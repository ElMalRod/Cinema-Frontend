import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActorOption,
  CastItem,
  CategoryOption,
  ClassificationOption,
  CommentItem,
  CountryOption,
  CreateMoviePayload,
  MovieAdminDetail,
  MovieCountryInfoItem,
  MovieDetail,
  MoviePeopleItem,
  MovieSummary,
  PeopleOption,
  PosterItem,
  RatingSummary,
  UpdateMoviePayload
} from '../models/movie.model';

export const STATIC_COUNTRIES: CountryOption[] = [
  { id: 'aaaaaaaa-0001-0001-0001-000000000001', name: 'Estados Unidos' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000002', name: 'México' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000003', name: 'Centroamérica' }
];

@Injectable({ providedIn: 'root' })
export class MoviesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/movies/v1`;

  getMovies(
    countryId: string,
    filters?: { title?: string; categoryId?: string; classificationId?: string; sort?: string }
  ): Observable<MovieSummary[]> {
    const params: Record<string, string> = { countryId };
    if (filters?.title?.trim())          params['title']            = filters.title.trim();
    if (filters?.categoryId)             params['categoryId']       = filters.categoryId;
    if (filters?.classificationId)       params['classificationId'] = filters.classificationId;
    if (filters?.sort)                   params['sort']             = filters.sort;
    return this.http.get<MovieSummary[]>(`${this.base}/movies`, { params });
  }

  createMovie(payload: CreateMoviePayload): Observable<void> {
    return this.http.post<void>(`${this.base}/movies`, payload);
  }

  getCategories(): Observable<CategoryOption[]> {
    return this.http.get<CategoryOption[]>(`${this.base}/categories`);
  }

  getClassificationsByCountry(countryId: string): Observable<ClassificationOption[]> {
    return this.http.get<ClassificationOption[]>(
      `${this.base}/countries/${countryId}/classifications`
    );
  }

  getPeople(): Observable<PeopleOption[]> {
    return this.http.get<PeopleOption[]>(`${this.base}/people`);
  }

  getActors(): Observable<ActorOption[]> {
    return this.http.get<ActorOption[]>(`${this.base}/actors`);
  }

  getCountries(): CountryOption[] {
    return STATIC_COUNTRIES;
  }

  // ──── EDIT MOVIE ────────────────────────────────────────────────────────────

  getMovieAdmin(movieId: string): Observable<MovieAdminDetail> {
    return this.http.get<MovieAdminDetail>(`${this.base}/movies/${movieId}/admin`);
  }

  updateMovie(movieId: string, payload: UpdateMoviePayload): Observable<void> {
    return this.http.patch<void>(`${this.base}/movies/${movieId}`, payload);
  }

  // Categories
  getMovieCategories(movieId: string): Observable<CategoryOption[]> {
    return this.http.get<CategoryOption[]>(`${this.base}/movies/${movieId}/categories`);
  }

  addMovieCategory(movieId: string, categoryId: string): Observable<CategoryOption[]> {
    return this.http.post<CategoryOption[]>(`${this.base}/movies/${movieId}/categories`, { categoryId });
  }

  removeMovieCategory(movieId: string, categoryId: string): Observable<CategoryOption[]> {
    return this.http.delete<CategoryOption[]>(`${this.base}/movies/${movieId}/categories/${categoryId}`);
  }

  // Country info (classifications)
  getMovieCountryInfo(movieId: string): Observable<MovieCountryInfoItem[]> {
    return this.http.get<MovieCountryInfoItem[]>(`${this.base}/movies/${movieId}/country-info`);
  }

  addMovieClassification(movieId: string, classificationId: string): Observable<MovieCountryInfoItem[]> {
    return this.http.post<MovieCountryInfoItem[]>(`${this.base}/movies/${movieId}/country-info/${classificationId}`, {});
  }

  toggleMovieClassification(movieId: string, movieCountryInfoId: string): Observable<MovieCountryInfoItem> {
    return this.http.patch<MovieCountryInfoItem>(`${this.base}/movies/${movieId}/country-info/${movieCountryInfoId}/toggle`, {});
  }

  removeMovieClassification(movieId: string, movieCountryInfoId: string): Observable<MovieCountryInfoItem[]> {
    return this.http.delete<MovieCountryInfoItem[]>(`${this.base}/movies/${movieId}/country-info/${movieCountryInfoId}`);
  }

  // Posters
  getMoviePosters(movieId: string): Observable<PosterItem[]> {
    return this.http.get<PosterItem[]>(`${this.base}/movies/${movieId}/posters`);
  }

  addMoviePoster(movieId: string, urlImagen: string, isMain: boolean): Observable<PosterItem[]> {
    return this.http.post<PosterItem[]>(`${this.base}/movies/${movieId}/posters`, { urlImagen, isMain });
  }

  setMainMoviePoster(movieId: string, newMainPosterId: string): Observable<PosterItem[]> {
    return this.http.patch<PosterItem[]>(`${this.base}/movies/${movieId}/posters/main`, { newMainPosterId });
  }

  deleteMoviePoster(movieId: string, posterId: string): Observable<PosterItem[]> {
    return this.http.delete<PosterItem[]>(`${this.base}/movies/${movieId}/posters/${posterId}`);
  }

  // People (crew)
  getMoviePeople(movieId: string): Observable<MoviePeopleItem[]> {
    return this.http.get<MoviePeopleItem[]>(`${this.base}/movies/${movieId}/people`);
  }

  addMoviePerson(movieId: string, peopleId: string, rol: string): Observable<MoviePeopleItem[]> {
    return this.http.post<MoviePeopleItem[]>(`${this.base}/movies/${movieId}/people`, { peopleId, rol });
  }

  updateMoviePersonRol(movieId: string, moviePeopleId: string, rol: string): Observable<MoviePeopleItem[]> {
    return this.http.patch<MoviePeopleItem[]>(
      `${this.base}/movies/${movieId}/people/${moviePeopleId}/rol`,
      null,
      { params: { rol } }
    );
  }

  removeMoviePerson(movieId: string, moviePeopleId: string): Observable<MoviePeopleItem[]> {
    return this.http.delete<MoviePeopleItem[]>(`${this.base}/movies/${movieId}/people/${moviePeopleId}`);
  }

  // Cast (actors)
  getMovieCast(movieId: string): Observable<CastItem[]> {
    return this.http.get<CastItem[]>(`${this.base}/movies/${movieId}/cast`);
  }

  addMovieActor(movieId: string, actorId: string, characterName: string): Observable<CastItem[]> {
    return this.http.post<CastItem[]>(`${this.base}/movies/${movieId}/cast`, { actorId, characterName });
  }

  updateCastCharacterName(movieId: string, castId: string, characterName: string): Observable<CastItem> {
    return this.http.patch<CastItem>(`${this.base}/movies/${movieId}/cast/${castId}`, { characterName });
  }

  removeMovieActor(movieId: string, castId: string): Observable<CastItem[]> {
    return this.http.delete<CastItem[]>(`${this.base}/movies/${movieId}/cast/${castId}`);
  }

  // ──── PUBLIC DETAIL ─────────────────────────────────────────────────────────

  getMovieDetail(movieId: string, countryId: string): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`${this.base}/movies/${movieId}`, { params: { countryId } });
  }

  // ──── COMMENTS ──────────────────────────────────────────────────────────────

  getComments(movieId: string): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${this.base}/movies/${movieId}/comments`);
  }

  createComment(movieId: string, content: string): Observable<CommentItem> {
    return this.http.post<CommentItem>(`${this.base}/movies/${movieId}/comments`, { content });
  }

  updateComment(commentId: string, content: string): Observable<CommentItem> {
    return this.http.patch<CommentItem>(`${this.base}/comments/${commentId}`, { content });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comments/${commentId}`);
  }

  // ──── RATINGS ───────────────────────────────────────────────────────────────

  getRatings(movieId: string): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.base}/movies/${movieId}/ratings`);
  }

  createRating(movieId: string, score: number): Observable<RatingSummary> {
    return this.http.post<RatingSummary>(`${this.base}/movies/${movieId}/ratings`, { score });
  }

  updateRating(ratingId: string, score: number): Observable<RatingSummary> {
    return this.http.patch<RatingSummary>(`${this.base}/ratings/${ratingId}`, { score });
  }
}
