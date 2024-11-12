import { CommonModule } from '@angular/common';
import { ClassProvider, Injectable, NgModule } from '@angular/core';
import { SebNgWizardModule, WizardSteps, WizardTexts, WizardTranslations } from '@sebgroup/ng-wizard';
import { Observable, of } from 'rxjs';
import { SharedModule } from '../shared/shared.module';

import { NgxPaginationModule } from 'ngx-pagination';

import { AddStepsComponent } from './components/steps/getting-started/sub-steps/add-steps/add-steps.component';
import { NewCarrierModuleComponent } from './components/steps/getting-started/sub-steps/newcarrier/newcarrier.component';
import { ZendeskModuleComponent } from './components/steps/getting-started/sub-steps/zendesk-module/zendesk-module.component';

import { teamComponent } from './components/steps/carrierteam/carrierteam.component';
import { OptionsComponent } from './components/steps/options/options.component';
import { AdminModuleComponent } from './components/steps/options/sub-steps/admin/admincarrierteam.component';
import { LoginComponent } from './components/steps/options/sub-steps/login/login.component';
import { StepControlsComponent } from './components/steps/options/sub-steps/step-controls/step-controls.component';
import { WizardTutorialRoutingModule } from './wizard-tutorial-routing.module';
import { WizardTutorialComponent } from './wizard-tutorial.component';

// service for custom translations implementing wizard translations
@Injectable()
export class CustomTranslations implements WizardTranslations {
  constructor() {}
  // you need to provide translations$ observable with key value pairs for the keys you use in the wizard
  translations$: Observable<WizardTexts> = of({ wiz_header_title: 'Carrier Management' });
}

const TRANSLATIONS_PROVIDER: ClassProvider = {
  provide: WizardTranslations,
  useClass: CustomTranslations,
};

@NgModule({
  declarations: [
    WizardTutorialComponent,
    teamComponent,
    OptionsComponent,
    AddStepsComponent,
    StepControlsComponent,
    AdminModuleComponent,
    NewCarrierModuleComponent,
    ZendeskModuleComponent,
    LoginComponent,
  ],
  imports: [
    CommonModule,
    WizardTutorialRoutingModule,
    SebNgWizardModule.forRoot({ hideClose: true }, TRANSLATIONS_PROVIDER),
    SharedModule,
  ],
  providers: [WizardSteps, NgxPaginationModule],
})
export class WizardTutorialModule {}
