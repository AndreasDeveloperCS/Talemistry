import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ALREADY_REGISTER_ERROR, USER_NOT_FOUND_ERROR } from '../../../common/constants';
import { UpdateUserDTO } from '../../../common/dto';
import { IUser, IVerificationData, IVerificationRequest } from '../interfaces/user.interface';
import { User, UserDocument } from '../models/user';

import { UtilitiesService } from '../../core/services/utilities.service';

import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { MessageNotificationPreferences } from '../../communication/enums/communication-means.enum';
import { TELEGRAM_FIELDS } from '../../communication/enums/telegram-fields.enum';
import { ProfilePhotoService } from '../../profiles/services/profile-photo.service';
import { TalentProfileService } from '../../profiles/services/talent-profile.service';
import { UserDto } from '../models/auth.dto';
import { VerificationService } from './verification.service';
import { PaymentSubscriptionState } from '../../payments/dto/payments.dto';

@Injectable()
export class UsersService extends BaseService<User> {

  private async findByPseudonym(pseudonym?: string | null): Promise<{ user: User; pseudonym?: string } | null> {
    const trimmedPseudonym = String(pseudonym || '').trim();
    if (!trimmedPseudonym) {
      return null;
    }

    const profiles = await this.talentProfileService.findByPseudonymExact(trimmedPseudonym);
    const uniqueProfiles = profiles.filter((profile) => {
      const profileUserId = String(profile?.userId || profile?.user?._id || '').trim();
      return !!profileUserId;
    });

    const distinctUserIds = Array.from(new Set(uniqueProfiles.map((profile) => String(profile.userId || profile.user?._id || '').trim())));
    if (distinctUserIds.length !== 1) {
      return null;
    }

    const user = await this.model.findById(distinctUserIds[0]).exec();
    if (!user) {
      return null;
    }

    const profile = uniqueProfiles.find((entry) => String(entry.userId || entry.user?._id || '').trim() === distinctUserIds[0]);

    return {
      user,
      pseudonym: String(profile?.pseudonym || '').trim() || undefined,
    };
  }

  constructor(
    @InjectModel(User.name)
    protected readonly model: Model<UserDocument>,

    @InjectRepository(User)
    protected readonly repository: Repository<User>,

    private utilitiesService: UtilitiesService,
    private talentProfileService: TalentProfileService,
    private talentPhotoService: ProfilePhotoService,
    private userVerificaiotnService: VerificationService,
  ) {
    super(model, repository);
  }

  getUser(user: User): IUser {
    return user;
  }

  async findAll(): Promise<Partial<UserDocument[]>> {
    const users = await this.model.find().select('-password').exec();
    return users;
  }

  async getAllUsersAsync(): Promise<IUser[]> {
    const users = await this.model.find().exec();

    return users.map(user => {
      return this.getUser(user);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.model.findOne({ email }).exec();
    } catch (error) {
      console.error('findByEmail', error);
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }

  normalizeUsername(username?: string | null): string | undefined {
    const normalized = String(username || '').trim().toLowerCase().replace(/^@+/, '');
    return normalized || undefined;
  }

  normalizePhone(phone?: string | null): string | undefined {
    const raw = String(phone || '').trim();
    if (!raw) {
      return undefined;
    }

    const hasPlus = raw.startsWith('+');
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      return undefined;
    }

    return `${hasPlus ? '+' : ''}${digits}`;
  }

  async findByUsername(username?: string | null): Promise<User | null> {
    const normalized = this.normalizeUsername(username);
    if (!normalized) {
      return null;
    }

    return this.model.findOne({ username: normalized }).exec();
  }

  async ensureUsernameAvailable(username?: string | null, currentUserId?: string | ObjectId): Promise<void> {
    const normalized = this.normalizeUsername(username);
    if (!normalized) {
      return;
    }

    const existingUser = await this.findByUsername(normalized);
    if (existingUser && String(existingUser._id) !== String(currentUserId || '')) {
      throw new ConflictException('This username is already taken.');
    }
  }

  async findDirectChatContact(
    identifier: string,
    requestingUserId?: string | ObjectId,
  ): Promise<{ contactId: string; contactName: string; email?: string; phone?: string; username?: string; pseudonym?: string } | null> {
    const trimmedIdentifier = String(identifier || '').trim();
    if (!trimmedIdentifier) {
      return null;
    }

    let user: User | null = null;
    let matchedPseudonym: string | undefined;
    const normalizedEmail = trimmedIdentifier.toLowerCase();
    const normalizedUsername = this.normalizeUsername(trimmedIdentifier);
    const normalizedPhone = this.normalizePhone(trimmedIdentifier);

    if (trimmedIdentifier.includes('@')) {
      user = await this.findByEmail(normalizedEmail);
    }

    if (!user && normalizedUsername) {
      user = await this.findByUsername(normalizedUsername);
    }

    if (!user && normalizedPhone) {
      const phoneDigits = normalizedPhone.replace(/\D/g, '');
      if (phoneDigits) {
        const phoneMatcher = new RegExp(`^\\+?\\D*${phoneDigits.split('').join('\\D*')}\\D*$`, 'i');
        user = await this.model.findOne({ phone: { $regex: phoneMatcher } }).exec();
      }
    }

    if (!user) {
      const pseudonymMatch = await this.findByPseudonym(trimmedIdentifier);
      if (pseudonymMatch) {
        user = pseudonymMatch.user;
        matchedPseudonym = pseudonymMatch.pseudonym;
      }
    }

    if (!user || String(user._id) === String(requestingUserId || '')) {
      return null;
    }

    const contactName = matchedPseudonym
      || [user.firstname, user.lastname].filter(Boolean).join(' ').trim()
      || user.username
      || user.email
      || user.phone
      || 'Direct contact';

    return {
      contactId: String(user._id),
      contactName,
      email: String(user.email || '').trim() || undefined,
      phone: String(user.phone || '').trim() || undefined,
      username: this.normalizeUsername(user.username),
      pseudonym: matchedPseudonym,
    };
  }

  async findById(id: string): Promise<IUser> {

    const userIdObject = new ObjectId(id);

    const user = await this.model.findById(userIdObject).exec();

    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }

    return this.getUser(user);
  }

