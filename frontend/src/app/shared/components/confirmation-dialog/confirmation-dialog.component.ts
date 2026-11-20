import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogService } from './confirmation-dialog.service';
@Component({selector:'app-confirmation-dialog',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./confirmation-dialog.component.html',styleUrl:'./confirmation-dialog.component.scss'})
export class ConfirmationDialogComponent {
 @ViewChild('confirmButton') confirmButton?: ElementRef<HTMLButtonElement>; typed=''; previous: HTMLElement|null=null;
 constructor(readonly dialog:ConfirmationDialogService) { dialog.state$.subscribe(state=>{this.typed=''; if(state){this.previous=document.activeElement as HTMLElement; setTimeout(()=>this.confirmButton?.nativeElement.focus());}else this.previous?.focus();}); }
 close(){this.dialog.resolve(false);} confirm(){const state=this.dialog.current; if(!state||state.requiredText&&this.typed!==state.requiredText)return;this.dialog.resolve(true);}
 @HostListener('document:keydown.escape') escape(){if(this.dialog.current)this.close();}
}
