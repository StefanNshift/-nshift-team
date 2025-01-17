import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierTicketComponent } from './carriertickets.component';

describe('CarrierTicketComponent', () => {
  let component: CarrierTicketComponent;
  let fixture: ComponentFixture<CarrierTicketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CarrierTicketComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarrierTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
