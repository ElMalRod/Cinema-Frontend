import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent {
  readonly title = 'Salas';
  readonly subtitle = 'Gestiona las salas de tu cine';
}
