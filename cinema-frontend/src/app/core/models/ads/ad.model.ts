import { AdType, AdPeriod } from '../prices/price.model';

export interface AdResponse {
  idAd: string;
  idAdvertiser: string;
  adType: AdType;
  adPeriod: AdPeriod;
  contentText: string;
  imageUrl: string | null;
  videoUrl: string | null;
  amountPaid: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  desactivateBy: string | null;
  updatedAt: string;
}

export interface AdRequest {
  adPriceId: string;
  contentText: string;
  videoUrl?: string; // Solo si se envía un enlace de YouTube
}

export interface AdvertiserDto {
  advertiserId: string;
  advertiserName: string;
  totalAds: number;
}

export interface AdBlockNowResponse {
  isBlocked?: boolean; 
  blocked?: boolean; 
  message: string;
  blockEndDate: string;
}