import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, switchMap, catchError, tap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AdDisplayService } from '../../../../core/services/ads/ad-display.service';
import { SharedModule } from '../../../../shared/shared.module';
import { AdBannerComponent } from '../../../../shared/components/ad-banner/ad-banner.component';
import { AdBlockResponse, AdBlockPricingResponse } from '../../../../core/models/cinema.model';
import { AdBlockNowResponse } from '../../../../core/models/ads/ad.model';

@Component({
  selector: 'app-ads-block',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputNumberModule, 
    TableModule, TagModule, ProgressSpinnerModule, ToastModule, 
    SharedModule, AdBannerComponent
  ],
  providers: [MessageService],
  templateUrl: './ads-block.component.html',
  styleUrls: ['./ads-block.component.scss']
})
export class AdsBlockComponent implements OnInit {
  private readonly cinemaApi = inject(CinemaApiService);
  private readonly auth = inject(AuthService);
  private readonly adDisplayService = inject(AdDisplayService);
  private readonly msg = inject(MessageService);

  cinemaId: string | undefined = undefined;
  loading = true;
  processing = false;

  // Datos
  pricing: AdBlockPricingResponse | null = null;
  history: AdBlockResponse[] = [];
  currentStatus: AdBlockNowResponse | null = null;

  // Formulario
  daysToBlock: number = 1;

  ngOnInit(): void {
    this.resolveCinemaId().pipe(
      tap(id => this.cinemaId = id ?? undefined),
      switchMap(id => {
        if (!id) return of(null);
        return this.loadDashboardData(id);
      })
    ).subscribe({
      next: () => this.loading = false,
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar la información del cine.' });
        this.loading = false;
      }
    });
  }

  private loadDashboardData(cinemaId: string) {
    return forkJoin({
      pricing: this.cinemaApi.getAdBlockPricing(cinemaId),
      history: this.cinemaApi.getAdBlocksHistory(cinemaId),
      status: this.adDisplayService['http'].get<AdBlockNowResponse>(`${this.adDisplayService['blockBaseUrl']}/${cinemaId}/current`)
    }).pipe(
      tap(({ pricing, history, status }) => {
        this.pricing = pricing;
        this.history = history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.currentStatus = status;
      })
    );
  }

  get totalCost(): number {
    return this.daysToBlock * (this.pricing?.pricePerDay || 0);
  }

  purchaseAdBlock(): void {
    if (!this.cinemaId || !this.daysToBlock || this.daysToBlock < 1) return;

    this.processing = true;
    this.cinemaApi.createAdBlock(this.cinemaId, { daysBlocked: this.daysToBlock }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Bloqueo Exitoso', detail: `Anuncios bloqueados por ${this.daysToBlock} días.` });
        this.daysToBlock = 1;
        // Limpiamos cache para que el cambio se refleje inmediatamente
        this.adDisplayService.clearCinemaCache(this.cinemaId!);
        // Recargar datos para actualizar estado y tabla
        this.loadDashboardData(this.cinemaId!).subscribe(() => this.processing = false);
      },
      error: (e: HttpErrorResponse) => {
        this.processing = false;
        const detail = e.error?.message || 'No se pudo procesar la compra.';
        this.msg.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  private resolveCinemaId() {
    const stored = this.auth.getCinemaId();
    if (stored) return of(stored);
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return of(null as string | null);
    return this.cinemaApi.getCinemaByAdmin(userId).pipe(
      switchMap(c => {
        localStorage.setItem('cinemaId', c.id);
        return of(c.id as string | null);
      }),
      catchError(() => of(null as string | null))
    );
  }
}