import { EventEmitter, Injectable, Output } from '@angular/core';
import * as data from '../../LanguageSource.json'
import { Subject } from 'rxjs';
import { LanguageState } from '../models/language-state';

@Injectable({
  providedIn: 'root'
})
export class LanguageStateService {
  @Output() languageChanges = new EventEmitter<LanguageState>();

  public languages: LanguageState[];

  public selectedLanguage: Subject<LanguageState> = new Subject<LanguageState>();
  public languageDictionary: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
  public activeDictionary: Subject<Map<string, string>> = new Subject<Map<string, string>>();
  public contentDictionary: Map<string, string> = new Map<string, string>();

  public _activeSelectedLanguage:LanguageState = new LanguageState();

  public get activeSelectedLanguage():LanguageState {
    return this._activeSelectedLanguage;
  }
  public set activeSelectedLanguage(languageState: LanguageState) {
    this._activeSelectedLanguage = languageState;

    if(this.languageDictionary.has(languageState.lang)) {
      const dictionary = this.languageDictionary.get(languageState.lang);

      if(dictionary != undefined) {
        this.activeDictionary.next(new Map(Object.entries(dictionary)));
      }
    }
  }

  public _languageStateSelected: Subject<LanguageState> = new Subject<LanguageState>();

  constructor() {

    this.languages = [];

    const keys = Object.keys(data).slice(0, -1);

    keys.forEach(lng => {
      const lang = new LanguageState();
      lang.lang = lng;
      lang.code = lng.substring(0,2).toUpperCase();
      this.languages.push(lang);
    });

    if(this.languages.length > 0) {
      this.activeSelectedLanguage = this.languages[0];
    }
    const dictionary:Map<string, Map<string,string>> = JSON.parse(JSON.stringify(data));

    this.languageDictionary = new Map(Object.entries(dictionary));
  }

  changeLanguage(id: string) {
    let currentLanguage = 'English';
    if (id == "GR") {
      currentLanguage = 'Greek';
    }
    const dictionary = this.languageDictionary.get(currentLanguage);
    if (dictionary != undefined) {
      this.contentDictionary = new Map<string, string>(Object.entries(dictionary));
      this.activeDictionary.next(this.contentDictionary);
    }
  }
}
