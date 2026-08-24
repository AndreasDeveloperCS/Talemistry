import { City } from "../../locations/models/city";
import { Country } from "../../locations/models/countries";

export class EntityLocation {
    city: City;
    country: Country;
    lattitude: number = 0.0;
    longitude: number = 0.0;
}