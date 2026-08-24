import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizerUrl',
  standalone: true
})
export class SanitizerUrlPipe implements PipeTransform {

  constructor (
    private sanitize: DomSanitizer
  ) {}

  transform(value: string): SafeUrl {
    return this.sanitize.bypassSecurityTrustUrl(value);
  }

}
