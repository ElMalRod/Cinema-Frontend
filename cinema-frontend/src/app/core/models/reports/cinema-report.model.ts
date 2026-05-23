export interface ReportCommentDetail {
  userName: string;
  commentContent: string;
  commentDate: string;
}

export interface ReportRoomComments {
  roomName: string;
  totalComments: string | number;
  comentarios: ReportCommentDetail[];
}

export interface ReportShowtimeDetail {
  movieTitle: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ReportRoomShowtimes {
  roomName: string;
  totalShowtimes: string | number;
  funciones: ReportShowtimeDetail[];
}

export interface ReportRatingDetail {
  userName: string;
  score: number;
  createdAt: string;
}

export interface ReportTopRatedRoom {
  roomName: string;
  avgScore: string | number;
  totalRatings: number;
  calificaciones: ReportRatingDetail[];
}

export interface ReportTicketDetail {
  userName: string;
  movieTitle: string;
  seat: string;
  price: string;
  purchaseDate: string;
}

export interface ReportTicketSales {
  roomName: string;
  roomTotal: string;
  boletos: ReportTicketDetail[];
}