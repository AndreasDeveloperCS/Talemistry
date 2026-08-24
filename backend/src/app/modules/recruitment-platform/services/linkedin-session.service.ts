import { Injectable, NotFoundException } from "@nestjs/common";
import { LinkedInSessionToken, LinkedInSessionTokenDocument } from "../models/linkedin-session-token";
import { BaseService } from "../../base/services/base.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";

@Injectable()
export class LinkedInSessionService extends BaseService<LinkedInSessionToken> {

    constructor(
        @InjectModel(LinkedInSessionToken.name)
        protected readonly model: Model<LinkedInSessionTokenDocument>,

        @InjectRepository(LinkedInSessionToken)
        protected readonly repository: Repository<LinkedInSessionToken>
    ) {
        super(model, repository);
    }

    async saveLinkedInSessionTokenAsync(token: any): Promise<void> {
        await this.model.deleteMany({ userId: token.userId });
        console.log("Saving token for user:", token.userId);
        console.log("access_token:", token.access_token);
        console.log("expires_in:", token.expires_in);
        console.log("refresh_token_expires_in:", token.refresh_token_expires_in);
        await this.model.create(token);
    }

    async findAllTokens(): Promise<LinkedInSessionToken[]> {
        const tokens = this.model.find().exec();
        console.log("All LinkedInSessionTokens", tokens);
        return tokens;
    }

    async getLinkedInSessionTokenAsync(userId: any): Promise<LinkedInSessionToken> {

        try {
            console.log("getLinkedInSessionTokenAsync items", userId)
            const item = await this.repository.findOne({
                where: { userId: userId },
                order: {
                    createdDate: "DESC"
                }
            });
            if (item === null || item === undefined) {
                console.error(`${this.model.name} with ID "${userId}" not found`);
                return null;
            }
            return item;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async refreshToken(entity: LinkedInSessionToken, data: any): Promise<LinkedInSessionToken> {
        entity.access_token = data.access_token;
        entity.expires_in = data.expires_in;
        entity.refresh_token = data.refresh_token;
        entity.refresh_token_expires_in = data.refresh_token_expires_in;
        entity.modifiedDate = new Date();

        const id = entity._id;
        const updatingEntity: LinkedInSessionToken = entity;

        delete updatingEntity._id;

        const updatedEntity: any = await this.model.updateOne(
            { _id: id },
            { $set: updatingEntity }
        );
        const updated = await this.updateAsync(entity);
        console.log('refreshToken', updated, updatedEntity);

        if (!updatedEntity) {
            throw new NotFoundException(`Entity with ID "${entity._id}" not found`);
        }
        return entity;

    }
}