import { TestBed } from '@angular/core/testing';

import { WizardbackendService } from './wizardbackend.service';

describe('WizardbackendService', () => {
  let service: WizardbackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WizardbackendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