  async findRawById(id: string | ObjectId): Promise<User | null> {
    return this.model.findById(id).exec();
  }

  async getPaymentSubscriptionState(userId: string | ObjectId): Promise<PaymentSubscriptionState | undefined> {
    const user = await this.model
      .findById(userId)
      .select('paymentSubscription')
      .lean()
      .exec();

    return user?.paymentSubscription;
  }

  async findByPaymentReference(reference: string): Promise<User | null> {
    const trimmedReference = String(reference || '').trim();
    if (!trimmedReference) {
      return null;
    }

    return this.model.findOne({
      $or: [
        { 'paymentSubscription.customerId': trimmedReference },
        { 'paymentSubscription.subscriptionId': trimmedReference },
        { 'paymentSubscription.checkoutSessionId': trimmedReference },
        { 'paymentSubscription.mandateId': trimmedReference },
        { 'paymentSubscription.redirectFlowId': trimmedReference },
      ],
    }).exec();
  }

  async upsertPaymentSubscriptionState(userId: string | ObjectId, paymentSubscription: PaymentSubscriptionState): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      {
        $set: {
          paymentSubscription,
          modifiedDate: new Date(),
        },
      },
    ).exec();
  }


  public async registerUser(user: Readonly<UserDto>, userId?: any): Promise<IVerificationRequest> {
    console.log('registerUser', user);
    const existingUser = await this.findByEmail(user.email);
    console.log('existingUser', existingUser);

    if (existingUser) {
      throw new UnauthorizedException(ALREADY_REGISTER_ERROR);
    }

    const autoGeneratedPassword = this.utilitiesService.generatePassword(12);
    const hashedPassword = await this.utilitiesService.hashPassword(autoGeneratedPassword);

    const userCreated: User = await this.createUser(
      user.firstname,
      user.lastname,
      user.email,
      user.phone,
      user.role,
      userId
    );

    console.log('userCreated', userCreated);

    if (!user.isSocialUser) {
      const verificaitonRequest = await this.userVerificaiotnService.createEmailVerificationRequest(
        userCreated
      );
      console.log('verificaitonRequest', verificaitonRequest)

      return verificaitonRequest;
    }
    else if (user.isSocialUser) {
      return {
        userId: userCreated._id,
        email: userCreated.email
      };
    }
  }

  async createUser(
    firstname: string,
    lastname: string,
    email: string,
    //hashedPassword: string,
    phone: string,
    role: any[],
    userId?: any
  ): Promise<User> {
    console.log('userCreated 1', userId);
    const userCreated = new this.model({
      firstname,
      lastname,
      email,
      phone: phone || '',
      //password: hashedPassword,
      role
    });
    console.log('userCreated 2', userCreated);
    userCreated.createdBy = userId || userCreated._id;
    userCreated.userId = userId || userCreated._id;
    console.log('userCreated 3', userCreated);

    return await userCreated.save();
  }

  async updateUser(
    id: string,
    updateUserData: UpdateUserDTO
  ): Promise<UserDocument> {
    const updatedUser = await this.model
      .findByIdAndUpdate(id, updateUserData)
      .setOptions({ overwrite: true });

    if (!updatedUser) {
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }

    return updatedUser;
  }

  async verifyEmail(verificationData: IVerificationData): Promise<any> {

    const filter = { _id: new ObjectId(verificationData.userId) };
    const hashedPassword = await this.utilitiesService.hashPassword(verificationData.confirmPassword);
    const compareResult = await this.utilitiesService.passwordCheck(verificationData.confirmPassword, hashedPassword);

    const updateUser = {
      isVerifiedEmail: true,
      password: hashedPassword,
      modifiedDate: new Date(Date.now())
    };

    const updated = await this.model.findOneAndUpdate(filter, updateUser)
      .setOptions({
        useFindAndModify: false,
        strict: false
      });

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    return this.model.findByIdAndDelete(id);
  }

  public async getUserNameMap(userIds: ObjectId[]): Promise<Map<string, string>> {
    if (!userIds.length) return new Map();

    const users = await this.model.find(
      { _id: { $in: userIds } },
      { firstname: 1 }
    ).lean();

    const map = new Map<string, string>();
    for (const u of users) {
      const fullName = [u.firstname].filter(Boolean).join(' ');
      map.set(String(u._id), fullName);
    }

    return map;
  }

  public async getUserContactMap(userIds: ObjectId[]): Promise<Map<string, { name: string; email: string; username?: string }>> {
    if (!userIds.length) {
      return new Map();
    }

    const users = await this.model.find(
      { _id: { $in: userIds } },
      { firstname: 1, lastname: 1, email: 1, username: 1 }
    ).lean();

    const map = new Map<string, { name: string; email: string; username?: string }>();

    for (const user of users) {
      const name = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
      map.set(String(user._id), {
        name,
        email: String(user.email || '').trim(),
        username: this.normalizeUsername(user.username),
      });
    }

    return map;
  }

  async generateTelegramConnectToken(userId: ObjectId): Promise<{ token: string }> {
    const token = randomBytes(24).toString('hex');

    await this.model.updateOne(
      { _id: userId },
      {
        $set: {
          [TELEGRAM_FIELDS.connectToken]: token,
          [TELEGRAM_FIELDS.connectTokenExpiresAt]: new Date(Date.now() + 10 * 60 * 1000),
          [TELEGRAM_FIELDS.enabled]: false,
        },
      },
    );

    return { token };
  }

  async findByTelegramConnectToken(token: string) {
    return this.model.findOne({
      [TELEGRAM_FIELDS.connectToken]: token,
    });
  }

  async linkTelegram(userId: ObjectId, telegram: { chatId: string; username?: string }): Promise<any> {
    return this.model.updateOne(
      { _id: userId },
      {
        $set: {
          [TELEGRAM_FIELDS.chatId]: telegram.chatId,
          [TELEGRAM_FIELDS.username]: telegram.username,
          [TELEGRAM_FIELDS.enabled]: true,
          [TELEGRAM_FIELDS.linkedAt]: new Date(),
        },
        $unset: {
          [TELEGRAM_FIELDS.connectToken]: '',
          [TELEGRAM_FIELDS.connectTokenExpiresAt]: '',
        },
      },
    );
  }

  async resetTelegramState(userId: ObjectId): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      {
        $unset: {
          [TELEGRAM_FIELDS.chatId]: '',
          [TELEGRAM_FIELDS.username]: '',
          [TELEGRAM_FIELDS.connectToken]: '',
          [TELEGRAM_FIELDS.connectTokenExpiresAt]: '',
          [TELEGRAM_FIELDS.linkedAt]: '',
        },
        $set: {
          [TELEGRAM_FIELDS.enabled]: false,
        },
      },
    );
  }

  async getMessagePreferencesById(userId: string): Promise<MessageNotificationPreferences> {
    const objectId = this.getObjectId(userId);

    const item = await this.model
      .findOne({ _id: objectId })
      .select('messageNotificationPreferences')
      .lean()
      .exec();

    if (!item) {
      return {
        channels: {
          email: true, sms: true, viber: false, whatsapp: false, telegram: false
        }
      };
    }

    return item.messageNotificationPreferences;
  }

  async deleteUserCascade(userId: string, requestingUser: User) {
    const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");

    if (requestingUser._id.toString() !== userId.toString() && !isAdmin) {
      throw new ForbiddenException('You cannot delete another user');
    }

    const objectId = new ObjectId(userId);

    await Promise.all([
      this.talentProfileService.deleteByUserIdAsync(userId),
      this.talentPhotoService.deleteOldPhoto(userId)
    ]);

    const deleteUserResult = await this.deleteAsync(objectId);

    return deleteUserResult;
  }
}
