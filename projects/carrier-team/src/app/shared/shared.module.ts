import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faJira } from '@fortawesome/free-brands-svg-icons/faJira';
import { NgxPaginationModule } from 'ngx-pagination';

import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, FontAwesomeModule, NgxPaginationModule, ReactiveFormsModule, MarkdownModule.forRoot()],
  exports: [CommonModule, FormsModule, FontAwesomeModule, ReactiveFormsModule,NgxPaginationModule, MarkdownModule],
})
export class SharedModule {
  constructor(library: FaIconLibrary) {
    // add icons that should be available in the app/module
    library.addIcons(<any>faGithub);
    library.addIcons(<any>faJira);

  }
}
