import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip'; // <-- IMPORTANTE
import { DividerModule } from 'primeng/divider'; // <-- IMPORTANTE
import { MessageService } from 'primeng/api';

// Services
import { CinemaApiService } from '../../../core/services/cinema-api.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { UsersApiService } from '../../../core/services/users-api.service'; 

// Models
import { SeatResponse, TheaterPricingResponse } from '../../../core/models/cinema.model';
import { TicketPurchaseRequest, OccupiedSeat } from '../../../core/models/ticket.model';

import { AdBannerComponent } from '../../../shared/components/ad-banner/ad-banner.component';

interface VisualSeat extends SeatResponse {
  status: 'available' | 'occupied' | 'selected';
}

interface SeatRow {
  rowName: string;
  seats: VisualSeat[];
}

@Component({
  selector: 'app-checkout-seats',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ToastModule, 
    ProgressSpinnerModule, 
    TooltipModule, 
    DividerModule,
    AdBannerComponent
  ],
  providers: [MessageService],
  templateUrl: './checkout-seats.component.html',
  styleUrls: ['./checkout-seats.component.scss']
})
export class CheckoutSeatsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cinemaApi = inject(CinemaApiService);
  private readonly ticketsService = inject(TicketsService);
  private readonly usersApi = inject(UsersApiService);
  private readonly messageService = inject(MessageService);

  // Contexto recibido de la pantalla anterior
  checkoutData: any;

  // Datos cargados del backend
  pricing: TheaterPricingResponse | null = null;
  walletBalance: number = 0;
  
  // Mapa visual
  seatRows: SeatRow[] = [];
  selectedSeats: VisualSeat[] = [];

  loading = true;
  processing = false;

  ngOnInit(): void {
    this.checkoutData = history.state?.checkoutData;
    
    if (!this.checkoutData) {
      this.goBack(); // Usamos la nueva función
      return;
    }

    this.loadData();
  }

  goBack(): void {
    this.router.navigate(['/movies']);
  }

  private loadData(): void {
    const { theaterId, scheduleId } = this.checkoutData;

    // 2. Carga Paralela (ForkJoin) de los 4 endpoints
    forkJoin({
      seats: this.cinemaApi.getTheaterSeats(theaterId),
      pricing: this.cinemaApi.getTheaterPricing(theaterId),
      occupied: this.ticketsService.getOccupiedSeats(scheduleId),
      wallet: this.usersApi.getWallet()
    }).subscribe({
      next: ({ seats, pricing, occupied, wallet }) => {
        this.pricing = pricing;
        this.walletBalance = wallet.balance;
        this.buildSeatMap(seats, occupied);
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información de la sala.' });
        this.loading = false;
      }
    });
  }

  private buildSeatMap(allSeats: SeatResponse[], occupiedSeats: OccupiedSeat[]): void {
    // Set para búsqueda rápida de asientos ocupados
    const occupiedIds = new Set(occupiedSeats.map(s => s.seatId));

    // Mapear a VisualSeat
    const visualSeats: VisualSeat[] = allSeats.map(seat => {
      // Verificamos si estrictamente viene como false en 'isActive' o en 'active'
      const isInactive = seat.isActive === false || seat.active === false;

      return {
        ...seat,
        status: (isInactive || occupiedIds.has(seat.id)) ? 'occupied' : 'available'
      };
    });

    // Agrupar por fila (rowName)
    const rowMap = new Map<string, VisualSeat[]>();
    for (const seat of visualSeats) {
      const row = rowMap.get(seat.rowName) ?? [];
      row.push(seat);
      rowMap.set(seat.rowName, row);
    }

    // Convertir el Map a un arreglo ordenado alfabéticamente (A, B, C...)
    this.seatRows = Array.from(rowMap.keys()).sort().map(rowName => {
      const seatsInRow = rowMap.get(rowName)!;
      // Ordenar los asientos dentro de la fila por columna (1, 2, 3...)
      seatsInRow.sort((a, b) => a.colNumber - b.colNumber);
      return { rowName, seats: seatsInRow };
    });
  }

  toggleSeat(seat: VisualSeat): void {
    if (seat.status === 'occupied') return;

    if (seat.status === 'available') {
      // Regla de negocio: limitar a máximo 10 boletos por transacción (opcional)
      if (this.selectedSeats.length >= 10) {
        this.messageService.add({ severity: 'warn', summary: 'Límite', detail: 'Máximo 10 boletos por compra.' });
        return;
      }
      seat.status = 'selected';
      this.selectedSeats.push(seat);
    } else {
      seat.status = 'available';
      this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
    }
  }

  get totalAmount(): number {
    return this.selectedSeats.length * (this.pricing?.price || 0);
  }

  get hasEnoughBalance(): boolean {
    return this.walletBalance >= this.totalAmount;
  }

  confirmPurchase(): void {
    if (this.selectedSeats.length === 0) return;
    if (!this.hasEnoughBalance) {
      this.messageService.add({ severity: 'error', summary: 'Saldo insuficiente', detail: 'Por favor, recarga tu Wallet.' });
      return;
    }

    this.processing = true;

    // 3. Preparar el arreglo de peticiones
    const purchaseRequests = this.selectedSeats.map(seat => {
      const req: TicketPurchaseRequest = {
        scheduleId: this.checkoutData.scheduleId,
        seatId: seat.id,
        roomId: this.checkoutData.theaterId,
        movieId: this.checkoutData.movieId,
        companyId: this.checkoutData.cinemaId, 
        companyName: this.checkoutData.cinemaName,
        roomName: this.checkoutData.theaterName,
        movieTitle: this.checkoutData.movieTitle,
        seatRow: seat.rowName,
        seatColumn: seat.colNumber,
        price: this.pricing!.price
      };
      return this.ticketsService.buyTicket(req);
    });

    // 4. Ejecutar todas las compras en paralelo
    forkJoin(purchaseRequests).subscribe({
      next: () => {
        this.processing = false;
        this.messageService.add({ severity: 'success', summary: '¡Compra Exitosa!', detail: 'Tus boletos han sido generados.' });
        
        // Redirigir a sus tickets después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard/client/tickets']);
        }, 1500);
      },
      error: () => {
        this.processing = false;
        this.messageService.add({ severity: 'error', summary: 'Error de Transacción', detail: 'Ocurrió un error al procesar algunos boletos. Verifica tu wallet.' });
      }
    });
  }
}