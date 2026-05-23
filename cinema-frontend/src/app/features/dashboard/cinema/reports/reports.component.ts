import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Core
import { CinemaReportsService } from '../../../../core/services/reports/cinema-reports.service';
import { AuthService } from '../../../../core/services/auth.service';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-cinema-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, 
    TabsModule, DatePickerModule, ToastModule, SharedModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './reports.component.html'
})
export class CinemaReportsComponent implements OnInit {
  private readonly reportsService = inject(CinemaReportsService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly datePipe = inject(DatePipe);

  cinemaId: string | null = null;
  activeTab: string = 'comments';
  
  // Filtros
  fromDate: Date | null = null;
  toDate: Date | null = null;

  readonly today = new Date();

  // Datos
  commentsData: any[] = [];
  showtimesData: any[] = [];
  topRoomsData: any[] = [];
  ticketSalesData: any[] = [];
  
  loading = false;

  ngOnInit(): void {
    this.cinemaId = this.authService.getCinemaId();
    if (!this.cinemaId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el ID del cine asignado a este usuario.' });
    }
  }

  // Genera la vista previa en JSON según el tab activo
  generatePreview(): void {
    if (!this.cinemaId) return;
    
    this.loading = true;
    const fromStr = this.fromDate ? this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')! : undefined;
    const toStr = this.toDate ? this.datePipe.transform(this.toDate, 'yyyy-MM-dd')! : undefined;

    switch (this.activeTab) {
      case 'comments':
        this.reportsService.getCommentsJSON(this.cinemaId, fromStr, toStr).subscribe(res => { this.commentsData = res; this.loading = false; });
        break;
      case 'showtimes':
        this.reportsService.getShowtimesJSON(this.cinemaId, fromStr, toStr).subscribe(res => { this.showtimesData = res; this.loading = false; });
        break;
      case 'topRooms':
        this.reportsService.getTopRoomsJSON(this.cinemaId, fromStr, toStr).subscribe(res => { this.topRoomsData = res; this.loading = false; });
        break;
      case 'sales':
        this.reportsService.getTicketSalesJSON(this.cinemaId, fromStr, toStr).subscribe(res => { this.ticketSalesData = res; this.loading = false; });
        break;
    }
  }

  // Descarga el archivo PDF
  downloadPDF(): void {
    if (!this.cinemaId) return;

    this.loading = true;
    const fromStr = this.fromDate ? this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')! : undefined;
    const toStr = this.toDate ? this.datePipe.transform(this.toDate, 'yyyy-MM-dd')! : undefined;

    let request$;
    switch (this.activeTab) {
      case 'comments': request$ = this.reportsService.getCommentsPDF(this.cinemaId, fromStr, toStr); break;
      case 'showtimes': request$ = this.reportsService.getShowtimesPDF(this.cinemaId, fromStr, toStr); break;
      case 'topRooms': request$ = this.reportsService.getTopRoomsPDF(this.cinemaId, fromStr, toStr); break;
      case 'sales': request$ = this.reportsService.getTicketSalesPDF(this.cinemaId, fromStr, toStr); break;
    }

    request$?.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${this.activeTab}_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte descargado correctamente' });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el documento PDF' });
      }
    });
  }

  clearDates(): void {
    this.fromDate = null;
    this.toDate = null;
    this.generatePreview(); // Opcional: vuelve a cargar los datos sin filtros
    this.messageService.add({ severity: 'info', summary: 'Filtros Limpios', detail: 'Se han restablecido las fechas.' });
  }
}