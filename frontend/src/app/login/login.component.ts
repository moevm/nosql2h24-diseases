import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgClass, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isError: boolean = false;

  constructor(private http: HttpClient) {}

  onSubmit() {
    console.log('Email:', this.email);
    console.log('Password:', this.password);

    if (!this.email || !this.password) {
      this.isError = true;
      return;
    } else {
      this.isError = false;
    }

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.http.post('/http://127.0.0.1:5000/login', loginData).subscribe({
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
