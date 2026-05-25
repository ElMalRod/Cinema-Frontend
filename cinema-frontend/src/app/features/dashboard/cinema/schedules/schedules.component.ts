import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { tap,catchError, forkJoin, of, switchMap } from 'rxjs';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { TicketsService } from '../../../../core/services/tickets.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MoviesApiService, STATIC_COUNTRIES } from '../../../../core/services/movies-api.service';
import {
  AdminShowtime,
  AdminTheater,
  CreateShowtimePayload,
  SeatResponse,
  UpdateShowtimePayload
} from '../../../../core/models/cinema.model';
import { OccupiedSeat } from '../../../../core/models/ticket.model';
import { MovieSummary } from '../../../../core/models/movie.model';

import { AdBannerComponent } from '../../../../shared/components/ad-banner/ad-banner.component';

type VersionType = 'ORIGINAL' | 'DUBBED' | 'SUBTITLED';

interface VisualSeat extends SeatResponse {
  status: 'available' | 'occupied';
}

interface SeatRow {
  rowName: string;
  seats: VisualSeat[];
}

const VERSION_OPTIONS: { label: string; value: VersionType }[] = [
  { label: 'Original', value: 'ORIGINAL' },
  { label: 'Doblada', value: 'DUBBED' },
  { label: 'Subtitulada', value: 'SUBTITLED' }
];

interface ShowtimeWithMovie extends AdminShowtime {
  movieTitle?: string;
  moviePoster?: string | null;
  movieDuration?: number;
  movieClassification?: string;
}

interface ShowtimeForm {
  theaterId: string;
  movieId: string;
  versionType: string;
  dateShowtime: string;
  startShowtime: string;
  endShowtime: string;
}

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, DialogModule, ToastModule,
    ProgressSpinnerModule, TagModule, SelectModule, InputTextModule,
    TooltipModule, AdBannerComponent
  ],
  providers: [MessageService],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss'
})
export class SchedulesComponent implements OnInit {
  readonly title = 'Horarios';
  readonly subtitle = 'Configura las funciones de tu cine';

  theaters: AdminTheater[] = [];
  selectedTheaterId: string | null = null;
  showtimes: ShowtimeWithMovie[] = [];
  movies: MovieSummary[] = [];

  cinemaId: string | null = null;

  loadingTheaters = false;
  loadingShowtimes = false;
  loadingMovies = false;

  readonly versionOptions = VERSION_OPTIONS;

  // Create modal
  showCreateModal = false;
  creating = false;
  createForm: ShowtimeForm = this.emptyForm();

  // Edit modal
  showEditModal = false;
  editingId: string | null = null;
  saving = false;
  editForm: ShowtimeForm = this.emptyForm();

  // Movie picker modal
  showMoviePicker = false;
  moviePickerTarget: 'create' | 'edit' = 'create';
  movieSearch = '';

  // Seat map modal
  showSeatMapModal = false;
  seatMapLoading = false;
  selectedShowtimeForMap: ShowtimeWithMovie | null = null;
  seatRows: SeatRow[] = [];

  // Filtros
  filterDate = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  get theaterOptions() {
    return this.theaters
      .filter(t => t.visible)
      .map(t => ({ label: t.name, value: t.id }));
  }

  get filteredMovies(): MovieSummary[] {
    const q = this.movieSearch.toLowerCase();
    return q ? this.movies.filter(m => m.title.toLowerCase().includes(q)) : this.movies;
  }

  get filteredShowtimes(): ShowtimeWithMovie[] {
    return this.showtimes.filter(s => {
      if (this.filterDate && s.dateShowtime !== this.filterDate) return false;
      if (this.filterStatus === 'active' && !s.active) return false;
      if (this.filterStatus === 'inactive' && s.active) return false;
      return true;
    });
  }

  get durationValidationError(): string | null {
    return this.validateDuration(this.createForm);
  }

  get editDurationValidationError(): string | null {
    return this.validateDuration(this.editForm);
  }

