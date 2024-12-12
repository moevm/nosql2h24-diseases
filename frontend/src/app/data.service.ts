import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();

  setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  getUserData() {
    return this.userDataSubject.value;
  }
}
