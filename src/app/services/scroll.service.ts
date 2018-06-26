import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ScrollService {
  scrollY = new BehaviorSubject(0);

  constructor() {}

  setScrollY(val: number) {
    this.scrollY.next(val);
  }
}
