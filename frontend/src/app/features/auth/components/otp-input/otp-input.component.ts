import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';

const OTP_LENGTH = 6;

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpInputComponent implements OnInit, OnDestroy {
  @Input() initialCountdown = 45;
  @Output() otpSubmit = new EventEmitter<string>();
  @Output() resendOtp = new EventEmitter<void>();

  @ViewChildren('otpInput') private readonly inputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpLength = OTP_LENGTH;
  digits = Array.from({ length: OTP_LENGTH }, () => '');
  countdown = 45;
  canResend = false;

  private timerId: ReturnType<typeof setInterval> | null = null;
  private wasComplete = false;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  onInput(event: Event, index: number): void {
    const value = this.numericValue((event.target as HTMLInputElement).value);

    // Browser OTP autofill can place the whole code into one input.
    if (value.length > 1) {
      this.setDigits(value.length >= OTP_LENGTH ? value.slice(0, OTP_LENGTH) : value, value.length >= OTP_LENGTH ? 0 : index);
      return;
    }

    this.digits[index] = value;
    this.updateCompletionState();

    if (value && index < OTP_LENGTH - 1) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'Backspace' || this.digits[index] || index === 0) {
      return;
    }

    event.preventDefault();
    this.digits[index - 1] = '';
    this.updateCompletionState();
    this.focusInput(index - 1);
  }

  onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pastedValue = this.numericValue(event.clipboardData?.getData('text') ?? '');

    if (!pastedValue) {
      return;
    }

    // A full OTP should work no matter which box received the paste.
    this.setDigits(pastedValue.slice(0, OTP_LENGTH), pastedValue.length >= OTP_LENGTH ? 0 : index);
  }

  handleResend(): void {
    if (!this.canResend) {
      return;
    }

    this.digits = Array.from({ length: OTP_LENGTH }, () => '');
    this.wasComplete = false;
    this.resendOtp.emit();
    this.startTimer();
    this.focusInput(0);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private setDigits(value: string, startIndex: number): void {
    const nextDigits = [...this.digits];
    const values = value.slice(0, OTP_LENGTH - startIndex).split('');

    values.forEach((digit, offset) => {
      nextDigits[startIndex + offset] = digit;
    });

    this.digits = nextDigits;
    this.updateCompletionState();

    const nextIndex = Math.min(startIndex + values.length, OTP_LENGTH - 1);
    this.focusInput(nextIndex);
  }

  private updateCompletionState(): void {
    const code = this.digits.join('');
    const isComplete = this.digits.every((digit) => digit !== '');

    if (isComplete && !this.wasComplete) {
      this.otpSubmit.emit(code);
    }

    this.wasComplete = isComplete;
  }

  private startTimer(): void {
    this.stopTimer();
    this.countdown = Math.max(0, this.initialCountdown);
    this.canResend = this.countdown === 0;

    if (this.canResend) {
      return;
    }

    this.timerId = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.countdown = 0;
        this.canResend = true;
        this.stopTimer();
      }

      this.changeDetectorRef.markForCheck();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private focusInput(index: number): void {
    queueMicrotask(() => this.inputs?.get(index)?.nativeElement.focus());
  }

  private numericValue(value: string): string {
    return value.replace(/\D/g, '');
  }
}
