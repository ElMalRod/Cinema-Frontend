import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, of } from 'rxjs';
import { CinemaApiService } from '../../../../core/services/cinema-api.service';
import {
  AdBlockPricingPayload,
  AdBlockPricingResponse,
  CinemaOperatingCostSummary,
  CinemaSummary,
  CreateGlobalCostPayload,
  CreateOperatingCostPayload,
  GlobalCostResponse,
} from '../../../../core/models/cinema.model';

interface AdBlockRow {
  cinemaId: string;
  cinemaName: string;
  cinemaLocation: string;
  companyId: string;
  companyName: string;
  hasPricing: boolean;
  pricePerDay: number | null;
  updatedAt: string | null;
}

interface OpCostRow extends CinemaOperatingCostSummary {
  companyId: string;
  companyName: string;
}

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, DialogModule, ToastModule,
    ProgressSpinnerModule, TagModule, SelectModule, TabsModule,
    InputNumberModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './costs.component.html',
  styleUrl: './costs.component.scss'
})
export class CostsComponent implements OnInit {
  readonly title = 'Costos';
  readonly subtitle = 'Gestiona el costo base, bloqueo de anuncios y costos operativos';

  loading = true;

  // ── Global Cost ──────────────────────────────────────────────────────────
  globalCost: GlobalCostResponse | null = null;
  globalCostNotFound = false;
  showGlobalCostModal = false;
  savingGlobalCost = false;
  gcForm: { dailyCost: number | null; effectiveFrom: string } = { dailyCost: null, effectiveFrom: '' };

  // ── AdBlock Pricing ──────────────────────────────────────────────────────
  adBlockRows: AdBlockRow[] = [];
  filterCompanyAdBlock: string | null = null;
  showAdBlockModal = false;
  savingAdBlock = false;
  selectedAdBlockRow: AdBlockRow | null = null;
  abForm: { pricePerDay: number | null } = { pricePerDay: null };

  // ── Operating Costs ──────────────────────────────────────────────────────
  opCostRows: OpCostRow[] = [];
  filterCompanyOpCost: string | null = null;
  showAddOpCostModal = false;
  savingOpCost = false;
  addOpCostForm: { cinemaId: string; dailyCost: number | null; effectiveFrom: string } = {
    cinemaId: '', dailyCost: null, effectiveFrom: ''
  };
  showOpCostDetailModal = false;
  selectedOpCostRow: OpCostRow | null = null;

  // ── Shared ───────────────────────────────────────────────────────────────
  companyOptionsAdBlock: { label: string; value: string }[] = [];
  companyOptionsOpCost: { label: string; value: string }[] = [];
  cinemaOptions: { label: string; value: string }[] = [];

  get filteredAdBlockRows(): AdBlockRow[] {
    if (!this.filterCompanyAdBlock) return this.adBlockRows;
    return this.adBlockRows.filter(r => r.companyId === this.filterCompanyAdBlock);
  }

