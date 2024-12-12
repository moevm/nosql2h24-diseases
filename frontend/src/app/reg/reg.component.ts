import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from "../data.service"

@Component({
  selector: 'app-reg',
  imports: [FormsModule, NgClass, CommonModule],
  templateUrl: './reg.component.html',
  styleUrl: './reg.component.less'
})
export class RegComponent {
  regData = {
    fullname : null,
    password : null,
    confirmed_password : null,
    mail : null, 
    sex : null,
    birthday : null,
    height : null,
    weight : null,
    admin : false
  };
  error: string = ''

  constructor(private http: HttpClient, private router: Router, private dataService: DataService) {}

  GoToLogin(){
    this.router.navigate(['/login']);
  }

  GoToSearch(){
    this.router.navigate(['/search'])
  }

  OnSubmit() {

    this.http.post('http://127.0.0.1:5000/api/register', this.regData).subscribe({
      next: (response: any) => {
        this.error = response['msg']

        if(!this.error){
          this.dataService.setUserData(this.regData);
          this.GoToSearch();
        }
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }
}
