import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'wizard',
    loadChildren: () => import('./wizardcarrier/wizard.module').then(m => m.WizardTutorialModule),
  },
  { path: '', redirectTo: 'wizard', pathMatch: 'full' },
  { path: '**', redirectTo: 'wizard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
