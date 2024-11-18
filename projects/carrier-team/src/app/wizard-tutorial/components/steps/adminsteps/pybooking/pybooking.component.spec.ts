import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PybookingComponent } from './pybooking.component';

describe('PybookingComponent', () => {
  let component: PybookingComponent;
  let fixture: ComponentFixture<PybookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PybookingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PybookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
