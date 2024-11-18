import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZendeskModuleComponent } from './zendesk-module.component';

describe('ZendeskModuleComponent', () => {
  let component: ZendeskModuleComponent;
  let fixture: ComponentFixture<ZendeskModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ZendeskModuleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZendeskModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
