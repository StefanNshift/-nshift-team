import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentjiraComponent } from './componentjira.component';

describe('ComponentjiraComponent', () => {
  let component: ComponentjiraComponent;
  let fixture: ComponentFixture<ComponentjiraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComponentjiraComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentjiraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
