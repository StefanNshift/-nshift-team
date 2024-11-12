import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard-tutorial.component.html',
})
export class WizardTutorialComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedAdmin) {
    } else {
      const element = this.el.nativeElement.querySelector('ol.list-group:nth-child(2) > li:nth-child(1)');
      const element1 = this.el.nativeElement.querySelector('ol.list-group:nth-child(2) > li:nth-child(2)');
      const element2 = this.el.nativeElement.querySelector('ol.list-group:nth-child(2) > li:nth-child(3)');

      if (element) {
        this.renderer.setStyle(element, 'display', 'none');
        this.renderer.setStyle(element1, 'display', 'none');
        this.renderer.setStyle(element2, 'display', 'none');
      }
    }
  }
}
