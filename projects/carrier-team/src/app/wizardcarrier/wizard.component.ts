import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';
import { routes } from './wizard-routing.module'; // Importera dina routes

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard.component.html',
})
export class WizardTutorialComponent implements AfterViewInit {
  roleRestrictions: { [key: string]: string[] } = {};

  constructor(private renderer: Renderer2, private el: ElementRef) {
    this.generateRoleRestrictions();
  }

  ngAfterViewInit() {
    const userRole = localStorage.getItem('userRole') || 'guest';
    if (userRole === 'guest') {
      this.hideAllExceptLogin();
      return;
    }

    this.applyRoleRestrictions(userRole);
  }

  private generateRoleRestrictions() {
    this.roleRestrictions = { admin: [], manager: [], developer: [], guest: [] };

    const extractRoles = (routeArray: any[], parentRoles: string[] = []) => {
      routeArray.forEach(route => {
        const roles = route.data?.role || parentRoles;
        const heading = route.data?.heading;

        if (heading) {
          if (!roles.includes('admin')) {
            this.roleRestrictions.admin.push(heading);
          }
          if (!roles.includes('manager')) {
            this.roleRestrictions.manager.push(heading);
          }
          if (!roles.includes('developer')) {
            this.roleRestrictions.developer.push(heading);
          }
          if (roles.length === 0) {
            this.roleRestrictions.guest.push(heading);
          }
        }

        if (route.children) {
          extractRoles(route.children, roles);
        }
      });
    };

    extractRoles(routes[0].children);
  }

  /**
   * Dölj element baserat på roll-restriktioner
   */
  private applyRoleRestrictions(role: string) {
    if (!this.roleRestrictions[role]) {
      return;
    }

    const restrictedItems = this.roleRestrictions[role];

    const elements = this.el.nativeElement.querySelectorAll('li.list-group-item');
    elements.forEach((element: HTMLElement) => {
      const spanElement = element.querySelector('span');
      const linkText = spanElement?.textContent?.trim() || element.textContent?.trim();

      if (restrictedItems.includes(linkText) && linkText !== 'Carrier Team') {
        this.renderer.setStyle(element, 'display', 'none');
      }
    });
  }

  private hideAllExceptLogin() {
    const elements = this.el.nativeElement.querySelectorAll('li.list-group-item');
    elements.forEach((element: HTMLElement) => {
      const linkText = element.textContent?.trim();

      if (linkText !== 'Login') {
        this.renderer.setStyle(element, 'display', 'none');
      }
    });
  }
}
