import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  ReportSystemProfit, ReportAdsPurchased, ReportAdvertiserProfit, 
  ReportTopPopularRoom, ReportTopCommentedRoom 
} from '../../models/reports/system-report.model';

@Injectable({ providedIn: 'root' })
export class SystemReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports/system`;

  private buildParams(from?: string, to?: string, format: string = 'json', extraParamName?: string, extraParamValue?: string): HttpParams {
    let params = new HttpParams().set('format', format);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (extraParamName && extraParamValue) params = params.set(extraParamName, extraParamValue);
    return params;
  }

  // 1. Ganancias
  getProfitJSON(from?: string, to?: string): Observable<ReportSystemProfit> {
    return this.http.get<ReportSystemProfit>(`${this.baseUrl}/profit`, { params: this.buildParams(from, to, 'json') });
  }
  getProfitPDF(from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/profit`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }

  // 2. Anuncios Comprados
  getAdsPurchasedJSON(from?: string, to?: string, adType?: string): Observable<ReportAdsPurchased[]> {
    return this.http.get<ReportAdsPurchased[]>(`${this.baseUrl}/ads-purchased`, { params: this.buildParams(from, to, 'json', 'adType', adType) });
  }
  getAdsPurchasedPDF(from?: string, to?: string, adType?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/ads-purchased`, { params: this.buildParams(from, to, 'pdf', 'adType', adType), responseType: 'blob' });
  }

  // 3. Ganancias por Anunciante
  getAdvertiserProfitJSON(from?: string, to?: string, advertiserId?: string): Observable<ReportAdvertiserProfit[]> {
    return this.http.get<ReportAdvertiserProfit[]>(`${this.baseUrl}/advertiser-profit`, { params: this.buildParams(from, to, 'json', 'advertiserId', advertiserId) });
  }
  getAdvertiserProfitPDF(from?: string, to?: string, advertiserId?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/advertiser-profit`, { params: this.buildParams(from, to, 'pdf', 'advertiserId', advertiserId), responseType: 'blob' });
  }

  // 4. Salas Populares
  getTopPopularJSON(from?: string, to?: string): Observable<ReportTopPopularRoom[]> {
    return this.http.get<ReportTopPopularRoom[]>(`${this.baseUrl}/top-popular-rooms`, { params: this.buildParams(from, to, 'json') });
  }
  getTopPopularPDF(from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/top-popular-rooms`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }

  // 5. Salas Comentadas
  getTopCommentedJSON(from?: string, to?: string): Observable<ReportTopCommentedRoom[]> {
    return this.http.get<ReportTopCommentedRoom[]>(`${this.baseUrl}/top-commented-rooms`, { params: this.buildParams(from, to, 'json') });
  }
  getTopCommentedPDF(from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/top-commented-rooms`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }
}