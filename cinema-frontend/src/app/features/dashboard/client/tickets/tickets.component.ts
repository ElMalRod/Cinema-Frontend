import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

// Services & Models
import { TicketsService } from '../../../../core/services/tickets.service';
import { TicketResponse } from '../../../../core/models/ticket.model';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-client-tickets',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    TagModule, 
    ProgressSpinnerModule,
    SharedModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  private readonly ticketsService = inject(TicketsService);
  private readonly messageService = inject(MessageService);

  tickets: TicketResponse[] = [];
  loading = true;

  // Lógica del modal
  selectedTicket: TicketResponse | null = null;
  displayTicketModal = false;

  ngOnInit(): void {
    this.loadMyTickets();
  }

  loadMyTickets(): void {
    this.loading = true;
    this.ticketsService.getMyTickets().subscribe({
      next: (data) => {
        // Ordenamos por fecha de compra (más recientes primero)
        this.tickets = data.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar tus boletos.' });
        this.loading = false;
      }
    });
  }

  openTicketModal(ticket: TicketResponse): void {
    this.selectedTicket = ticket;
    this.displayTicketModal = true;
  }

  closeTicketModal(): void {
    this.displayTicketModal = false;
    this.selectedTicket = null;
  }

  // Genera un string para simular el código QR basado en el ticketId
  getQrCodeString(ticketId: string): string {
    return ticketId.split('-').join('').substring(0, 15).toUpperCase();
  }
}