import { Prop, Schema } from "@nestjs/mongoose";

@Schema()
export class Applicant {
    @Prop()
    email: string;

    @Prop()
    fullName: string;

    // your other fields...

    @Prop()
    telegramChatId?: string;

    @Prop({ default: false })
    telegramOptIn?: boolean;

    @Prop()
    telegramConnectToken?: string; // one-time token to link bot & applicant
}