
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";

export class CoordinateEntity {
    latitude: number = 0;
    longitude: number = 0;
}

export enum LocationType {
    point = "Point"
}

export class LocationEntity {
    type: LocationType = LocationType.point;
    coordinates: CoordinateEntity = new CoordinateEntity();
}

@Schema({ collection: 'cities' })
@Entity("cities")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class City implements IBaseModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    cityId: number = 0;

    @Column()
    @Prop({ required: false })
    name: string = '';

    @Column()
    @Prop({ required: false })
    altName: string = '';

    @Column()
    @Prop({ required: false })
    country: string = '';

    @Column()
    @Prop({ required: false })
    featureCode: string = '';

    @Column()
    @Prop({ required: false })
    adminCode: string = '';

    @Column()
    @Prop({ required: false })
    population: number = 0;

    @Column()
    @Prop({ required: false })
    loc: LocationEntity = new LocationEntity();


    @Column()
    @Prop({ required: true, default: new ObjectId() })
    createdBy: ObjectId = new ObjectId();

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

export type CityDocument = City & Document;

export const CitySchema = SchemaFactory.createForClass(City);
