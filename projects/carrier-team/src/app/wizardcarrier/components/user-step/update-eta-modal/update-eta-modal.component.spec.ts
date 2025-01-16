import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateEtaModalComponent } from './update-eta-modal.component';

describe('UpdateEtaModalComponent', () => {
  let component: UpdateEtaModalComponent;
  let fixture: ComponentFixture<UpdateEtaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateEtaModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateEtaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
