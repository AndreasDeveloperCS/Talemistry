import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { ObjectId } from 'bson';
import { randomBytes } from 'crypto';
import { BaseService } from '../../base/services/base.service';
import { VideoChatRoom, VideoChatRoomDocument, VideoChatRoomType } from '../models/video-chat-room';

@Injectable()
export class VideoChatRoomService extends BaseService<VideoChatRoom> {

    constructor(
        @InjectModel(VideoChatRoom.name)
        protected readonly model: Model<VideoChatRoomDocument>,

        @InjectRepository(VideoChatRoom)
        protected readonly repository: Repository<VideoChatRoom>,
    ) {
        super(model, repository);
    }

    private toObjectId(value: any): ObjectId | undefined {
        const raw = String(value ?? '').trim();
        if (!raw) return undefined;
        try {
            return new ObjectId(raw);
        } catch {
            return undefined;
        }
    }

    async ensureDefaultBrainstormingRoomAsync(user?: { _id?: any; email?: string } | null): Promise<VideoChatRoom | null> {
        const defaultName = 'Brainstorming';
        const ownerId = this.toObjectId((user as any)?._id);
        const ownerEmail = this.normalizeEmail((user as any)?.email);

        let roomDoc = await this.model.findOne({ isDefault: true, name: { $regex: '^brainstorming$', $options: 'i' } }).exec();
        if (!roomDoc) {
            roomDoc = await this.model.findOne({ type: VideoChatRoomType.GROUP, name: { $regex: '^brainstorming$', $options: 'i' } }).exec();
        }

        if (!roomDoc) {
            // Create a global open room even without an authenticated owner so that all users
            // (including unauthenticated / mobile sessions) always have at least one visible room.
            const created = new this.model({
                name: defaultName,
                type: VideoChatRoomType.GROUP,
                isOpenMeeting: true,
                isDefault: true,
                participants: (ownerId && ownerEmail) ? [{ email: ownerEmail, userId: ownerId, joinedAt: new Date() }] : [],
                ...(ownerId ? { userId: ownerId, createdBy: ownerId } : {}),
                createdDate: new Date(),
                joinToken: randomBytes(16).toString('hex'),
            });

            const saved = await created.save();
            return saved.toObject() as VideoChatRoom;
        }

        let changed = false;

        if (String((roomDoc as any)?.type ?? '').trim() !== VideoChatRoomType.GROUP) {
            (roomDoc as any).type = VideoChatRoomType.GROUP;
            changed = true;
        }
        if (!(roomDoc as any)?.isDefault) {
            (roomDoc as any).isDefault = true;
            changed = true;
        }
        if (!(roomDoc as any)?.isOpenMeeting) {
            (roomDoc as any).isOpenMeeting = true;
            changed = true;
        }
        if (!(roomDoc as any)?.joinToken) {
            (roomDoc as any).joinToken = randomBytes(16).toString('hex');
            changed = true;
        }
        if (ownerEmail) {
            const hasOwner = (roomDoc.participants ?? []).some((p: any) => this.normalizeEmail(p?.email) === ownerEmail);
            if (!hasOwner) {
                roomDoc.participants = roomDoc.participants ?? [];
                roomDoc.participants.push({ email: ownerEmail, userId: ownerId, joinedAt: new Date() } as any);
                changed = true;
            }
        }

        if (changed) {
            const saved = await roomDoc.save();
            return saved.toObject() as VideoChatRoom;
        }

        return roomDoc.toObject() as VideoChatRoom;
    }

