import { CoordinateEntity } from "./coordinate";

export enum LocationType {
    point = "Point"
}

export class LocationEntity {
    type:LocationType = LocationType.point;
    coordinates: CoordinateEntity = new CoordinateEntity();
}