  private validateDuration(form: ShowtimeForm): string | null {
    if (!form.startShowtime || !form.endShowtime || !form.movieId) return null;
    const [sh, sm] = form.startShowtime.split(':').map(Number);
    const [eh, em] = form.endShowtime.split(':').map(Number);
    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMin <= 0) return 'La hora de fin debe ser posterior al inicio';
    const movie = this.movies.find(m => m.id === form.movieId);
    if (movie && diffMin < movie.duration) {
      return `La duración (${diffMin} min) es menor que la duración de la película (${movie.duration} min)`;
    }
    return null;
  }

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly moviesApi: MoviesApiService,
    private readonly ticketsService: TicketsService,
    private readonly auth: AuthService,
    private readonly msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInit();
  }

  private loadInit(): void {
    this.loadingTheaters = true;

    this.resolveCinemaId().pipe(
      tap(cinemaId => this.cinemaId = cinemaId ?? null),
      switchMap(cinemaId => {
        if (!cinemaId) return of(null);
        return this.cinemaApi.getAdminTheaters(cinemaId);
      })
    ).subscribe({
      next: result => {
        if (result) this.theaters = result;
        this.loadingTheaters = false;
        // Auto-seleccionar la primera sala visible
        const first = this.theaters.find(t => t.visible);
        if (first) this.selectedTheaterId = first.id;
        this.loadMovies();
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar las salas'), life: 5000 });
        this.loadingTheaters = false;
      }
    });
  }

  /** Obtiene cinemaId: desde localStorage o desde la API si no está guardado. */
  private resolveCinemaId() {
    const stored = this.auth.getCinemaId();
    if (stored) return of(stored);
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return of(null as string | null);
    return this.cinemaApi.getCinemaByAdmin(userId).pipe(
      switchMap(c => {
        localStorage.setItem('cinemaId', c.id);
        return of(c.id as string | null);
      }),
      catchError(() => of(null as string | null))
    );
  }

  private loadMovies(): void {
    this.loadingMovies = true;
    this.moviesApi.getMovies(STATIC_COUNTRIES[0].id).subscribe({
      next: (m) => {
        this.movies = m;
        this.loadingMovies = false;
        // Si hay sala pre-seleccionada, cargar sus funciones ahora que las películas están listas
        if (this.selectedTheaterId) this.loadShowtimes(this.selectedTheaterId);
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar las películas'), life: 5000 });
        this.loadingMovies = false;
      }
    });
  }

  onTheaterChange(): void {
    this.filterDate = '';
    this.filterStatus = 'all';
    if (!this.selectedTheaterId) { this.showtimes = []; return; }
    this.loadShowtimes(this.selectedTheaterId);
  }

  private loadShowtimes(theaterId: string): void {
    this.loadingShowtimes = true;
    this.cinemaApi.getAdminShowtimes(theaterId).subscribe({
      next: (data) => {
        this.showtimes = data.map(s => {
          const movie = this.movies.find(m => m.id === s.movieId);
          return {
            ...s,
            movieTitle: movie?.title,
            moviePoster: movie?.poster ?? null,
            movieDuration: movie?.duration,
            movieClassification: movie?.classifications?.[0]?.name
          };
        });
        this.loadingShowtimes = false;
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar las funciones'), life: 5000 });
        this.loadingShowtimes = false;
      }
    });
  }

  openCreate(): void {
    this.createForm = this.emptyForm();
    if (this.selectedTheaterId) this.createForm.theaterId = this.selectedTheaterId;
    this.showCreateModal = true;
  }

  openMoviePicker(target: 'create' | 'edit'): void {
    this.moviePickerTarget = target;
    this.movieSearch = '';
    this.showMoviePicker = true;
  }

  selectMovie(movie: MovieSummary): void {
    const form = this.moviePickerTarget === 'create' ? this.createForm : this.editForm;
    form.movieId = movie.id;
    this.showMoviePicker = false;
  }

  getMovieTitle(movieId: string): string {
    return this.movies.find(m => m.id === movieId)?.title ?? '—';
  }

  getMoviePoster(movieId: string): string | null {
    return this.movies.find(m => m.id === movieId)?.poster ?? null;
  }

  submitCreate(): void {
    if (this.durationValidationError) return;
    this.creating = true;
    const payload: CreateShowtimePayload = { ...this.createForm, versionType: this.createForm.versionType };
    this.cinemaApi.createShowtime(payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Creada', detail: 'Función creada exitosamente', life: 4000 });
        this.creating = false;
        this.showCreateModal = false;
        if (this.selectedTheaterId) this.loadShowtimes(this.selectedTheaterId);
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo crear la función'), life: 5000 });
        this.creating = false;
      }
    });
  }

  openEdit(showtime: ShowtimeWithMovie): void {
    this.editingId = showtime.id;
    this.editForm = {
      theaterId: this.selectedTheaterId ?? '',
      movieId: showtime.movieId,
      versionType: showtime.versionTypeName,
      dateShowtime: showtime.dateShowtime,
      startShowtime: showtime.startShowtime,
      endShowtime: showtime.endShowtime
    };
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (!this.editingId || this.editDurationValidationError) return;
    this.saving = true;
    const payload: UpdateShowtimePayload = {
      movieId: this.editForm.movieId,
      versionType: this.editForm.versionType,
      dateShowtime: this.editForm.dateShowtime,
      startShowtime: this.editForm.startShowtime,
      endShowtime: this.editForm.endShowtime
    };
    this.cinemaApi.updateShowtime(this.editingId, payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Función actualizada', life: 4000 });
        this.saving = false;
        this.showEditModal = false;
        if (this.selectedTheaterId) this.loadShowtimes(this.selectedTheaterId);
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo actualizar la función'), life: 5000 });
        this.saving = false;
      }
    });
  }

  formatVersion(v: string): string {
    return VERSION_OPTIONS.find(o => o.value === v)?.label ?? v;
  }

  openSeatMap(showtime: ShowtimeWithMovie): void {
    this.selectedShowtimeForMap = showtime;
    this.seatRows = [];
    this.seatMapLoading = true;
    this.showSeatMapModal = true;
    if (!this.selectedTheaterId) { this.seatMapLoading = false; return; }

    forkJoin({
      seats: this.cinemaApi.getTheaterSeats(this.selectedTheaterId),
      occupied: this.ticketsService.getOccupiedSeats(showtime.id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ seats, occupied }) => {
        this.buildSeatMap(seats, occupied);
        this.seatMapLoading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo cargar el mapa de asientos'), life: 5000 });
        this.seatMapLoading = false;
      }
    });
  }

  private buildSeatMap(allSeats: SeatResponse[], occupiedSeats: OccupiedSeat[]): void {
    const occupiedIds = new Set(occupiedSeats.map(s => s.seatId));
    const visualSeats: VisualSeat[] = allSeats.map(seat => {
      const isInactive = seat.isActive === false || seat.active === false;
      return {
        ...seat,
        status: (isInactive || occupiedIds.has(seat.id)) ? 'occupied' : 'available'
      };
    });

    const rowMap = new Map<string, VisualSeat[]>();
    for (const seat of visualSeats) {
      const row = rowMap.get(seat.rowName) ?? [];
      row.push(seat);
      rowMap.set(seat.rowName, row);
    }

    this.seatRows = Array.from(rowMap.keys()).sort().map(rowName => {
      const seatsInRow = rowMap.get(rowName)!;
      seatsInRow.sort((a, b) => a.colNumber - b.colNumber);
      return { rowName, seats: seatsInRow };
    });
  }

  private emptyForm(): ShowtimeForm {
    return { theaterId: '', movieId: '', versionType: 'ORIGINAL', dateShowtime: '', startShowtime: '', endShowtime: '' };
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}
