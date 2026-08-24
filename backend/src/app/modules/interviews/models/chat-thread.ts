import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { ChatChannel } from "./chat-channel";
import { ChatMessage } from "./chat-message";


export class ChatThread {
    @Column()
    @Prop({ required: true })
    channel: ChatChannel = ChatChannel.Meeting;

    @Column()
    @Prop({ required: false })
    externalThreadId?: string; // Zoom/Teams/Meet thread id

    @Column()
    @Prop({ required: true, type: [ChatMessage], default: [] })
    messages: ChatMessage[];
}