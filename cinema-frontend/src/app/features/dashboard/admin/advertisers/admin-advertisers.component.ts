import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsService } from '../../../../core/services/ads/ads.service';
import { AdResponse, AdvertiserDto } from '../../../../core/models/ads/ad.model';
import { AdType } from '../../../../core/models/prices/price.model';

// PrimeNG & Shared
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-admin-advertisers',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, DialogModule, 
    TagModule, TooltipModule, ToastModule, ConfirmDialogModule, 
    SharedModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-advertisers.component.html'
})
export class AdminAdvertisersComponent implements OnInit {
  private readonly adsService = inject(AdsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  advertisers: AdvertiserDto[] = [];
  loadingAdvertisers = false;

  // Estado del Modal de Anuncios
  displayAdsModal = false;
  selectedAdvertiser: AdvertiserDto | null = null;
  advertiserAds: AdResponse[] = [];
  loadingAds = false;

  ngOnInit(): void {
    this.loadAdvertisers();
  }

  loadAdvertisers(): void {
    this.loadingAdvertisers = true;
    this.adsService.getAdvertisers().subscribe({
      next: (data) => {
        this.advertisers = data;
        this.loadingAdvertisers = false;
      },
      error: () => {
        this.showError('Error al cargar la lista de anunciantes');
        this.loadingAdvertisers = false;
      }
    });
  }

  viewAds(advertiser: AdvertiserDto): void {
    this.selectedAdvertiser = advertiser;
    this.displayAdsModal = true;
    this.loadingAds = true;
    
    this.adsService.getAdsByAdvertiserId(advertiser.advertiserId).subscribe({
      next: (ads) => {
        this.advertiserAds = ads;
        this.loadingAds = false;
      },
      error: () => {
        this.showError('Error al cargar los anuncios');
        this.loadingAds = false;
      }
    });
  }

  confirmDesactivate(ad: AdResponse): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de bloquear y desactivar este anuncio de forma permanente?',
      header: 'Bloquear Campaña',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adsService.desactivateAd(ad.idAd).subscribe({
          next: () => {
            this.showSuccess('Anuncio bloqueado exitosamente.');
            // Recargar la tabla del modal
            if (this.selectedAdvertiser) {
              this.viewAds(this.selectedAdvertiser);
            }
          },
          error: () => this.showError('No se pudo desactivar el anuncio.')
        });
      }
    });
  }

  translateType(type: AdType): string {
    const dict = { [AdType.TEXT]: 'Solo Texto', [AdType.TEXT_IMAGE]: 'Texto + Imagen', [AdType.VIDEO_TEXT]: 'Texto + Video' };
    return dict[type] || type;
  }

  private showSuccess(msg: string): void { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg }); }
  private showError(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}