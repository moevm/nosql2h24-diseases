import { CommonModule, NgClass } from '@angular/common';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { Router } from '@angular/router';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';
import { FileDownloadService } from '../file-download.service';
import {saveAs} from 'file-saver'

@Component({
  selector: 'app-dbases',
  imports: [CommonModule, FormsModule, NgClass, MatIconModule, MatSliderModule],
  templateUrl: './dbases.component.html',
  styleUrl: './dbases.component.less'
})
export class DbasesComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  type: string = 'diseases';
  data: any = null;
  items: any = [];
  idx: number = 0;
  req: any;

  page: number = 1;
  currect_enters: any = [];

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

  constructor(private http: HttpClient, private router: Router, private dialog: MatDialog, private fileDownloadService: FileDownloadService){}

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddDialogComponent, {
      width: '600px',
      data: { type: this.type, fields: {} }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.AddNewObject(result)
    });
  }

  GoToDB(type: string){
    this.type = type
    this.currect_enters = []
    this.items = []
    this.page = 1
    this.MakePostReq(this.type)
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  AddNewObject(data: any){
    if(this.type == 'diseases'){
        this.req = {
          "entity_type": "Disease",
          "parametrs": {
              "disease_name": data.disease_name ? data.disease_name : "",
              "disease_description": data.disease_description ? data.disease_description : "",
              "disease_recommendations": data.disease_recommendations ? data.disease_recommendations : "",
              "disease_type": data.disease_type ? data.disease_type : "",
              "disease_course": data.disease_course == 0 ? "" : (data.disease_course == -1 ? "Острое течение" : "Хроническое течение")
          }
        }
    }
    else if(this.type == 'appeals'){
      this.req = {
        "entity_type": "Appeal",
        "parametrs": {
            "appeal_date": data.appeal_date ? data.appeal_date.replace('T', ' ') : "",
            "appeal_complaints": data.appeal_complaints ? data.appeal_complaints : ""
        }
      }
    }
    else if(this.type == 'sympts'){
      this.req = {
        "entity_type": "Symptom",
        "parametrs": {
            "symptom_name": data.symptom_name ? data.symptom_name : "",
            "symptom_description": data.symptom_description ? data.symptom_description : "" 
        }
      }
    }
    else{
      this.req = {
        "entity_type": "Patient",
        "parametrs": {
            "fullname": data.fullname ? data.fullname : "",
            "mail": data.mail ? data.mail : "",
            "password": data.password ? data.password : "",
            "sex": data.sex ? data.sex : "",
            "birthday": data.birthday ? data.birthday : "",
            "last_update": this.formatDate(new Date()),
            "registration_date": this.formatDate(new Date()),
            "height": data.height ? data.height : "",
            "weight": data.weight ? data.weight : "",
            "admin": data.admin ? "TRUE" : "FALSE"
        }
      }
    }


    this.http.post('http://127.0.0.1:5000/api/create_entity', this.req).subscribe({
      next: (response: any) => {
        console.log(response)

      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('here')
          this.MakePostReq(this.type)
      }
    });
  }

  MakePostReq(type: string){
    if(type == 'diseases'){
      this.data = {"entity_type": "Disease", "filter_params": {}}
      this.idx = 1

      if(this.disease_filter['name']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_name'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.disease_filter['name']
        this.idx += 1
      }

      if(this.disease_filter['description']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_description'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.disease_filter['description']
        this.idx += 1
      }

      if(this.disease_filter['recommendation']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_recommendations'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.disease_filter['recommendation']
        this.idx += 1
      }

      if(this.disease_filter['type']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_type'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.disease_filter['type']
        this.idx += 1
      }

      if(this.disease_filter['cource']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'disease_course'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = (this.disease_filter['cource'] == -1 ? "Острое течение" : "Хроническое течение")
        this.idx += 1
      }
    }
    else if(type == 'patients'){
      this.data = {"entity_type": "Patient", "filter_params": {}}
      this.idx = 1

      if(this.patient_filter['name']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'fullname'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.patient_filter['name']
        this.idx += 1
      }
      
      if(this.patient_filter['mail']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'mail'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.patient_filter['mail']
        this.idx += 1
      }

      if(this.patient_filter['sex']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'sex'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.patient_filter['sex']
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
      this.data['filter_params'][`filter${this.idx}-action`] = '<='
      this.data['filter_params'][`filter${this.idx}-value`] = `${this.patient_filter['to_weight']}`
      this.idx += 1

    }
    else if(type == 'sympts'){
      this.data = {"entity_type": "Symptom", "filter_params": {}}
      this.idx = 1

      if(this.sympts_filter['name']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'symptom_name'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.sympts_filter['name']
        this.idx += 1
      }
      
      if(this.sympts_filter['description']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'symptom_description'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.sympts_filter['description']
        this.idx += 1
      }

    } else{
      this.data = {"entity_type": "Appeal", "filter_params": {}}
      this.idx = 1

      if(this.appeal_filter['from_appeal_datetime']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'appeal_date'
        this.data['filter_params'][`filter${this.idx}-action`] = '>='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.appeal_filter['from_appeal_datetime'] ? this.appeal_filter['from_appeal_datetime'].split(' ')[0] : '1900-01-01') + "T00:00:00" + "'"
        this.idx += 1
      }

      if(this.appeal_filter['to_appeal_datetime']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'appeal_date'
        this.data['filter_params'][`filter${this.idx}-action`] = '<='
        this.data['filter_params'][`filter${this.idx}-value`] = "'" + (this.appeal_filter['to_appeal_datetime'] ? this.appeal_filter['to_appeal_datetime'].split(' ')[0] : '2200-01-01') + "T23:59:59" + "'"
        this.idx += 1
      }

      if(this.appeal_filter['complaints']){
        this.data['filter_params'][`filter${this.idx}-field`] = 'appeal_complaints'
        this.data['filter_params'][`filter${this.idx}-action`] = 'CONTAINS'
        this.data['filter_params'][`filter${this.idx}-value`] = this.appeal_filter['complaints']
        this.idx += 1
      }
    }

    this.http.post('http://127.0.0.1:5000/api/entities', this.data).subscribe({
      next: (response: any) => {
        this.items = response['ans']
        this.currect_enters = this.items.slice(0, 10)
        this.page = Math.min(1, this.totalPages)
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

  get totalPages(): number {
    return Math.ceil(this.items.length / 10);
  }

  FirstPage(){
    this.page = 1
    this.currect_enters = this.items.slice((this.page - 1) * 10, this.page * 10)
  }

  PreviousPage(){
    this.page = Math.max(1, this.page - 1)
    this.currect_enters = this.items.slice((this.page - 1) * 10, this.page * 10)
  }

  NextPage(){
    this.page = Math.min(this.totalPages, this.page + 1)
    this.currect_enters = this.items.slice((this.page - 1) * 10, this.page * 10)
  }

  LastPage(){
    this.page = this.totalPages
    this.currect_enters = this.items.slice((this.page - 1) * 10, this.page * 10)
  }

  ngOnInit(){
    this.MakePostReq(this.type)
    console.log(this.items)
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    console.log("was here")
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      this.http.post('http://127.0.0.1:5000/api/import_dump', formData).subscribe(
        response => {
          console.log('File uploaded successfully', response);
          this.MakePostReq(this.type);
        },
        error => {
          console.error('Error uploading file', error);
        }
      );
    }
  }

  downloadFile() {
    const url = 'http://127.0.0.1:5000/api/export_dump'; // Замените на URL вашего файла
    this.fileDownloadService.downloadFile(url).subscribe(
      (response: HttpResponse<Blob>) => {
        console.log(response)
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '');
        saveAs(response.body!, filename || 'athome_database');
      },
      error => {
        console.error('Error downloading the file', error);
      }
    );
  }
}
