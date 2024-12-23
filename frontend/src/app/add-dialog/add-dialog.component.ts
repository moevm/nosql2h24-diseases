import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  styleUrls: ['./add-dialog.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class AddDialogComponent {

  isClickingOnList: boolean = false;
  symptoms: any = null;
  dict: any = {
    "diseases": "Болезни",
    "appeals": "Обращения",
    "sympts": "Симптома",
    "patients": "Пациента"
  }

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('80%', '80%');
    this.data.fields.chosen_symptoms = []
  } 

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(form: any): void {
    if (form.valid) {
      this.dialogRef.close(this.data.fields);
    }
  }

  MakePostReq(){
    const symptomName = this.data.fields.appeal_symptoms ? this.data.fields.appeal_symptoms.toLowerCase() : '';
    this.http.post('http://127.0.0.1:5000/api/entities', {"entity_type": "Symptom", "filter_params": {"filter1-field": "symptom_name", "filter1-action": "CONTAINS", "filter1-value": symptomName}}).subscribe({
      next: (response: any) => {
        this.symptoms = response['ans']
        console.log(this.symptoms)
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }

  OnInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.data.fields.appeal_symptoms = inputElement.value;

    this.MakePostReq()
  }

  OnInputFocus(){
    this.MakePostReq();
  }

  OnInputBlur() {
    // Задержка для проверки, был ли клик сделан на элемент списка
    setTimeout(() => {
      if (!this.isClickingOnList) {
        this.symptoms = null;
      }
      this.isClickingOnList = false; // Сброс переменной после проверки
    }, 200);

  }

  OnItemMouseDown() {
    this.isClickingOnList = true;
  }

  ChooseTheSympt(name: string){
    if(this.data.fields.chosen_symptoms){
      this.data.fields.chosen_symptoms.push(name)
    }
    else{
      this.data.fields.chosen_symptoms = [name]
    }

    this.symptoms = null;
    this.data.fields.appeal_symptoms = ''
  }

  IsTaken(name: string){
    if(this.data.fields.chosen_symptoms){
      return this.data.fields.chosen_symptoms.includes(name)
    }
    return this.data.fields.chosen_symptoms
  }

  RemoveItem(name: string){
    this.data.fields.chosen_symptoms.splice(this.data.fields.chosen_symptoms.indexOf(name), 1)
  }

  IsEmpty(){
    if(this.symptoms == null){
      return false;
    }
    return true;
  }
}
