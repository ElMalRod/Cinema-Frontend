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
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { catchError, of, switchMap } from 'rxjs';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AdminTheater,
  CreateTheaterPayload,
  SeatResponse,
  TheaterComment,
  TheaterRatingSummary,
  TypeTheater,
  UpdateTheaterPayload
} from '../../../../core/models/cinema.model';

interface SeatCell {
  id: string;
  rowName: string;
  colNumber: number;
  active: boolean;
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, DialogModule, ToastModule,
    ProgressSpinnerModule, TagModule, SelectModule,
    InputTextModule, InputNumberModule, ToggleSwitchModule
  ],
  providers: [MessageService],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent implements OnInit {
  readonly title = 'Salas';
  readonly subtitle = 'Gestiona las salas de tu cine';

  loading = false;
  theaters: AdminTheater[] = [];
  typeTheaters: TypeTheater[] = [];

  // Detail modal
  showDetailModal = false;
  selectedTheater: AdminTheater | null = null;
  detailTab: 'info' | 'comments' | 'ratings' = 'info';
  seats: SeatCell[][] = [];
  loadingSeats = false;
  comments: TheaterComment[] = [];
  loadingComments = false;
  ratingSummary: TheaterRatingSummary | null = null;
  loadingRatings = false;
  savingUpdate = false;

  editForm: UpdateTheaterPayload = {
    typeTheaterId: '', name: '', isVisible: true, allowComments: true, allowRatings: true
  };

  // Create modal
  showCreateModal = false;
  creating = false;
  createForm: Omit<CreateTheaterPayload, 'cinemaId'> = {
    typeTheaterId: '', name: '', rows: 5, cols: 8
  };

  get typeTheaterOptions() {
    return this.typeTheaters.map(t => ({ label: t.name, value: t.id }));
  }

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly auth: AuthService,
    private readonly msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    // Cargar tipos de sala siempre (no depende de cinemaId)
    this.cinemaApi.getTypeTheaters().subscribe({
      next: types => { this.typeTheaters = types; },
      error: (e: HttpErrorResponse) => this.msg.add({ severity: 'warn', summary: 'Aviso', detail: this.extractError(e, 'No se pudieron cargar los tipos de sala'), life: 5000 })
    });

    this.resolveCinemaId().pipe(
      switchMap(cinemaId => {
        if (!cinemaId) return of(null);
        return this.cinemaApi.getAdminTheaters(cinemaId);
      })
    ).subscribe({
      next: result => {
        if (result) this.theaters = result.sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar las salas'), life: 5000 });
        this.loading = false;
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

  openDetail(theater: AdminTheater): void {
    this.selectedTheater = { ...theater };
    this.editForm = {
      typeTheaterId: theater.typeTheaterId,
      name: theater.name,
      isVisible: theater.visible,
      allowComments: theater.allowComments,
      allowRatings: theater.allowRatings
    };
    this.detailTab = 'info';
    this.seats = [];
    this.comments = [];
    this.ratingSummary = null;
    this.showDetailModal = true;
    // Cargar asientos inmediatamente para la referencia visual en la pestaña Info
    this.loadSeats(theater.id);
  }

  selectTab(tab: 'info' | 'comments' | 'ratings'): void {
    this.detailTab = tab;
    if (!this.selectedTheater) return;
    if (tab === 'comments' && this.comments.length === 0) this.loadComments(this.selectedTheater.id);
    if (tab === 'ratings' && !this.ratingSummary) this.loadRatings(this.selectedTheater.id);
  }

  private loadSeats(theaterId: string): void {
    this.loadingSeats = true;
    this.cinemaApi.getTheaterSeats(theaterId).subscribe({
      next: (seats) => {
        this.seats = this.groupSeatsByRow(seats);
        this.loadingSeats = false;
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar los asientos'), life: 5000 });
        this.loadingSeats = false;
      }
    });
  }

  private groupSeatsByRow(seats: SeatResponse[]): SeatCell[][] {
    const rowMap = new Map<string, SeatCell[]>();
    for (const s of seats) {
      if (!rowMap.has(s.rowName)) rowMap.set(s.rowName, []);
      rowMap.get(s.rowName)!.push({ ...s });
    }
    return [...rowMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, cells]) => cells.sort((a, b) => a.colNumber - b.colNumber));
  }

  private loadComments(theaterId: string): void {
    this.loadingComments = true;
    this.cinemaApi.getTheaterComments(theaterId).subscribe({
      next: (c) => { this.comments = c; this.loadingComments = false; },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar los comentarios'), life: 5000 });
        this.loadingComments = false;
      }
    });
  }

  private loadRatings(theaterId: string): void {
    this.loadingRatings = true;
    this.cinemaApi.getTheaterRatings(theaterId).subscribe({
      next: (r) => { this.ratingSummary = r; this.loadingRatings = false; },
      error: (e) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudieron cargar las calificaciones'), life: 5000 });
        this.loadingRatings = false;
      }
    });
  }

  saveUpdate(): void {
    if (!this.selectedTheater) return;
    const trimmedName = this.editForm.name.trim();
    const duplicate = this.theaters.find(
      t => t.id !== this.selectedTheater!.id &&
           t.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      this.msg.add({ severity: 'warn', summary: 'Nombre duplicado', detail: `Ya existe una sala con el nombre "${duplicate.name}"`, life: 5000 });
      return;
    }
    this.savingUpdate = true;
    this.cinemaApi.updateTheater(this.selectedTheater.id, this.editForm).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Sala actualizada correctamente', life: 4000 });
        this.savingUpdate = false;
        this.showDetailModal = false;
        this.loadData();
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo actualizar la sala'), life: 5000 });
        this.savingUpdate = false;
      }
    });
  }

  openCreate(): void {
    this.createForm = { typeTheaterId: '', name: '', rows: 5, cols: 8 };
    this.showCreateModal = true;
  }

  submitCreate(): void {
    this.creating = true;
    this.resolveCinemaId().subscribe({
      next: cinemaId => {
        if (!cinemaId) {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el cine asignado a tu cuenta' });
          this.creating = false;
          return;
        }
        const payload: CreateTheaterPayload = { cinemaId, ...this.createForm };
        this.cinemaApi.createTheater(payload).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Creada', detail: 'Sala creada exitosamente', life: 4000 });
            this.creating = false;
            this.showCreateModal = false;
            this.loadData();
          },
          error: (e: HttpErrorResponse) => {
            this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo crear la sala'), life: 5000 });
            this.creating = false;
          }
        });
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el cine asignado a tu cuenta' });
        this.creating = false;
      }
    });
  }

  totalSeats(t: AdminTheater): number { return t.rows * t.cols; }

  starArray(score: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}
