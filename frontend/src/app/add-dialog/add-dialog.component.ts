import { CommonModule } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  imports: [CommonModule, FormsModule, MatDialogModule],
  styleUrls: ['./add-dialog.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class AddDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  dict: any = {
    "diseases": "Болезни",
    "appeals": "Обращения",
    "sympts": "Симптома",
    "patients": "Пациента"
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(form: any): void {
    if (form.valid) {
      this.dialogRef.close(this.data.fields);
    }
  }
}
