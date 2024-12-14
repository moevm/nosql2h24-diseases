// file-download.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {

  constructor(private http: HttpClient) { }

  downloadFile(url: string): Observable<HttpResponse<Blob>> {
    return this.http.post(url, {}, { responseType: 'blob', observe: 'response' });
  }
}
