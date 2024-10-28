import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';

@Component({
  selector: 'app-take-over',
  templateUrl: './wizard-tutorial.component.html',
})
export class WizardTutorialComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) { }




  ngAfterViewInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedAdmin) {}
    else {
      const element = this.el.nativeElement.querySelector('ol.list-group:nth-child(2) > li:nth-child(1)');
      const element1 = this.el.nativeElement.querySelector('ol.list-group:nth-child(2) > li:nth-child(2)');

      if (element) {
        this.renderer.setStyle(element, 'display', 'none');
        this.renderer.setStyle(element1, 'display', 'none');

      }
    }
  }

}
