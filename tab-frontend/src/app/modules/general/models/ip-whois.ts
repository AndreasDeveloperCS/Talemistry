export class IpWhois {
    ip: string = "";
    continent: string = "";
    country: string = "";
    countryCode: string = "";
    region: string = "";
    regionCode: string = "";
    city: string = "";
    latitude: number = 0;
    longitude: number = 0;
    postal: string = "";
    timezone: Timezone = new Timezone("", "");
    constructor(whoisJson: any) {
        this.ip = whoisJson.ip;
        this.continent = whoisJson.continent;
        this.country = whoisJson.country;
        this.countryCode = whoisJson.country_code;
        this.region = whoisJson.region;
        this.regionCode = whoisJson.region_code;
        this.city = whoisJson.city;
        this.latitude = whoisJson.latitude;
        this.longitude = whoisJson.longitude;
        this.postal = whoisJson.postal;
        this.timezone = new Timezone(whoisJson.timezone.id, whoisJson.timezone.utc);
    }
}

class Timezone {
    id: string = "";
    utc: string = "";
    constructor(id: string, utc: string) {
        this.id = id;
        this.utc = utc;
    }
}