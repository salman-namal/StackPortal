import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'stack-portal-theme';
  private readonly themeSubject = new BehaviorSubject<boolean>(this.getInitialTheme());

  readonly theme$: Observable<boolean> = this.themeSubject.asObservable();

  get isDark(): boolean {
    return this.themeSubject.value;
  }

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  toggleTheme(): void {
    this.setTheme(!this.themeSubject.value);
  }

  setTheme(isDark: boolean): void {
    this.themeSubject.next(isDark);
    localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  private getInitialTheme(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const storedTheme = localStorage.getItem(this.storageKey);
    if (storedTheme) {
      return storedTheme === 'dark';
    }

    return true;
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}
