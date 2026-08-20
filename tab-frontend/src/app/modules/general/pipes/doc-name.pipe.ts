import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'docName',
  standalone: true
})
export class DocNamePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.length > 0 ? value.replace('assets/','').replace('.pdf','') : value;
  }

}
