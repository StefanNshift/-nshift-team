// Angular imports
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Third-party libraries
import { WizardStep } from '@sebgroup/ng-wizard';

// Services / Guards
import { authGuard } from '../shared/auth-guard.service';

// Main Wizard
import { WizardTutorialComponent } from './wizard.component';

// Components - Login Step
import { LoginComponent } from './components/login-step/login.component';

// Components - Admin Step
import { AdminStepComponent } from './components/admin-step/admin-step.component';
import { IndexComponent as AdminIndexComponent } from './components/admin-step/index/index.component';
import { AdminModuleComponent } from './components/admin-step/sub-steps/adminteam/admincarrierteam.component';
import { CarrierTicketComponent } from './components/admin-step/sub-steps/carriertickets/carriertickets.component';
import { PythonAnalyze } from './components/admin-step/sub-steps/pythonanalyze/pythonanalyze.component';
import { SchemaViolationComponent } from './components/admin-step/sub-steps/schema-violation/schema-violation.component';
import { SprintreviewComponent } from './components/admin-step/sub-steps/sprintreview/sprintreview.component';
import { ZendeskFieldModuleComponent } from './components/admin-step/sub-steps/zendeskfield/zendeskfield.component';

// Components - User Step
import { UserComponent } from './components/carrierteam-step/sub-steps/userticket/userticket.component';
import { IndexComponent as UserIndexComponent } from './components/user-step/index/index.component';
import { CarrierTeamComponent } from './components/user-step/carrierteam/carrierteam.component';
import { ReleasenoteComponent } from './components/user-step/releasenote/releasenote.component';

// Components - Carrier Team Step
import { IndexComponent as CarrierIndexComponent } from './components/carrierteam-step/index/index.component';
import { AllTicketComponent } from './components/carrierteam-step/sub-steps/carriertickets/carriertickets.component';
import { ComponentjiraComponent } from './components/carrierteam-step/sub-steps/componentjira/componentjira.component';
import { CarrierFieldModuleComponent } from './components/carrierteam-step/sub-steps/carrierjirafield/carrierfield.component';
import { JiraformComponent } from './components/carrierteam-step/sub-steps/jiraform/jiraform.component';
import { PythonURL } from './components/carrierteam-step/sub-steps/pythonurl/pythonurl.component';

// Components - Insights Step
import { InsightsStepComponent } from './components/Insights-step/insights-step.component';
import { IndexComponent as InsightsIndexComponent } from './components/Insights-step/index/index.component';
import { IdeasComponent } from './components/Insights-step/sub-steps/ideas/ideas.component';

