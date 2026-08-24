import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DeviceDetectorService, DeviceInfo } from 'ngx-device-detector';
import { Observable, from, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IpWhois } from '../models/ip-whois';
import { VisitorInfo } from '../../visitors/models/visitor-info';

@Injectable({
  providedIn: 'root'
})
export class ClientInfoService {
  deviceInfo: DeviceInfo;
  currentIp!: string;
  constructor(private http: HttpClient,
    private deviceDetectorService: DeviceDetectorService) {
    this.deviceInfo = this.deviceDetectorService.getDeviceInfo();
  }

  getInfo() {
    try {

      this.getIpAddress().pipe(take(1)).subscribe(data => {
        //const responseData = this.getAdvancedIpInfo(data.ip)
        //const visitorInfo = this.convertToVisitorInfo(responseData);
        const shortvisitorInfo = this.convertToShortVisitorInfo(data.ip);

        const tartgetUrl = `${environment.apiUrl}${environment.serverPaths.visitorPath}`;

        this.http.post(tartgetUrl, shortvisitorInfo, {
          withCredentials: false
        });

      })
    } catch (error) {

    }
  }

  async getWhoisInfo(): Promise<void> {
    try {
      const ipResp = await fetch('https://api.ipify.org');
      const ip = await ipResp.text();
      this.currentIp = ip;
      const targetUrl = `https://ipwho.is/${ip}`;
      const whoisResp = await fetch(targetUrl);
      const json = await whoisResp.json();
      const whois = new IpWhois(json);
      //console.log(whois);
      const shortvisitorInfo = this.convertWhoisToVisitorInfo(whois);
      if (environment.production) {
        const tartgetUrl = `${environment.apiUrl}${environment.serverPaths.visitorPath}`;
        const resp = await fetch(tartgetUrl, {
          method: 'POST',
          body: JSON.stringify(shortvisitorInfo),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      //console.log('Save visitor response: ', resp.statusText);
    } catch (ex) {
      if (!environment.production) {
        console.error(ex);
      }
    }

  }

  getIpAddress(): Observable<any> {
    try {
      const ipdata = this.http.get('https://api.ipify.org?format=json');
      //ipdata.subscribe((data => { }));
      return ipdata;
    } catch (ex) {
      return new Observable();
    }
  }

  getAdvancedIpInfo(ip: string): any {
    const targetUrl = `http://ip-api.com/json/${ip}`;
    let responseData = {};
    // const ipdata = this.http.get();
    // ipdata.subscribe((data => {
    // }));
    // return ipdata;
    try {
      const result = fetch(`${targetUrl}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
          , "Accept": "application/json; charset=utf-8"
          // , "Transfer-Encoding": "gzip, chunked"
          // , "Accept-Encoding": "gzip, chunked, br"
        },
      });

      result.then(function (response) {
        //console.log(response);
        return response?.json();
      })
        .then(function (data) {
          //console.log('data', data);
          responseData = data;
          return data;
        })
        .catch(function (error) {
          //console.error("Error:", error);
        });
      return from(result)
    } catch (ex) {

    }
    return responseData;
  }

  convertWhoisToVisitorInfo(whois: IpWhois) {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? undefined;
    const lang = navigator.language;
    const visitorInfo: VisitorInfo = {
      userId: userId,
      publicIp: whois.ip,
      deviceType: this.deviceInfo.deviceType,
      isDesktop: this.deviceDetectorService.isDesktop(),
      isMobile: this.deviceDetectorService.isMobile(),
      isTablet: this.deviceDetectorService.isTablet(),
      userAgent: this.deviceInfo.userAgent,
      device: this.deviceInfo.device,
      os: this.deviceInfo.os,
      osVersion: this.deviceInfo.os_version,
      browser: this.deviceInfo.browser,
      browserVersion: this.deviceInfo.browser_version,

      orientation: this.deviceInfo.orientation,
      ip: whois.ip,
      city: whois.city,
      country: whois.country,
      countryCode: whois.countryCode,
      lat: whois.latitude,
      lon: whois.longitude,
      region: whois.regionCode,
      regionName: whois.region,
      timezone: whois.timezone.utc,
      zip: whois.postal,
      language: lang,
      dateTimeVisit: new Date(Date.now())
    }
    return visitorInfo;
  }

  convertToVisitorInfo(dataAdvanced: any) {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? undefined;
    const lang = navigator.language;
    const visitorInfo: VisitorInfo = {

      userId: userId,
      publicIp: dataAdvanced.query,
      macAddress: "",
      deviceType: this.deviceInfo.deviceType,
      isDesktop: this.deviceDetectorService.isDesktop(),
      isMobile: this.deviceDetectorService.isMobile(),
      isTablet: this.deviceDetectorService.isTablet(),
      userAgent: this.deviceInfo.userAgent,
      device: this.deviceInfo.device,
      os: this.deviceInfo.os,
      osVersion: this.deviceInfo.os_version,
      browser: this.deviceInfo.browser,
      browserVersion: this.deviceInfo.browser_version,

      orientation: this.deviceInfo.orientation,
      ip: dataAdvanced.query,
      mac: "",
      as: dataAdvanced.as,
      city: dataAdvanced.city,
      country: dataAdvanced.country,
      countryCode: dataAdvanced.countryCode,
      isp: dataAdvanced.isp,
      lat: dataAdvanced.lat,
      lon: dataAdvanced.lon,
      org: dataAdvanced.org,
      query: dataAdvanced.query,
      region: dataAdvanced.region,
      regionName: dataAdvanced.regionName,
      timezone: dataAdvanced.timezone,
      zip: dataAdvanced.zip,
      language: lang,
      dateTimeVisit: new Date(Date.now())
    }
    return visitorInfo;
  }


  convertToShortVisitorInfo(ip: string) {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? undefined;
    const lang = navigator.language;
    const visitorInfo: VisitorInfo = {
      userId: userId,
      publicIp: ip,
      macAddress: "",
      deviceType: this.deviceInfo.deviceType,
      isDesktop: this.deviceDetectorService.isDesktop(),
      isMobile: this.deviceDetectorService.isMobile(),
      isTablet: this.deviceDetectorService.isTablet(),
      userAgent: this.deviceInfo.userAgent,
      device: this.deviceInfo.device,
      os: this.deviceInfo.os,
      osVersion: this.deviceInfo.os_version,
      browser: this.deviceInfo.browser,
      browserVersion: this.deviceInfo.browser_version,
      orientation: this.deviceInfo.orientation,
      ip: ip,
      mac: "",
      language: lang,
      dateTimeVisit: new Date(Date.now())
    }
    return visitorInfo;
  }
}
