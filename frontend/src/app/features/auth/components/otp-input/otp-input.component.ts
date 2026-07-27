import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  styleUrls: ['./otp-input.component.scss']
})
export class OtpInputComponent implements OnInit, OnDestroy {
  @Input() length = 6;
  @Input() initialCountdown = 45;
  @Output() otpSubmit = new EventEmitter<string>();
  @Output() resendOtp = new EventEmitter<void>();

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits: string[] = [];
  countdown = 45;
  timerInterval: any = null;
  canResend = false;

 ngOnInit(): void {
  this.digits = Array(this.length).fill('');
  this.countdown = this.initialCountdown;
  this.startTimer();
  console.log("OTP COMPONENT LOADED");
}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer(): void {
    this.stopTimer();
    this.canResend = false;
    this.countdown = this.initialCountdown;

    this.timerInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.canResend = true;
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

 onInput(event: Event, index: number): void {
  const input = event.target as HTMLInputElement;

  // Keep only numeric characters
  const value = input.value.replace(/\D/g, '');

  // Handle browser autofill or paste into a single box
  if (value.length > 1) {
    const chars = value.substring(0, this.length - index).split('');

    chars.forEach((char, i) => {
      this.digits[index + i] = char;

      const el = this.inputs.toArray()[index + i];
      if (el) {
        el.nativeElement.value = char;
      }
    });

    const nextIndex = Math.min(index + chars.length, this.length - 1);
    this.inputs.toArray()[nextIndex]?.nativeElement.focus();

    this.checkCompletion();
    return;
  }

  // Normal typing
  const digit = value.slice(-1);
  input.value = digit;
  this.digits[index] = digit;

  if (digit && index < this.length - 1) {
    this.inputs.toArray()[index + 1]?.nativeElement.focus();
  }

  this.checkCompletion();
}

  onKeyDown(event: KeyboardEvent, index: number): void {
    // Handle backspace navigation
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        const prevInput = this.inputs.toArray()[index - 1];
        if (prevInput) {
          prevInput.nativeElement.value = '';
          prevInput.nativeElement.focus();
          this.digits[index - 1] = '';
        }
      } else {
        const input = event.target as HTMLInputElement;
        input.value = '';
        this.digits[index] = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedData = clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const codeDigits = pastedData.slice(0, this.length).split('');
    codeDigits.forEach((digit, i) => {
      if (i < this.length) {
        this.digits[i] = digit;
        const inputEl = this.inputs.toArray()[i];
        if (inputEl) {
          inputEl.nativeElement.value = digit;
        }
      }
    });

    // Focus last filled box or next box
    const nextFocusIndex = Math.min(codeDigits.length, this.length - 1);
    const targetInput = this.inputs.toArray()[nextFocusIndex];
    if (targetInput) {
      targetInput.nativeElement.focus();
    }

    this.checkCompletion();
  }

  checkCompletion(): void {
    const fullCode = this.digits.join('');
    if (fullCode.length === this.length && !this.digits.includes('')) {
      this.otpSubmit.emit(fullCode);
    }
  }

  handleResend(): void {
    if (this.canResend) {
      this.digits = Array(this.length).fill('');
      this.inputs.forEach((input) => (input.nativeElement.value = ''));
      const firstInput = this.inputs.toArray()[0];
      if (firstInput) firstInput.nativeElement.focus();

      this.resendOtp.emit();
      this.startTimer();
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
