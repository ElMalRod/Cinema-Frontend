import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdResponse, AdRequest, AdvertiserDto } from '../../models/ads/ad.model';


@Injectable({
  providedIn: 'root'
})
export class AdsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ads`;

  // Obtiene los anuncios del publicista logueado
  getAdvertiserAds(): Observable<AdResponse[]> {
    return this.http.get<AdResponse[]>(`${this.baseUrl}/advertiser`);
  }

  // Obtiene todos los anuncios (Para el futuro admin)
  getAllActiveAds(): Observable<AdResponse[]> {
    return this.http.get<AdResponse[]>(`${this.baseUrl}/active`);
  }

  desactivateAd(adId: string): Observable<AdResponse> {
    return this.http.put<AdResponse>(`${this.baseUrl}/desactivate/${adId}`, {});
  }

  // Creación de anuncio con Multipart Form Data
  createAd(request: AdRequest, imageFile?: File, videoFile?: File): Observable<AdResponse> {
    const formData = new FormData();
    
    // Spring Boot espera la parte 'request' como un Blob JSON
    formData.append(
      'request',
      new Blob([JSON.stringify(request)], { type: 'application/json' })
    );

    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    if (videoFile) {
      formData.append('videoFile', videoFile);
    }

    return this.http.post<AdResponse>(this.baseUrl, formData);
  }

  getAdvertisers(): Observable<AdvertiserDto[]> {
    return this.http.get<AdvertiserDto[]>(`${this.baseUrl}/advertisers`);
  }

  // Obtiene los anuncios de un anunciante específico (Para SYSTEM_ADMIN)
  getAdsByAdvertiserId(advertiserId: string): Observable<AdResponse[]> {
    return this.http.get<AdResponse[]>(`${this.baseUrl}/advertiser/${advertiserId}/ads`);
  }

}