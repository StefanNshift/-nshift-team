import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WizardStep } from '@sebgroup/ng-wizard';
import { teamComponent } from './components/steps/carrierteam/carrierteam.component';
import { NewCarrierModuleComponent } from './components/steps/getting-started/sub-steps/newcarrier/newcarrier.component';
import { ZendeskModuleComponent } from './components/steps/getting-started/sub-steps/zendesk-module/zendesk-module.component';
import { OptionsComponent } from './components/steps/options/options.component';
import { AdminModuleComponent } from './components/steps/options/sub-steps/admin/admincarrierteam.component';
import { LoginComponent } from './components/steps/options/sub-steps/login/login.component';
import { WizardTutorialComponent } from './wizard-tutorial.component';
const routes: WizardStep[] = [
  {
    path: '',
    component: WizardTutorialComponent,
    children: [
      { path: '', redirectTo: 'carrier-team', pathMatch: 'full' },
      {
        path: 'carrier-team',
        component: teamComponent,
        data: {
          heading: 'Carrier Team',
        },
      },

      {
        path: 'admin',
        component: OptionsComponent,
        data: {
          heading: 'Carrier Admin',
          pageHeading: '',
          subSteps: ['team', 'tickets', 'carrierJira'],
        },
        children: [
          {
            path: '',
            component: LoginComponent,
            data: {
              heading: 'Options and configuration',
              pageHeading: 'Customize and configure the wizard',
            },
          },

          {
            path: 'team',
            component: AdminModuleComponent,
            data: {
              heading: 'Carrier Team',
              pageHeading: '',
            },
          },
          {
            path: 'tickets',
            component: ZendeskModuleComponent,
            data: {
              heading: 'Carrier Tickets',
              pageHeading: '',
            },
          },

          {
            path: 'carrierJira',
            component: NewCarrierModuleComponent,
            data: {
              heading: 'Carrier list in JIRA',
              pageHeading: '',
            },
          },
        ],
      },
      /*
      {
        path: 'examples',
        component: ExamplesWrapperComponent,
        data: {
          heading: 'Examples',
          pageHeading: 'How to use the wizard',
          subSteps: ['step-states', 'secondary-content', 'prevent-navigation', 'language', 'sub-steps'],
          secondaryContent: {
            component: MoreExamplesComponent,
            class: 'col-12 col-lg-auto order-last ml-lg-3 mb-3',
            data: {
              heading: 'Want more examples?',
            },
          },
        },
        children: [
          {
            path: '',
            component: ExamplesComponent,
          },
          {
            path: 'step-states',
            component: StepStatesComponent,
            data: {
              pageHeading: 'Set a state for a step',
              state: 'info',
              heading: 'Step states',
            },
          },
          {
            path: 'secondary-content',
            component: SecondaryContentComponent,
            data: {
              pageHeading: 'Add additional content',
              heading: 'Secondary content',
              secondaryContent: {
                component: AdditionalContentComponent,
                class: 'col-12 col-lg-auto order-last ml-lg-3 mb-3',
                data: {
                  heading: 'Alert box',
                },
              },
            },
          },
          {
            path: 'prevent-navigation',
            component: PreventNavigationComponent,
            data: {
              heading: 'Prevent navigation',
              pageHeading: 'Use route guards to prevent navigation',
            },
          },
          {
            path: 'language',
            component: LanguageComponent,
            data: {
              heading: 'Language',
              pageHeading: 'Support different languages and translations',
            },
          },
          {
            path: 'sub-steps',
            component: SubStepsComponent,
            data: {
              heading: 'Sub steps',
              pageHeading: 'Use sub steps when you need to drill down',
            },
          },
        ],
      },
      */
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WizardTutorialRoutingModule {}
