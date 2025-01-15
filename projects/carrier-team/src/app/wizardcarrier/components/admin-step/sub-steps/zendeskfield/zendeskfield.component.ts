import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COUNTRIES } from '../../../../../shared/countries';
import { WizardbackendService } from '../../../backend/wizardbackend.service';

@Component({
  selector: 'app-zendeskfield',
  templateUrl: './zendeskfield.component.html',
})
export class ZendeskFieldModuleComponent implements OnInit {
  newZendeskFieldForm: FormGroup;
  isLoading = true;
  toastVisible = false;
  toastMessage = '';
  toastType = '';
  ticketFieldOptions: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  TicketFieldObject: any[] = [];
  countries = COUNTRIES;

  constructor(private fb: FormBuilder, private wizardBackendService: WizardbackendService) {
    this.newZendeskFieldForm = this.fb.group({
      name: ['', Validators.required],
      id: [null, Validators.required],
      country: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.fetchZendeskTicketFieldOptions();
  }

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }

  fetchZendeskTicketFieldOptions() {
    this.isLoading = true;
    this.wizardBackendService.GetZendeskTicketFieldOption().subscribe(
      response => {
        this.TicketFieldObject = response;

        this.ticketFieldOptions = response.ticket_field.custom_field_options.map(option =>
          this.processTicketFieldOption(option),
        );

        this.ticketFieldOptions.sort((a, b) => {
          if (a.conceptID === 'N/A') { return 1; }
          if (b.conceptID === 'N/A') { return -1; }
          return (b.conceptID || 0) - (a.conceptID || 0);
        });

        this.isLoading = false;
      },
      error => {
        console.error('Failed to fetch ticket fields:', error);
        this.isLoading = false;
      },
    );
  }

  addNewZendeskTicketFieldOption() {
    if (this.newZendeskFieldForm.invalid) {
      this.showToast('Pleasea fill out all fields.', 'warning');
      return;
    }

    console.log(this.newZendeskFieldForm.value);
    const { name, id, country } = this.newZendeskFieldForm.value;
    const formattedName = `${name} (${country}) ${id}`;

    const formattedValue = formattedName
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    const newField = {
      name: formattedName,
      raw_name: formattedName,
      value: formattedValue,
      default: false,
    };

    const ticketField = (this.TicketFieldObject as any)?.ticket_field;

    if (ticketField?.custom_field_options && Array.isArray(ticketField.custom_field_options)) {
      ticketField.custom_field_options.push(newField);
      console.log('New field added:', newField);
      console.log('Updated TicketFieldObject:', this.TicketFieldObject);

      this.wizardBackendService.updateZendeskTicketFieldOption(ticketField).subscribe({
        next: response => {
          this.fetchZendeskTicketFieldOptions();
          this.showToast('Carrier Field added successfully!', 'success');
          this.newZendeskFieldForm.reset();
        },
        error: error => {
          console.error('Error updating ticket field:', error);
          this.showToast('Failed to update the ticket field.', 'error');
        },
      });
    } else {
      console.error('custom_field_options does not exist or is not an array.');
      this.showToast('Failed to add the new field. custom_field_options is invalid.', 'error');
    }
  }

  deleteZendeskField(option: any) {
    if (!confirm(`Are you sure you want to delete the field "${option.name}"?`)) {
      return;
    }

    const ticketFieldObject = Array.isArray(this.TicketFieldObject)
      ? this.TicketFieldObject[0]
      : this.TicketFieldObject;

    if (
      ticketFieldObject &&
      ticketFieldObject.ticket_field &&
      Array.isArray(ticketFieldObject.ticket_field.custom_field_options)
    ) {
      const customFieldOptions = ticketFieldObject.ticket_field.custom_field_options;
      const indexToDelete = customFieldOptions.findIndex((field: any) => String(field.id) === String(option.id));

      if (indexToDelete !== -1) {
        customFieldOptions.splice(indexToDelete, 1);
        console.log('Deleted field:', option);
        console.log('Updated TicketFieldObject:', this.TicketFieldObject);

        this.wizardBackendService.updateZendeskTicketFieldOption(ticketFieldObject.ticket_field).subscribe({
          next: response => {
            this.fetchZendeskTicketFieldOptions();
            this.showToast('Carrier Field deleted successfully in Zendesk!', 'success');
          },
          error: error => {
            console.error('Error deleting ticket field in Zendesk:', error);
            this.showToast('Failed to delete the ticket field in Zendesk.', 'error');
          },
        });
      } else {
        this.showToast('Zendesk Field not found.', 'error');
        console.error(`Field with ID ${option.id} was not found in custom_field_options.`);
      }
    } else {
      this.showToast('Zendesk Field structure is invalid.', 'error');
      console.error('TicketFieldObject is invalid or does not contain ticket_field.');
    }
  }

  saveFieldEditZendesk(option: any) {
    console.log('Option ID:', option.id);
    console.log('Full TicketFieldObject:', this.TicketFieldObject);
    const editedConceptID = String(option.editedConceptID || '').trim();
    const editedCarrierName = option.editedName ? option.editedName.trim() : '';

    if (!editedCarrierName) {
      this.showToast('Please provide a valid carrier name.', 'warning');
      return;
    }

    if (!editedConceptID) {
      this.showToast('Please provide a valid concept ID.', 'warning');
      return;
    }

    if (option.carrierName === editedCarrierName && String(option.conceptID || '') === editedConceptID) {
      this.showToast('No changes were made.', 'warning');
      return;
    }

    const ticketFieldObject = Array.isArray(this.TicketFieldObject)
      ? this.TicketFieldObject[0]
      : this.TicketFieldObject;

    console.log('Resolved TicketFieldObject:', ticketFieldObject);

    if (
      ticketFieldObject &&
      ticketFieldObject.ticket_field &&
      Array.isArray(ticketFieldObject.ticket_field.custom_field_options)
    ) {
      const customFieldOptions = ticketFieldObject.ticket_field.custom_field_options;
      const fieldToUpdate = customFieldOptions.find((field: any) => String(field.id) === String(option.id));

      if (fieldToUpdate) {
        const combinedName = `${option.editedName} ${option.editedConceptID}`.trim();

        const sanitizedName = combinedName
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '_')
          .toLowerCase();

        fieldToUpdate.name = combinedName;
        fieldToUpdate.raw_name = combinedName;
        fieldToUpdate.value = sanitizedName;

        console.log('Updated field:', fieldToUpdate);
        console.log('Updated TicketFieldObject:', this.TicketFieldObject);

        this.wizardBackendService.updateZendeskTicketFieldOption(ticketFieldObject.ticket_field).subscribe({
          next: () => {
            this.fetchZendeskTicketFieldOptions();
            this.showToast('Carrier Field updated successfully in Zendesk!', 'success');
          },
          error: error => {
            console.error('Error updating ticket field in Zendesk:', error);
            this.showToast('Failed to update the ticket field in Zendesk.', 'error');
          },
        });
      } else {
        this.showToast('Zendesk Field not found.', 'error');
        console.error(`Field with ID ${option.id} was not found in custom_field_options.`);
      }
    } else {
      this.showToast('Zendesk Field structure is invalid.', 'error');
      console.error('TicketFieldObject is invalid or does not contain ticket_field.');
    }

    option.isEditing = false;
  }

