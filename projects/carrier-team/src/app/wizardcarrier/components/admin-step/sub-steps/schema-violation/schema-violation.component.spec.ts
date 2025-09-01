import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaViolationComponent } from './schema-violation.component';

describe('SchemaViolationComponent', () => {
  let component: SchemaViolationComponent;
  let fixture: ComponentFixture<SchemaViolationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SchemaViolationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaViolationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
