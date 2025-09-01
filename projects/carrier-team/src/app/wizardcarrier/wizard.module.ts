import { CommonModule } from '@angular/common';
import { ClassProvider, Injectable, NgModule } from '@angular/core';
import { Observable, of } from 'rxjs';

// Third-party modules
import { SebNgWizardModule, WizardSteps, WizardTexts, WizardTranslations } from '@sebgroup/ng-wizard';
import { NgxPaginationModule } from 'ngx-pagination';

// App modules
import { SharedModule } from '../shared/shared.module';
import { WizardTutorialRoutingModule } from './wizard-routing.module';

// Main components
import { WizardTutorialComponent } from './wizard.component';

// Step components grouped by functionality
// Login Step
import { LoginComponent } from './components/login-step/login.component';

// Admin Steps
import { AdminStepComponent } from './components/admin-step/admin-step.component';
import { IndexComponent } from './components/admin-step/index/index.component';
import { AdminstepComponent } from './components/admin-step/sub-steps/adminstep/adminstep.component';
import { AdminModuleComponent } from './components/admin-step/sub-steps/adminteam/admincarrierteam.component';
import { CarrierTicketComponent } from './components/admin-step/sub-steps/carriertickets/carriertickets.component';
import { ZendeskFieldModuleComponent } from './components/admin-step/sub-steps/zendeskfield/zendeskfield.component';
import { SprintreviewComponent } from './components/admin-step/sub-steps/sprintreview/sprintreview.component';
import { PythonAnalyze } from './components/admin-step/sub-steps/pythonanalyze/pythonanalyze.component';
import { SchemaViolationComponent } from './components/admin-step/sub-steps/schema-violation/schema-violation.component';

// Carrier Team Steps
import { CarrierTeamStepComponent } from './components/carrierteam-step/carrierteam-step.component';
import { CarrierFieldModuleComponent } from './components/carrierteam-step/sub-steps/carrierjirafield/carrierfield.component';
import { AllTicketComponent } from './components/carrierteam-step/sub-steps/carriertickets/carriertickets.component';
import { ComponentjiraComponent } from './components/carrierteam-step/sub-steps/componentjira/componentjira.component';
import { PythonURL } from './components/carrierteam-step/sub-steps/pythonurl/pythonurl.component';
import { UserComponent } from './components/carrierteam-step/sub-steps/userticket/userticket.component';
import { JiraformComponent } from './components/carrierteam-step/sub-steps/jiraform/jiraform.component';

// User Steps
import { CarrierTeamComponent } from './components/user-step/carrierteam/carrierteam.component';
import { ReleasenoteComponent } from './components/user-step/releasenote/releasenote.component';

// AI Steps
import { AIStepComponent } from './components/ai-step/ai-step.component';
import { TicketComponent } from './components/ai-step/sub-steps/ticket/ticket.component';

// Insights Steps
import { InsightsStepComponent } from './components/Insights-step/insights-step.component';
import { IdeasComponent } from './components/Insights-step/sub-steps/ideas/ideas.component';

// service for custom translations implementing wizard translations
@Injectable()
export class CustomTranslations implements WizardTranslations {
  constructor() {}
  // you need to provide translations$ observable with key value pairs for the keys you use in the wizard
  translations$: Observable<WizardTexts> = of({ wiz_header_title: 'Carrier Console' });
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
    PythonURL,
    PythonAnalyze,
    UserComponent,
    SprintreviewComponent,
    AllTicketComponent,
    AdminstepComponent,
    AdminStepComponent,
    CarrierTeamStepComponent,
    IndexComponent,
    TicketComponent,
    ComponentjiraComponent,
    // AI Step
    AIStepComponent,
    IdeasComponent,
    InsightsStepComponent,
    JiraformComponent,
    SchemaViolationComponent,
    ReleasenoteComponent,
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
