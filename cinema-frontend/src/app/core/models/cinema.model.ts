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
