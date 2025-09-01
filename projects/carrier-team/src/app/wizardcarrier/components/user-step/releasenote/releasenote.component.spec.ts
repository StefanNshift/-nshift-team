import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleasenoteComponent } from './releasenote.component';

describe('ReleasenoteComponent', () => {
  let component: ReleasenoteComponent;
  let fixture: ComponentFixture<ReleasenoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReleasenoteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleasenoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
