import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { WalletTransactionResponse, CreateWalletTransactionRequest } from '../../../../core/models/cinema.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, 
    TableModule, DialogModule, InputNumberModule, 
    InputTextModule, ToastModule, TagModule
  ],
  providers: [MessageService],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  adminId: string | null = null;
  loading = false;
  transactions: WalletTransactionResponse[] = [];
  currentBalance: number = 0;

  // Modal de Recarga
  showRechargeModal = false;
  recharging = false;
  rechargeAmount: number | null = null;
  rechargeDescription: string = '';

  constructor(
    private readonly auth: AuthService,
    private readonly cinemaApi: CinemaApiService,
    private readonly msg: MessageService
  ) {}

  ngOnInit(): void {
    this.adminId = this.auth.getCurrentUser()?.id ?? null;
    if (this.adminId) {
      this.loadTransactions();
    } else {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al administrador.' });
    }
  }

  loadTransactions(): void {
    if (!this.adminId) return;
    this.loading = true;
    this.cinemaApi.getWalletTransactions(this.adminId).subscribe({
      next: (txs) => {
        // Ordenamos por fecha descendente (más recientes primero)
        this.transactions = txs.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        this.calculateBalance(this.transactions);
        this.loading = false;
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial de la cartera.' });
        this.loading = false;
      }
    });
  }

  private calculateBalance(txs: WalletTransactionResponse[]): void {
    // Calculamos el saldo base. Si tu backend devuelve cobros en negativo, usa siempre suma.
    // Aquí asumimos que RECHARGE suma, y los demás (CHARGE, etc.) restan.
    this.currentBalance = txs.reduce((acc, tx) => {
      return tx.type === 'RECHARGE' ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }

  openRechargeModal(): void {
    this.rechargeAmount = null;
    this.rechargeDescription = '';
    this.showRechargeModal = true;
  }

  submitRecharge(): void {
    if (!this.adminId || !this.rechargeAmount || this.rechargeAmount <= 0) return;
    this.recharging = true;

    const payload: CreateWalletTransactionRequest = {
      adminCinemaId: this.adminId,
      amount: this.rechargeAmount,
      description: this.rechargeDescription.trim() || 'Recarga de saldo'
    };

    this.cinemaApi.createWalletRecharge(payload).subscribe({
      next: (response) => {
        this.msg.add({ severity: 'success', summary: 'Recarga Exitosa', detail: `Nuevo saldo: Q ${response.newBalance.toFixed(2)}` });
        this.recharging = false;
        this.showRechargeModal = false;
        this.loadTransactions(); // Recargar historial para ver la nueva transacción
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la recarga.' });
        this.recharging = false;
      }
    });
  }

  getTxTypeSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    switch (type) {
      case 'RECHARGE': return 'success';
      case 'CHARGE': return 'danger';
      case 'REFUND': return 'info';
      default: return 'secondary';
    }
  }

  getTxTypeLabel(type: string): string {
    switch (type) {
      case 'RECHARGE': return 'Recarga';
      case 'CHARGE': return 'Cobro';
      case 'REFUND': return 'Reembolso';
      default: return type;
    }
  }
}