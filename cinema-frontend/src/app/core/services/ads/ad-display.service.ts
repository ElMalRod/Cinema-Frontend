import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdResponse, AdBlockNowResponse } from '../../models/ads/ad.model';

@Injectable({ providedIn: 'root' })
export class AdDisplayService {
  private readonly http = inject(HttpClient);
  
  private readonly adsBaseUrl = `${environment.apiBaseUrl}/ads`; 
  private readonly blockBaseUrl = `${environment.apiBaseUrl}/cinemas/v1/cinemas/ad-blocks`; 

  // Cachés en memoria
  private cachedAds: AdResponse[] | null = null;
  private blockedCinemasCache = new Map<string, boolean>();
  private lastAdId: string | null = null;
  /**
   * 1. Obtiene los anuncios. Si ya los pidió antes, devuelve la memoria.
   */
  private getActiveAds(): Observable<AdResponse[]> {
    if (this.cachedAds !== null) {
      return of(this.cachedAds);
    }
    return this.http.get<AdResponse[]>(`${this.adsBaseUrl}/active`).pipe(
      tap(ads => this.cachedAds = ads),
      catchError(() => of([])) // Si falla, devolvemos array vacío para no romper la app
    );
  }

  /**
   * 2. Obtiene un anuncio al azar de los activos.
   */


  getRandomAd(): Observable<AdResponse | null> {
    return this.getActiveAds().pipe(
      map(ads => {
        if (!ads || ads.length === 0) return null;
        if (ads.length === 1) return ads[0]; // Si solo hay 1, no hay de otra

        // Filtramos el último anuncio para forzar la rotación
        const availableAds = ads.filter(ad => ad.idAd !== this.lastAdId);
        
        // Si por alguna razón fallara, usamos el original
        const pool = availableAds.length > 0 ? availableAds : ads;

        const randomIndex = Math.floor(Math.random() * pool.length);
        const selectedAd = pool[randomIndex];
        
        this.lastAdId = selectedAd.idAd; // Lo recordamos para la próxima
        return selectedAd;
      })
    );
  }

  /**
   * 3. Verifica si un cine bloqueó la publicidad (usando caché para no repetir).
   */
  isCinemaBlocked(cinemaId: string): Observable<boolean> {
    if (this.blockedCinemasCache.has(cinemaId)) {
      return of(this.blockedCinemasCache.get(cinemaId)!);
    }
    
    return this.http.get<AdBlockNowResponse>(`${this.blockBaseUrl}/${cinemaId}/current`).pipe(
      // Evaluamos ambas propiedades por la serialización de Spring Boot
      map(res => res.isBlocked === true || res.blocked === true),
      tap(isBlocked => this.blockedCinemasCache.set(cinemaId, isBlocked)),
      catchError(() => of(false)) // Si el endpoint falla, asumimos que NO está bloqueado
    );
  }
}