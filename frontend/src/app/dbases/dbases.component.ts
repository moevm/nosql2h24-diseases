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
  data: any = null;
  items: any = [];
  idx: number = 0;

  disease_filter: any = {
    name: '',
    description: '',
    recommendation: '', 
    type: '',
    cource: null
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
    this.MakePostReq(this.type)
  }


  MakePostReq(type: string){
    if(type == 'diseases'){
      this.data = {"entity_type": "Disease", "filter_params": {}}
      this.idx = 1

      if(this.disease_filter['name']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_name'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.disease_filter['name'] + "'"
        this.idx += 1
      }

      if(this.disease_filter['description']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_description'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.disease_filter['description'] + "'"
        this.idx += 1
      }

      if(this.disease_filter['recommendation']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_recommendations'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + this.disease_filter['recommendation'] + "'"
        this.idx += 1
      }

      if(this.disease_filter['cource']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_course'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.disease_filter['cource'] == -1 ? "Острое течение" : "Хроническое течение")  + "'"
        this.idx += 1
      }
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

      if(this.patient_filter['to_birthday']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'birthday'
        this.data['filter_params'][`filter${this.idx}-action`] = '<='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.patient_filter['to_birthday'] ? this.patient_filter['to_birthday'].split(' ')[0] : '2200-01-01') + "T23:59:59" + "'"
        this.idx += 1
      }

      if(this.patient_filter['from_reg_datetime']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'registration_date'
        this.data['filter_params'][`filter${this.idx}-action`] = '>='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.patient_filter['from_reg_datetime'] ? this.patient_filter['from_reg_datetime'].split(' ')[0] : '1900-01-01T00:00:00') + "'"
        this.idx += 1
      }

      if(this.patient_filter['to_reg_datetime']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'registration_date'
        this.data['filter_params'][`filter${this.idx}-action`] = '<='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.patient_filter['to_reg_datetime'] ? this.patient_filter['to_reg_datetime'].split(' ')[0] : '2200-01-01T23:59:59') + "'"
        this.idx += 1
      }

      /*

      this.data['filter_params'][`filter${this.idx}-field`] = 'height'
      this.data['filter_params'][`filter${this.idx}-action`] = '>='
      this.data['filter_params'][`filter${this.idx}-value`] = `${this.patient_filter['from_height']}`
      this.idx += 1

      this.data['filter_params'][`filter${this.idx}-field`] = 'height'
      this.data['filter_params'][`filter${this.idx}-action`] = '<='
      this.data['filter_params'][`filter${this.idx}-value`] = `${this.patient_filter['to_height']}`
      this.idx += 1

      this.data['filter_params'][`filter${this.idx}-field`] = 'weight'
      this.data['filter_params'][`filter${this.idx}-action`] = '>='
      this.data['filter_params'][`filter${this.idx}-value`] = `${this.patient_filter['from_weight']}`
      this.idx += 1

      this.data['filter_params'][`filter${this.idx}-field`] = 'weight'
      this.data['filter_params'][`filter${this.idx}-action`] = '>='
      this.data['filter_params'][`filter${this.idx}-value`] = `${this.patient_filter['to_weight']}`
      this.idx += 1

      */
    }
    else if(type == 'sympts'){
      console.log(this.sympts_filter)
    } else{
      console.log(this.appeal_filter)
    }

    this.http.post('http://127.0.0.1:5000/api/entities', this.data).subscribe({
      next: (response: any) => {
        this.items = response['ans']
        console.log(response['ans'])
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
    this.MakePostReq(this.type)
    console.log(this.items)
  }
}
