import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SystemReportsService } from '../../../../core/services/reports/system-reports.service';
import { AdsService } from '../../../../core/services/ads/ads.service';
import { ReportSystemProfit } from '../../../../core/models/reports/system-report.model';
import { AdvertiserDto } from '../../../../core/models/ads/ad.model';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, 
    TabsModule, DatePickerModule, DropdownModule, ToastModule, SharedModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './reports.component.html'
})
export class AdminReportsComponent implements OnInit {
  private readonly reportsService = inject(SystemReportsService);
  private readonly adsService = inject(AdsService);
  private readonly messageService = inject(MessageService);
  private readonly datePipe = inject(DatePipe);

  activeTab: string = 'profit';
  readonly today = new Date();
  loading = false;

  // Filtros
  fromDate: Date | null = null;
  toDate: Date | null = null;
  selectedAdType: string | null = null;
  selectedAdvertiser: string | null = null;

  // Opciones de Dropdowns
  adTypes = [
    { label: 'Todos', value: null },
    { label: 'Solo Texto', value: 'TEXT' },
    { label: 'Texto + Imagen', value: 'TEXT_IMAGE' },
    { label: 'Video + Texto', value: 'VIDEO_TEXT' }
  ];
  advertisers: AdvertiserDto[] = [];

  // Datos
  profitData: ReportSystemProfit | null = null;
  adsPurchasedData: any[] = [];
  advertiserProfitData: any[] = [];
  topPopularData: any[] = [];
  topCommentedData: any[] = [];

  ngOnInit(): void {
    this.loadAdvertisers();
  }

  loadAdvertisers(): void {
    this.adsService.getAdvertisers().subscribe({
      next: (data) => this.advertisers = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los anunciantes.' })
    });
  }

  clearDates(): void {
    this.fromDate = null;
    this.toDate = null;
    this.selectedAdType = null;
    this.selectedAdvertiser = null;
    this.messageService.add({ severity: 'info', summary: 'Filtros Limpios', detail: 'Se han restablecido los parámetros.' });
  }

  generatePreview(): void {
    this.loading = true;
    const fromStr = this.fromDate ? this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')! : undefined;
    const toStr = this.toDate ? this.datePipe.transform(this.toDate, 'yyyy-MM-dd')! : undefined;
    const adType = this.selectedAdType || undefined;
    const advId = this.selectedAdvertiser || undefined;

    switch (this.activeTab) {
      case 'profit':
        this.reportsService.getProfitJSON(fromStr, toStr).subscribe(res => { this.profitData = res; this.loading = false; });
        break;
      case 'adsPurchased':
        this.reportsService.getAdsPurchasedJSON(fromStr, toStr, adType).subscribe(res => { this.adsPurchasedData = res; this.loading = false; });
        break;
      case 'advertiserProfit':
        this.reportsService.getAdvertiserProfitJSON(fromStr, toStr, advId).subscribe(res => { this.advertiserProfitData = res; this.loading = false; });
        break;
      case 'popularRooms':
        this.reportsService.getTopPopularJSON(fromStr, toStr).subscribe(res => { this.topPopularData = res; this.loading = false; });
        break;
      case 'commentedRooms':
        this.reportsService.getTopCommentedJSON(fromStr, toStr).subscribe(res => { this.topCommentedData = res; this.loading = false; });
        break;
    }
  }

  downloadPDF(): void {
    this.loading = true;
    const fromStr = this.fromDate ? this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')! : undefined;
    const toStr = this.toDate ? this.datePipe.transform(this.toDate, 'yyyy-MM-dd')! : undefined;
    const adType = this.selectedAdType || undefined;
    const advId = this.selectedAdvertiser || undefined;

    let request$;
    switch (this.activeTab) {
      case 'profit': request$ = this.reportsService.getProfitPDF(fromStr, toStr); break;
      case 'adsPurchased': request$ = this.reportsService.getAdsPurchasedPDF(fromStr, toStr, adType); break;
      case 'advertiserProfit': request$ = this.reportsService.getAdvertiserProfitPDF(fromStr, toStr, advId); break;
      case 'popularRooms': request$ = this.reportsService.getTopPopularPDF(fromStr, toStr); break;
      case 'commentedRooms': request$ = this.reportsService.getTopCommentedPDF(fromStr, toStr); break;
    }

    request$?.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `System_Report_${this.activeTab}_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte descargado' });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al descargar PDF' });
      }
    });
  }
}