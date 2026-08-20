import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { ChatChannel } from "./chat-channel";

export class ChatAttachment {
    @Column()
    @Prop({ required: true })
    name: string;

    @Column()
    @Prop({ required: true })
    storageKey: string;

    @Column()
    @Prop({ required: true })
    mimeType: string;

    @Column()
    @Prop({ required: false })
    sizeBytes?: number;
}