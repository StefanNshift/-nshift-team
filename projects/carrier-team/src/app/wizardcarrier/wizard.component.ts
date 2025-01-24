import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard.component.html',
})
export class WizardTutorialComponent implements AfterViewInit {
  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      console.log('Admin detected: No restrictions applied.');
      return;
    }

    // Case 2: If isManager is 'true', hide manager-restricted elements
    if (userRole === 'manager') {
      console.log('Manager detected: Hiding specific elements for managers.');
      this.hideSpecificElementsManager();
      return;
    } else {
      this.hideAllExceptLogin();
    }
  }

  private hideSpecificElementsManager() {
    const selectors = ['li.list-group-item'];
    selectors.forEach(selector => {
      const elements = this.el.nativeElement.querySelectorAll(selector);
      elements.forEach((element: HTMLElement) => {
        const spanElement = element.querySelector('span');
        const linkText = spanElement?.textContent?.trim() || element.textContent?.trim();
        if (
          linkText === 'Admin' ||
          linkText === 'Carrier Admin' ||
          linkText === 'Central Libary Tickets' ||
          linkText === 'Carrier list in JIRA' ||
          linkText === 'Sprint Review'
        ) {
          this.renderer.setStyle(element, 'display', 'none');
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
      if (linkText !== 'Login') {
        this.renderer.setStyle(element, 'display', 'none');
      }
    });
  }
}
