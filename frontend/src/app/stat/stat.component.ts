import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-stat',
  imports: [],
  templateUrl: './stat.component.html',
  styleUrl: './stat.component.less'
})
export class StatComponent {
  userData : any = null;

  constructor(private dataService: DataService, private router : Router, private http: HttpClient){}

  ngOnInit() {
    this.userData = this.dataService.getUserData();
    console.log(this.userData);

    if (!this.userData) {
      this.router.navigate(['/login']);
    }

    this.MakePostReq();
  }

  MakePostReq(){
    
  }
}
