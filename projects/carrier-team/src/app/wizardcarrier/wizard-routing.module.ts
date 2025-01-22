import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WizardStep } from '@sebgroup/ng-wizard';
import { authGuard } from '../shared/auth-guard.service';
import { AdminStepComponent } from './components/admin-step/admin-step.component';
import { IndexComponent as AdminIndexComponent } from './components/admin-step/index/index.component';
import { AdminModuleComponent } from './components/admin-step/sub-steps/adminteam/admincarrierteam.component';
import { CarrierFieldModuleComponent } from './components/admin-step/sub-steps/carrierjirafield/carrierfield.component';
import { CarrierTicketComponent } from './components/admin-step/sub-steps/carriertickets/carriertickets.component';
import { SprintreviewComponent } from './components/admin-step/sub-steps/sprintreview/sprintreview.component';
import { ZendeskFieldModuleComponent } from './components/admin-step/sub-steps/zendeskfield/zendeskfield.component';
import { CarrierTeamComponent } from './components/carrierteam-step/carrierteam/carrierteam.component';
import { IndexComponent as CarrierIndexComponent } from './components/carrierteam-step/index/index.component';
import { LoginComponent } from './components/login-step/login.component';
import { IndexComponent as UserIndexComponent } from './components/user-step/index/index.component';
import { UserComponent } from './components/user-step/userticket/userticket.component';
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
          heading: 'Login',
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
        ],
        data: {
          heading: 'Carrier Team',
          subSteps: [],
          controls: [],
        },
      },
      {
        path: 'user',
        component: AdminStepComponent,
        canActivate: [authGuard], // Kontrollera manager-åtkomst
        data: {
          heading: 'Central CIS',
          role: 'manager', // Kräv rollen manager för alla under /user
          subSteps: ['mytickets', 'carrierjira', 'carrierzendesk'],
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
              role: 'manager', // Kräv manager-roll
            },
          },
          {
            path: 'carrierjira',
            component: CarrierFieldModuleComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Carrier list in Jira',
              pageHeading: '',
              role: 'manager', // Kräv manager-roll
            },
          },
          {
            path: 'carrierzendesk',
            component: ZendeskFieldModuleComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Carrier list in Zendesk',
              pageHeading: '',
              role: 'manager', // Kräv manager-roll
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
        canActivate: [authGuard], // Kontrollera admin-åtkomst
        data: {
          heading: 'Admin',
          role: 'admin', // Kräv rollen admin för alla under /admin
          subSteps: ['team', 'tickets', 'sprint'],
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
              role: 'admin', // Kräv admin-roll
            },
          },
          {
            path: 'tickets',
            component: CarrierTicketComponent,
            canActivate: [authGuard],
            data: {
              heading: 'Central Libary Tickets',
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
        ],
      },

      { path: '**', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WizardTutorialRoutingModule {}
