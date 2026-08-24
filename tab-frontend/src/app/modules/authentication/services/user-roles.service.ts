import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, takeUntil } from "rxjs";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class UserRolesService extends CRUDService<any> {
    userRolesSubjectBehavior: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    constructor(httpService: HttpClient, private router: Router) {
        super(httpService);
    }

    override getHttpHeaders(isProtected: boolean): HttpHeaders {
        this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
        return isProtected
            ? new HttpHeaders({
                'Authorization': `Bearer ${this.idToken}`,
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                //"Access-Control-Allow-Origin" : environment.sourceUrl
            })
            : new HttpHeaders({
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
            });
    }

    getUsersRoleAsync(): Observable<any> {
        const userId = sessionStorage.getItem(`${environment.storage.userId}`);

        const tokenKey = `${environment.storage.prefixToken}${userId}`;
        const idToken = sessionStorage.getItem(`${tokenKey}`) ?? '';

        //console.log('getUsersRoleAsync userID', userId, tokenKey, idToken);

        const tartgetUrl = `${environment.apiUrl}auth/${userId}/role`;
        // console.log('getUsersRoleAsync 2', tartgetUrl);

        try {
            const usersSubscription = this.http.get(tartgetUrl, {
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${idToken}`,
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                }),
                withCredentials: true
            });

            usersSubscription
                .pipe(takeUntil(this._onDestroy))
                .subscribe((result: any) => {
                    this.userRolesSubjectBehavior.next(result);
                });
            return usersSubscription;
        } catch (error) {
            console.error(error);
        }
        return Observable.prototype;
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this._onDestroy.next();
        this._onDestroy.complete();
    }
}