import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import { CinemaApiService } from '../../../core/services/cinema-api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CompanyOption,
  CinemaSummary,
  TheaterInfo,
  ShowtimeInfo,
  TheaterComment,
  TheaterRating,
  TheaterRatingSummary
} from '../../../core/models/cinema.model';

type ShowtimesStep = 'companies' | 'cinemas' | 'theaters';

@Component({
  selector: 'app-movie-showtimes-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    TextareaModule,
    RatingModule
  ],
  providers: [MessageService],
  templateUrl: './movie-showtimes-page.component.html',
  styleUrl: './movie-showtimes-page.component.scss'
})
export class MovieShowtimesPage implements OnInit {

  movieId = '';
  movieTitle = 'Película';

  // ── Wizard step ─────────────────────────────────────────────────────────────
  step: ShowtimesStep = 'companies';
  loading = false;

  // ── Empresas ─────────────────────────────────────────────────────────────────
  companies: CompanyOption[] = [];
  selectedCompany: CompanyOption | null = null;

  // ── Cines ────────────────────────────────────────────────────────────────────
  allCinemas: CinemaSummary[] = [];
  cinemas: CinemaSummary[] = [];
  selectedCinema: CinemaSummary | null = null;

  // ── Salas ────────────────────────────────────────────────────────────────────
  theaters: TheaterInfo[] = [];
  selectedTheater: TheaterInfo | null = null;

  // ── Modal sala ───────────────────────────────────────────────────────────────
  showTheaterModal = false;
  loadingTheaterData = false;
  selectedDay: string | null = null;

  // Comentarios
  comments: TheaterComment[] = [];
  newCommentContent = '';
  submittingComment = false;
  editingCommentId: string | null = null;
  editCommentContent = '';

  // Ratings
  ratingSummary: TheaterRatingSummary | null = null;
  newScore = 0;
  submittingRating = false;
  editingRatingId: string | null = null;
  editScore = 0;

  // ── Auth ─────────────────────────────────────────────────────────────────────
  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // ── Showtimes agrupados por día ──────────────────────────────────────────────
  get showtimesByDay(): Map<string, ShowtimeInfo[]> {
    if (!this.selectedTheater) return new Map();
    const map = new Map<string, ShowtimeInfo[]>();
    for (const s of this.selectedTheater.showtimes) {
      const existing = map.get(s.dateShowtime) ?? [];
      map.set(s.dateShowtime, [...existing, s]);
    }
    return map;
  }

  get sortedDays(): string[] {
    return [...this.showtimesByDay.keys()].sort();
  }

  get dayOptions(): { label: string; value: string }[] {
    return this.sortedDays.map(d => ({ label: this.formatDay(d), value: d }));
  }

  get myRating(): TheaterRating | null {
    if (!this.ratingSummary || !this.currentUserId) return null;
    return this.ratingSummary.ratings.find(r => r.userId === this.currentUserId) ?? null;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cinemaApi: CinemaApiService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService
  ) {
    // Recuperar título de película del navigation state
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as Record<string, string> | undefined;
    if (state?.['movieTitle']) {
      this.movieTitle = state['movieTitle'];
    }
  }

