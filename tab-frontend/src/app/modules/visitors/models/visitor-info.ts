import { BaseEntity } from "../../general/models/base-entity";

export class VisitorInfo implements BaseEntity {

  _id?: any;
  frequency?:number;
  userId?: string;
  publicIp?: string;
  macAddress?: string;
  userAgent?: string;
  device?: string;
  deviceInfo?:any;
  isDesktop?: boolean;
  isMobile? : boolean;
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
  region?:string
  regionName? :string
  timezone?:string
  zip?: string;
  language?: string;
  dateTimeVisit?:Date;
  createdDate?: Date = new Date();
  modifiedDate?: Date;
}
