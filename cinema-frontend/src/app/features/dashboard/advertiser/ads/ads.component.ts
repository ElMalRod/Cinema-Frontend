import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Core Imports
import { AdsService } from '../../../../core/services/ads/ads.service';
import { PricesService } from '../../../../core/services/prices/prices.service';
import { AdResponse, AdRequest } from '../../../../core/models/ads/ad.model';
import { AdPrice, AdType } from '../../../../core/models/prices/price.model';

// PrimeNG & Shared
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider'; // <-- Nuevo import para diseño
import { MessageService, ConfirmationService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-advertiser-ads',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, 
    DialogModule, ToastModule, ConfirmDialogModule, DropdownModule, 
    TextareaModule, InputTextModule, TagModule, FileUploadModule, 
    TooltipModule, DividerModule, SharedModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './ads.component.html',
  styleUrls: ['./ads.component.scss']
})
export class AdvertiserAdsComponent implements OnInit {
  private readonly adsService = inject(AdsService);
  private readonly pricesService = inject(PricesService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('videoInput') videoInput!: ElementRef;

  ads: AdResponse[] = [];
  availablePrices: AdPrice[] = [];
  priceOptions: any[] = []; 
  
  loading = false;
  isSubmitting = false;
  displayModal = false;
  adForm: FormGroup;

  // Variables para archivos y previsualización local
  selectedImage: File | undefined;
  selectedVideo: File | undefined;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  videoPreviewUrl: string | ArrayBuffer | null = null;

  // Variables para el Modal de Detalles
  displayDetailModal = false;
  selectedAdDetails: AdResponse | null = null;
  
  readonly AdType = AdType;

  constructor() {
    this.adForm = this.fb.group({
      adPriceId: [null, Validators.required],
      contentText: ['', [Validators.required, Validators.maxLength(500)]],
      videoUrl: [''],
      videoUploadType: ['link']
    });
  }

  ngOnInit(): void {
    this.loadAds();
    this.loadPrices();
    this.setupFormListeners();
  }

  loadAds(): void {
    this.loading = true;
    this.adsService.getAdvertiserAds().subscribe({
      next: (data) => {
        this.ads = data;
        this.loading = false;
      },
      error: () => {
        this.showError('Error al cargar tus anuncios');
        this.loading = false;
      }
    });
  }

  loadPrices(): void {
    this.pricesService.getPrices().subscribe({
      next: (prices) => {
        this.availablePrices = prices;
        this.priceOptions = prices.map(p => ({
          label: `${this.translateType(p.adType)} - ${this.translatePeriod(p.adPeriod)} (Q${p.price})`,
          value: p.id,
          type: p.adType
        }));
      }
    });
  }

  setupFormListeners(): void {
    this.adForm.get('adPriceId')?.valueChanges.subscribe(() => {
      this.clearMediaSelections();
    });
    this.adForm.get('videoUploadType')?.valueChanges.subscribe(() => {
      this.clearMediaSelections();
    });
  }

  get selectedPriceType(): AdType | null {
    const priceId = this.adForm.get('adPriceId')?.value;
    const price = this.availablePrices.find(p => p.id === priceId);
    return price ? price.adType : null;
  }

  openNew(): void {
    this.adForm.reset({ videoUploadType: 'link' });
    this.clearMediaSelections();
    this.displayModal = true;
  }

  // Lógica para previsualizar Imagen Local
  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreviewUrl = e.target?.result || null;
      reader.readAsDataURL(file);
    }
  }

  // Lógica para previsualizar Video Local
  onVideoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedVideo = file;
      const reader = new FileReader();
      reader.onload = e => this.videoPreviewUrl = e.target?.result || null;
      reader.readAsDataURL(file);
    }
  }

  clearMediaSelections(): void {
    this.selectedImage = undefined;
    this.selectedVideo = undefined;
    this.imagePreviewUrl = null;
    this.videoPreviewUrl = null;
    this.adForm.get('videoUrl')?.reset();
  }

  saveAd(): void {
    if (this.adForm.invalid) return;
    this.isSubmitting = true;

    const formValue = this.adForm.value;
    const request: AdRequest = {
      adPriceId: formValue.adPriceId,
      contentText: formValue.contentText
    };

    if (this.selectedPriceType === AdType.VIDEO_TEXT && formValue.videoUploadType === 'link' && formValue.videoUrl) {
      request.videoUrl = formValue.videoUrl;
    }

    this.adsService.createAd(request, this.selectedImage, this.selectedVideo).subscribe({
      next: () => {
        this.showSuccess('Anuncio creado exitosamente.');
        this.displayModal = false;
        this.loadAds();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Error al crear el anuncio.');
        this.isSubmitting = false;
      }
    });
  }

  // Abrir Modal de Detalles
  viewAdDetails(ad: AdResponse): void {
    this.selectedAdDetails = ad;
    this.displayDetailModal = true;
  }

  confirmDesactivate(ad: AdResponse): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas desactivar este anuncio antes de tiempo? No habrá reembolso.',
      header: 'Confirmar Desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adsService.desactivateAd(ad.idAd).subscribe({
          next: () => {
            this.showSuccess('Anuncio desactivado');
            this.loadAds();
          },
          error: () => this.showError('No se pudo desactivar el anuncio')
        });
      }
    });
  }

  hideModal(): void {
    this.displayModal = false;
  }

  translateType(type: AdType): string {
    const dict = { [AdType.TEXT]: 'Solo Texto', [AdType.TEXT_IMAGE]: 'Texto + Imagen', [AdType.VIDEO_TEXT]: 'Texto + Video' };
    return dict[type] || type;
  }

  translatePeriod(period: string): string {
    const dict: any = { 'ONE_DAY': '1 Día', 'THREE_DAYS': '3 Días', 'ONE_WEEK': '1 Sem', 'TWO_WEEKS': '2 Sem' };
    return dict[period] || period;
  }

  private showSuccess(msg: string): void { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg }); }
  private showError(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}