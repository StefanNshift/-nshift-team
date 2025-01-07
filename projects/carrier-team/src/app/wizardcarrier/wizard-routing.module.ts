import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocationStrategy, HashLocationStrategy } from '@angular/common'; // Lägg till detta
import { WizardStep } from '@sebgroup/ng-wizard';
import { authGuard } from '../shared/auth-guard.service';
import { AdminStepComponent } from './components/admin-step/admin-step.component';
import { IndexComponent as AdminIndexComponent } from './components/admin-step/index/index.component';
import { AdminModuleComponent } from './components/admin-step/sub-steps/adminteam/admincarrierteam.component';
import { CarrierFieldModuleComponent } from './components/admin-step/sub-steps/carrierjirafield/carrierfield.component';
import { CarrierTicketComponent } from './components/admin-step/sub-steps/carriertickets/carriertickets.component';
import { SprintreviewComponent } from './components/admin-step/sub-steps/sprintreview/sprintreview.component';
import { CarrierTeamComponent } from './components/carrierteam-step/carrierteam/carrierteam.component';
import { IndexComponent as CarrierIndexComponent } from './components/carrierteam-step/index/index.component';
import { IpsumComponent } from './components/carrierteam-step/sub-steps/ipsum/ipsum.component';
import { LoremComponent } from './components/carrierteam-step/sub-steps/lorem/lorem.component';
import { LoginComponent } from './components/login-step/login.component';
import { WizardTutorialComponent } from './wizard.component';

const routes: WizardStep[] = [
  {
    path: '',
    component: WizardTutorialComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        component: LoginComponent,
        data: {
          heading: 'Carrier Wizard',
          pageHeading: 'Login',
          controls: [],
        },
      },
      {
        path: 'carrier-team',
        component: CarrierTeamComponent,
        children: [
          {
            path: '',
            component: CarrierIndexComponent,
          },
          {
            path: 'lorem',
            data: {
              heading: 'Lorem step',
            },
            component: LoremComponent,
          },
          {
            path: 'ipsum',
            data: {
              heading: 'Ipsum step',
            },
            component: IpsumComponent,
          },
        ],
        data: {
          heading: 'Carrier Team',
          subSteps: [],
          controls: [],
        },
      },
      {
        path: 'admin',
        component: AdminStepComponent,
        data: {
          heading: 'Admin',
          subSteps: ['team', 'tickets', 'carrierjira', 'sprint'],

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
            path: 'team',
            component: AdminModuleComponent,
            canActivate: [authGuard],

            data: {
              heading: 'Carrier Team',
              pageHeading: '',
            },
          },
          {
            path: 'tickets',
            component: CarrierTicketComponent,
            canActivate: [authGuard],

            data: {
              heading: 'Carrier Tickets',
              pageHeading: '',
            },
          },

          {
            path: 'carrierjira',
            component: CarrierFieldModuleComponent,
            data: {
              heading: 'Carrier list in JIRA',
              pageHeading: '',
            },
          },

          {
            path: 'sprint',
            component: SprintreviewComponent,
            canActivate: [authGuard],

            data: {
              heading: 'Sprint Review',
              pageHeading: '',
              controls: [
                {
                  type: 'prev',
                },
              ],
            },
          },
        ],
      },

      { path: '**', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy }, 
  ],
})
export class WizardTutorialRoutingModule {}
