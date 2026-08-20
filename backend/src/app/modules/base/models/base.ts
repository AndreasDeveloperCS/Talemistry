import { ObjectId } from "bson";

export interface IBaseModel {
  _id?: ObjectId;
}

export interface IVerifiableModel {
  isVerified: boolean;
}

export interface IEntityAudit extends IAuditCreated, IAuditModified { }

export interface IAuditCreated {
  createdBy?: ObjectId;
  createdDate?: Date;
}

export interface IAuditModified {
  modifiedBy?: ObjectId;
  modifiedDate?: Date;
}

export interface IOwnerModel {
  userId: ObjectId;
}

export interface ISharedModel extends ISharedReadModel, ISharedEditModel { }

export interface ISharedReadModel extends ISharedIdsReadModel, ISharedEmailsReadModel { }

export interface ISharedEditModel extends ISharedIdsEditModel, ISharedEmailsEditModel { }


export interface ISharedIdsReadModel {
  sharedReadIds: ObjectId[];
}

export interface ISharedIdsEditModel {
  sharedEditIds: ObjectId[];
}

export interface ISharedEmailsReadModel {
  sharedReadEmails: string[];
}

export interface ISharedEmailsEditModel {
  sharedEditEmails: string[];
}