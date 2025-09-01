import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierFieldModuleComponent } from './carrierfield.component';

describe('CarrierFieldModuleComponent', () => {
  let component: CarrierFieldModuleComponent;
  let fixture: ComponentFixture<CarrierFieldModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CarrierFieldModuleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarrierFieldModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
