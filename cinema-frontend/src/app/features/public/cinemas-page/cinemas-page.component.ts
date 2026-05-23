import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CinemaSummaryResponse, UsersApiService } from '../../../core/services/users-api.service';

@Component({
  selector: 'app-cinemas-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cinemas-page.component.html',
  styleUrl: './cinemas-page.component.scss'
})
export class CinemasPage implements OnInit {
  loading = false;
  errorMessage = '';
  cinemas: CinemaSummaryResponse[] = [];

  constructor(private readonly usersApiService: UsersApiService) {}

  ngOnInit(): void {
    this.loadCinemas();
  }

  private loadCinemas(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usersApiService.listCinemas().subscribe({
      next: (cinemas) => {
        this.loading = false;
        this.cinemas = cinemas;
      },
      error: () => {
        this.loading = false;
        this.cinemas = [];
        this.errorMessage = 'No se pudo cargar el listado de cines en este momento.';
      }
    });
  }
}
