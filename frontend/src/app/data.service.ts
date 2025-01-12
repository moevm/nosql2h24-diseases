import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private userDataSubject = new BehaviorSubject<any>(this.getUserDataFromLocalStorage());
  private predictDataSubject = new BehaviorSubject<any>(this.getPredictDataFromLocalStorage());
  private appealDataSubject = new BehaviorSubject<any>(this.getAppealInformationFromLocalStorage());

  userData$ = this.userDataSubject.asObservable();
  predictData$ = this.predictDataSubject.asObservable();
  appealData$ = this.appealDataSubject.asObservable();

  constructor() {
    this.userDataSubject.subscribe(data => {
      console.log('User Data:', data);
      localStorage.setItem('userData_v2', JSON.stringify(data));
    });

    this.predictDataSubject.subscribe(data => {
      console.log('Predict Data:', data);
      localStorage.setItem('predictData_v2', JSON.stringify(data));
    });

    this.appealDataSubject.subscribe(data => {
      console.log("Appeal Data: ", data)
      localStorage.setItem('appealData_v2', JSON.stringify(data));
    })

    console.log('Initial User Data:', this.getUserData());
    console.log('Initial Predict Data:', this.getPredictData());
    console.log("Initial Appeal Data: ", this.getAppealData());
  }

  setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  setPredictData(data: any) {
    this.predictDataSubject.next(data);
  }

  setAppealData(data: any){
    this.appealDataSubject.next(data);
  }

  getUserData() {
    console.log('Getting User Data:', this.userDataSubject.value);
    return this.userDataSubject.value;
  }

  getPredictData() {
    console.log('Getting Predict Data:', this.predictDataSubject.value);
    return this.predictDataSubject.value;
  }

  getAppealData(){
    console.log("Getting Appeal Data: ", this.appealDataSubject.value);
    return this.appealDataSubject.value;
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

  private getAppealInformationFromLocalStorage(): any{
    const appealData = localStorage.getItem('appealData_v2');
    console.log("Appeal Data From LocalStorage:", appealData);
    return appealData ? JSON.parse(appealData) : null;
  }

  isLoggedIn() {
    return this.userData$;
  }
}
