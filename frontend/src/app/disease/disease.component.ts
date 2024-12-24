import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-disease',
  templateUrl: './disease.component.html',
  styleUrls: ['./disease.component.less'],
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class DiseaseComponent implements OnInit {
  disease_name: string = '';
  disease_description: string = '';
  disease_recommendations: any = [];
  analysis: any = [];

  constructor(private route: ActivatedRoute, private http: HttpClient, private router : Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.disease_name = params.get('disease_name') ?? "";

      if(this.disease_name){
        this.MakePostReqSymptoms();
      }
    });
  }

  MakePostReqSymptoms(){
    let data = {
      entity_type: "Disease",
      filter_params: {
        "filter1-field": "disease_name",
        "filter1-action": "CONTAINS",
        "filter1-value": this.disease_name
      },
      relation_type: "cause"
    }

    this.http.post('http://127.0.0.1:5000/api/entities', data).subscribe({
      next: (response: any) => {
        console.log(response['ans']);
        this.disease_description = response['ans'][0]['disease_description']
        this.disease_recommendations = response['ans'][0]['disease_recommendations']
          .split(';')
          .map((rec: string) => rec.trim())
          .filter((rec: string) => rec !== "");
        this.MakePostReqAnalysis(response['ans'][1])
        
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }

  MakePostReqAnalysis(symptoms: any){
    for(let i = 0; i < symptoms.length; i++){
      let data = {
        entity_type: "Symptom",
        filter_params: {
          "filter1-field": "symptom_name",
          "filter1-action": "CONTAINS",
          "filter1-value": symptoms[i]['symptom_name']
        },
        relation_type: "confirm"
      }
  
      this.http.post('http://127.0.0.1:5000/api/entities', data).subscribe({
        next: (response: any) => {
          this.analysis = [...this.analysis, ...response['ans'][1]];
          console.log(this.analysis)
          
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

  GoToDisease(){
    this.router.navigate(['/predict'])
  }
}
