import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-predictor',
  imports: [],
  templateUrl: './predictor.component.html',
  styleUrl: './predictor.component.less'
})
export class PredictorComponent {
  predict : any = null;

  constructor(private router: Router, private http: HttpClient, private dataService: DataService){}

  ngOnInit(){
    this.predict = this.dataService.getPredictData()
    console.log("was here")
    console.log(this.predict)

  }
}
