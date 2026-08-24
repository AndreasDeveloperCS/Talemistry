
import { City } from "../app/modules/location/models/city";
import { Country } from "../app/modules/location/models/country";
import { LocationEntity, LocationType } from "../app/modules/location/models/location";

export function getCity(info: any) {
    const city = new City();
    city.name = info.city;
    city.altName = info.region;
    city.country = info.country_code;
    city.loc = new LocationEntity();
    city.loc.type = LocationType.point;
    city.loc.coordinates.latitude = info.latitude;
    city.loc.coordinates.longitude = info.longitude;

    return city;
}

export function getCountry(info: any) {
    const country = new Country();
    country.name = info.country;
    country.code = info.country_code;
    return country;
}