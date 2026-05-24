export interface TicketPurchaseRequest {
  scheduleId: string;
  seatId: string;
  roomId: string;
  movieId: string;
  companyId: string;
  companyName: string;
  roomName: string;
  movieTitle: string;
  seatRow: string;
  seatColumn: number;
  price: number;
}

export interface TicketResponse {
  ticketId: string;
  userId: string;
  scheduleId: string;
  seatId: string;
  roomId: string;
  movieId: string;
  companyId: string;
  companyName: string;
  roomName: string;
  movieTitle: string;
  seatRow: string;
  seatColumn: number;
  purchaseDate: string;
}

export interface OccupiedSeat {
  seatId: string;
  seatRow: string;
  seatColumn: number;
}