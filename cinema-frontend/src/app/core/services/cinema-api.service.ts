import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminShowtime,
  AdminTheater,
  AdBlockPricingPayload,
  AdBlockPricingResponse,
  CinemaDetail,
  CinemaOperatingCostSummary,
  CompanyOption,
  CinemaSummary,
  CreateGlobalCostPayload,
  CreateOperatingCostPayload,
  CreateShowtimePayload,
  CreateTheaterPayload,
  GlobalCostResponse,
  TheaterInfo,
  TheaterComment,
  TheaterRatingSummary,
  UserTheaterComment,
  UserTheaterRating,
  ShowtimeInfo,
  CinemaShowtimeInfo,
  CinemaTheaterWithShowtimes,
  SeatResponse,
  TheaterPricingResponse,
  TypeTheater,
  UpdateShowtimePayload,
  UpdateTheaterPayload,
  AdBlockResponse,
  AdBlockRequest,
  TheaterPrincingRequest,
  RechargeResponse,
  CreateWalletTransactionRequest,
  WalletTransactionResponse
} from '../models/cinema.model';

/* ── Raw backend response types ─────────────────────────────────────────── */

interface TheaterRaw {
  id: string;
  typeTheaterId: string;
  typeTheaterName: string;
  name: string;
  rows: number;
  cols: number;
  visible: boolean;
  allowComments: boolean;
  allowRatings: boolean;
}

interface TheaterClientRaw {
  id: string;
  typeTheaterName: string;
  name: string;
  rows: number;
  cols: number;
  showtimes: ShowtimeInfo[];
}

