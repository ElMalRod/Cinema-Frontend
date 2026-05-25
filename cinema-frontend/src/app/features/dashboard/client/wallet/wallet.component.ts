import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { UsersApiService, WalletTransactionResponse } from '../../../../core/services/users-api.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class ClientWalletComponent implements OnInit {
  readonly title = 'Mi wallet';
  readonly subtitle = 'Recarga tu saldo y consulta tus últimos movimientos';

  readonly cardTypeOptions = [
    { label: 'Tarjeta de crédito', value: 'CREDIT' },
    { label: 'Tarjeta de débito', value: 'DEBIT' }
  ];

  loading = false;
  recharging = false;
  balance = 0;
  transactions: WalletTransactionResponse[] = [];
  errorMessage = '';
  successMessage = '';

  readonly rechargeForm: FormGroup;

  constructor(
    private readonly usersApiService: UsersApiService,
    private readonly formBuilder: FormBuilder
  ) {
    this.rechargeForm = this.formBuilder.group({
      cardType: ['CREDIT', Validators.required],
      cardHolder: ['', [Validators.required, Validators.minLength(5)]],
      cardNumber: ['', [Validators.required, ClientWalletComponent.cardNumberValidator]],
      cardExpiry: ['', [Validators.required, ClientWalletComponent.cardExpiryValidator]],
      cardCvv: ['', [Validators.required, ClientWalletComponent.cardCvvValidator]],
      amount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadWallet();
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 19);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    this.rechargeForm.patchValue({ cardNumber: formatted }, { emitEvent: false });
  }

  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);

    let formatted = digits;
    if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    this.rechargeForm.patchValue({ cardExpiry: formatted }, { emitEvent: false });
  }

  onCardCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.rechargeForm.patchValue({ cardCvv: digits }, { emitEvent: false });
  }

  recharge(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.rechargeForm.invalid) {
      this.rechargeForm.markAllAsTouched();
      this.errorMessage = 'Revisa los datos de la tarjeta y el monto.';
      return;
    }

    const amount = Number(this.rechargeForm.value['amount']);
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
        this.rechargeForm.patchValue({
          cardType: 'CREDIT',
          cardHolder: '',
          cardNumber: '',
          cardExpiry: '',
          cardCvv: '',
          amount: null
        });
        this.rechargeForm.markAsPristine();
        this.rechargeForm.markAsUntouched();
      },
      error: () => {
        this.recharging = false;
        this.errorMessage = 'No se pudo procesar la recarga.';
      }
    });
  }

  isControlInvalid(name: string): boolean {
    const control = this.rechargeForm.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  }

  transactionTypeLabel(type: string): string {
    const normalizedType = (type || '').trim().toUpperCase();
    if (normalizedType === 'RECHARGE') {
      return 'Recarga';
    }
    if (normalizedType === 'PURCHASE' || normalizedType === 'TICKET_PURCHASE') {
      return 'Compra';
    }
    if (normalizedType === 'REFUND') {
      return 'Reembolso';
    }
    return normalizedType || 'Movimiento';
  }

  transactionTypeClass(type: string): string {
    const normalizedType = (type || '').trim().toUpperCase();
    if (normalizedType === 'RECHARGE' || normalizedType === 'REFUND') {
      return 'tx-positive';
    }
    if (normalizedType === 'PURCHASE' || normalizedType === 'TICKET_PURCHASE') {
      return 'tx-negative';
    }
    return 'tx-neutral';
  }

  amountClass(type: string): string {
    const normalizedType = (type || '').trim().toUpperCase();
    return normalizedType === 'PURCHASE' || normalizedType === 'TICKET_PURCHASE' ? 'amount-negative' : 'amount-positive';
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

  private static cardNumberValidator(control: AbstractControl): ValidationErrors | null {
    const digits = String(control.value ?? '').replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19 ? null : { cardNumber: true };
  }

  private static cardExpiryValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '').trim();
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test(value) ? null : { cardExpiry: true };
  }

  private static cardCvvValidator(control: AbstractControl): ValidationErrors | null {
    const digits = String(control.value ?? '').replace(/\D/g, '');
    return /^\d{3,4}$/.test(digits) ? null : { cardCvv: true };
  }
}

