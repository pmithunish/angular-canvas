import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';

import { ScrollService } from './services/scroll.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private scrollService: ScrollService) {}
  @ViewChild('content') content: ElementRef;
  onScrollHandler() {
    const scrollY = this.content.nativeElement.scrollTop;
    this.scrollService.setScrollY(scrollY);
  }
}