/* ─────────────────────────────────────────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class CinemaApiService {
  private readonly base = `${environment.apiBaseUrl}/cinemas/v1`;

  constructor(private readonly http: HttpClient) {}

  // ── Empresas ───────────────────────────────────────────────────────────────

  getCompanies(): Observable<CompanyOption[]> {
    return this.http.get<CompanyOption[]>(`${this.base}/cinemas/companies`);
  }

  // ── Cines ──────────────────────────────────────────────────────────────────

  getCinemas(): Observable<CinemaSummary[]> {
    return this.http.get<CinemaSummary[]>(`${this.base}/cinemas`);
  }

  // ── Salas ──────────────────────────────────────────────────────────────────

  /**
   * Devuelve salas del cine que están programadas para la película dada.
   * Hace dos llamadas en paralelo y las combina por ID.
   */
  getTheatersByCinemaAndMovie(cinemaId: string, movieId: string): Observable<TheaterInfo[]> {
    const params = new HttpParams().set('cinemaId', cinemaId);
    const movieParams = new HttpParams().set('movieId', movieId);

    return forkJoin({
      cinemaTheaters: this.http.get<TheaterRaw[]>(`${this.base}/theaters`, { params }),
      movieTheaters: this.http.get<TheaterClientRaw[]>(`${this.base}/theaters/movie`, { params: movieParams })
    }).pipe(
      map(({ cinemaTheaters, movieTheaters }) => {
        const movieMap = new Map(movieTheaters.map(t => [t.id, t.showtimes]));
        return cinemaTheaters
          .filter(t => t.visible)
          .map(t => ({
            id: t.id,
            typeTheaterName: t.typeTheaterName,
            name: t.name,
            rows: t.rows,
            cols: t.cols,
            visible: t.visible,
            allowComments: t.allowComments,
            allowRatings: t.allowRatings,
            showtimes: movieMap.get(t.id) ?? []
          }));
      })
    );
  }

  getTheatersWithShowtimesByCinema(cinemaId: string): Observable<CinemaTheaterWithShowtimes[]> {
    return this.http.get<CinemaTheaterWithShowtimes[]>(`${this.base}/theaters/cinema/${cinemaId}`);
  }

  // ── Comentarios de sala ────────────────────────────────────────────────────

  getTheaterComments(theaterId: string): Observable<TheaterComment[]> {
    return this.http.get<TheaterComment[]>(`${this.base}/theaters/${theaterId}/comments`);
  }

  createTheaterComment(theaterId: string, userId: string, content: string): Observable<TheaterComment> {
    return this.http.post<TheaterComment>(`${this.base}/theaters/${theaterId}/comments`, { userId, content });
  }

  updateTheaterComment(commentId: string, userId: string, content: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/comments/${commentId}`, { userId, content });
  }

  deleteTheaterComment(commentId: string, userId: string): Observable<void> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<void>(`${this.base}/comments/${commentId}`, { params });
  }

  // ── Calificaciones de sala ─────────────────────────────────────────────────

  getTheaterRatings(theaterId: string): Observable<TheaterRatingSummary> {
    return this.http.get<TheaterRatingSummary>(`${this.base}/theaters/${theaterId}/ratings`);
  }

  createTheaterRating(theaterId: string, userId: string, score: number): Observable<TheaterRatingSummary> {
    return this.http.post<TheaterRatingSummary>(`${this.base}/theaters/${theaterId}/ratings`, { userId, score });
  }

  updateTheaterRating(ratingId: string, userId: string, score: number): Observable<TheaterRatingSummary> {
    return this.http.patch<TheaterRatingSummary>(`${this.base}/ratings/${ratingId}`, { userId, score });
  }

  getUserTheaterComments(userId: string): Observable<UserTheaterComment[]> {
    return this.http.get<UserTheaterComment[]>(`${this.base}/comments/user/${userId}`);
  }

  getUserTheaterRatings(userId: string): Observable<UserTheaterRating[]> {
    return this.http.get<UserTheaterRating[]>(`${this.base}/ratings/user/${userId}`);
  }

  // ── Admin: Cinema info ─────────────────────────────────────────────────────

  getCinemaByAdmin(adminUserId: string): Observable<CinemaDetail> {
    return this.http.get<CinemaDetail>(`${this.base}/cinemas/admin/${adminUserId}`);
  }

  // ── Admin: TypeTheater ─────────────────────────────────────────────────────

  getTypeTheaters(): Observable<TypeTheater[]> {
    return this.http.get<TypeTheater[]>(`${this.base}/theaters/types`);
  }

  // ── Admin: Theaters CRUD ───────────────────────────────────────────────────

  getAdminTheaters(cinemaId: string): Observable<AdminTheater[]> {
    const params = new HttpParams().set('cinemaId', cinemaId);
    return this.http.get<AdminTheater[]>(`${this.base}/theaters`, { params });
  }

  createTheater(payload: CreateTheaterPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/theaters`, payload);
  }

  updateTheater(theaterId: string, payload: UpdateTheaterPayload): Observable<void> {
    return this.http.patch<void>(`${this.base}/theaters/${theaterId}`, payload);
  }

  getTheaterSeats(theaterId: string): Observable<SeatResponse[]> {
    return this.http.get<SeatResponse[]>(`${this.base}/theaters/${theaterId}/seats`);
  }

  getTheaterPricing(theaterId: string): Observable<TheaterPricingResponse> {
    return this.http.get<TheaterPricingResponse>(`${this.base}/theaters/${theaterId}/pricing`);
  }

  toggleSeat(seatId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/seats/${seatId}/toggle`, {});
  }

  // ── Admin: Showtimes CRUD ──────────────────────────────────────────────────

  getAdminShowtimes(theaterId: string): Observable<AdminShowtime[]> {
    return this.http.get<AdminShowtime[]>(`${this.base}/showtimes/theater/${theaterId}`);
  }

  createShowtime(payload: CreateShowtimePayload): Observable<void> {
    return this.http.post<void>(`${this.base}/showtimes`, payload);
  }

  updateShowtime(showtimeId: string, payload: UpdateShowtimePayload): Observable<void> {
    return this.http.patch<void>(`${this.base}/showtimes/${showtimeId}`, payload);
  }

  // ── System Admin: GlobalCost ────────────────────────────────────────────

  getLatestGlobalCost(): Observable<GlobalCostResponse> {
    return this.http.get<GlobalCostResponse>(`${this.base}/global-costs`);
  }

  createGlobalCost(payload: CreateGlobalCostPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/global-costs`, payload);
  }

  // ── System Admin: AdBlockPricing ────────────────────────────────────────

  getAllAdBlockPricings(): Observable<AdBlockPricingResponse[]> {
    return this.http.get<AdBlockPricingResponse[]>(`${this.base}/ad-block-pricing/cinemas`);
  }

  createAdBlockPricing(cinemaId: string, payload: AdBlockPricingPayload): Observable<AdBlockPricingResponse> {
    return this.http.post<AdBlockPricingResponse>(`${this.base}/ad-block-pricing/cinemas/${cinemaId}`, payload);
  }

  updateAdBlockPricing(cinemaId: string, payload: AdBlockPricingPayload): Observable<AdBlockPricingResponse> {
    return this.http.put<AdBlockPricingResponse>(`${this.base}/ad-block-pricing/cinemas/${cinemaId}`, payload);
  }

  // ── System Admin: OperatingCost ─────────────────────────────────────────

  getAllOperatingCostSummaries(): Observable<CinemaOperatingCostSummary[]> {
    return this.http.get<CinemaOperatingCostSummary[]>(`${this.base}/operating-costs`);
  }

  createOperatingCost(payload: CreateOperatingCostPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/operating-costs`, payload);
  }


  // ----------------- Bloqueo de Anuncios (Ad Blocks) -----------------------------

  createAdBlock(cinemaId: string, request: AdBlockRequest): Observable<AdBlockResponse> {
    return this.http.post<AdBlockResponse>(`${this.base}/cinemas/ad-blocks/${cinemaId}`, request);
  }

  getAdBlocksHistory(cinemaId: string): Observable<AdBlockResponse[]> {
    return this.http.get<AdBlockResponse[]>(`${this.base}/cinemas/ad-blocks/${cinemaId}`);
  }

  getAdBlockPricing(cinemaId: string): Observable<AdBlockPricingResponse> {
    return this.http.get<AdBlockPricingResponse>(`${this.base}/ad-block-pricing/cinemas/${cinemaId}`);
  }

  createTheaterPricing(theaterId: string, payload: TheaterPrincingRequest): Observable<TheaterPricingResponse> {
    return this.http.post<TheaterPricingResponse>(`${this.base}/theaters/${theaterId}/pricing`, payload);
  }

  updateTheaterPricing(theaterId: string, payload: TheaterPrincingRequest): Observable<TheaterPricingResponse> {
    return this.http.put<TheaterPricingResponse>(`${this.base}/theaters/${theaterId}/pricing`, payload);
  }


  getWalletTransactions(adminCinemaId: string): Observable<WalletTransactionResponse[]> {
    return this.http.get<WalletTransactionResponse[]>(`${this.base}/wallet-transactions/${adminCinemaId}`);
  }

  createWalletRecharge(payload: CreateWalletTransactionRequest): Observable<RechargeResponse> {
    return this.http.post<RechargeResponse>(`${this.base}/wallet-transactions`, payload);
  }
}
