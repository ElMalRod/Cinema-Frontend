import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketPurchaseRequest, TicketResponse, OccupiedSeat } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tickets`;

  // Comprar un boleto
  buyTicket(request: TicketPurchaseRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.baseUrl}/buy`, request);
  }

  // Obtener mis boletos
  getMyTickets(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${this.baseUrl}/my-tickets`);
  }

  // Obtener asientos ocupados para una función específica
  getOccupiedSeats(showtimeId: string): Observable<OccupiedSeat[]> {
    return this.http.get<OccupiedSeat[]>(`${this.baseUrl}/occupied-seats/${showtimeId}`);
  }
}