    async findOrCreateRoomAsync(body: Partial<VideoChatRoom>): Promise<VideoChatRoom> {
        if (!body.participants || body.participants.length === 0) {
            throw new Error('Participants list is required');
        }

        const participantEmails = [...new Set(body.participants.map(p => p.email.trim().toLowerCase()))].sort();

        const requestedType = String((body as any)?.type ?? '').trim() as VideoChatRoomType | '';
        if (requestedType === VideoChatRoomType.DIRECT) {
            if (participantEmails.length !== 2) {
                throw new Error('Direct meeting must have exactly 2 participants');
            }
            body.type = VideoChatRoomType.DIRECT;
        }

        if (requestedType === VideoChatRoomType.SELF) {
            if (participantEmails.length !== 1) {
                throw new Error('Self meeting must have exactly 1 participant');
            }
            body.type = VideoChatRoomType.SELF;
        }

        if (requestedType === VideoChatRoomType.GROUP) {
            if (participantEmails.length < 1) {
                throw new Error('Group meeting must have at least 1 participant');
            }
            body.type = VideoChatRoomType.GROUP;
        }

        body.participants = participantEmails.map(email => ({
            email,
            videoChatRoomId: new ObjectId,
            joinedAt: new Date(),
        }));

        // If type was explicitly requested above, keep it.
        if (body.type) {
            // no-op
        }
        else if (participantEmails.length === 1) {
            // Preserve an explicit room type (e.g. GROUP meeting created by a single host).
            // Only default to SELF when type is not provided.
            body.type = body.type ?? VideoChatRoomType.SELF;
        } else {
            body.type = body.type ?? VideoChatRoomType.GROUP;
        }

        const existingRoom = await this.model.findOne({
            type: body.type,
            $expr: { $eq: [{ $size: "$participants" }, participantEmails.length] },
            "participants.email": { $all: participantEmails },
        }).lean();

        if (existingRoom) {
            console.log("Existing room found:", existingRoom._id);
            return existingRoom as VideoChatRoom;
        }

        const newRoom = new this.model({
            ...body,
            createdDate: new Date(),
            joinToken: body.joinToken || randomBytes(16).toString('hex'),
        });

        const saved = await newRoom.save();
        console.log("New video room created:", saved._id);

        return saved;
    }

    private normalizeParticipants(input: any[] | undefined, existing: any[] | undefined): any[] {
        const existingByEmail = new Map<string, any>();
        for (const p of (existing ?? [])) {
            const email = this.normalizeEmail(p?.email);
            if (email && !existingByEmail.has(email)) existingByEmail.set(email, p);
        }

        const emails = [...new Set((input ?? [])
            .map((p: any) => this.normalizeEmail(p?.email))
            .filter(Boolean))];

        return emails.map((email) => {
            const prev = existingByEmail.get(email);
            return {
                email,
                userId: prev?.userId,
                role: prev?.role,
                joinedAt: prev?.joinedAt ?? new Date(),
            } as any;
        });
    }

    async updateRoomAsync(roomId: string, patch: Partial<VideoChatRoom>): Promise<VideoChatRoom> {
        const id = String(roomId ?? '').trim();
        if (!id) throw new Error('roomId is required');

        const roomDoc = await this.model.findById(id).exec();
        if (!roomDoc) throw new Error('Room not found');

        const nextType = (String((patch as any)?.type ?? roomDoc.type ?? '').trim() || roomDoc.type) as VideoChatRoomType;
        const nextParticipants = this.normalizeParticipants((patch as any)?.participants, (roomDoc as any)?.participants);

        if (nextType === VideoChatRoomType.DIRECT && nextParticipants.length !== 2) {
            throw new Error('Direct meeting must have exactly 2 participants');
        }
        if (nextType === VideoChatRoomType.SELF && nextParticipants.length !== 1) {
            throw new Error('Self meeting must have exactly 1 participant');
        }
        if (nextType === VideoChatRoomType.GROUP && nextParticipants.length < 1) {
            throw new Error('Group meeting must have at least 1 participant');
        }

        // Only group rooms can be open/closed.
        const isOpenMeeting = nextType === VideoChatRoomType.GROUP
            ? !!(patch as any)?.isOpenMeeting
            : false;

        const update: any = {
            name: typeof (patch as any)?.name === 'string' ? String((patch as any).name) : roomDoc.name,
            type: nextType,
            participants: nextParticipants,
            isOpenMeeting,
            modifiedDate: new Date(),
        };

        if (!(roomDoc as any)?.joinToken) {
            update.joinToken = randomBytes(16).toString('hex');
        }

        const updated = await this.model.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
        if (!updated) throw new Error('Room not found');
        return updated.toObject() as VideoChatRoom;
    }

    /**
     * Raw room lookup by id (bypasses BaseService access filters).
     * Controllers should apply their own authorization rules.
     */
    async getByIdRawAsync(roomId: string): Promise<VideoChatRoom | null> {
        const normalizedRoomId = String(roomId ?? '').trim();
        if (!normalizedRoomId) return null;
        const room = await this.model.findById(normalizedRoomId).exec();
        return room ? (room.toObject() as VideoChatRoom) : null;
    }

