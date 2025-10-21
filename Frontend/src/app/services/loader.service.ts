import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private loadingSubject = new BehaviorSubject<{show: boolean, message: string}>({show: false, message: ''});
  loading$ = this.loadingSubject.asObservable();

  show(message = 'Loading, please wait...') {
    this.loadingSubject.next({show: true, message});
  }

  hide() {
    this.loadingSubject.next({show: false, message: ''});
  }
} 