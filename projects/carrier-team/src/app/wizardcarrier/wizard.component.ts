import { Component, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard.component.html',
})
export class WizardTutorialComponent implements AfterViewInit {
  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    const isAdmin = localStorage.getItem('isAdmin');
    // Case 1: If isAdmin is 'true', do nothing
    if (isAdmin === 'true') {
      return;
    }

    // Case 2: If isAdmin is 'false', hide "Carrier Admin" and sub-items
    if (isAdmin === 'false') {
      this.hideSpecificElements();
      return;
    }

    // Case 3: If isAdmin is null/undefined, hide everything except "Login"
    if (isAdmin === null || isAdmin === undefined) {
      this.hideAllExceptLogin();
    }
  }

  /**
   * Hide specific elements like "Carrier Admin" and its sub-items
   */
  private hideSpecificElements() {
    const selectors = [
    ];

    selectors.forEach((selector) => {
      const elements = this.el.nativeElement.querySelectorAll(selector);
      elements.forEach((element: HTMLElement) => {
        const linkText = element.textContent?.trim();

        if (
          linkText === 'Carrier Admin' ||
          linkText === 'Carrier Team' ||
          linkText === 'Carrier Tickets' ||
          linkText === 'Carrier list in JIRA' ||
          linkText === 'Sprint Review'
        ) {
          this.renderer.setStyle(element, 'display', 'none'); // Hide element
        }
      });
    });
  }

  /**
   * Hide everything except the "Login" link
   */
  private hideAllExceptLogin() {
    const elements = this.el.nativeElement.querySelectorAll('ol.list-group li.list-group-item');
    elements.forEach((element: HTMLElement) => {
      const linkText = element.textContent?.trim();

      // Only keep "Login", hide all other elements
      if (linkText !== 'Login') {
        this.renderer.setStyle(element, 'display', 'none');
      }
    });
  }
}
