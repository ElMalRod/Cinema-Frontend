import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdPrice, AdPriceRequest } from '../../models/prices/price.model';

@Injectable({
  providedIn: 'root'
})
export class PricesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ads/prices`;

  // Endpoint reutilizable tanto por el Administrador como por el Publicista
  getPrices(): Observable<AdPrice[]> {
    return this.http.get<AdPrice[]>(this.baseUrl);
  }

  // Endpoints exclusivos del Administrador (bloqueados por rol en backend)
  createPrice(price: AdPriceRequest): Observable<AdPrice> {
    return this.http.post<AdPrice>(this.baseUrl, price);
  }

  updatePrice(id: string, price: { price: number }): Observable<AdPrice> {
    return this.http.put<AdPrice>(`${this.baseUrl}/${id}`, price);
  }

  deletePrice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}