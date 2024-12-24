import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class SearchComponent {
  @ViewChild('inputElement') inputElement!: ElementRef;
  @ViewChild('textareaElement') textareaElement!: ElementRef;

  input: string = '';
  complaints: string = '';
  data: any = null;
  isClickingOnList: boolean = false;
  chosen_sympts: any = [];

  constructor(private http: HttpClient, private dataService: DataService, private router: Router) {}

  MakePostReq() {
    this.http.post('http://127.0.0.1:5000/api/entities', {
      "entity_type": "Symptom",
      "filter_params": {
        "filter1-field": "symptom_name",
        "filter1-action": "CONTAINS",
        "filter1-value": this.input.toLowerCase()
      }
    }).subscribe({
      next: (response: any) => {
        this.data = response['ans'];
        console.log(this.data);
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
    this.input = inputElement.value;
    this.MakePostReq();
  }

  OnInputFocus() {
    this.MakePostReq();
  }

  OnInputBlur() {
    setTimeout(() => {
      if (!this.isClickingOnList) {
        this.data = null;
      }
      this.isClickingOnList = false;
    }, 200);
  }

  OnItemMouseDown() {
    this.isClickingOnList = true;
  }

  ChooseTheSympt(name: string) {
    this.chosen_sympts.push(name);
    this.data = null;
    this.input = '';
  }

  IsTaken(name: string) {
    return this.chosen_sympts.includes(name);
  }

  RemoveItem(name: string) {
    this.chosen_sympts.splice(this.chosen_sympts.indexOf(name), 1);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  SendAppeal() {
    let userInfo = this.dataService.getUserData();
    let data = {
      "appeal_date": this.formatDate(new Date()),
      "appeal_complaints": this.complaints,
      "symptoms": this.chosen_sympts.length != 0 ? this.chosen_sympts : [],
      "patient": userInfo.mail ? userInfo.mail : ""
    };

    if (data.symptoms.length == 0) {
      alert("Требуется выбрать симптомы, которые описывают ваше состояние");
      this.inputElement.nativeElement.classList.add('error');
      setTimeout(() => {
        this.inputElement.nativeElement.classList.remove('error');
      }, 1000); // Remove the error class after the animation duration
      return;
    }

    if (data.appeal_complaints == '') {
      alert("Требуется в общих словах описать своё состояние");
      this.textareaElement.nativeElement.classList.add('error');
      setTimeout(() => {
        this.textareaElement.nativeElement.classList.remove('error');
      }, 1000); // Remove the error class after the animation duration
      return;
    }

    console.log(data)


    this.http.post('http://127.0.0.1:5000/api/create_appeal', data).subscribe({
      next: (response: any) => {
        console.log(response)
        this.http.post('http://127.0.0.1:5000/api/predict_disease', {"appeal_date": data.appeal_date}).subscribe({
          next: (response: any) => {
            this.dataService.setPredictData(response['ans'])
            this.router.navigate(['/predict'])
          },
          error: error => {
            console.error('Error:', error);
          },
          complete: () => {
            console.log('here')
          }
        });
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('here')
      }
    });
  }
}
