import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-reg',
  imports: [FormsModule, NgClass, CommonModule],
  templateUrl: './reg.component.html',
  styleUrl: './reg.component.less'
})
export class RegComponent {
  regData = {
    fullname: null,
    mail: null,
    password: null,
    confirmed_password: null
  };
  isError: boolean = false;

  constructor(private http: HttpClient) {}

  onSubmit() {

    this.http.post('/http://127.0.0.1:5000/api/register', this.regData).subscribe({
      next: response => {
        console.log('Success:', response);
        // Обработка успешного ответа
      },
      error: error => {
        console.error('Error:', error);
        // Обработка ошибки
      },
      complete: () => {
        console.log('Request complete');
        // Обработка завершения запроса
      }
    });
  }
}
