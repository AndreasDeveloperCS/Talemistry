import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ContactEmail, ContactPhone } from "../../companies/models/contact";
import { User } from "../../users/models/user";
import { Column, Entity } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { IUser } from "../../users/interfaces/user.interface";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";

@Schema({ collection: 'managers' })
@Entity("managers")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Manager extends User implements IBaseModel, IUser, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @Prop({ required: true })
    position: string = '';

    @Column()
    @Prop({ required: true })
    department?: string = '';

    @Column()
    @Prop({ required: true })
    mainEmail: ContactEmail = new ContactEmail(this.email);

    @Column()
    @Prop({ required: true })
    mainPhone: ContactPhone = new ContactPhone(this.phone);

    @Column()
    @Prop({ required: true })
    emails: ContactEmail[] = [];

    @Column()
    @Prop({ required: true })
    phones: ContactPhone[] = [];
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);

export type ManagerDocument = Manager & Document;