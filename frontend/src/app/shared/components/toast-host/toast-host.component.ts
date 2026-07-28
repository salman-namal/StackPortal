import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe, NgFor } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [AsyncPipe, NgFor],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastHostComponent {
  constructor(readonly toastService: ToastService) {}
}
