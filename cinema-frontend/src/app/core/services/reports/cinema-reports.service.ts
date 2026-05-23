import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  ReportRoomComments, ReportRoomShowtimes, 
  ReportTopRatedRoom, ReportTicketSales 
} from '../../models/reports/cinema-report.model';

@Injectable({
  providedIn: 'root'
})
export class CinemaReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports/cinema`;

  private buildParams(from?: string, to?: string, format: string = 'json'): HttpParams {
    let params = new HttpParams().set('format', format);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return params;
  }

  // 1. Comentarios
  getCommentsJSON(companyId: string, from?: string, to?: string): Observable<ReportRoomComments[]> {
    return this.http.get<ReportRoomComments[]>(`${this.baseUrl}/${companyId}/comments`, { params: this.buildParams(from, to, 'json') });
  }
  getCommentsPDF(companyId: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${companyId}/comments`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }

  // 2. Funciones
  getShowtimesJSON(companyId: string, from?: string, to?: string): Observable<ReportRoomShowtimes[]> {
    return this.http.get<ReportRoomShowtimes[]>(`${this.baseUrl}/${companyId}/showtimes`, { params: this.buildParams(from, to, 'json') });
  }
  getShowtimesPDF(companyId: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${companyId}/showtimes`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }

  // 3. Top Salas
  getTopRoomsJSON(companyId: string, from?: string, to?: string): Observable<ReportTopRatedRoom[]> {
    return this.http.get<ReportTopRatedRoom[]>(`${this.baseUrl}/${companyId}/top-rated-rooms`, { params: this.buildParams(from, to, 'json') });
  }
  getTopRoomsPDF(companyId: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${companyId}/top-rated-rooms`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }

  // 4. Ventas
  getTicketSalesJSON(companyId: string, from?: string, to?: string): Observable<ReportTicketSales[]> {
    return this.http.get<ReportTicketSales[]>(`${this.baseUrl}/${companyId}/ticket-sales`, { params: this.buildParams(from, to, 'json') });
  }
  getTicketSalesPDF(companyId: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${companyId}/ticket-sales`, { params: this.buildParams(from, to, 'pdf'), responseType: 'blob' });
  }
}