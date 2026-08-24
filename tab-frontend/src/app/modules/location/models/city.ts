import { BaseEntity } from "../../general/models/base-entity";
import { LocationEntity } from "./location";

export class City implements BaseEntity{
    _id:any;
    cityId:number = 0;
    name:string = '';
    altName:string = '';
    country:string = '';
    featureCode:string = '';
    adminCode:string = '';
    population:number = 0;
    loc:LocationEntity = new LocationEntity();
}