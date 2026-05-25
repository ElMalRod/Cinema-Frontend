export interface MovieSummary {
  id: string;
  title: string;
  duration: number;
  poster: string | null;
  releaseDate: string;
  classifications: ClassificationDetail[];
}

export interface ClassificationDetail {
  name: string;
  ageLimit: number;
  country: string;
}

export interface ClassificationOption {
  id: string;
  name: string;
  ageLimit: number;
  country: string;
  active: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  active: boolean;
}

export interface PeopleOption {
  id: string;
  name: string;
  active: boolean;
}

export interface ActorOption {
  id: string;
  name: string;
  urlImage: string | null;
  active: boolean;
}

export interface CountryOption {
  id: string;
  name: string;
}

export interface CreateMoviePayload {
  title: string;
  synopsis: string;
  duration: number;
  trailerLink?: string | null;
  originalLanguage: string;
  releaseDate: string;
  classificationIds: string[];
  categories?: string[];
  posters?: { urlImagen: string; isMain: boolean }[];
  people?: { peopleId: string; rol: string }[];
  actors?: { actorId: string; characterName?: string | null }[];
}

export interface UpdateMoviePayload {
  title?: string;
  synopsis?: string;
  duration?: number;
  trailerLink?: string | null;
  originalLanguage?: string;
  releaseDate?: string;
  allowComments?: boolean;
  allowRatings?: boolean;
}

export interface MovieAdminDetail {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  trailerLink: string | null;
  originalLanguage: string;
  releaseDate: string;
  allowComments: boolean;
  allowRatings: boolean;
}

/** boolean isActive → Jackson serializa como "active" */
export interface MovieCountryInfoItem {
  movieCountryInfoId: string;
  classificationId: string;
  classificationName: string;
  ageLimit: number;
  countryId: string;
  countryName: string;
  active: boolean;
}

/** boolean isMain → Jackson serializa como "main" */
export interface PosterItem {
  id: string;
  urlImage: string;
  main: boolean;
}

export interface MoviePeopleItem {
  moviePeopleId: string;
  peopleId: string;
  peopleName: string;
  rol: string;
}

export interface CastItem {
  castId: string;
  actorId: string;
  actorName: string;
  actorUrlImage: string | null;
  characterName: string | null;
}

export interface CastDetailItem {
  actorName: string;
  actorImageUrl: string | null;
  characterName: string | null;
}

export interface CrewItem {
  name: string;
  role: string;
}

export interface MovieDetail {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  trailerLink: string | null;
  originalLanguage: string;
  releaseDate: string;
  classifications: ClassificationDetail[];
  cast: CastDetailItem[];
  categories: string[];
  posters: PosterItem[];
  crew: CrewItem[];
}

/** boolean edited → Jackson serializa como "edited" */
export interface CommentItem {
  id: string;
  userId: string;
  userName: string | null;
  content: string;
  createdAt: string;
  edited: boolean;
}

/** boolean edited → Jackson serializa como "edited" */
export interface RatingItem {
  id: string;
  userId: string;
  userName: string | null;
  score: number;
  createdAt: string;
  edited: boolean;
}

export interface RatingSummary {
  ratings: RatingItem[];
  averageScore: number | null;
}

export interface UserMovieComment {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  movieId: string;
  movieTitle: string;
  posterUrl: string | null;
}

export interface UserMovieRating {
  id: string;
  score: number;
  createdAt: string;
  edited: boolean;
  movieId: string;
  movieTitle: string;
  posterUrl: string | null;
}
