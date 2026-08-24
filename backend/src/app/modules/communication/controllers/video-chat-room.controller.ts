import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { IEnrichedVideoChatRoom, VideoChatRoom, VideoChatRoomType } from '../models/video-chat-room';
import { VideoChatRoomService } from '../services/video-chat-room.service';
import { Sorting } from '../../../helpers/sorting';
import { Filtering, FilterRule } from '../../../helpers/filtering';
import { randomBytes } from 'crypto';
import { VideoChatRoomParticipantService } from '../services/video-chat-room-participant.service';
import { IVideoChatParticipant } from '../models/video-chat-room-participant';

@Controller('video-chat-rooms')
@SetMetadata('entityModel', VideoChatRoom)
export class VideoChatRoomController extends BaseController<VideoChatRoom> {
    override className: string = this.constructor.name;

    constructor(protected service: VideoChatRoomService,
        protected videoChatRoomParticipantService: VideoChatRoomParticipantService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    @Get()
    async getAllAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('------ GET VIDEO CHAT ROOMS START ------');

        try {
            // Step 0️⃣ - Extract user
            const requestingUser: User = this.utilitiesService?.getUser(request);
            console.log('Requesting user:', requestingUser);

            if (!requestingUser?.email) {
                console.log('❌ No requesting user email found');
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const currentUserEmail = String(requestingUser.email).trim().toLowerCase();
            console.log('✅ Current User Email:', currentUserEmail);

            // Step 1️⃣ - Get participant records by email
            const participantRecords =
                await this.videoChatRoomParticipantService.findAsync({
                    email: currentUserEmail
                });
            console.log('Participant records found:', participantRecords?.length, participantRecords);

            if (!participantRecords?.length) {
                console.log('⚠ No participant records found. Returning empty array.');
                return response.status(200).json({
                    items: [],
                    total: 0,
                    page: paginationParams?.page ?? 1,
                    limit: paginationParams?.limit ?? 0
                });
            }

            // Step 2️⃣ - Extract roomIds
            const roomIds = [
                ...new Set(
                    participantRecords.map(p => String(p.videoChatRoomId))
                )
            ].map(id => new ObjectId(id));

            console.log('Room IDs extracted:', roomIds.map(r => r.toString()));

            // Step 3️⃣ - Parse sorting and filtering
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            console.log('Sorting:', sorting);

            const parsedFiltering: Filtering = filterParams ? JSON.parse(filterParams) : [];
            console.log('Parsed filtering:', parsedFiltering);

            const filtering: Filtering = Array.isArray(parsedFiltering) ? [...parsedFiltering] : [];

            // 🔥 Step 3a - Enrich filtering for current user rooms
            filtering.push({
                property: '_id',
                rule: FilterRule.IN,
                value: roomIds
            });
            console.log('Enriched filtering:', filtering);
            const accessFilter = this.getAccessFilters(request);
            console.log('Access filter', accessFilter);

            // Step 4️⃣ - Fetch paginated rooms
            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                accessFilter
            );
            console.log('Pagination result:', paginationResult);

            // Step 5️⃣ - Enrich returned rooms with participants
            const returnedRoomIds = paginationResult.items.map(r => new ObjectId(String(r._id)));
            console.log('Returned room IDs for enrichment:', returnedRoomIds.map(r => r.toString()));

            const allParticipants = await this.videoChatRoomParticipantService.findAsync({
                videoChatRoomId: { $in: returnedRoomIds }
            });
            console.log('All participants fetched for returned rooms:', allParticipants.length, allParticipants);

            const participantsMap = new Map<string, IVideoChatParticipant[]>();
            for (const participant of allParticipants) {
                const key = String(participant.videoChatRoomId);
                if (!participantsMap.has(key)) {
                    participantsMap.set(key, []);
                }
                participantsMap.get(key)!.push(participant);
            }
            console.log('Participants grouped by room:', participantsMap);

            paginationResult.items = paginationResult.items.map(room => ({
                ...room,
                participants: participantsMap.get(String(room._id)) ?? []
            }));

            console.log('------ GET VIDEO CHAT ROOMS END ------');
            return response.status(200).json(paginationResult);

        } catch (error) {
            console.error('❌ ERROR in getAllAsync:', error);
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Query('token') token: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {

        const origin =
            typeof (request as any)?.headers?.origin === 'string' &&
                (request as any).headers.origin
                ? String((request as any).headers.origin)
                : '*';

        try {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Vary', 'Origin');
        } catch { }

        try {

            const requestingUser: User = this.utilitiesService?.getUser(request);
            const email = String(requestingUser?.email ?? '').trim().toLowerCase();
            const userId = String(requestingUser?._id ?? '').trim();

            const roomDoc = await (this.service as any).model
                .findById(String(_id ?? '').trim())
                .exec();

            if (!roomDoc) {
                return response.status(404).send({ message: 'Room not found' });
            }

            // Ensure join token exists
            if (!roomDoc?.joinToken) {
                roomDoc.joinToken = randomBytes(16).toString('hex');
                await roomDoc.save();
            }

            const room: VideoChatRoom = roomDoc.toObject();

            const isGroupRoom = String(room?.type ?? '').trim() === VideoChatRoomType.GROUP;
            const isStageRoom = String(room?.type ?? '').trim() === VideoChatRoomType.STAGE;
            const isDirectRoom = String(room?.type ?? '').trim() === VideoChatRoomType.DIRECT;

            const isDefaultOpenRoom = !!room?.isDefault;
            const isOpenMeeting = !!room?.isOpenMeeting;
            const effectiveIsOpenMeeting = isOpenMeeting || isDefaultOpenRoom;

            // 🔹 Load participants from separate collection
            const participants =
                await this.videoChatRoomParticipantService.findAsync({ videoChatRoomId: roomDoc._id });

            const participantEmails = new Set(
                participants.map(p => String(p.email ?? '').trim().toLowerCase())
            );

            const participantUserIds = new Set(
                participants.map(p => String(p.userId ?? '').trim())
            );

            // ─────────────────────────────────────────────
            // OPEN MEETING (auto-admit anyone)
            // ─────────────────────────────────────────────
            if (isGroupRoom && effectiveIsOpenMeeting) {

                if (email && !participantEmails.has(email)) {
                    await this.videoChatRoomParticipantService.createAsync({
                        videoChatRoomId: roomDoc._id,
                        email,
                        isVerified: true,
                        userId: new ObjectId(userId) || undefined,
                        joinedAt: new Date(),
                        createdBy: new ObjectId(userId),
                        createdDate: new Date(),
                    });
                }

                const updatedParticipants =
                    await this.videoChatRoomParticipantService.findAsync({ videoChatRoomId: roomDoc._id });

                return response.status(200).json({
                    ...room,
                    participants: updatedParticipants
                });
            }

            // ─────────────────────────────────────────────
            // TOKEN ACCESS
            // ─────────────────────────────────────────────
            const providedToken = String(token ?? '').trim();

            if (providedToken && providedToken === String(room.joinToken ?? '').trim()) {

                // Direct room must remain strictly 1:1
                if (isDirectRoom) {

                    const isDirectParticipant =
                        participantEmails.has(email) ||
                        participantUserIds.has(userId);

                    if (!isDirectParticipant) {
                        return response.status(403).send({
                            message: 'Forbidden. Direct meeting is restricted to its 2 participants.'
                        });
                    }

                    return response.status(200).json({
                        ...room,
                        participants
                    });
                }

                // Add participant if not already present
                if (email && !participantEmails.has(email)) {
                    await this.videoChatRoomParticipantService.createAsync({
                        videoChatRoomId: roomDoc._id,
                        email,
                        isVerified: true,
                        userId: new ObjectId(userId) || undefined,
                        joinedAt: new Date(),
                        createdBy: new ObjectId(userId),
                        createdDate: new Date(),
                    });
                }

                const updatedParticipants =
                    await this.videoChatRoomParticipantService.findAsync({ videoChatRoomId: roomDoc._id });

                return response.status(200).json({
                    ...room,
                    participants: updatedParticipants
                });
            }

            // ─────────────────────────────────────────────
            // AUTHENTICATED ACCESS (no token)
            // ─────────────────────────────────────────────
            if (!email && !userId) {
                return response.status(401).send({
                    message: 'Unauthorized. Please sign in or use a join link with a valid token.'
                });
            }

            const createdBy = String(room?.createdBy ?? '').trim();
            const isCreator = createdBy && createdBy === userId;

            const isParticipant =
                participantEmails.has(email) ||
                participantUserIds.has(userId);

            if (!isCreator && !isParticipant) {

                // Stage rooms auto-admit authenticated users
                if (isStageRoom) {

                    if (email && !participantEmails.has(email)) {
                        await this.videoChatRoomParticipantService.createAsync({
                            videoChatRoomId: roomDoc._id,
                            email,
                            isVerified: true,
                            userId: new ObjectId(userId) || undefined,
                            joinedAt: new Date(),
                            createdBy: new ObjectId(userId),
                            createdDate: new Date(),
                        });
                    }

                    const updatedParticipants =
                        await this.videoChatRoomParticipantService.findAsync({ videoChatRoomId: roomDoc._id });

                    return response.status(200).json({
                        ...room,
                        participants: updatedParticipants
                    });
                }

                if (isGroupRoom) {
                    return response.status(403).send({
                        message: 'Forbidden. This group meeting is closed. Use a join link to access this room.'
                    });
                }

                return response.status(403).send({
                    message: 'Forbidden. Use a join link to access this room.'
                });
            }

            // ─────────────────────────────────────────────
            // SUCCESS
            // ─────────────────────────────────────────────
            return response.status(200).json({
                ...room,
                participants
            });

        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    // Join room via token (supports joining with a different account/email).
    // If the caller is already a participant, token is optional.
    // If not a participant, token must match room.joinToken and caller email is added to participants.
    @Get(':_id/join')
    async joinByToken(
        @Param('_id') _id: string,
        @Query('token') token: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        const origin = typeof (request as any)?.headers?.origin === 'string' && (request as any).headers.origin
            ? String((request as any).headers.origin)
            : '*';
        try {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Vary', 'Origin');
        } catch {
            // Best-effort CORS header; never fail the request because of it.
        }
        console.log('[RTC🔍 CONTROLLER] joinByToken', {
            roomId: _id,
            token: token ? `${token.slice(0, 8)}...` : '(none)',
            hasAuth: !!this.utilitiesService?.getUser(request),
        });

        try {
            const requestingUser: User = this.utilitiesService?.getUser(request);
            const email = String(requestingUser?.email ?? '').trim();

            // Allow guest joins via token.
            // If the user is authenticated, their email is appended as a participant.
            // If not authenticated, we still validate the token and return the room,
            // but we do not persist anonymous participants.
            const room = await this.service.joinRoomByTokenAsync(_id, email || undefined, token);
            console.log('[RTC🔍 CONTROLLER] joinByToken SUCCESS', { roomId: room?._id });
            return response.status(200).json(room);
        } catch (error: any) {
            const message = String(error?.message ?? error);
            if (message.toLowerCase().includes('not found')) {
                return response.status(404).send({ message });
            }
            if (message.toLowerCase().includes('invalid join token')) {
                return response.status(403).send({ message });
            }
            console.error(error);
            return response.status(500).send({ message });
        }
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {

        const origin =
            typeof (request as any)?.headers?.origin === 'string' &&
                (request as any).headers.origin
                ? String((request as any).headers.origin)
                : '*';

        try {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Vary', 'Origin');
        } catch {
            // never fail because of CORS header
        }

        try {
            console.log(`VideoChatRoom Inserted entity:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);

            const safeObjectId = (value: any): ObjectId | undefined => {
                const raw = String(value ?? '').trim();
                if (!raw) return undefined;
                try {
                    return new ObjectId(raw);
                } catch {
                    return undefined;
                }
            };

            const requestingUserId = safeObjectId((requestingUser as any)?._id);
            const bodyUserId = safeObjectId(body?.userId);
            const effectiveUserId = requestingUserId ?? bodyUserId;

            if (!effectiveUserId) {
                return response
                    .status(400)
                    .send({ message: 'Invalid user context for video room creation' });
            }

            // 1️⃣ Extract participants from body BEFORE room creation
            const participantsInput = Array.isArray(body?.participants)
                ? body.participants
                : [];
            console.log('participantsInput', participantsInput);

            body.participants = [];

            // 2️⃣ Prepare room data
            body.isVerified = true;
            body.userId = effectiveUserId;
            body.createdBy = requestingUserId ?? effectiveUserId;

            // 2.5️⃣ For DIRECT rooms, check if a room already exists with same participants
            let chatRoom: any;
            const roomType = String(body?.type ?? '').trim();
            if (roomType === 'DIRECT' && participantsInput.length === 2) {
                const participantEmails = participantsInput
                    .map((p: any) => String(p?.email ?? '').trim().toLowerCase())
                    .filter(Boolean)
                    .sort();

                if (participantEmails.length === 2) {
                    // Try to find existing DIRECT room with same participants
                    const existingParticipants = await this.videoChatRoomParticipantService.findAsync({
                        email: { $in: participantEmails }
                    });

                    // Group participants by room ID
                    const roomParticipantMap = new Map<string, string[]>();
                    for (const p of existingParticipants) {
                        const roomId = String(p?.videoChatRoomId ?? '').trim();
                        if (!roomId) continue;
                        const emailList = roomParticipantMap.get(roomId) ?? [];
                        emailList.push(String(p?.email ?? '').trim().toLowerCase());
                        roomParticipantMap.set(roomId, emailList);
                    }

                    // Find a DIRECT room with exactly these 2 participants
                    for (const [roomId, emails] of roomParticipantMap.entries()) {
                        if (emails.length >= 2 &&
                            emails.includes(participantEmails[0]) &&
                            emails.includes(participantEmails[1])) {
                            const existingRoom = await this.service.getByIdAsync(roomId);
                            if (existingRoom && String(existingRoom.type ?? '').trim() === 'DIRECT') {
                                console.log('Found existing DIRECT room:', roomId);
                                chatRoom = existingRoom;
                                break;
                            }
                        }
                    }
                }
            }

            // 3️⃣ Create room (WITHOUT participants) if not found
            if (!chatRoom) {
                // Remove _id if provided to avoid duplicate key errors
                delete body._id;
                console.log('Room before creation', body);
                chatRoom = await this.service.createAsync(body);
            }

            // 4️⃣ Create participants in parallel (skip if they already exist)
            if (participantsInput.length > 0) {
                const existingRoomParticipants = await this.videoChatRoomParticipantService.findAsync({
                    videoChatRoomId: chatRoom._id
                });
                const existingEmails = new Set(
                    existingRoomParticipants.map((p: any) => String(p?.email ?? '').trim().toLowerCase())
                );

                await Promise.all(
                    participantsInput
                        .filter((p: any) => p?.email && !existingEmails.has(String(p.email).trim().toLowerCase()))
                        .map((p: any) => {

                            const email = String(p.email).trim().toLowerCase();

                            let participantUserId: ObjectId | undefined;
                            try {
                                if (p?.userId) {
                                    participantUserId = new ObjectId(String(p.userId));
                                }
                            } catch {
                                participantUserId = undefined;
                            }

                            return this.videoChatRoomParticipantService.createAsync({
                                name: p?.name,
                                email,
                                role: p?.role,
                                isVerified: true,
                                userId: participantUserId,
                                videoChatRoomId: chatRoom._id,
                                createdBy: effectiveUserId,
                                joinedAt: p?.joinedAt
                                    ? new Date(p.joinedAt)
                                    : new Date(),
                                createdDate: new Date()
                            });
                        })
                );
            }

            console.log('Create video chat room', chatRoom);
            const updatedParticipants = await this.videoChatRoomParticipantService.findAsync({
                videoChatRoomId: chatRoom._id
            });

            const enrichedRoom = {
                ...chatRoom,
                participants: updatedParticipants
            };

            return response.status(201).json(enrichedRoom);
        } catch (error: any) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    @Put()
    @HttpCode(204)
    async putPayload(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        return await super.putAsync(body, request, response, ip);
    }

    @Put(':id')
    @HttpCode(200)
    async put(
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        const origin =
            typeof (request as any)?.headers?.origin === 'string' &&
                (request as any).headers.origin
                ? String((request as any).headers.origin)
                : '*';
        try {
            response.header('Access-Control-Allow-Origin', origin);
            response.header('Vary', 'Origin');
        } catch {
            // ignore
        }

        try {
            const requestingUser: User = this.utilitiesService?.getUser(request);
            const effectiveUserId = requestingUser?._id
                ? new ObjectId(requestingUser._id)
                : body?.userId
                    ? new ObjectId(body.userId)
                    : undefined;

            if (!effectiveUserId) {
                return response.status(400).send({ message: 'Invalid user context for video room update' });
            }

            // 1️⃣ Fetch current room
            const existingRoom = await this.service.getByIdAsync(id);
            console.log('Existing room', existingRoom);
            if (!existingRoom) {
                return response.status(404).send({ message: 'Video chat room not found' });
            }

            // 2️⃣ Prepare room update data (without participants)
            const roomPayload: VideoChatRoom = {
                ...(body ?? {}),
                participants: [],
                isVerified: true,
                userId: new ObjectId(body.userId ?? existingRoom.userId),
                createdBy: new ObjectId(body.createdBy ?? existingRoom.createdBy),
            };

            const updatedRoom = await this.service.updateAsync(roomPayload);

            // 3️⃣ Synchronize participants
            const incomingParticipants: { email: string; joinedAt?: Date }[] = Array.isArray(body?.participants)
                ? body.participants.map(p => ({
                    isVerified: true,
                    email: String(p?.email ?? '').trim().toLowerCase(),
                    joinedAt: p?.joinedAt ? new Date(p.joinedAt) : new Date(),
                }))
                : [];

            // 3a️⃣ Fetch current participants
            const existingParticipants = await this.videoChatRoomParticipantService.findAsync({
                videoChatRoomId: new ObjectId(id)
            });
            console.log('existingParticipants', existingParticipants);

            const existingEmails = existingParticipants.map(p => p.email.toLowerCase());
            const incomingEmails = incomingParticipants.map(p => p.email.toLowerCase());
            console.log('existingEmails', existingEmails, 'incomingEmails', incomingEmails);

            // 3b️⃣ Participants to add
            const participantsToAdd = incomingParticipants.filter(p => !existingEmails.includes(p.email));

            await Promise.all(
                participantsToAdd.map(p =>
                    this.videoChatRoomParticipantService.createAsync({
                        email: p.email,
                        isVerified: true,
                        videoChatRoomId: existingRoom._id,
                        joinedAt: p.joinedAt ?? new Date(),
                        createdBy: effectiveUserId,
                        createdDate: new Date(),
                    })
                )
            );

            // // 3c️⃣ Participants to remove
            const participantsToRemove = existingParticipants.filter(p => !incomingEmails.includes(p.email));
            await Promise.all(
                participantsToRemove.map(p =>
                    this.videoChatRoomParticipantService.deleteAsync(String(p._id))
                )
            );

            console.log('participantsToAdd', participantsToAdd, 'participantsToRemove', participantsToRemove);

            // 4️⃣ Fetch updated participants for response
            const updatedParticipants = await this.videoChatRoomParticipantService.findAsync({
                videoChatRoomId: existingRoom._id
            });

            const enrichedRoom = {
                ...updatedRoom,
                participants: updatedParticipants
            };

            return response.status(200).json(enrichedRoom);

        } catch (error: any) {
            const message = String(error?.message ?? error);
            if (message.toLowerCase().includes('not found')) {
                return response.status(404).send({ message });
            }
            console.error(error);
            return response.status(500).send({ message });
        }
    }

    @Patch(':_id')
    async patch(
        @Param('_id') _id: string,
        @Query('propertyName') propertyName: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        try {
            const deletedRoom = await super.deleteAsync(id, request, response);

            if (!deletedRoom) {
                return response.status(404).json({ message: 'Video chat room not found' });
            }

            await this.videoChatRoomParticipantService.deleteAllByRoomId(id);

            return response.status(204).send();
        } catch (error) {
            console.error('Error deleting video chat room and participants:', error);
            return response.status(500).json(error);
        }
    }
}