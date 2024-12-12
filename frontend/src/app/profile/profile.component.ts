import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.less'
})
export class ProfileComponent {
  userData : any = null;
  data: any = null;

  constructor(private router : Router, private dataService : DataService, private http : HttpClient){}

  MakePostReq(){
    this.http.post('http://127.0.0.1:5000/api/entities', {"entity_type": "Appeal", 
                    "filter_params": {"filter1-field": "appeal_date", "filter1-action": "<>", "filter1-value": "''"
                    }}).subscribe({
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

  ngOnInit(){
    this.userData = this.dataService.getUserData()
    console.log(this.userData)

    if(!this.userData){
      this.router.navigate(['/login']) 
    }

    this.MakePostReq()
  }
}
