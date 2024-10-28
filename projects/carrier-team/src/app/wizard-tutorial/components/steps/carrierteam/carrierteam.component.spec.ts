import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { teamComponent } from './carrierteam.component';

describe('teamComponent', () => {
  let component: teamComponent;
  let fixture: ComponentFixture<teamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [teamComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(teamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
