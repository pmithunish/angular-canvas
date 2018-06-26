/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CirculatingPixelsComponent } from './circulating-pixels.component';

describe('CirculatingPixelsComponent', () => {
  let component: CirculatingPixelsComponent;
  let fixture: ComponentFixture<CirculatingPixelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CirculatingPixelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CirculatingPixelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