export const routes: WizardStep[] = [
  // 🔹 Lägg till "export" här!
  {
    path: '',
    component: WizardTutorialComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        component: LoginComponent,
        data: {
          heading: 'Login',
          role: ['manager', 'developer', 'admin'],
          controls: [],
        },
      },




      {
        path: 'carrier-team',
        component: CarrierTeamComponent,
        data: {
          heading: 'Carrier Team',
          role: ['manager', 'developer', 'admin'],
          subSteps: [],
          controls: [],
        },

        children: [
          {
            path: '',
            component: CarrierIndexComponent,
            data: {
              heading: 'Carrier Team',
              role: ['manager', 'developer', 'admin'],
              subSteps: [],
              controls: [],
            },
          },
        ],
      },

      {
        path: 'releasenote',
        component: ReleasenoteComponent,
        canActivate: [authGuard],
        data: {
          heading: 'Release Note',
          pageHeading: '',
          role: ['manager', 'developer', 'admin'],
          controls: [
            {
              type: 'prev',
            },
          ],
        },
      },


      {
        path: 'user',
        component: AdminStepComponent,
        canActivate: [authGuard], // Kontrollera manager-åtkomst
        data: {
          heading: 'Central Carrier Team',
          role: ['manager', 'developer', 'admin'],
          subSteps: ['mytickets', 'carriertickets', 'carrierjira', 'componentjira', 'pyurl', 'jira'],
          controls: [
            {
              type: 'next',
            },
          ],
        },
        children: [
          {
            path: '',
            component: UserIndexComponent,
          },
          {
            path: 'mytickets',
            component: UserComponent,
            canActivate: [authGuard],
            data: {
              heading: 'My Tickets',
              pageHeading: '',
              role: ['manager', 'admin'],
              controls: [
                {
                  type: 'other', // Typ av kontroll
                  text: 'Refresh Tickets', // Text på knappen
                  title: 'Refresh Tickets', // Titel för skärmläsare
                  class: 'btn-clear-session', // CSS-klass (valfritt)
                },
              ],
            },
          },

          {
            path: 'carriertickets',
            component: AllTicketComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Carrier Tickets',
              pageHeading: '',
              role: ['manager', 'admin'],
              controls: [
                {
                  type: 'other', // Typ av kontroll
                  text: 'Refresh Tickets', // Text på knappen
                  title: 'Refresh Tickets', // Titel för skärmläsare
                  class: 'btn-clear-session', // CSS-klass (valfritt)
                },
              ],
            },
          },

          {
            path: 'carrierjira',
            component: CarrierFieldModuleComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Carrier Field',
              pageHeading: '',
              role: ['manager', 'developer', 'admin', 'jira'],
              controls: [
                {
                  type: 'next',
                },
              ],
            },
          },
          {
            path: 'componentjira',
            component: ComponentjiraComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Component Field',
              pageHeading: '',
              role: ['manager', 'developer', 'admin', 'jira'],
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
          /*
          {
            path: 'carrierserver',
            component: PythonAnalyze,
            canActivate: [authGuard],
            data: {
              heading: 'Python Analyze',
              role: ['manager', 'developer', 'admin'],
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
*/
          {
            path: 'pyurl',
            component: PythonURL,
            canActivate: [authGuard],
            data: {
              heading: 'Python URLs',
              role: ['manager', 'developer', 'admin'],
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
          {
            path: 'jira',
            component: JiraformComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Create Ticket',
              role: ['manager', 'developer', 'admin'],
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
        ],
      },
      {
        path: 'admin',
        component: AdminStepComponent,
        canActivate: [authGuard],
        data: {
          heading: 'Admin',
          role: 'admin',
          subSteps: ['tickets', 'team', 'sprint', 'schema'],
          controls: [
            {
              type: 'next',
            },
          ],
        },
        children: [
          {
            path: '',
            component: AdminIndexComponent,
          },
          {
            path: 'tickets',
            component: CarrierTicketComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Central Libary Tickets',
              pageHeading: '',
              role: 'admin', // Kräv admin-roll
              controls: [
                {
                  type: 'other', // Typ av kontroll
                  text: 'Refresh Tickets', // Text på knappen
                  title: 'Refresh Tickets', // Titel för skärmläsare
                  class: 'btn-clear-session', // CSS-klass (valfritt)
                },
              ],
            },
          },
          {
            path: 'team',
            component: AdminModuleComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Carrier Team',
              pageHeading: '',
              role: 'admin', // Kräv admin-roll
            },
          },
          {
            path: 'sprint',
            component: SprintreviewComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Sprint Review',
              pageHeading: '',
              role: 'admin', // Kräv admin-roll
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
          {
            path: 'schema',
            component: SchemaViolationComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Schema Violation',
              pageHeading: '',
              role: 'admin', // Kräv admin-roll
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
        ],
      },

      /*
      {
        path: 'Insights',
        component: InsightsStepComponent,
        canActivate: [authGuard], // Kontrollera admin-åtkomst
        data: {
          heading: 'insights',
          role: ['manager', 'developer', 'admin'],
          subSteps: ['tickets'],
          controls: [
            {
              type: 'next',
            },
          ],
        },
        children: [
       
          {
            path: 'tickets',
            component: IdeasComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Idea Suggestions',
              pageHeading: '',
              role: ['manager', 'developer', 'admin'],
     
            },
          },
       

        ],
      },
*/
      { path: '**', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WizardTutorialRoutingModule { }
