
import { Injectable } from '@nestjs/common';

@Injectable()
export class ParsingHelper {

    getExtension(fileName: string): string {
        const fileExtension = fileName.split('.').slice(-1)[0]
        return fileExtension;
    }

    getHostName(login: string): string {
        const hostName = login.split('@').slice(-1)[0]
        return hostName;
    }

    public getDate(date: Date): string {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    }

}
