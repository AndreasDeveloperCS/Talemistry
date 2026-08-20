import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CompanyPhotoGalleryCanEditResponse, CompanyPhotoGalleryResponse } from '../models/company-photo-gallery';

@Injectable({
    providedIn: 'root'
})
export class CompanyPhotoGalleryService {
    private readonly baseApi = environment.apiUrl.replace(/\/+$/, '');

    constructor(private readonly http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token =
            sessionStorage.getItem(
                `${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`
            ) ?? '';

        return token
            ? new HttpHeaders({
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            })
            : new HttpHeaders({ Accept: 'application/json' });
    }

    getGalleryPublic(companyId: string): Observable<CompanyPhotoGalleryResponse> {
        const url = `${this.baseApi}/companies-photo-gallery-public/${companyId}`;
        // Avoid sending non-simple headers on a public GET to reduce CORS preflight/edge failures.
        return this.http.get<CompanyPhotoGalleryResponse>(url, { withCredentials: false });
    }

    getGalleryProtected(companyId: string): Observable<CompanyPhotoGalleryResponse> {
        const url = `${this.baseApi}/companies-verified/${companyId}/photo-gallery`;
        return this.http.get<CompanyPhotoGalleryResponse>(url, {
            headers: this.getAuthHeaders(),
            withCredentials: false
        });
    }

    canEdit(companyId: string): Observable<CompanyPhotoGalleryCanEditResponse> {
        const url = `${this.baseApi}/companies-verified/${companyId}/photo-gallery/can-edit`;
        return this.http.get<CompanyPhotoGalleryCanEditResponse>(url, {
            headers: this.getAuthHeaders(),
            withCredentials: false
        }).pipe(
            catchError(() => of({ canEdit: false }))
        );
    }

    upload(companyId: string, files: File[], caption?: string): Observable<CompanyPhotoGalleryResponse> {
        const url = `${this.baseApi}/companies-verified/${companyId}/photo-gallery`;
        const form = new FormData();

        for (const file of files) {
            form.append('files', file, file.name);
        }

        if (caption != null) {
            form.append('caption', caption);
        }

        return this.http.post<CompanyPhotoGalleryResponse>(url, form, {
            headers: this.getAuthHeaders(),
            withCredentials: false
        });
    }

    deleteItem(companyId: string, photoId: string): Observable<CompanyPhotoGalleryResponse> {
        const url = `${this.baseApi}/companies-verified/${companyId}/photo-gallery/${photoId}`;
        return this.http.delete<CompanyPhotoGalleryResponse>(url, {
            headers: this.getAuthHeaders(),
            withCredentials: false
        });
    }

    getGalleryBestEffort(companyId: string): Observable<CompanyPhotoGalleryResponse> {
        const empty: CompanyPhotoGalleryResponse = { items: [], canEdit: false };

        return this.getGalleryProtected(companyId).pipe(
            catchError((protectedErr: any) => {
                return this.getGalleryPublic(companyId).pipe(
                    catchError((publicErr: any) => {
                        const status = publicErr?.status ?? protectedErr?.status;
                        if (status === 404) {
                            return of(empty);
                        }
                        return throwError(() => publicErr ?? protectedErr);
                    })
                );
            }),
            catchError((err) => throwError(() => err))
        );
    }
}
