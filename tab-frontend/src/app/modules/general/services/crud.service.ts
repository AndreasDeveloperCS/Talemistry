import { HttpClient, HttpHeaders } from "@angular/common/http";
import { EventEmitter, Injectable, OnDestroy, Output } from "@angular/core";
import { BehaviorSubject, Observable, Subject, take } from "rxjs";
import { environment } from "../../../../environments/environment";
import { BaseEntity } from "../models/base-entity";
import { Filtering, PaginatedResource, Sorting } from "./search-logic.service";

export interface ICRUDService<T> {
  refreshDataBehaviorSubject: BehaviorSubject<boolean>;

  getAllAsync(selectedPageSize: number, pageIndex: number, sorting: Sorting, filtering: Filtering, isProtected?: boolean): Observable<PaginatedResource<T>>;
  getByIdAsync(id: any, isProtected?: boolean): Observable<T>;
  createAsync(entity: T, isProtected?: boolean, pushSubject?: boolean): Observable<T>;
  updateAsync(entity: T, isProtected?: boolean, pushSubject?: boolean): Observable<T>;
  patchAsync(id: any, entity: any, propertyName: string, value: any, isProtected?: boolean, pushSubject?: boolean): Observable<T>;
  deleteAsync(id: any): Observable<T>;
}

@Injectable({
  providedIn: 'root'
})
export class CRUDService<T extends BaseEntity> implements ICRUDService<T>, OnDestroy {

  public headers: HttpHeaders = new HttpHeaders();

  protected tartgetUrl = `${environment.apiUrl}`;
  public currentServiceName: string = this.constructor.name;
  @Output()
  refreshData: EventEmitter<boolean> = new EventEmitter<boolean>();

  public refreshDataBehaviorSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // requestSubscription!: Subscription;
  paginationResource = new PaginatedResource<T>();
  public dataSubject = new Subject<PaginatedResource<T>>();
  // public behaviorSubject = new BehaviorSubject<PaginatedResource<T>>(this.paginationResource);
  // public behaviorSubject$:Observable<PaginatedResource<T>> = this.behaviorSubject.asObservable();

  protected idToken: string = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
  public inheritedClassName: string = ""
  //private deleteSubscription!: Subscription;
  protected _onDestroy = new Subject<void>();

  constructor(public http: HttpClient) {

  }

  // ngOnDestroy(): void {
  //   this.requestSubscription?.unsubscribe();
  //   this.deleteSubscription?.unsubscribe();
  // }

  getAllAsync(
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<T>> {

    console.log('getAllAsync', this.tartgetUrl);
    if (!environment.production) {
      // console.log("getAllAsync", this.inheritedClassName, pageSize, pageIndex, sorting, filtering, isProtected, pushSubject);
    }

    // this.requestSubscription?.unsubscribe();

    const url = `${this.tartgetUrl}?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`

    if (!environment.production) {
      // console.log(url, this.idToken);
    }

    const request = this.http.get<PaginatedResource<T>>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    if (pushSubject) {
      //this.requestSubscription = 
      request.pipe(take(1)).subscribe((result: any) => {
        if (!environment.production) {
          // console.log(url, result);
        }
        this.dataSubject.next(result);
        //this.requestSubscription?.unsubscribe();
      });
    }

    return request;
  }

  getHttpHeaders(isProtected: boolean): HttpHeaders {
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
      })
  }

  getByIdAsync(id: any, isProtected: boolean = true): Observable<T> {
    //this.requestSubscription?.unsubscribe();
    const tartgetUrl = `${this.tartgetUrl}/${id}`;

    const request = this.http.get<any>(tartgetUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    return request;
  }

  createAsync(entity: T, isProtected: boolean = true, pushSubject: boolean = true): Observable<T> {
    console.log('createAsync', this.tartgetUrl);
    console.log('Entity', entity);

    const request = this.http.post<any>(this.tartgetUrl, entity,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    if (pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
        this.refreshData.next(true);
      });
    }

    return request;
  }

  updateAsync(entity: T, isProtected: boolean = true, pushSubject: boolean = true): Observable<T> {

    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, entity, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected,
      observe: "body",
      reportProgress: true,
      responseType: "json",
    });

    if (pushSubject) {
      //const subscription = 
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
        this.refreshData.next(true);
        // subscription.unsubscribe();
      });
    }
    return request;
  }

  patchAsync(id: any, entity: any, propertyName: string, value: any, isProtected: boolean = true, pushSubject: boolean = true) {
    // console.log('patchAsync', this.constructor.name, entity);

    const url = `${this.tartgetUrl}/${id?.toString()}?propertyName=${propertyName}`;
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';

    if (!environment.production) {
      // console.log(url, entity, propertyName, value);
    }

    if (propertyName in entity || entity.hasOwnProperty(propertyName)) {
      entity[propertyName] = value;

      const keyValue = { [propertyName]: value };

      if (!environment.production) {
        // console.log(url, entity, propertyName, value, keyValue);
      }
      const request = this.http.patch<any>(url, keyValue,
        {
          headers: this.getHttpHeaders(isProtected),
          withCredentials: isProtected
        });
      if (pushSubject) {

        //const subscription = 
        request.pipe(take(1)).subscribe((result: any) => {
          this.refreshData.next(true);
          this.refreshDataBehaviorSubject.next(true);
          //subscription.unsubscribe();
        });
      }
      return request;
    } else {
      console.warn(`Property ${propertyName} does not exist on the target entity.`);
    }
    return new Observable<T>();
  }

  deleteAsync(id: any, isProtected: boolean = true, isProcessedInside = true): Observable<T> {
    //this.deleteSubscription?.unsubscribe();
    const url = `${this.tartgetUrl}/${id?.toString()}`;

    const request = this.http.delete<any>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected,
      observe: "body",
      body: JSON.stringify({ id })
    });

    if (isProcessedInside) {
      //this.deleteSubscription = 
      request.pipe(take(1)).subscribe((result: any) => {
        // console.log('subscription delete', result);
        this.refreshDataBehaviorSubject.next(true);
        this.refreshData.emit(true);
        //this.deleteSubscription.unsubscribe();
      });
    }

    return request;
  }

  public getDate(date: Date): string {
    return `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}_${date.getMilliseconds()}`;
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
