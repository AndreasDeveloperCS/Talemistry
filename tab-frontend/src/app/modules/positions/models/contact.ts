export class ContactArtifact {
    isActive: boolean = true;
    isMain: boolean = true;
    description: string = '';
}
  
  export class ContactPhone extends ContactArtifact {

    constructor(phoneValue:string='') {
      super();
      this.phone = phoneValue;
    }

    countryCode: number = 0;
    country: string = '';
    operatorCode: string = '';
    internalCountryPhone: string = '';
    phone: string = '';
  }
  
  export class ContactEmail extends ContactArtifact {
    domain: string = '';
    constructor(emailValue:string='') {
      super();
      this.email = emailValue
    }
    email: string = '';
  }
  