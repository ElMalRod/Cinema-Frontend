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
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { tap, catchError, of, switchMap, forkJoin } from 'rxjs';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { AuthService } from '../../../../core/services/auth.service';

import { AdBannerComponent } from '../../../../shared/components/ad-banner/ad-banner.component';

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

// Interfaz para la tabla del Gestor de Precios
interface PricingRow {
  theaterId: string;
  name: string;
  typeTheaterId: string;
  typeTheaterName: string;
  currentPrice: number | null;
  inputPrice: number | null;
  hasExistingPrice: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, DialogModule, ToastModule,
    ProgressSpinnerModule, TagModule, SelectModule,
    InputTextModule, InputNumberModule, ToggleSwitchModule,
    TableModule, AdBannerComponent
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
  cinemaId: string | null = null;

  // Modal de Detalle Original
  showDetailModal = false;
  selectedTheater: AdminTheater | null = null;
  seats: SeatCell[][] = [];
  loadingSeats = false;
  savingUpdate = false;

  editForm: UpdateTheaterPayload = {
    typeTheaterId: '', name: '', isVisible: true, allowComments: true, allowRatings: true
  };

  // Modal de Crear Sala Original
  showCreateModal = false;
  creating = false;
  createForm: Omit<CreateTheaterPayload, 'cinemaId'> = {
    typeTheaterId: '', name: '', rows: 5, cols: 8
  };

  // NUEVO: Variables del Gestor de Precios
  showPricingModal = false;
  loadingPricing = false;
  pricingRows: PricingRow[] = [];

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
    this.cinemaApi.getTypeTheaters().subscribe({
      next: types => { this.typeTheaters = types; },
      error: () => this.msg.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar los tipos de sala' })
    });

    this.resolveCinemaId().pipe(
      tap(cinemaId => this.cinemaId = cinemaId ?? null), 
      switchMap(cinemaId => {
        if (!cinemaId) return of(null);
        return this.cinemaApi.getAdminTheaters(cinemaId);
      })
    ).subscribe({
      next: result => {
        if (result) this.theaters = result.sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las salas' });
        this.loading = false;
      }
    });
  }

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

  // ── 1. LÓGICA ORIGINAL DE SALAS (Limpia) ──

  openDetail(theater: AdminTheater): void {
    this.selectedTheater = { ...theater };
    this.editForm = {
      typeTheaterId: theater.typeTheaterId,
      name: theater.name,
      isVisible: theater.visible,
      allowComments: theater.allowComments,
      allowRatings: theater.allowRatings
    };
    
    this.seats = [];
    this.showDetailModal = true;
    this.loadSeats(theater.id);
  }

  saveUpdate(): void {
    if (!this.selectedTheater) return;
    this.savingUpdate = true;
    this.cinemaApi.updateTheater(this.selectedTheater.id, this.editForm).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Sala actualizada correctamente' });
        this.savingUpdate = false;
        this.showDetailModal = false;
        this.loadData();
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la sala' });
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
        if (!cinemaId) return;
        const payload: CreateTheaterPayload = { cinemaId, ...this.createForm };
        this.cinemaApi.createTheater(payload).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Sala Creada', detail: 'No olvides asignarle un precio en el Gestor de Precios.' });
            this.creating = false;
            this.showCreateModal = false;
            this.loadData();
          },
          error: () => {
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la sala' });
            this.creating = false;
          }
        });
      }
    });
  }

  // ── 2. NUEVA LÓGICA DEL GESTOR DE PRECIOS ──

  openPricingManager(): void {
    this.showPricingModal = true;
    this.loadingPricing = true;
    
    // Mapeamos las salas a las filas de la tabla
    this.pricingRows = this.theaters.map(t => ({
      theaterId: t.id,
      name: t.name,
      typeTheaterId: t.typeTheaterId,
      typeTheaterName: t.typeTheaterName,
      currentPrice: null,
      inputPrice: null,
      hasExistingPrice: false,
      loading: true // Spinner individual por fila
    }));

    // Cargamos los precios en paralelo para todas las salas
    const requests = this.pricingRows.map(row => 
      this.cinemaApi.getTheaterPricing(row.theaterId).pipe(
        catchError(() => of(null)) // Si falla (404), devuelve null y sabemos que no tiene precio
      )
    );

    forkJoin(requests).subscribe(results => {
      results.forEach((res, index) => {
        const row = this.pricingRows[index];
        if (res) {
          row.currentPrice = res.price;
          row.inputPrice = res.price;
          row.hasExistingPrice = true;
        }
        row.loading = false;
      });
      this.loadingPricing = false;
    });
  }

  saveRowPrice(row: PricingRow): void {
    if (row.inputPrice == null) return;
    row.loading = true;
    
    const payload = {
      typeTheaterId: row.typeTheaterId,
      price: row.inputPrice,
      effectiveDate: this.getTodayDateString()
    };

    const request$ = row.hasExistingPrice 
      ? this.cinemaApi.updateTheaterPricing(row.theaterId, payload)
      : this.cinemaApi.createTheaterPricing(row.theaterId, payload);

    request$.subscribe({
      // Si el backend se arregló y funciona perfecto:
      next: (res) => this.handleRowSuccess(row, res.price),
      
      // Si el backend lanza el Falso 500:
      error: () => {
        // INTERCEPTAMOS EL ERROR: Hacemos una consulta rápida para ver si sí se guardó en la BD
        this.cinemaApi.getTheaterPricing(row.theaterId).subscribe({
          next: (res) => {
            // ¡Era un falso error! El precio sí está en la base de datos
            this.handleRowSuccess(row, res.price);
          },
          error: () => {
            // Si también falla la consulta, entonces sí fue un error real
            row.loading = false;
            this.msg.add({ severity: 'error', summary: 'Error', detail: `Fallo real al guardar precio en ${row.name}` });
          }
        });
      }
    });
  }

  // Pequeño método auxiliar para no repetir código
  private handleRowSuccess(row: PricingRow, newPrice: number): void {
    row.currentPrice = newPrice;
    row.hasExistingPrice = true;
    row.loading = false;
    this.msg.add({ severity: 'success', summary: 'Éxito', detail: `Precio de ${row.name} actualizado` });
  }

  // ── UTILIDADES ──
  private loadSeats(theaterId: string): void {
    this.loadingSeats = true;
    this.cinemaApi.getTheaterSeats(theaterId).subscribe({
      next: (seats) => {
        this.seats = this.groupSeatsByRow(seats);
        this.loadingSeats = false;
      },
      error: () => this.loadingSeats = false
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

  totalSeats(t: AdminTheater): number { return t.rows * t.cols; }

  private getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}