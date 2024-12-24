import { HttpClient } from '@angular/common/http';
import { Component, Input, SimpleChange, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { DataService } from '../data.service';

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.less'
})
export class ChartComponent implements OnChanges {
  @Input() type: string = 'sex'
  @Input() symptom : string = ''
  @Input() from : string = '';
  @Input() to : string = '';
  userData: any;
  labels: any;
  data: any;


  config: any;

  chart: any;
  
  constructor(private http: HttpClient, private router: Router, private dataService: DataService){}

  ngOnInit(){
    this.userData = this.dataService.getUserData();
    console.log(this.userData);

    if(!this.userData){
      this.router.navigate(['/login'])
    }
    this.MakePostReq();

    this.chart = new Chart('AppealPlot', this.config);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.MakePostReq();
  }

  MakePostReq(){
    if(!this.symptom){
      return;
    }

    this.http.post('http://127.0.0.1:5000/api/appeal_database', {
      "filter_params": {
        "filter1-field": "appeal_date",
        "filter1-action": "<>",
        "filter1-value": "",
        "filter2-field": "appeal_date",
        "filter2-action": ">=",
        "filter2-value": "'" + (this.from ? this.from.split(' ')[0] : '1900-01-01') + "'",
        "filter3-field": "appeal_date",
        "filter3-action": "<=",
        "filter3-value": "'" + (this.to ? this.to.split(' ')[0] : '2200-01-01') + "'"
      },
      "patient_filter_params": {}
    }).subscribe({
      next: (response: any) => {
        console.log(response);
        this.ProcessData(response['ans']);

        if (this.chart) {
          this.chart.destroy();
        }

        this.chart = new Chart('AppealPlot', this.config);

        console.log(this.config)
      },
      error: error => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Request complete');
      }
    });
  }
  
  ProcessData(response: any) {
    if (this.type == 'age') {
      this.labels = ["0-10 лет", "11-20 лет", "21-30 лет", "31-40 лет", "41-50 лет", "51-60 лет", "61-70 лет", "71-80 лет", "81-90 лет", "91-100 лет"];
      this.data = {
        labels: this.labels,
        datasets: [{
          label: this.symptom,
          data: this.AnalyzeData(response),
          backgroundColor: [
            '#21D9D9'
          ],
          borderColor: [
            '#1EB9B9'
          ],
          borderWidth: 1
        }]
      };
  
      this.config = {
        type: 'bar',
        data: this.data,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
      };
    } else if (this.type == 'sex') {
      this.labels = ["Мужчины", "Женщины"];
      this.data = {
        labels: this.labels,
        datasets: [{
          label: this.symptom,
          data: this.AnalyzeData(response),
          backgroundColor: [
            '#21D9D9',
            '#f1f1f1'
          ],
          hoverOffset: 4
        }]
      };
  
      this.config = {
        type: 'pie',
        data: this.data,
      };
    } else if (this.type == 'height') {
      this.labels = ["ниже 129,9 см", " 130–149,9 см", "150–159,9 см", "160–163,9 см", "164–166,9 см", "167–169,9 см", "170–179,9 см", "180–199,9 см", "выше 200 см"];
      this.data = {
        labels: this.labels,
        datasets: [{
          label: this.symptom,
          data: this.AnalyzeData(response),
          backgroundColor: [
            '#21D9D9'
          ],
          borderColor: [
            '#1EB9B9'
          ],
          borderWidth: 1
        }]
      };
  
      this.config = {
        type: 'bar',
        data: this.data,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
      };
    } else {
      this.labels = ["Менее 40 кг", "40-50 кг", "51-60 кг", "61-70 кг", "71-80 кг", "81-90 кг", "91-100 кг", "101-110 кг", "111-120 кг", "Более 120 кг"];
      this.data = {
        labels: this.labels,
        datasets: [{
          label: this.symptom,
          data: this.AnalyzeData(response),
          backgroundColor: [
            '#21D9D9'
          ],
          borderColor: [
            '#1EB9B9'
          ],
          borderWidth: 1
        }]
      };
  
      this.config = {
        type: 'bar',
        data: this.data,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
      };
    }
    this.config.data = this.data;
  }
  
  AnalyzeData(response: any) {
    response = this.SymptomFilter(response);
    console.log(response)
    let arr: any;
    if (this.type == 'age') {
        arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // Текущая дата
        const currentDate = new Date();

        response.forEach((item: any) => {
            const birthday = new Date(item.patient.birthday);
            let age = currentDate.getFullYear() - birthday.getFullYear();

            // Корректировка возраста, если день рождения еще не наступил в этом году
            if (currentDate.getMonth() < birthday.getMonth() ||
                (currentDate.getMonth() === birthday.getMonth() && currentDate.getDate() < birthday.getDate())) {
                age--;
            }

            // Определение диапазона возраста
            const ageRangeIndex = Math.floor((age - 1) / 10);

            // Увеличение соответствующего элемента в массиве arr
            if (ageRangeIndex >= 0 && ageRangeIndex < 10) {
                arr[ageRangeIndex]++;
            }
        });
    } else if (this.type == 'sex') {
        arr = [0, 0];

        response.forEach((item: any) => {
            if (item.patient.sex == 'male') {
                arr[0]++;
            } else {
                arr[1]++;
            }
        });
    } else if (this.type == 'height') {
        arr = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        response.forEach((item: any) => {
            if (Number(item.patient.height) < 130.0) {
                arr[0]++;
            } else if (Number(item.patient.height) < 150.0) {
                arr[1]++;
            } else if (Number(item.patient.height) < 160.0) {
                arr[2]++;
            } else if (Number(item.patient.height) < 164.0) {
                arr[3]++;
            } else if (Number(item.patient.height) < 167.0) {
                arr[4]++;
            } else if (Number(item.patient.height) < 170.0) {
                arr[5]++;
            } else if (Number(item.patient.height) < 180.0) {
                arr[6]++;
            } else if (Number(item.patient.height) < 200.0) {
                arr[7]++;
            } else {
                arr[8]++;
            }
        });
    } else if (this.type == 'weight') {
        arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        response.forEach((item: any) => {
            const weight = Number(item.patient.weight);
            if (weight < 40) {
                arr[0]++;
            } else if (weight < 50) {
                arr[1]++;
            } else if (weight < 60) {
                arr[2]++;
            } else if (weight < 70) {
                arr[3]++;
            } else if (weight < 80) {
                arr[4]++;
            } else if (weight < 90) {
                arr[5]++;
            } else if (weight < 100) {
                arr[6]++;
            } else if (weight < 110) {
                arr[7]++;
            } else if (weight < 120) {
                arr[8]++;
            } else {
                arr[9]++;
            }
        });
    }
    return arr;
}



SymptomFilter(response: any) {
  if (!this.symptom) {
    return response;
  }

  return response.filter((item: any) => {
    // Проверяем, есть ли симптом с названием this.symptom в массиве related
    return item.related.some((symptom: any) => symptom.symptom_name === this.symptom);
  });
}

}
