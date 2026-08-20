export interface BaseEntity {
    _id?: any;
    createdDate?: Date;
    modifiedDate?: Date;
}

export interface OwnerEntity {
    userId: any;
}

export interface ChatRoomEntity {
    roomId: any;
}

export interface VerifiedEntity {
    isVerified: any;
}

export interface PositionEntity {
    title: any;
    appliedDate: Date;
    status: any;
}