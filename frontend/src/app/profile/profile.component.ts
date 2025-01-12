import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

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

  isEditing: any = {
    sex: false,
    birthday: false,
    height: false,
    weight: false
  };

  tempUser: any = {
    sex : '',
    birthday : '',
    height : '',
    weght : ''
  }

  toggleEdit(field: string) {
    this.isEditing[field] = true;
  }

  saveEdit(field: string) {
    this.isEditing[field] = false;
    this.userData[field] = this.tempUser[field]
    console.log(this.userData)
    this.MakePostPatientUpdateReq(field);
  }

  MakePostPatientUpdateReq(field: string){
    this.http.post('http://127.0.0.1:5000/api/update_entity', {
           "entity_id": "mail",
           "entity_id_value": this.userData.mail,
           "entity_type": "Patient",
           "new_values": {
               [field]: this.userData[field]
            }
    }).subscribe({
      next: (response: any) => {
        console.log(response)
        this.dataService.setUserData(this.userData)
        
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }

  MakePostAppealReq() {
    this.http.post('http://127.0.0.1:5000/api/appeal_database', {
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
      },
      "patient_filter_params": {
        "filter1-field": "fullname",
        "filter1-action": "CONTAINS",
        "filter1-value": this.userData['fullname']
      }
    }).subscribe({
      next: (response: any) => {
        this.data = response['ans'];
        console.log(response);
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
    this.tempUser['sex'] = this.userData['sex']
    this.tempUser['birthday'] = this.userData['birthday']
    this.tempUser['height'] = this.userData['height']
    this.tempUser['weight'] = this.userData['weight']
    
    console.log(this.userData);

    if(!this.userData){
      this.router.navigate(['/login'])
    }

    this.MakePostAppealReq();
  }

  onDateChange(event: any, type: string) {
    if (type === 'from') {
      this.from = event.target.value;
      console.log('From:', this.from);
    } else if (type === 'to') {
      this.to = event.target.value;
      console.log('To:', this.to);
    }
    this.MakePostAppealReq()
  }

  GoToDBases(){
    this.router.navigate(['/dbases'])
  }

  GoToStat(){
    this.router.navigate(['/stat'])
  }

  GoToPredict(item: any){
      this.http.post('http://127.0.0.1:5000/api/predict_disease', {"appeal_date": item.appeal.appeal_date}).subscribe({
        next: (response: any) => {
          this.dataService.setPredictData(response)

          this.http.post('http://127.0.0.1:5000/api/appeal_database', {
        "filter_params": {
          "filter1-field": "appeal_date",
          "filter1-action": "<>",
          "filter1-value": "",
          "filter2-field": "appeal_date",
          "filter2-action": ">=",
          "filter2-value": "'" + item.appeal.appeal_date.replace(" ", "T") + "'",
          "filter3-field": "appeal_date",
          "filter3-action": "<=",
          "filter3-value": "'" + item.appeal.appeal_date.replace(" ", "T") + "'"
        },
        "patient_filter_params": {
          "filter1-field": "fullname",
          "filter1-action": "CONTAINS",
          "filter1-value": this.userData['fullname']
        }
      }).subscribe({
        next: (response: any) => {
          this.dataService.setAppealData(response['ans'][0]['appeal'])
          this.router.navigate(['/predict'])
        },
        error: error => {
          console.error('Error:', error);
        },
        complete: () => {
          console.log('Request complete');
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
