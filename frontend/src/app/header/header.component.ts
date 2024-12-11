import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {
  isCurtainPage = true;
  isLoggedIn = false;
  isAuthForm = false;
  isAdmin = true;
  fullname = "Прошичев Александр"

  constructor(private router: Router) {}

  ngOnInit(){
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isCurtainPage = this.router.url === '/login' || this.router.url == '/reg';
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
}
