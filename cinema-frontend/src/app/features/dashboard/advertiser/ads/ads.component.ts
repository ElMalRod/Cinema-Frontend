import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.scss'
})
export class AdvertiserAdsComponent {
  readonly title = 'Mis Anuncios';
  readonly subtitle = 'Gestiona tus campañas publicitarias';
}
