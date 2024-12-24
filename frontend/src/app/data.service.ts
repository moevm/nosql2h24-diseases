import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private userDataSubject = new BehaviorSubject<any>(this.getUserDataFromLocalStorage());
  private predictDataSubject = new BehaviorSubject<any>(this.getPredictDataFromLocalStorage());

  userData$ = this.userDataSubject.asObservable();
  predictData$ = this.predictDataSubject.asObservable();

  constructor() {
    this.userDataSubject.subscribe(data => {
      console.log('User Data:', data);
      localStorage.setItem('userData_v2', JSON.stringify(data));
    });

    this.predictDataSubject.subscribe(data => {
      console.log('Predict Data:', data);
      localStorage.setItem('predictData_v2', JSON.stringify(data));
    });

    console.log('Initial User Data:', this.getUserData());
    console.log('Initial Predict Data:', this.getPredictData());
  }

  setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  setPredictData(data: any) {
    this.predictDataSubject.next(data);
  }

  getUserData() {
    console.log('Getting User Data:', this.userDataSubject.value);
    return this.userDataSubject.value;
  }

  getPredictData() {
    console.log('Getting Predict Data:', this.predictDataSubject.value);
    return this.predictDataSubject.value;
  }

  private getUserDataFromLocalStorage(): any {
    const userData = localStorage.getItem('userData_v2');
    console.log('User Data from LocalStorage:', userData);
    return userData ? JSON.parse(userData) : null;
  }

  private getPredictDataFromLocalStorage(): any {
    const predictData = localStorage.getItem('predictData_v2');
    console.log('Predict Data from LocalStorage:', predictData);
    return predictData ? JSON.parse(predictData) : null;
  }

  isLoggedIn() {
    return this.userData$;
  }
}
