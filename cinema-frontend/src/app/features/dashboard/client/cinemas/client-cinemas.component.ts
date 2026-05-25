import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { MoviesApiService } from '../../../../core/services/movies-api.service';
import {
  CompanyOption,
  CinemaSummary,
  CinemaTheaterWithShowtimes,
  CinemaShowtimeInfo
} from '../../../../core/models/cinema.model';
import { MovieBrief } from '../../../../core/models/movie.model';
import { AdBannerComponent } from '../../../../shared/components/ad-banner/ad-banner.component';
type CinemasStep = 'companies' | 'cinemas' | 'showtimes';

interface ShowtimeCard {
  showtimeId: string;
  theaterId: string;
  theaterName: string;
  theaterType: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string | null;
  movieClassifications: string[];
  versionTypeName: string;
  dateShowtime: string;
  startShowtime: string;
  endShowtime: string;
  alert: string | null;
  rows: number;
  cols: number;
}

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-client-cinemas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    TagModule,
    ToastModule,
    AdBannerComponent
  ],
  providers: [MessageService],
  templateUrl: './client-cinemas.component.html',
  styleUrl: './client-cinemas.component.scss'
})
export class ClientCinemasComponent implements OnInit {

  step: CinemasStep = 'companies';
  loading = false;

  // Paso 1 – Empresas
  companies: CompanyOption[] = [];
  selectedCompany: CompanyOption | null = null;

  // Paso 2 – Sucursales
  allCinemas: CinemaSummary[] = [];
  cinemas: CinemaSummary[] = [];
  selectedCinema: CinemaSummary | null = null;

  // Paso 3 – Funciones
  showtimeCards: ShowtimeCard[] = [];
  filteredCards: ShowtimeCard[] = [];

  // Filtros
  filterDay: string | null = null;
  filterTheaterId: string | null = null;

  get dayOptions(): SelectOption[] {
    const days = [...new Set(this.showtimeCards.map(c => c.dateShowtime))].sort();
    return days.map(d => ({ label: this.formatDay(d), value: d }));
  }

  get theaterOptions(): SelectOption[] {
    const seen = new Map<string, string>();
    this.showtimeCards.forEach(c => seen.set(c.theaterId, c.theaterName));
    return [...seen.entries()].map(([id, name]) => ({ label: name, value: id }));
  }

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly moviesApi: MoviesApiService,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading = true;
    forkJoin({
      companies: this.cinemaApi.getCompanies(),
      cinemas: this.cinemaApi.getCinemas()
    }).subscribe({
      next: ({ companies, cinemas }) => {
        this.companies = companies;
        this.allCinemas = cinemas;
        this.loading = false;
      },
      error: () => {
        this.companies = [];
        this.allCinemas = [];
        this.loading = false;
      }
    });
  }

  selectCompany(company: CompanyOption): void {
    this.selectedCompany = company;
    this.cinemas = this.allCinemas.filter(c => c.companyId === company.id);
    this.step = 'cinemas';
  }

  selectCinema(cinema: CinemaSummary): void {
    this.selectedCinema = cinema;
    this.step = 'showtimes';
    this.loading = true;
    this.showtimeCards = [];
    this.filteredCards = [];
    this.filterDay = null;
    this.filterTheaterId = null;

    this.cinemaApi.getTheatersWithShowtimesByCinema(cinema.id).subscribe({
      next: (theaters: CinemaTheaterWithShowtimes[]) => {
        const movieIds = [...new Set(
          theaters.flatMap(t => t.showtimes.map((s: CinemaShowtimeInfo) => s.movieId))
        )];

        if (movieIds.length === 0) {
          this.loading = false;
          return;
        }

        this.moviesApi.getMoviesBrief(movieIds).subscribe({
          next: (movies: MovieBrief[]) => {
            const movieMap = new Map(movies.map(m => [m.id, m]));
            this.showtimeCards = theaters.flatMap(t =>
              t.showtimes
                .filter((s: CinemaShowtimeInfo) => movieMap.has(s.movieId))
                .map((s: CinemaShowtimeInfo) => ({
                  showtimeId: s.id,
                  theaterId: t.id,
                  theaterName: t.name,
                  theaterType: t.typeTheaterName,
                  movieId: s.movieId,
                  movieTitle: movieMap.get(s.movieId)!.title,
                  moviePoster: movieMap.get(s.movieId)!.poster,
                  movieClassifications: movieMap.get(s.movieId)!.classifications,
                  versionTypeName: s.versionTypeName,
                  dateShowtime: s.dateShowtime,
                  startShowtime: s.startShowtime,
                  endShowtime: s.endShowtime,
                  alert: s.alert,
                  rows: t.rows,
                  cols: t.cols
                } as ShowtimeCard))
            ).sort((a, b) =>
              a.dateShowtime.localeCompare(b.dateShowtime) ||
              a.startShowtime.localeCompare(b.startShowtime)
            );
            this.applyFilters();
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.filteredCards = this.showtimeCards.filter(c => {
      if (this.filterDay && c.dateShowtime !== this.filterDay) return false;
      if (this.filterTheaterId && c.theaterId !== this.filterTheaterId) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.filterDay = null;
    this.filterTheaterId = null;
    this.applyFilters();
  }

  backToCompanies(): void {
    this.step = 'companies';
    this.selectedCompany = null;
    this.cinemas = [];
    this.selectedCinema = null;
    this.showtimeCards = [];
    this.filteredCards = [];
  }

  backToCinemas(): void {
    this.step = 'cinemas';
    this.selectedCinema = null;
    this.showtimeCards = [];
    this.filteredCards = [];
    this.filterDay = null;
    this.filterTheaterId = null;
  }

  selectShowtime(card: ShowtimeCard): void {
    if (!this.selectedCinema || !this.selectedCompany) return;
    const checkoutData = {
      movieId: card.movieId,
      movieTitle: card.movieTitle,
      empresaId: this.selectedCompany.id,
      empresaName: this.selectedCompany.name,
      cinemaId: this.selectedCinema.id,
      cinemaName: this.selectedCinema.name,
      theaterId: card.theaterId,
      theaterName: card.theaterName,
      theaterRows: card.rows,
      theaterCols: card.cols,
      scheduleId: card.showtimeId,
      showtimeDate: card.dateShowtime,
      showtimeStart: card.startShowtime,
      version: card.versionTypeName
    };
    this.router.navigate(['/checkout/seats'], { state: { checkoutData } });
  }

  formatDay(date: string): string {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  formatDateShort(date: string): string {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  }
}
