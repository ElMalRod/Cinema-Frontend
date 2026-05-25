// 1. Ganancias del Sistema
export interface SystemProfitRow {
  cinemaName: string;
  operatingCost: number;
  adRevenue: number | null;
  adBlockRevenue: number | null;
  totalRevenue: number | null;
  totalProfit: number;
}
export interface ReportSystemProfit {
  totalAdRevenue: number;
  totalBlockRevenue: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  rows: SystemProfitRow[];
}

// 2. Anuncios Comprados
export interface AdsPurchasedDetail {
  advertiserName: string;
  amountPaid: string;
  startDate: string;
  endDate: string;
}
export interface ReportAdsPurchased {
  adType: string;
  adTypeCount: number;
  ads: AdsPurchasedDetail[];
}

// 3. Ganancias por Anunciante
export interface AdvertiserProfitDetail {
  adType: string;
  amountPaid: string;
  startDate: string;
  endDate: string;
}
export interface ReportAdvertiserProfit {
  advertiserName: string;
  advertiserTotal: string;
  anuncios: AdvertiserProfitDetail[];
}

// 4. Salas Populares
export interface PopularRoomTicket {
  userName: string;
  userTicketCount: number;
}
export interface ReportTopPopularRoom {
  roomName: string;
  companyName: string;
  avgScore: string;
  tickets: PopularRoomTicket[];
}

// 5. Salas Comentadas
export interface CommentedRoomDetail {
  userName: string;
  commentContent: string;
  commentDate: string;
}
export interface ReportTopCommentedRoom {
  roomName: string;
  companyName: string;
  totalComments: string;
  comentarios: CommentedRoomDetail[];
}