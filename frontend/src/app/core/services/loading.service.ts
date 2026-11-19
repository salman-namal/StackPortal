import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private readonly state = new BehaviorSubject(false);
  readonly loading$ = this.state.asObservable();
  begin(): void { this.pending++; this.state.next(true); }
  end(): void { this.pending = Math.max(0, this.pending - 1); this.state.next(this.pending > 0); }
}

