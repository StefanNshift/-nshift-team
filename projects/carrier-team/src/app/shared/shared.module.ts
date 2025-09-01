import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faJira } from '@fortawesome/free-brands-svg-icons/faJira';
import { EditorModule } from '@tinymce/tinymce-angular';

import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EditorModule,
    FormsModule,
    FontAwesomeModule,
    NgxPaginationModule,
    ReactiveFormsModule,
    NgSelectModule,
    MarkdownModule.forRoot(),
  ],
  exports: [
    CommonModule,
    EditorModule,
    FormsModule,
    NgSelectModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    MarkdownModule,
  ],
})
export class SharedModule {
  constructor(library: FaIconLibrary) {
    // add icons that should be available in the app/module
    library.addIcons(<any>faGithub);
    library.addIcons(<any>faJira);
  }
}
