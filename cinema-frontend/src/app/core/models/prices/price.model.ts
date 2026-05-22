export enum AdType {
  TEXT = 'TEXT',
  TEXT_IMAGE = 'TEXT_IMAGE',
  VIDEO_TEXT = 'VIDEO_TEXT'
}

export enum AdPeriod {
  ONE_DAY = 'ONE_DAY',
  THREE_DAYS = 'THREE_DAYS',
  ONE_WEEK = 'ONE_WEEK',
  TWO_WEEKS = 'TWO_WEEKS'
}

export interface AdPrice {
  id: string;
  adType: AdType;
  adPeriod: AdPeriod;
  price: number;
  createdAt: string;
  updatedBy: string;
}

export interface AdPriceRequest {
  adType?: AdType;
  adPeriod?: AdPeriod;
  price: number;
}