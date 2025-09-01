import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JiraformComponent } from './jiraform.component';

describe('JiraformComponent', () => {
  let component: JiraformComponent;
  let fixture: ComponentFixture<JiraformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JiraformComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JiraformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