    private normalizeEmail(email: string): string {
        return String(email ?? '').trim().toLowerCase();
    }

    /**
     * Join a room using a secret joinToken.
     * - If user is already a participant (by email), token is not required.
     * - If user is not a participant, a correct token is required and the user email
     *   will be appended to participants (so future joins don't need the token).
     */
    async joinRoomByTokenAsync(roomId: string, email?: string, token?: string): Promise<VideoChatRoom> {
        const normalizedRoomId = String(roomId ?? '').trim();
        if (!normalizedRoomId) throw new Error('roomId is required');

        const normalizedEmail = this.normalizeEmail(email);

        const room = await this.model.findById(normalizedRoomId).exec();
        if (!room) throw new Error('Room not found');

        const roomType = String((room as any)?.type ?? '').trim();
        const isDirectRoom = roomType === VideoChatRoomType.DIRECT;

        if (!room.joinToken) {
            room.joinToken = randomBytes(16).toString('hex');
        }

        // Direct meetings must always remain 1:1.
        // Token may grant access ONLY to an existing participant; it must not add new ones.
        if (isDirectRoom) {
            if (!normalizedEmail) {
                throw new Error('Invalid join token');
            }

            const isParticipant = (room.participants ?? []).some((p: any) => this.normalizeEmail(p?.email) === normalizedEmail);
            if (!isParticipant) {
                throw new Error('Invalid join token');
            }

            return room.toObject() as VideoChatRoom;
        }

        // Open meetings: when type=group AND isOpenMeeting=true, skip token
        // validation entirely — any authenticated user can join.
        const isOpenGroup = String(room.type ?? '').trim() === VideoChatRoomType.GROUP
            && !!(room as any).isOpenMeeting;

        if (isOpenGroup && normalizedEmail) {
            const isParticipant = (room.participants ?? []).some((p: any) =>
                this.normalizeEmail(p?.email) === normalizedEmail,
            );
            if (!isParticipant) {
                room.participants = room.participants ?? [];
                room.participants.push({ email: normalizedEmail, joinedAt: new Date() } as any);
            }
            const saved = await room.save();
            return saved.toObject() as VideoChatRoom;
        }

        // If no email was provided (e.g. guest join), token must be valid.
        // We intentionally don't persist an anonymous participant in the room.
        if (!normalizedEmail) {
            const provided = String(token ?? '').trim();
            if (!provided || provided !== room.joinToken) {
                throw new Error('Invalid join token');
            }
            return room.toObject() as VideoChatRoom;
        }

        const isParticipant = (room.participants ?? []).some((p: any) => this.normalizeEmail(p?.email) === normalizedEmail);
        if (!isParticipant) {
            const provided = String(token ?? '').trim();
            if (!provided || provided !== room.joinToken) {
                throw new Error('Invalid join token');
            }

            room.participants = room.participants ?? [];
            room.participants.push({ email: normalizedEmail, joinedAt: new Date() } as any);
        }

        const saved = await room.save();
        return saved.toObject() as VideoChatRoom;
    }

    async findOrCreate(roomId: string, participants: string[]) {
        // 👇 cast because lean() returns a plain object, not a Document
        let room = await this.model.findOne({ roomId }).lean<VideoChatRoom>().exec();

        if (!room) {
            const created = new this.model({
                roomId,
                participants: participants.map(id => ({
                    userId: new ObjectId(id),
                    joinedAt: new Date(),
                })),
                createdDate: new Date(),
            });
            const saved = await created.save();
            // return a plain object version for consistency
            return saved.toObject() as VideoChatRoom;
        }

        // update existing participants
        const existingIds = new Set(room.participants.map(p => p.userId.toString()));
        for (const id of participants) {
            if (!existingIds.has(id)) {
                await this.model.updateOne(
                    { roomId },
                    {
                        $push: {
                            participants: { userId: new ObjectId(id), joinedAt: new Date() },
                        },
                    },
                );
            }
        }

        return room;
    }

    public async findAsync(filter: any = {}): Promise<VideoChatRoom[]> {
        return await this.repository.find(filter);
    }
}
