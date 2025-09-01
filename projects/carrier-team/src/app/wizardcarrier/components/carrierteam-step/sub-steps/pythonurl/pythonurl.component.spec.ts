import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PythonURL } from './pythonurl.component';

describe('PythonURL', () => {
  let component: PythonURL;
  let fixture: ComponentFixture<PythonURL>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PythonURL],
    }).compileComponents();

    fixture = TestBed.createComponent(PythonURL);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
