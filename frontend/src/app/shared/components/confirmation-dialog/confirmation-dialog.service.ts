import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ConfirmationType = 'success' | 'warning' | 'danger';
export interface ConfirmationOptions { title: string; message: string; type?: ConfirmationType; icon?: string; confirmText?: string; cancelText?: string; requiredText?: string; }
interface DialogState extends ConfirmationOptions { resolve: (confirmed: boolean) => void; }

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private readonly stateSubject = new BehaviorSubject<DialogState | null>(null);
  readonly state$ = this.stateSubject.asObservable();
  get current(): DialogState | null { return this.stateSubject.value; }
  confirm(options: ConfirmationOptions): Promise<boolean> {
    if (this.stateSubject.value) return Promise.resolve(false);
    return new Promise(resolve => this.stateSubject.next({ type: 'warning', confirmText: 'Confirm', cancelText: 'Cancel', ...options, resolve }));
  }
  resolve(confirmed: boolean): void { const current = this.stateSubject.value; if (!current) return; this.stateSubject.next(null); current.resolve(confirmed); }
}
