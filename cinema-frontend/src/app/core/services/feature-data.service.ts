import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeatureDataService {
  constructor(private readonly http: HttpClient) {}

  getList(endpoint: string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}${endpoint}`);
  }
}
