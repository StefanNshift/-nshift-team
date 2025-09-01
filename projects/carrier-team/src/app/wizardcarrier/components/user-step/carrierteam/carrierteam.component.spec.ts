import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrierTeamComponent } from './carrierteam.component';

describe('CarrierTeamComponent', () => {
  let component: CarrierTeamComponent;
  let fixture: ComponentFixture<CarrierTeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CarrierTeamComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarrierTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
