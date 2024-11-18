import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCarrierModuleComponent } from './newcarrier.component';

describe('NewCarrierModuleComponent', () => {
  let component: NewCarrierModuleComponent;
  let fixture: ComponentFixture<NewCarrierModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewCarrierModuleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewCarrierModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
