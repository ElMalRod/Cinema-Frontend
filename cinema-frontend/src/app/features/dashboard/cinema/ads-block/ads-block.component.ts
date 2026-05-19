import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-ads-block',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './ads-block.component.html',
  styleUrl: './ads-block.component.scss'
})
export class AdsBlockComponent {
  readonly title = 'Bloqueo de Anuncios';
  readonly subtitle = 'Administra la visibilidad de anuncios';
}
