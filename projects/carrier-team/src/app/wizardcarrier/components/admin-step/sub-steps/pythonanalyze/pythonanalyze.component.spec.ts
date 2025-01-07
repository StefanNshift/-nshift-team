import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PythonAnalyze } from './pythonanalyze.component';

describe('PythonAnalyze', () => {
  let component: PythonAnalyze;
  let fixture: ComponentFixture<PythonAnalyze>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PythonAnalyze ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PythonAnalyze);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
