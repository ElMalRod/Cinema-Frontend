import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-cinemas-page',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './cinemas-page.component.html',
  styleUrl: './cinemas-page.component.scss'
})
export class CinemasPage {
  readonly title = 'Cines';
  readonly subtitle = 'Encuentra tu cine más cercano';
}
