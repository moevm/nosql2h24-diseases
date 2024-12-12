import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-dbases',
  imports: [CommonModule, FormsModule, NgClass, MatIconModule, MatSliderModule],
  templateUrl: './dbases.component.html',
  styleUrl: './dbases.component.less'
})
export class DbasesComponent {
  type: string = 'diseases';
  selectedOption: string | null = null;
  data: any = null;
  idx: number = 0;

  disease_filter: any = {
    name: '',
    description: '',
    recommendation: '', 
    type: null,
    source: ''
  }

  appeal_filter: any = {
    from_appeal_datetime: '',
    to_appeal_datetime: '',
    complaints: ''
  }

  patient_filter: any = {
    name: '',
    mail: '',
    sex: '',
    from_birthday: '',
    to_birthday: '',
    from_reg_datetime: '',
    to_reg_datetime: '',
    from_height: 0,
    to_height: 300,
    from_weight: 0,
    to_weight: 200
  }

  sympts_filter: any = {
    name: '',
    description: ''
  }

  constructor(private http: HttpClient, private router: Router){}

  GoToDB(type: string){
    this.type = type
  }
  
  onRadioClick(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked && this.selectedOption === target.value) {
      this.selectedOption = null;
    }
  }

  MakePostReq(type: string){
    console.log("was there")
    if(type == 'diseases'){
      console.log(this.disease_filter)
    }
    else if(type == 'patients'){
      this.data = {"entity_type": "Patient", "filter_params": {}}
      this.idx = 1

      if(this.patient_filter['name']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'fullname'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.patient_filter['name'] + "'"
        this.idx += 1
      }
      
      if(this.patient_filter['mail']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'mail'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.patient_filter['mail'] + "'"
        this.idx += 1
      }

      if(this.patient_filter['sex']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'sex'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.patient_filter['sex'] + "'"
        this.idx += 1
      }

      if(this.patient_filter['from_birthday']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'birthday'
        this.data['filter_params'][`filter${this.idx}-action`] = '>='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.patient_filter['from_birthday'] ? this.patient_filter['from_birthday'].split(' ')[0] : '1900-01-01') + "T00:00:00" + "'"
        this.idx += 1
      }

      this.http.post('http://127.0.0.1:5000/api/entities', this.data).subscribe({
        next: (response: any) => {
          this.data = response['ans']
          console.log(response['req'])
        },
        error: error => {
          console.error('Error:', error);
        },
        complete: () => {
          console.log('Request complete');
        }
      });
    }
    else if(type == 'sympts'){
      console.log(this.sympts_filter)
    } else{
      console.log(this.appeal_filter)
    }
  }
}
