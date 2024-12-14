import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  imports: [NgClass, CommonModule, FormsModule, MatIconModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.less'
})
export class SearchComponent {
  input: string = ''
  data: any = null
  isClickingOnList: boolean = false;
  chosen_sympts : any = []

  constructor(private http: HttpClient, private dataService: DataService){}

  MakePostReq(){
    this.http.post('http://127.0.0.1:5000/api/entities', {"entity_type": "Symptom", "filter_params": {"filter1-field": "symptom_name", "filter1-action": "CONTAINS", "filter1-value": "'" + this.input.toLowerCase() + "'"}}).subscribe({
      next: (response: any) => {
        this.data = response['ans']
        console.log(this.data)
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
    this.chosen_sympts.push(name)
    this.data = null;
    this.input = ''
  }

  IsTaken(name: string){
    return this.chosen_sympts.includes(name)
  }

  RemoveItem(name: string){
    this.chosen_sympts.splice(this.chosen_sympts.indexOf(name), 1)
  }
}
