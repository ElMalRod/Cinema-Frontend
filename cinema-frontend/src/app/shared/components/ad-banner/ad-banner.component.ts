import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // <-- IMPORTANTE
import { AdDisplayService } from '../../../core/services/ads/ad-display.service';
import { AdResponse } from '../../../core/models/ads/ad.model';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-banner.component.html',
  styleUrls: ['./ad-banner.component.scss']
})
export class AdBannerComponent implements OnInit {
  @Input() cinemaId?: string;

  private readonly adDisplayService = inject(AdDisplayService);
  private readonly sanitizer = inject(DomSanitizer); // <-- INYECTAMOS EL SANITIZADOR

  ad: AdResponse | null = null;
  loading = true;
  isBlocked = false;

  ngOnInit(): void {
    if (this.cinemaId) {
      this.adDisplayService.isCinemaBlocked(this.cinemaId).subscribe(blocked => {
        this.isBlocked = blocked;
        if (!blocked) this.loadRandomAd();
        else this.loading = false;
      });
    } else {
      this.loadRandomAd();
    }
  }

  private loadRandomAd(): void {
    this.adDisplayService.getRandomAd().subscribe(randomAd => {
      this.ad = randomAd;
      this.loading = false;
    });
  }


  isYouTube(url: string | null): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYouTubeUrl(url: string | null): SafeResourceUrl | null {
    if (!url) return null;
    
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    
    if (match && match[1]) {
      const embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    
    return null;
  }
}