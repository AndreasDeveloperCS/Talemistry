import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { ObjectId } from 'bson';

export interface VisitorInfo {
  userId?: string;
  publicIp?: string;
  macAddress?: string;
  userAgent?: string;
  device?: string;
  deviceInfo?: any,
  isDesktop?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  deviceType?: string;
  orientation?: string;
  ip?: string;
  mac?: string;
  as?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  lat?: number;
  lon?: number;
  org?: string;
  query?: string;
  region?: string;
  regionName?: string;
  timezone?: string;
  zip?: string;
  language?: string;
  dateTimeVisit?: Date;
}

@Schema({ collection: 'health-check' })
@Entity("health-check")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class HealthCheck implements VisitorInfo, IBaseModel, IAuditCreated, IAuditModified {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: any;

  @Column()
  @Prop({ required: false, default: "" })
  userId?: string;

  @Column()
  @Prop({ required: false, default: "" })
  publicIp?: string;

  @Column()
  @Prop({ required: false, default: 0 })
  frequency?: number;

  @Column()
  @Prop({ required: false, default: "" })
  macAddress?: string;

  @Column()
  @Prop({ required: false, default: "" })
  userAgent?: string;

  @Column()
  @Prop({ required: false, default: "" })
  device?: string;

  // @Column()
  // deviceInfo?:any;

  @Column()
  @Prop({ required: false, default: false })
  isDesktop?: boolean;

  @Column()
  @Prop({ required: false, default: false })
  isMobile?: boolean;

  @Column()
  @Prop({ required: false, default: false })
  isTablet?: boolean;

  @Column()
  @Prop({ required: false, default: "" })
  os?: string;

  @Column()
  @Prop({ required: false, default: "" })
  osVersion?: string;

  @Column()
  @Prop({ required: false, default: "" })
  browser?: string;

  @Column()
  @Prop({ required: false, default: "" })
  browserVersion?: string;

  @Column()
  @Prop({ required: false, default: "" })
  deviceType?: string;

  @Column()
  @Prop({ required: false, default: "" })
  orientation?: string;

  @Column()
  @Prop({ required: false, default: "" })
  ip?: string;

  @Column()
  @Prop({ required: false, default: "" })
  mac?: string;

  @Column()
  @Prop({ required: false, default: "" })
  as?: string;

  @Column()
  @Prop({ required: false, default: "" })
  city?: string;

  @Column()
  @Prop({ required: false, default: "" })
  country?: string;

  @Column()
  @Prop({ required: false, default: "" })
  countryCode?: string;

  @Column()
  @Prop({ required: false, default: "" })
  isp?: string;

  @Column()
  @Prop({ required: false, default: 0.0 })
  lat?: number;

  @Column()
  @Prop({ required: false, default: 0.0 })
  lon?: number;

  @Column()
  @Prop({ required: false, default: "" })
  org?: string;

  @Column()
  @Prop({ required: false, default: "" })
  query?: string;

  @Column()
  @Prop({ required: false, default: "" })
  region?: string;

  @Column()
  @Prop({ required: false, default: "" })
  regionName?: string;

  @Column()
  @Prop({ required: false, default: "" })
  timezone?: string;

  @Column()
  @Prop({ required: false, default: "" })
  zip?: string;

  @Column()
  @Prop({ required: false, default: "" })
  language?: string;

  @Column()
  @Prop({ required: true, default: new Date(Date.now()) })
  dateTimeVisit?: Date = new Date();

  @Column()
  @Prop({ required: true })
  createdBy: ObjectId;

  @Column()
  @Prop({ required: false, default: new Date(Date.now()) })
  createdDate: Date;

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ required: false, default: new Date(Date.now()) })
  modifiedDate: Date;
}

export type HealthCheckDocument = HealthCheck & Document;

export const HealthCheckSchema = SchemaFactory.createForClass(HealthCheck);
