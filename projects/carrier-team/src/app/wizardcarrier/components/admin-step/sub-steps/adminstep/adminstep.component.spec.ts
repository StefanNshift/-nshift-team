import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminstepComponent } from './adminstep.component';

describe('AdminstepComponent', () => {
  let component: AdminstepComponent;
  let fixture: ComponentFixture<AdminstepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminstepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminstepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
