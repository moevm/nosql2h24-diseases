import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChartComponent } from '../chart/chart.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stat',
  imports: [ChartComponent, CommonModule, FormsModule],
  templateUrl: './stat.component.html',
  styleUrl: './stat.component.less'
})
export class StatComponent {
  userData : any = null;
  selectedPatient: string = 'age';
  selectedSymptom: string = '';
  inputingSymptom: string = '';
  date_from: string = '';
  date_to: string = '';
  data: any = null;
  isClickingOnList: boolean = false;

  constructor(private dataService: DataService, private router : Router, private http: HttpClient){}

  ngOnInit() {
    this.userData = this.dataService.getUserData();
    console.log(this.userData);

    this.selectedSymptom = 'слабость в конечностях'
    this.inputingSymptom = 'слабость в конечностях'

    if (!this.userData) {
      this.router.navigate(['/login']);
    }
  }

  MakePostReq(){
    this.http.post('http://127.0.0.1:5000/api/entities', {"entity_type": "Symptom", "filter_params": {"filter1-field": "symptom_name", "filter1-action": "CONTAINS", "filter1-value": this.inputingSymptom.toLowerCase()}}).subscribe({
      next: (response: any) => {
        this.data = response['ans']
        
        this.data.sort((a: any, b: any) => {
          if (a.symptom_name < b.symptom_name) {
            return -1;
          }
          if (a.symptom_name > b.symptom_name) {
            return 1;
          }
          return 0;
        });
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
    this.inputingSymptom = inputElement.value;
    
    this.MakePostReq()
  }

  OnInputFocus(){
    this.MakePostReq();
  }

  OnInputBlur() {
    // Задержка для проверки, был ли клик сделан на элемент списка
    setTimeout(() => {
      if (!this.isClickingOnList) {
        this.data = null;
      }
      this.isClickingOnList = false; // Сброс переменной после проверки
    }, 200);

  }

  OnItemMouseDown() {
    this.isClickingOnList = true;
  }

  ChooseTheSympt(name: string){
    this.selectedSymptom = name
    this.inputingSymptom = name
    this.data = null;
  }
}
