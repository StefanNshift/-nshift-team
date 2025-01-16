import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-update-eta-modal',
  templateUrl: './update-eta-modal.component.html',
  styleUrls: ['./update-eta-modal.component.scss'],
})
export class UpdateEtaModalComponent {
  newEta: string = '';

  @Output() etaUpdated = new EventEmitter<string>();

  updateEta() {
    this.etaUpdated.emit(this.newEta);
    this.closeModal();
  }

  closeModal() {
    const modalElement = document.getElementById('updateEtaModal');
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('style');
    }
  }
}
