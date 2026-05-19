import { Component, OnInit } from '@angular/core';
import { FEATURE_MODULES_MAP } from '../../core/config/feature-modules.config';
import { FeatureDataService } from '../../core/services/feature-data.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './ads.component.html'
})
export class AdsComponent implements OnInit {
  readonly config = FEATURE_MODULES_MAP.ads;
  loading = false;
  data: Record<string, unknown>[] = [];

  constructor(private readonly featureDataService: FeatureDataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.featureDataService.getList(this.config.endpoint).subscribe({
      next: (rows) => {
        this.data = rows;
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.loading = false;
      }
    });
  }
}