  ngOnInit(): void {
    this.movieId = this.route.snapshot.paramMap.get('movieId') ?? '';
    // Fallback: leer título del history.state si ya navegamos
    if (this.movieTitle === 'Película' && history.state?.['movieTitle']) {
      this.movieTitle = history.state['movieTitle'];
    }
    this.loadInitialData();
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────────

  private loadInitialData(): void {
    this.loading = true;
    this.cinemaApi.getCompanies().subscribe({
      next: companies => {
        this.companies = companies;
        this.cinemaApi.getCinemas().subscribe({
          next: cinemas => { this.allCinemas = cinemas; this.loading = false; },
          error: () => { this.allCinemas = []; this.loading = false; }
        });
      },
      error: () => { this.companies = []; this.loading = false; }
    });
  }

  // ── Navegación entre pasos ────────────────────────────────────────────────────

  selectCompany(company: CompanyOption): void {
    this.selectedCompany = company;
    this.cinemas = this.allCinemas.filter(c => c.companyId === company.id);
    this.step = 'cinemas';
  }

  selectCinema(cinema: CinemaSummary): void {
    this.selectedCinema = cinema;
    this.step = 'theaters';
    this.loading = true;
    this.theaters = [];
    this.cinemaApi.getTheatersByCinemaAndMovie(cinema.id, this.movieId).subscribe({
      next: theaters => { this.theaters = theaters; this.loading = false; },
      error: () => { this.theaters = []; this.loading = false; }
    });
  }

  backToCompanies(): void {
    this.step = 'companies';
    this.selectedCompany = null;
    this.cinemas = [];
    this.selectedCinema = null;
    this.theaters = [];
  }

  backToCinemas(): void {
    this.step = 'cinemas';
    this.selectedCinema = null;
    this.theaters = [];
  }

  backToMovies(): void {
    this.router.navigate(['/movies']);
  }

  // ── Modal sala ────────────────────────────────────────────────────────────────

  openTheater(theater: TheaterInfo): void {
    this.selectedTheater = theater;
    this.selectedDay = this.sortedDays[0] ?? null;
    this.showTheaterModal = true;
    this.resetCommentForm();
    this.resetRatingForm();
    this.comments = [];
    this.ratingSummary = null;
    this.loadingTheaterData = true;

    this.cinemaApi.getTheaterComments(theater.id).subscribe({
      next: c => this.comments = c,
      error: () => this.comments = []
    });
    this.cinemaApi.getTheaterRatings(theater.id).subscribe({
      next: r => { this.ratingSummary = r; this.loadingTheaterData = false; },
      error: () => { this.ratingSummary = null; this.loadingTheaterData = false; }
    });
  }

  closeTheaterModal(): void {
    this.showTheaterModal = false;
    this.selectedTheater = null;
    this.selectedDay = null;
  }

  // ── Comentarios ───────────────────────────────────────────────────────────────

  submitComment(): void {
    if (!this.selectedTheater || !this.newCommentContent.trim() || !this.currentUserId) return;
    this.submittingComment = true;
    this.cinemaApi.createTheaterComment(this.selectedTheater.id, this.currentUserId, this.newCommentContent.trim()).subscribe({
      next: c => {
        this.comments = [c, ...this.comments];
        this.newCommentContent = '';
        this.submittingComment = false;
        this.messageService.add({ severity: 'success', summary: 'Comentario publicado' });
      },
      error: (err: HttpErrorResponse) => {
        this.submittingComment = false;
        this.messageService.add({ severity: 'error', summary: 'Error al comentar', detail: this.extractError(err, 'No se pudo publicar el comentario.') });
      }
    });
  }

  startEditComment(comment: TheaterComment): void {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
  }

  saveEditComment(commentId: string): void {
    if (!this.editCommentContent.trim() || !this.currentUserId) return;
    this.cinemaApi.updateTheaterComment(commentId, this.currentUserId, this.editCommentContent.trim()).subscribe({
      next: () => {
        this.comments = this.comments.map(c => c.id === commentId ? { ...c, content: this.editCommentContent } : c);
        this.cancelEditComment();
        this.messageService.add({ severity: 'success', summary: 'Comentario actualizado' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo actualizar.') })
    });
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  deleteComment(commentId: string): void {
    if (!this.currentUserId) return;
    this.cinemaApi.deleteTheaterComment(commentId, this.currentUserId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.messageService.add({ severity: 'success', summary: 'Comentario eliminado' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo eliminar.') })
    });
  }

  private resetCommentForm(): void {
    this.newCommentContent = '';
    this.editingCommentId = null;
    this.editCommentContent = '';
    this.submittingComment = false;
  }

  // ── Ratings ──────────────────────────────────────────────────────────────────

  submitRating(): void {
    if (!this.selectedTheater || !this.newScore || !this.currentUserId) return;
    this.submittingRating = true;
    this.cinemaApi.createTheaterRating(this.selectedTheater.id, this.currentUserId, this.newScore).subscribe({
      next: summary => {
        this.ratingSummary = summary;
        this.newScore = 0;
        this.submittingRating = false;
        this.messageService.add({ severity: 'success', summary: 'Calificación enviada' });
      },
      error: (err: HttpErrorResponse) => {
        this.submittingRating = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo calificar.') });
      }
    });
  }

  startEditRating(rating: TheaterRating): void {
    this.editingRatingId = rating.id;
    this.editScore = rating.score;
  }

  saveEditRating(ratingId: string): void {
    if (!this.editScore || !this.currentUserId) return;
    this.cinemaApi.updateTheaterRating(ratingId, this.currentUserId, this.editScore).subscribe({
      next: summary => {
        this.ratingSummary = summary;
        this.cancelEditRating();
        this.messageService.add({ severity: 'success', summary: 'Calificación actualizada' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo actualizar.') })
    });
  }

  cancelEditRating(): void {
    this.editingRatingId = null;
    this.editScore = 0;
  }

  private resetRatingForm(): void {
    this.newScore = 0;
    this.editingRatingId = null;
    this.editScore = 0;
    this.submittingRating = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  starsArray(n: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  roundScore(score: number): number {
    return Math.round(score);
  }

  formatDay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}
