import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { DataService } from './data.service'; // Убедитесь, что путь правильный
import {Chart, registerables} from "chart.js"

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'frontend';
  userData: any = null;
  userDataSub: any;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.userDataSub = this.dataService.userData$.subscribe(data => {
      this.userData = data;
      console.log(this.userData);
    });
  }

  ngOnDestroy() {
    if (this.userDataSub) {
      this.userDataSub.unsubscribe();
    }
  }
}