  get filteredOpCostRows(): OpCostRow[] {
    if (!this.filterCompanyOpCost) return this.opCostRows;
    return this.opCostRows.filter(r => r.companyId === this.filterCompanyOpCost);
  }

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    forkJoin({
      globalCost: this.cinemaApi.getLatestGlobalCost().pipe(catchError(() => of(null))),
      adBlockPricings: this.cinemaApi.getAllAdBlockPricings().pipe(catchError(() => of([] as AdBlockPricingResponse[]))),
      cinemas: this.cinemaApi.getCinemas().pipe(catchError(() => of([] as CinemaSummary[]))),
      opCosts: this.cinemaApi.getAllOperatingCostSummaries().pipe(catchError(() => of([] as CinemaOperatingCostSummary[])))
    }).subscribe({
      next: ({ globalCost, adBlockPricings, cinemas, opCosts }) => {
        this.globalCost = globalCost;
        this.globalCostNotFound = !globalCost;
        this.buildAdBlockRows(cinemas, adBlockPricings);
        this.buildOpCostRows(cinemas, opCosts);
        this.buildSharedOptions(cinemas);
        this.loading = false;
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos de costos', life: 5000 });
        this.loading = false;
      }
    });
  }

  private buildAdBlockRows(cinemas: CinemaSummary[], pricings: AdBlockPricingResponse[]): void {
    const pricingMap = new Map(pricings.map(p => [p.cinemaId, p]));
    this.adBlockRows = cinemas.map(c => {
      const p = pricingMap.get(c.id);
      return {
        cinemaId: c.id,
        cinemaName: c.name,
        cinemaLocation: c.address,
        companyId: c.companyId,
        companyName: c.companyName,
        hasPricing: !!p,
        pricePerDay: p?.pricePerDay ?? null,
        updatedAt: p?.updatedAt ?? null,
      };
    });
  }

  private buildOpCostRows(cinemas: CinemaSummary[], summaries: CinemaOperatingCostSummary[]): void {
    const cinemaMap = new Map(cinemas.map(c => [c.id, c]));
    this.opCostRows = summaries.map(s => ({
      ...s,
      companyId: cinemaMap.get(s.cinemaId)?.companyId ?? '',
      companyName: cinemaMap.get(s.cinemaId)?.companyName ?? '—',
    }));
  }

  private buildSharedOptions(cinemas: CinemaSummary[]): void {
    const uniqueCompanies = Array.from(
      new Map(cinemas.map(c => [c.companyId, c.companyName])).entries()
    ).map(([value, label]) => ({ label, value }));
    this.companyOptionsAdBlock = uniqueCompanies;
    this.companyOptionsOpCost = uniqueCompanies;
    this.cinemaOptions = cinemas.map(c => ({ label: `${c.name} — ${c.companyName}`, value: c.id }));
  }

  // ── GlobalCost ────────────────────────────────────────────────────────────

  openGlobalCostModal(): void {
    this.gcForm = { dailyCost: this.globalCost?.dailyCost ?? null, effectiveFrom: '' };
    this.showGlobalCostModal = true;
  }

  submitGlobalCost(): void {
    const { dailyCost, effectiveFrom } = this.gcForm;
    if (!dailyCost || dailyCost <= 0 || !effectiveFrom) return;
    this.savingGlobalCost = true;
    const payload: CreateGlobalCostPayload = { dailyCost, effectiveFrom };
    this.cinemaApi.createGlobalCost(payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Costo base actualizado', life: 4000 });
        this.savingGlobalCost = false;
        this.showGlobalCostModal = false;
        this.loadAll();
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo guardar el costo base'), life: 5000 });
        this.savingGlobalCost = false;
      }
    });
  }

  // ── AdBlock ───────────────────────────────────────────────────────────────

  openAdBlockModal(row: AdBlockRow): void {
    this.selectedAdBlockRow = row;
    this.abForm = { pricePerDay: row.pricePerDay };
    this.showAdBlockModal = true;
  }

  submitAdBlock(): void {
    const { pricePerDay } = this.abForm;
    if (!this.selectedAdBlockRow || !pricePerDay || pricePerDay <= 0) return;
    this.savingAdBlock = true;
    const payload: AdBlockPricingPayload = { pricePerDay };
    const request$ = this.selectedAdBlockRow.hasPricing
      ? this.cinemaApi.updateAdBlockPricing(this.selectedAdBlockRow.cinemaId, payload)
      : this.cinemaApi.createAdBlockPricing(this.selectedAdBlockRow.cinemaId, payload);
    request$.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Precio de bloqueo actualizado', life: 4000 });
        this.savingAdBlock = false;
        this.showAdBlockModal = false;
        this.loadAll();
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo guardar el precio de bloqueo'), life: 5000 });
        this.savingAdBlock = false;
      }
    });
  }

  // ── OperatingCost ─────────────────────────────────────────────────────────

  openAddOpCostModal(): void {
    this.addOpCostForm = { cinemaId: '', dailyCost: null, effectiveFrom: '' };
    this.showAddOpCostModal = true;
  }

  submitOpCost(): void {
    const { cinemaId, dailyCost, effectiveFrom } = this.addOpCostForm;
    if (!cinemaId || !dailyCost || dailyCost <= 0 || !effectiveFrom) return;
    this.savingOpCost = true;
    const payload: CreateOperatingCostPayload = { cinemaId, dailyCost, effectiveFrom };
    this.cinemaApi.createOperatingCost(payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Creado', detail: 'Costo operativo registrado', life: 4000 });
        this.savingOpCost = false;
        this.showAddOpCostModal = false;
        this.loadAll();
      },
      error: (e: HttpErrorResponse) => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: this.extractError(e, 'No se pudo registrar el costo operativo'), life: 5000 });
        this.savingOpCost = false;
      }
    });
  }

  openOpCostDetail(row: OpCostRow): void {
    this.selectedOpCostRow = row;
    this.showOpCostDetailModal = true;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (!err?.error) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    return err.error?.message || err.error?.error || fallback;
  }
}

