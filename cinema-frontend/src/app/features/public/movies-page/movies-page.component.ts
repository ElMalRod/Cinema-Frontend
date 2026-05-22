import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import { MoviesApiService, STATIC_COUNTRIES } from '../../../core/services/movies-api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MovieSummary,
  MovieDetail,
  CategoryOption,
  ClassificationOption,
  CommentItem,
  RatingSummary,
  RatingItem
} from '../../../core/models/movie.model';

@Component({
  selector: 'app-movies-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    TextareaModule,
    RatingModule
  ],
  providers: [MessageService],
  templateUrl: './movies-page.component.html',
  styleUrl: './movies-page.component.scss'
})
export class MoviesPage implements OnInit {
  private readonly countryId = STATIC_COUNTRIES[0].id;

  // ── Lista de películas ───────────────────────────────────────────────────────
  movies: MovieSummary[] = [];
  loading = false;

  // ── Filtros ──────────────────────────────────────────────────────────────────
  filterTitle = '';
  filterCategoryId: string | null = null;
  filterClassificationId: string | null = null;

  categories: CategoryOption[] = [];
  classificationOptions: ClassificationOption[] = [];

  // ── Modal detalle ────────────────────────────────────────────────────────────
  showMovieModal = false;
  loadingModal = false;
  selectedMovie: MovieDetail | null = null;

  get mainPoster(): string | null {
    if (!this.selectedMovie) return null;
    const main = this.selectedMovie.posters.find(p => p.main);
    return main?.urlImage ?? this.selectedMovie.posters[0]?.urlImage ?? null;
  }

  // ── Comentarios ──────────────────────────────────────────────────────────────
  comments: CommentItem[] = [];
  newCommentContent = '';
  submittingComment = false;
  editingCommentId: string | null = null;
  editCommentContent = '';

  // ── Ratings ──────────────────────────────────────────────────────────────────
  ratingSummary: RatingSummary | null = null;
  newScore = 0;
  submittingRating = false;
  editingRatingId: string | null = null;
  editScore = 0;

  get myRating(): RatingItem | null {
    if (!this.ratingSummary || !this.currentUserId) return null;
    return this.ratingSummary.ratings.find(r => r.userId === this.currentUserId) ?? null;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  get isClient(): boolean {
    return this.authService.getRole() === 'CLIENT';
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  constructor(
    private readonly moviesApi: MoviesApiService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadMovies();
    this.moviesApi.getCategories().subscribe({ next: cats => this.categories = cats });
    this.moviesApi.getClassificationsByCountry(this.countryId).subscribe({
      next: cls => this.classificationOptions = cls
    });
  }

  // ── Películas ────────────────────────────────────────────────────────────────

  loadMovies(): void {
    this.loading = true;
    this.moviesApi.getMovies(this.countryId, {
      title: this.filterTitle || undefined,
      categoryId: this.filterCategoryId ?? undefined,
      classificationId: this.filterClassificationId ?? undefined
    }).subscribe({
      next: movies => { this.movies = movies; this.loading = false; },
      error: () => { this.movies = []; this.loading = false; }
    });
  }

  applyFilters(): void {
    this.loadMovies();
  }

  clearFilters(): void {
    this.filterTitle = '';
    this.filterCategoryId = null;
    this.filterClassificationId = null;
    this.loadMovies();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterTitle || this.filterCategoryId || this.filterClassificationId);
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  openDetail(movie: MovieSummary): void {
    this.showMovieModal = true;
    this.selectedMovie = null;
    this.loadingModal = true;
    this.resetCommentForm();
    this.resetRatingForm();
    this.comments = [];
    this.ratingSummary = null;

    this.moviesApi.getMovieDetail(movie.id, this.countryId).subscribe({
      next: detail => {
        this.selectedMovie = detail;
        this.loadingModal = false;
        this.loadComments(movie.id);
        this.loadRatings(movie.id);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingModal = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractError(err, 'No se pudo cargar el detalle.') });
      }
    });
  }

  closeModal(): void {
    this.showMovieModal = false;
    this.selectedMovie = null;
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  getYoutubeEmbedUrl(url: string | null): SafeResourceUrl | null {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (!match) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }

  // ── Comentarios ──────────────────────────────────────────────────────────────

  loadComments(movieId: string): void {
    this.moviesApi.getComments(movieId).subscribe({
      next: c => this.comments = c,
      error: () => this.comments = []
    });
  }

  submitComment(): void {
    if (!this.selectedMovie || !this.newCommentContent.trim()) return;
    this.submittingComment = true;
    this.moviesApi.createComment(this.selectedMovie.id, this.newCommentContent.trim()).subscribe({
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

  startEditComment(comment: CommentItem): void {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
  }

  saveEditComment(commentId: string): void {
    if (!this.editCommentContent.trim()) return;
    this.moviesApi.updateComment(commentId, this.editCommentContent.trim()).subscribe({
      next: updated => {
        this.comments = this.comments.map(c => c.id === commentId ? updated : c);
        this.cancelEditComment();
        this.messageService.add({ severity: 'success', summary: 'Comentario actualizado' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail: this.extractError(err, 'No se pudo actualizar el comentario.') })
    });
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  deleteComment(commentId: string): void {
    this.moviesApi.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.messageService.add({ severity: 'success', summary: 'Comentario eliminado' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error al eliminar', detail: this.extractError(err, 'No se pudo eliminar el comentario.') })
    });
  }

  private resetCommentForm(): void {
    this.newCommentContent = '';
    this.editingCommentId = null;
    this.editCommentContent = '';
    this.submittingComment = false;
  }

  // ── Ratings ──────────────────────────────────────────────────────────────────

  loadRatings(movieId: string): void {
    this.moviesApi.getRatings(movieId).subscribe({
      next: r => this.ratingSummary = r,
      error: () => this.ratingSummary = null
    });
  }

  submitRating(): void {
    if (!this.selectedMovie || !this.newScore) return;
    this.submittingRating = true;
    this.moviesApi.createRating(this.selectedMovie.id, this.newScore).subscribe({
      next: summary => {
        this.ratingSummary = summary;
        this.newScore = 0;
        this.submittingRating = false;
        this.messageService.add({ severity: 'success', summary: 'Calificación enviada' });
      },
      error: (err: HttpErrorResponse) => {
        this.submittingRating = false;
        this.messageService.add({ severity: 'error', summary: 'Error al calificar', detail: this.extractError(err, 'No se pudo enviar la calificación.') });
      }
    });
  }

  startEditRating(rating: RatingItem): void {
    this.editingRatingId = rating.id;
    this.editScore = rating.score;
  }

  saveEditRating(ratingId: string): void {
    if (!this.editScore) return;
    this.moviesApi.updateRating(ratingId, this.editScore).subscribe({
      next: summary => {
        this.ratingSummary = summary;
        this.cancelEditRating();
        this.messageService.add({ severity: 'success', summary: 'Calificación actualizada' });
      },
      error: (err: HttpErrorResponse) => this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail: this.extractError(err, 'No se pudo actualizar la calificación.') })
    });
  }

  cancelEditRating(): void {
    this.editingRatingId = null;
    this.editScore = 0;
  }

  starsArray(score: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  roundScore(score: number): number {
    return Math.round(score);
  }

  private resetRatingForm(): void {
    this.newScore = 0;
    this.editingRatingId = null;
    this.editScore = 0;
    this.submittingRating = false;
  }
}

