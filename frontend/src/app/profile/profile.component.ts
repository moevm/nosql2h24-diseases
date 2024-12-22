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
  userData: any = null;
  data: any = null;
  from: string = '';
  to: string = '';

  constructor(private router: Router, private dataService: DataService, private http: HttpClient) {}

  MakePostReq() {
    this.http.post('http://127.0.0.1:5000/api/entities', {
      "entity_type": "Appeal",
      "filter_params": {
        "filter1-field": "appeal_date",
        "filter1-action": "<>",
        "filter1-value": "",
        "filter2-field": "appeal_date",
        "filter2-action": ">=",
        "filter2-value": "'" + (this.from ? this.from.split(' ')[0] : '1900-01-01') + "T23:59:59" + "'",
        "filter3-field": "appeal_date",
        "filter3-action": "<=",
        "filter3-value": "'" + (this.to ? this.to.split(' ')[0] : '2200-01-01') + "T23:59:59" + "'"
      }
    }).subscribe({
      next: (response: any) => {
        this.data = response['ans'];
        console.log(response['req']);
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }

  ngOnInit() {
    this.userData = this.dataService.getUserData();
    console.log(this.userData);

    if (!this.userData) {
      this.router.navigate(['/login']);
    }

    this.MakePostReq();
  }

  onDateChange(event: any, type: string) {
    if (type === 'from') {
      this.from = event.target.value;
      console.log('From:', this.from);
    } else if (type === 'to') {
      this.to = event.target.value;
      console.log('To:', this.to);
    }
    this.MakePostReq()
  }

  GoToDBases(){
    this.router.navigate(['/dbases'])
  }

  GoToStat(){
    this.router.navigate(['/stat'])
  }
}
