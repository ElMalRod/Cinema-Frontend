import { Component, OnInit } from '@angular/core';
import { FormField } from '../../../../shared/components/shared-form/shared-form.component';
import { SharedModule } from '../../../../shared/shared.module';
import { UsersApiService, WalletTransactionResponse } from '../../../../core/services/users-api.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class AdvertiserWalletComponent implements OnInit {
  readonly title = 'Wallet anunciante';
  readonly subtitle = 'Controla el saldo para pagos de anuncios';

  loading = false;
  recharging = false;
  balance = 0;
  transactions: WalletTransactionResponse[] = [];
  errorMessage = '';
  successMessage = '';

  readonly rechargeFields: FormField[] = [
    { name: 'amount', label: 'Monto a recargar', type: 'number', required: true, placeholder: '0.00' }
  ];

  constructor(private readonly usersApiService: UsersApiService) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  recharge(value: Record<string, unknown>): void {
    const amount = Number(value['amount']);
    this.errorMessage = '';
    this.successMessage = '';

    if (!Number.isFinite(amount) || amount <= 0) {
      this.errorMessage = 'Ingresa un monto válido mayor que 0.';
      return;
    }

    this.recharging = true;
    this.usersApiService.rechargeWallet(amount).subscribe({
      next: (response) => {
        this.recharging = false;
        this.balance = response.balance;
        this.transactions = response.transactions;
        this.successMessage = 'Recarga aplicada correctamente.';
      },
      error: () => {
        this.recharging = false;
        this.errorMessage = 'No se pudo procesar la recarga.';
      }
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  }

  private loadWallet(): void {
    this.loading = true;
    this.errorMessage = '';
    this.usersApiService.getWallet().subscribe({
      next: (response) => {
        this.loading = false;
        this.balance = response.balance;
        this.transactions = response.transactions;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar tu wallet.';
      }
    });
  }
}

