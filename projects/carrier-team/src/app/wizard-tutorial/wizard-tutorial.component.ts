import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard-tutorial.component.html',
})
export class WizardTutorialComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin) {
      return; // Exit early if the user is an admin
    }

    // Query all list items in the second list-group
    const elements = this.el.nativeElement.querySelectorAll('ol.list-group:nth-child(2) > li');
    if (elements?.length > 0) {
      elements.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, 'display', 'none'); // Hide each element
      });
    }

    const elements1 = this.el.nativeElement.querySelectorAll(
      'body > app-root > app-take-over > wiz-wizard > div > div.col-12.col-md-auto > wiz-left-navigation > nav > div.step-wrapper.ng-tns-c11-0.ng-trigger.ng-trigger-expand.ng-star-inserted > ol > li:nth-child(3) > a',
    );
    if (elements1?.length > 0) {
      elements1.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, 'display', 'none'); // Hide each element
      });
    }
  }
}
