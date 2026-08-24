import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TelegramNotification } from '../models/telegram-notification';

@Injectable({
  providedIn: 'root'
})
export class TelegramNotificationService extends CRUDService<TelegramNotification> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.telegramNotifications}`;

    private telegramNotificationSubject = new BehaviorSubject<TelegramNotification[]>([]);

    telegramNotificationSubject$: Observable<TelegramNotification[]> = this.telegramNotificationSubject.asObservable();

    constructor(http: HttpClient) {
        super(http)
    }
}