import { Component, Input } from '@angular/core';
@Component({ selector: 'app-welcome-banner', standalone: true, templateUrl: './welcome-banner.component.html', styleUrl: './welcome-banner.component.scss' })
export class WelcomeBannerComponent { @Input() name = 'Salman Khan'; }
