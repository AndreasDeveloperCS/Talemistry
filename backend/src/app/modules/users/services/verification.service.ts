import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WRONG_VERIFICATION_CODE } from '../../../common/constants';
import { VerificationType } from '../../../common/enums';
import { IUser, IVerificationData, IVerificationRequest } from '../interfaces/user.interface';
import { User, UserDocument } from '../models/user';
import { VerificationRequest, VerificationRequestDocument } from '../models/user-verification';

import { UtilitiesService } from '../../core/services/utilities.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ObjectId } from 'bson';
import { EmailService } from '../../email/services/email.service';

@Injectable()
export class VerificationService extends BaseService<VerificationRequest> {

  constructor(
    @InjectModel(VerificationRequest.name)
    protected readonly model: Model<VerificationRequestDocument>,

    @InjectRepository(VerificationRequest)
    protected readonly repository: Repository<VerificationRequest>,
    private utilitiesService: UtilitiesService,
    private emailService: EmailService,
  ) {
    super(model, repository);
  }

  getUser(user: UserDocument): IUser {
    return {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
  }

  async findAll(): Promise<Partial<VerificationRequestDocument[]>> {
    const users = await this.model.find().exec();
    return users;
  }

  async findByUserIdAndType(userId: string, verificaiotnType: VerificationType): Promise<VerificationRequestDocument> {
    const searchingItem = {
      userId: userId,
      verificaiotnType: verificaiotnType
    }
    const result = this.model.findOne(searchingItem).exec();
    return result;
  }

  // async findById(id: string): Promise<IUser> {
  //   const request = await this.verificaitonModel.findById(id).exec();

  //   if (!request) {
  //     throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
  //   }

  //   return this.getUser(user);
  // }

  async createEmailVerificationRequest(
    user: User,
  ): Promise<IVerificationRequest> {
    console.log('createEmailVerificationRequest', user);
    const verificationCode = this.utilitiesService.generateOtpCode(8);
    const verificationRequestCreated = new this.model({
      userId: user._id,
      verificationType: VerificationType.Email,
      generatedOtp: verificationCode,
      userOtp: null,
      isVerified: false,
      createdBy: user.createdBy,
    });
    console.log('verificationRequestCreated', verificationRequestCreated);

    const verificationRequest = await verificationRequestCreated.save();
    console.log('verificationRequest', verificationRequest);
    const notificationMessage = this.emailService.getUserEmailValidationRequest(user, verificationRequest);
    const notificationEmail = this.emailService.sendMessage(notificationMessage);
    const verification = this.getUserVerficationRequest(user, verificationRequest);
    console.log('createEmailVerificationRequest', verification)
    return verification;
  }

  getUserVerficationRequest(user: User, verificationRequest: VerificationRequest): IVerificationRequest {
    return {
      userId: user._id,
      requestId: verificationRequest._id.toString(),
      email: user.email
    };
  }

  async verify(verificationData: IVerificationData): Promise<any> {
    const filter = { _id: new ObjectId(verificationData.requestId) };

    const verificationRequest: VerificationRequestDocument = await this.model
      .findById(verificationData.requestId);

    if (!verificationRequest || verificationRequest.generatedOtp != verificationData.verificationCode) {
      throw new UnauthorizedException(WRONG_VERIFICATION_CODE);
    }

    const updateVerificationCode = {
      userOtp: verificationData.verificationCode,
      isVerified: true,
      modifiedDate: new Date(Date.now())
    };

    const updatedVerificationCode = await this.model
      .findOneAndUpdate(filter, updateVerificationCode)
      .setOptions({
        useFindAndModify: false,
        strict: false
      });

    return updatedVerificationCode;
  }

  async deleteVerificationRequest(id: string): Promise<void> {
    return this.model.findByIdAndDelete(id);
  }

}
