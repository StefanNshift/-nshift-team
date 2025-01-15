import { CommonModule } from '@angular/common';
import { ClassProvider, Injectable, NgModule } from '@angular/core';
import { SebNgWizardModule, WizardSteps, WizardTexts, WizardTranslations } from '@sebgroup/ng-wizard';
import { Observable, of } from 'rxjs';
import { SharedModule } from '../shared/shared.module';

import { NgxPaginationModule } from 'ngx-pagination';

// Login Step
import { LoginComponent } from './components/login-step/login.component';

// Admin Steps
import { CarrierFieldModuleComponent } from './components/admin-step/sub-steps/carrierjirafield/carrierfield.component';
import { CarrierTicketComponent } from './components/admin-step/sub-steps/carriertickets/carriertickets.component';
import { ZendeskFieldModuleComponent } from './components/admin-step/sub-steps/zendeskfield/zendeskfield.component';

import { AdminStepComponent } from './components/admin-step/admin-step.component';
import { IndexComponent } from './components/admin-step/index/index.component';
import { AdminstepComponent } from './components/admin-step/sub-steps/adminstep/adminstep.component';
import { AdminModuleComponent } from './components/admin-step/sub-steps/adminteam/admincarrierteam.component';
import { PythonAnalyze } from './components/admin-step/sub-steps/pythonanalyze/pythonanalyze.component';
import { SprintreviewComponent } from './components/admin-step/sub-steps/sprintreview/sprintreview.component';
import { CarrierTeamStepComponent } from './components/carrierteam-step/carrierteam-step.component';
import { CarrierTeamComponent } from './components/carrierteam-step/carrierteam/carrierteam.component';
import { UserComponent } from './components/user-step/user/user.component';

import { WizardTutorialRoutingModule } from './wizard-routing.module';
import { WizardTutorialComponent } from './wizard.component';

// AI Steps
import { AIStepComponent } from './components/ai-step/ai-step.component';
import { TicketComponent } from './components/ai-step/sub-steps/ticket/ticket.component';

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
    CarrierTeamComponent,
    AdminModuleComponent,
    CarrierFieldModuleComponent,
    ZendeskFieldModuleComponent,
    CarrierTicketComponent,
    LoginComponent,
    PythonAnalyze,
    UserComponent,
    SprintreviewComponent,
    AdminstepComponent,
    AdminStepComponent,
    CarrierTeamStepComponent,
    IndexComponent,
    TicketComponent,
    // AI Step
    AIStepComponent,
  ],
  imports: [
    CommonModule,
    WizardTutorialRoutingModule,
    SebNgWizardModule.forRoot({ hideClose: true, markPassedAsSuccess: false }, TRANSLATIONS_PROVIDER),
    SharedModule,
  ],
  providers: [WizardSteps, NgxPaginationModule],
})
export class WizardTutorialModule {}
