import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { RatingModule } from 'primeng/rating';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { MoviesApiService } from '../../../../core/services/movies-api.service';
import { UserTheaterComment, UserTheaterRating } from '../../../../core/models/cinema.model';
import { UserMovieComment, UserMovieRating } from '../../../../core/models/movie.model';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    TagModule,
    TextareaModule,
    RatingModule
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit {
  readonly title = 'Mis Comentarios';
  readonly subtitle = 'Tus reseñas y calificaciones en salas y películas';

  activeTab: 'theaters' | 'movies' = 'theaters';
  loading = false;
  errorMessage = '';

  // Data
  theaterComments: UserTheaterComment[] = [];
  theaterRatings: UserTheaterRating[] = [];
  movieComments: UserMovieComment[] = [];
  movieRatings: UserMovieRating[] = [];

  // Theater filters
  selectedCompanyId: string | null = null;
  selectedCinemaId: string | null = null;

  // Movie filter
  movieTitleFilter = '';

  // Edit comment
  editingCommentId: string | null = null;
  editingCommentSource: 'theater' | 'movie' = 'theater';
  editingCommentContent = '';
  savingComment = false;

  // Edit rating
  editingRatingId: string | null = null;
  editingRatingSource: 'theater' | 'movie' = 'theater';
  editingRatingScore = 0;
  savingRating = false;

  private userId = '';

  constructor(
    private readonly auth: AuthService,
    private readonly cinemaApi: CinemaApiService,
    private readonly moviesApi: MoviesApiService
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.userId = user.id;
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      theaterComments: this.cinemaApi.getUserTheaterComments(this.userId),
      theaterRatings: this.cinemaApi.getUserTheaterRatings(this.userId),
      movieComments: this.moviesApi.getMyMovieComments(),
      movieRatings: this.moviesApi.getMyMovieRatings()
    }).subscribe({
      next: ({ theaterComments, theaterRatings, movieComments, movieRatings }) => {
        this.theaterComments = theaterComments;
        this.theaterRatings = theaterRatings;
        this.movieComments = movieComments;
        this.movieRatings = movieRatings;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar tus reseñas. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  // ── Tab ───────────────────────────────────────────────────────────────────

  setTab(tab: 'theaters' | 'movies'): void {
    this.activeTab = tab;
    this.selectedCompanyId = null;
    this.selectedCinemaId = null;
    this.movieTitleFilter = '';
    this.cancelEdit();
    this.cancelEditRating();
  }

  // ── Filter options ────────────────────────────────────────────────────────

  get companyOptions(): SelectOption[] {
    const map = new Map<string, string>();
    this.theaterComments.forEach(c => map.set(c.companyId, c.companyName));
    this.theaterRatings.forEach(r => map.set(r.companyId, r.companyName));
    return [{ label: 'Todas las empresas', value: '' },
      ...Array.from(map.entries()).map(([id, name]) => ({ label: name, value: id }))];
  }

  get cinemaOptions(): SelectOption[] {
    const map = new Map<string, string>();
    const source = [...this.theaterComments, ...this.theaterRatings];
    source.forEach(item => {
      if (!this.selectedCompanyId || item.companyId === this.selectedCompanyId) {
        map.set(item.cinemaId, item.cinemaName);
      }
    });
    return [{ label: 'Todas las sucursales', value: '' },
      ...Array.from(map.entries()).map(([id, name]) => ({ label: name, value: id }))];
  }

  onCompanyChange(): void {
    this.selectedCinemaId = null;
  }

  // ── Filtered lists ────────────────────────────────────────────────────────

  get filteredTheaterComments(): UserTheaterComment[] {
    return this.theaterComments.filter(c =>
      (!this.selectedCompanyId || c.companyId === this.selectedCompanyId) &&
      (!this.selectedCinemaId || c.cinemaId === this.selectedCinemaId)
    );
  }

  get filteredTheaterRatings(): UserTheaterRating[] {
    return this.theaterRatings.filter(r =>
      (!this.selectedCompanyId || r.companyId === this.selectedCompanyId) &&
      (!this.selectedCinemaId || r.cinemaId === this.selectedCinemaId)
    );
  }

  get filteredMovieComments(): UserMovieComment[] {
    const q = this.movieTitleFilter.toLowerCase().trim();
    return q ? this.movieComments.filter(c => c.movieTitle.toLowerCase().includes(q)) : this.movieComments;
  }

  get filteredMovieRatings(): UserMovieRating[] {
    const q = this.movieTitleFilter.toLowerCase().trim();
    return q ? this.movieRatings.filter(r => r.movieTitle.toLowerCase().includes(q)) : this.movieRatings;
  }

  // ── Stars helper ──────────────────────────────────────────────────────────

  starsArray(score: number): number[] {
    return Array(score).fill(0);
  }

  emptyStarsArray(score: number): number[] {
    return Array(5 - score).fill(0);
  }

  // ── Edit comment ──────────────────────────────────────────────────────────

  startEditComment(id: string, content: string, source: 'theater' | 'movie'): void {
    this.editingCommentId = id;
    this.editingCommentSource = source;
    this.editingCommentContent = content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  saveEditComment(): void {
    if (!this.editingCommentId || !this.editingCommentContent.trim()) return;
    this.savingComment = true;
    const id = this.editingCommentId;
    const content = this.editingCommentContent.trim();

    if (this.editingCommentSource === 'theater') {
      this.cinemaApi.updateTheaterComment(id, this.userId, content).subscribe({
        next: () => { this.savingComment = false; this.cancelEdit(); this.loadData(); },
        error: () => { this.savingComment = false; }
      });
    } else {
      this.moviesApi.updateComment(id, content).subscribe({
        next: () => { this.savingComment = false; this.cancelEdit(); this.loadData(); },
        error: () => { this.savingComment = false; }
      });
    }
  }

  // ── Delete comment ────────────────────────────────────────────────────────

  deleteComment(id: string, source: 'theater' | 'movie'): void {
    if (source === 'theater') {
      this.cinemaApi.deleteTheaterComment(id, this.userId).subscribe({
        next: () => this.loadData()
      });
    } else {
      this.moviesApi.deleteComment(id).subscribe({
        next: () => this.loadData()
      });
    }
  }

  // ── Edit rating ───────────────────────────────────────────────────────────

  startEditRating(id: string, score: number, source: 'theater' | 'movie'): void {
    this.editingRatingId = id;
    this.editingRatingSource = source;
    this.editingRatingScore = score;
  }

  cancelEditRating(): void {
    this.editingRatingId = null;
    this.editingRatingScore = 0;
  }

  saveEditRating(): void {
    if (!this.editingRatingId) return;
    this.savingRating = true;
    const id = this.editingRatingId;
    const score = this.editingRatingScore;

    if (this.editingRatingSource === 'theater') {
      this.cinemaApi.updateTheaterRating(id, this.userId, score).subscribe({
        next: () => { this.savingRating = false; this.cancelEditRating(); this.loadData(); },
        error: () => { this.savingRating = false; }
      });
    } else {
      this.moviesApi.updateRating(id, score).subscribe({
        next: () => { this.savingRating = false; this.cancelEditRating(); this.loadData(); },
        error: () => { this.savingRating = false; }
      });
    }
  }
}

