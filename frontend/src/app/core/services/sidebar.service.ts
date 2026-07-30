import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly storageKey = 'stack-portal-sidebar-collapsed';
  readonly collapsed = signal(this.getInitialState());

  toggle(): void {
    this.setCollapsed(!this.collapsed());
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    localStorage.setItem(this.storageKey, String(collapsed));
  }

  private getInitialState(): boolean {
    const storedValue = localStorage.getItem(this.storageKey);
    if (storedValue !== null) {
      return storedValue === 'true';
    }

    return window.matchMedia('(min-width: 701px) and (max-width: 1024px)').matches;
  }
}