  editZendeskField(option: any) {
    option.isEditing = true;
    option.editedName = option.carrierName;
    option.editedConceptID = option.conceptID;
  }

  cancelZendeskEdit(option: any) {
    option.isEditing = false;
    option.editedName = null;
  }

  processTicketFieldOption(option: any): any {
    const trimmedName = option.name.trim();

    let carrierName = '';
    let conceptID: any = 'N/A';

    if (trimmedName.match(/^01\s*-\s*N\/A$/)) {
      carrierName = trimmedName;
    } else {
      const conceptIDMatch = trimmedName.match(/(\d+)(?=\s*-|\)$|$)/);
      conceptID =
        conceptIDMatch && !isNaN(parseInt(conceptIDMatch[1], 10))
          ? parseInt(conceptIDMatch[1].replace(/^0/, ''), 10)
          : 'N/A';

      carrierName = trimmedName.replace(/(\d+)(\s*-.*)?(\))?$/, '').trim();
    }

    return {
      id: option.id,
      name: option.name,
      carrierName: carrierName,
      conceptID: conceptID,
      editedName: null,
      isEditing: false,
    };
  }

  get filteredData() {
    if (!this.searchTerm) { return this.ticketFieldOptions; }
    const lowerSearch = this.searchTerm.toLowerCase();
    return this.ticketFieldOptions.filter(option => option.name.toLowerCase().includes(lowerSearch));
  }
}
