import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'absoluteUrl',
  standalone: false
})
export class AbsoluteUrlPipe implements PipeTransform {

  transform(url: string | null | undefined): string {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url.trim();
    }
    return url.trim();
  }
}
