import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SprintreviewComponent } from './sprintreview.component';

describe('SprintreviewComponent', () => {
  let component: SprintreviewComponent;
  let fixture: ComponentFixture<SprintreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SprintreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SprintreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
