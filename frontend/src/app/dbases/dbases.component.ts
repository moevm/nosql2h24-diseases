import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-dbases',
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './dbases.component.html',
  styleUrl: './dbases.component.less'
})
export class DbasesComponent {
  type: string = 'diseases';

  constructor(private http: HttpClient, private router: Router){}

  GoToDB(type: string){
    this.type = type
  }
}
