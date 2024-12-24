import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { config } from 'rxjs';

@Component({
  selector: 'app-predictor',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './predictor.component.html',
  styleUrl: './predictor.component.less'
})
export class PredictorComponent {
  predict : any = null;
  search: string = '';

  constructor(private router: Router, private http: HttpClient, private dataService: DataService){}

  ngOnInit() {
    this.predict = this.dataService.getPredictData();
    this.sortPredictByPercent();
  }

  sortPredictByPercent() {
    if (this.predict) {
      this.predict.sort((a: any, b: any) => b.percent - a.percent);
    }
  }

  Search() {
    console.log(this.search)
    if (this.search.trim() === '') {
      this.predict = this.dataService.getPredictData(); 
    } else {
      this.predict = this.dataService.getPredictData().filter((item: any) =>
        item.disease.disease_name.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  }

  GoToDisease(item: any){
    this.router.navigate([`/disease/${item.disease.disease_name}`])
  }
}
