import { Column } from "typeorm";
import { ChatAttachment } from "./chat-attachment";
import { Prop } from "@nestjs/mongoose";

export class ChatMessage {
    @Column()
    @Prop({ required: true })
    messageId: string;

    @Column()
    @Prop({ required: true })
    senderEmail: string;

    @Column()
    @Prop({ required: false })
    senderName?: string;

    @Column()
    @Prop({ required: true })
    sentAt: Date;

    @Column()
    @Prop({ required: true })
    text: string;

    @Column()
    @Prop({ required: true })
    lang: string; // BCP-47

    @Column()
    @Prop({ required: false, type: [ChatAttachment], default: [] })
    attachments?: ChatAttachment[];
}
