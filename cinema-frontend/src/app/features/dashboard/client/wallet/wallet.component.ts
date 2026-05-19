import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class ClientWalletComponent {
  readonly title = 'Mi Wallet';
  readonly subtitle = 'Administra tu saldo';
}
