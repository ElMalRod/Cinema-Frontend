export interface CompanyOption {
  id: string;
  name: string;
}

export interface CinemaSummary {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface CinemaDetail {
  id: string;
  companyId: string;
  companyName: string;
  adminCinemaId: string;
  countryId: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface ShowtimeInfo {
  id: string;
  versionTypeName: string;
  dateShowtime: string; // "YYYY-MM-DD"
  startShowtime: string;
  endShowtime: string;
  alert: string | null;
}

export interface TheaterInfo {
  id: string;
  typeTheaterName: string;
  name: string;
  rows: number;
  cols: number;
  visible: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  showtimes: ShowtimeInfo[];
}

export interface TheaterComment {
  id: string;
  userId: string;
  userName: string | null;
  content: string;
  createdAt: string;
  edited: boolean;
}

export interface TheaterRating {
  id: string;
  userId: string;
  score: number;
  createdAt: string;
}

export interface TheaterRatingSummary {
  ratings: TheaterRating[];
  averageScore: number | null;
}

/* ── Admin-only models ────────────────────────────────────────────────────── */

export interface TypeTheater {
  id: string;
  name: string;
}

export interface AdminTheater {
  id: string;
  typeTheaterId: string;
  typeTheaterName: string;
  name: string;
  rows: number;
  cols: number;
  /** boolean isVisible → Jackson serializa como "visible" */
  visible: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SeatResponse {
  id: string;
  rowName: string;
  colNumber: number;
  isActive?: boolean;
  active: boolean;
}

export interface AdminShowtime {
  id: string;
  movieId: string;
  versionTypeName: string;
  dateShowtime: string;
  startShowtime: string;
  endShowtime: string;
  /** boolean isActive → Jackson serializa como "active" */
  active: boolean;
  alert: string | null;
}

export interface CreateTheaterPayload {
  cinemaId: string;
  typeTheaterId: string;
  name: string;
  rows: number;
  cols: number;
}

export interface UpdateTheaterPayload {
  typeTheaterId: string;
  name: string;
  isVisible: boolean;
  allowComments: boolean;
  allowRatings: boolean;
}

export interface CreateShowtimePayload {
  theaterId: string;
  movieId: string;
  versionType: string;
  dateShowtime: string;
  startShowtime: string;
  endShowtime: string;
}

export interface UpdateShowtimePayload {
  movieId: string;
  versionType: string;
  dateShowtime: string;
  startShowtime: string;
  endShowtime: string;
}

export interface TheaterPricingResponse {
  theaterPricingId: string;
  theaterId: string;
  theaterName: string;
  typeTheaterId: string;
  typeTheaterName: string;
  price: number;
  effectiveDate: string;
}