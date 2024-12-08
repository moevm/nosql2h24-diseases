import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent {
  is_curtain_page = true;
  is_logged_in = false;
  is_admin = true;
  fullname = "Прошичев Александр"

  constructor(private router: Router) {}

  navigateToLogin() {
    //this.router.navigate(['/login']);
    this.is_logged_in = !this.is_logged_in;

  }
}
