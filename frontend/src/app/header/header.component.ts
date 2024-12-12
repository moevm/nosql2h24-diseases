import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../data.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {
  @Input() userData : any;

  isCurtainPage = true;
  isLoggedIn = false;
  isAuthForm = false;
  isAdmin = true;
  fullname = "Прошичев Александр"

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit(){
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isCurtainPage = this.router.url != '/search' && this.router.url != '/home';
        this.isAuthForm = this.router.url === '/login' || this.router.url === '/reg';
      }
    });
  }

  GoToSearch(){
    this.router.navigate(['/search']);
  }

  GoToLogin() {
    this.router.navigate(['/login']);
  }

  LogOut(){
    this.dataService.setUserData(null)
    this.router.navigate(['/login'])
  }

  GoToProfile() {
    this.router.navigate(['/profile']);
  }
}
