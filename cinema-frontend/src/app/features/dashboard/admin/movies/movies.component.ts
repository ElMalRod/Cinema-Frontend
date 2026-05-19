import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.scss'
})
export class AdminMoviesComponent {
  readonly title = 'Películas';
  readonly subtitle = 'Administra el catálogo de películas';
}
