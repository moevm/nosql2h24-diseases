import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgClass, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent {
  loginData = {
    mail: null,
    password: null
  };
  isError: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  GoToReg(){
    this.router.navigate(['/reg']);
  }

  OnSubmit() {

    this.http.post('http://127.0.0.1:5000/api/login', this.loginData).subscribe({
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
