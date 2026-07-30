import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-stack-portal-logo',
  standalone: true,
  templateUrl: './stack-portal-logo.component.html',
  styleUrl: './stack-portal-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackPortalLogoComponent {
  @Input() compact = false;
}
