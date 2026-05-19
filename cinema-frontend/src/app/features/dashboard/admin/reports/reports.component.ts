import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class AdminReportsComponent {
  readonly title = 'Reportes Globales';
  readonly subtitle = 'Estadísticas generales del sistema';
}
