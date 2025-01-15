import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZendeskFieldModuleComponent } from './zendeskfield.component';

describe('ZendeskFieldModuleComponent', () => {
  let component: ZendeskFieldModuleComponent;
  let fixture: ComponentFixture<ZendeskFieldModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ZendeskFieldModuleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZendeskFieldModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
