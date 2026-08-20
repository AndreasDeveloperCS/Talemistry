import { Injectable } from '@angular/core';
import gdpr from '../../../../gdpr.content.json'
import { GdprPolicyModel } from '../models/gdpr-model';

@Injectable({
  providedIn: 'root'
})
export class GdprService {

  constructor() { }

  public getGdprPolicy(): GdprPolicyModel {
    const gdprContent:GdprPolicyModel = JSON.parse(JSON.stringify(gdpr));
  //   //console.log('getGdprPolicy', gdprContent);
    return gdprContent;
  }
}
