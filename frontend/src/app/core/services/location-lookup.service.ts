import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocationLookupService {
  private readonly cities: Record<string, string[]> = {
    Pakistan: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
    China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Hangzhou', 'Xiâ€™an']
  };
  countries(): string[] { return Object.keys(this.cities); }
  citiesFor(country: string | null | undefined): string[] { return country ? this.cities[country] ?? [] : []; }
  isValid(country: string, city: string): boolean { return this.citiesFor(country).includes(city); }
}

