import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private userDataSubject = new BehaviorSubject<any>(this.getUserDataFromLocalStorage());
  userData$ = this.userDataSubject.asObservable();

  constructor() {
    this.userDataSubject.subscribe(data => {
      localStorage.setItem('userData', JSON.stringify(data));
    });
  }

  setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  getUserData() {
    return this.userDataSubject.value;
  }

  private getUserDataFromLocalStorage(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn() {
    return this.userData$;
  }
}
