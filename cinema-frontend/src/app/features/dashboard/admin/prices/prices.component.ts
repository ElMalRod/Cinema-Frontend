import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PricesService } from '../../../../core/services/prices/prices.service';
import { AdPrice, AdType, AdPeriod } from '../../../../core/models/prices/price.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-prices',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    ToastModule, 
    ConfirmDialogModule, 
    DropdownModule, 
    InputNumberModule,
    SharedModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './prices.component.html',
  styleUrls: ['./prices.component.scss']
})
export class PricesComponent implements OnInit {
  private readonly pricesService = inject(PricesService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  prices: AdPrice[] = [];
  loading = false;
  
  // Modal State
  displayModal = false;
  isEditing = false;
  currentPriceId: string | null = null;
  priceForm: FormGroup;

  // Dropdown Options
  adTypes = [
    { label: 'Solo Texto', value: AdType.TEXT },
    { label: 'Texto e Imagen', value: AdType.TEXT_IMAGE },
    { label: 'Video y Texto', value: AdType.VIDEO_TEXT }
  ];

  adPeriods = [
    { label: '1 Día', value: AdPeriod.ONE_DAY },
    { label: '3 Días', value: AdPeriod.THREE_DAYS },
    { label: '1 Semana', value: AdPeriod.ONE_WEEK },
    { label: '2 Semanas', value: AdPeriod.TWO_WEEKS }
  ];

  constructor() {
    this.priceForm = this.fb.group({
      adType: [null, Validators.required],
      adPeriod: [null, Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.loadPrices();
  }

  loadPrices(): void {
    this.loading = true;
    this.pricesService.getPrices().subscribe({
      next: (data) => {
        this.prices = data;
        this.loading = false;
      },
      error: () => {
        this.showError('Error al cargar los precios');
        this.loading = false;
      }
    });
  }

  openNew(): void {
    this.isEditing = false;
    this.currentPriceId = null;
    this.priceForm.reset();
    this.priceForm.get('adType')?.enable();
    this.priceForm.get('adPeriod')?.enable();
    this.displayModal = true;
  }

  editPrice(price: AdPrice): void {
    this.isEditing = true;
    this.currentPriceId = price.id;
    this.priceForm.patchValue({
      adType: price.adType,
      adPeriod: price.adPeriod,
      price: price.price
    });
    // Bloqueamos los campos que no se pueden editar en el PUT
    this.priceForm.get('adType')?.disable();
    this.priceForm.get('adPeriod')?.disable();
    this.displayModal = true;
  }

  deletePrice(price: AdPrice): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este precio?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.pricesService.deletePrice(price.id).subscribe({
          next: () => {
            this.showSuccess('Precio eliminado exitosamente');
            this.loadPrices();
          },
          error: () => this.showError('No se pudo eliminar el precio')
        });
      }
    });
  }

  savePrice(): void {
    if (this.priceForm.invalid) return;

    if (this.isEditing && this.currentPriceId) {
      // Flujo PUT
      const updateData = { price: this.priceForm.get('price')?.value };
      this.pricesService.updatePrice(this.currentPriceId, updateData).subscribe({
        next: () => {
          this.showSuccess('Precio actualizado exitosamente');
          this.displayModal = false;
          this.loadPrices();
        },
        error: (err) => this.handleApiError(err)
      });
    } else {
      // Flujo POST
      this.pricesService.createPrice(this.priceForm.getRawValue()).subscribe({
        next: () => {
          this.showSuccess('Precio registrado exitosamente');
          this.displayModal = false;
          this.loadPrices();
        },
        error: (err) => this.handleApiError(err)
      });
    }
  }

  hideModal(): void {
    this.displayModal = false;
  }

  getAdTypeName(type: AdType): string {
    return this.adTypes.find(t => t.value === type)?.label || type;
  }

  getAdPeriodName(period: AdPeriod): string {
    return this.adPeriods.find(p => p.value === period)?.label || period;
  }

  private showSuccess(msg: string): void {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }

  private handleApiError(err: any): void {
    if (err.status === 409 || err.error?.message?.includes('existe')) {
      this.showError('Ya existe un precio para esta combinación de tipo y duración.');
    } else {
      this.showError('Ocurrió un error al procesar la solicitud.');
    }
  }
}