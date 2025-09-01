import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { COUNTRIES } from '../../../../../shared/countries';
import { WizardbackendService } from '../../../backend/wizardbackend.service';

@Component({
  selector: 'app-carrierfield',
  templateUrl: './carrierfield.component.html',
})
export class CarrierFieldModuleComponent implements OnInit {
  newCarrierForm: FormGroup;
  isLoading = true;
  toastVisible = false;
  toastMessage = '';
  toastType = '';

  currentPageJira = 1;
  currentPageZendesk = 1;

  countries = COUNTRIES;
  customFieldOptions: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;

  newZendeskFieldForm: FormGroup;
  ticketFieldOptionsZD: any[] = [];
  TicketFieldObjectZD: any[] = [];
  currentPageZD = 1;
  searchTermZD = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private wizardBackendService: WizardbackendService,
  ) {
    this.newCarrierForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      country: ['', Validators.required],
      addTo: ['both', Validators.required],
    });
    this.newZendeskFieldForm = this.fb.group({
      name: ['', Validators.required],
      id: [null, Validators.required],
      country: ['', Validators.required],
    });
  }

  ngOnInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (!storedAdmin) {
      this.router.navigate(['/']);
    }
    this.fetchCustomFieldOptions();
    this.fetchZendeskticketFieldOptionsZD();
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

  editCarrier(carrier: any) {
    carrier.isEditing = true;
    carrier.editedValue = carrier.carrier;
    carrier.editedConceptID = carrier.conceptID;
  }

  saveCarrierEdit(carrier: any) {
    if (!carrier.editedValue || carrier.editedValue.trim() === '' || !carrier.editedConceptID) {
      this.showToast('Please provide valid values to save.', 'warning');
      return;
    }

    if (carrier.carrier === carrier.editedValue && carrier.conceptID === carrier.editedConceptID) {
      this.showToast('No changes were made to the carrier.', 'warning');
      return;
    } else {
      this.wizardBackendService
        .updateJiraCustomFieldOption({
          value: carrier.value,
          newValue: `${carrier.editedConceptID} ${carrier.editedValue.trim()}`,
        })
        .subscribe(
          (response: any) => {
            this.fetchCustomFieldOptions();
            this.showToast('Carrier List Updated Successfully!', 'success');
          },
          (error: any) => {
            this.showToast('Failed to update carrier.', 'error');
            console.error('Update error:', error);
          },
        );
    }
    carrier.isEditing = false;
  }

  cancelEdit(carrier: any) {
    carrier.isEditing = false;
    carrier.editedValue = null;
    carrier.editedConceptID = null;
  }

  deleteCarrier(option: any) {
    if (!confirm(`Are you sure you want to delete carrier "${option.value}"?`)) return;

    const fieldId = 'customfield_10378';
    const contextId = '10644';
    const optionId = option.id;

    this.wizardBackendService.deleteJiraCustomFieldOption(fieldId, contextId, optionId).subscribe({
      next: () => {
        this.fetchCustomFieldOptions();
        this.showToast('Carrier deleted successfully from Jira!', 'success');
      },
      error: err => {
        console.error('Error deleting Jira field:', err);
        this.showToast('Failed to delete carrier from Jira.', 'error');
      },
    });
  }

  fetchCustomFieldOptions() {
    this.isLoading = true;
    this.wizardBackendService.GetJiraCustomFieldOptions().subscribe(
      response => {
        this.customFieldOptions = response.values.map(option => {
          const [conceptID, ...carrierParts] = option.value.split(' ');
          const carrier = carrierParts.join(' ');

          return {
            ...option,
            conceptID: conceptID,
            carrier,
          };
        });
        this.customFieldOptions.sort((a, b) => b.conceptID - a.conceptID);
        this.isLoading = false;
      },
      error => {
        console.error('Failed to fetch custom field options:', error);
        this.isLoading = false;
      },
    );
  }

  get filteredData() {
    let filteredData = this.customFieldOptions;
    if (this.searchTerm) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(option => option.value.toLowerCase().includes(lowerCaseSearchTerm));
    }

    return filteredData;
  }

  addNewCarrierOption() {
    if (this.newCarrierForm.invalid) {
      this.showToast('Please fill out all fields correctly.', 'warning');
      return;
    }

    const { id, name, country, addTo } = this.newCarrierForm.value;
    const formattedValue = `${id} ${name} (${country})`;

    let jiraPromise = Promise.resolve();
    let zendeskPromise = Promise.resolve();

    if (addTo === 'jira' || addTo === 'both') {
      jiraPromise = this.wizardBackendService.addJiraCustomFieldOption(formattedValue).toPromise();
    }

    if (addTo === 'zendesk' || addTo === 'both') {
      const formattedName = `${name} (${country}) ${id}`;
      const formattedZDValue = formattedName
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      const newField = {
        name: formattedName,
        raw_name: formattedName,
        value: formattedZDValue,
        default: false,
      };

      const ticketFieldWrapper = Array.isArray(this.TicketFieldObjectZD)
        ? this.TicketFieldObjectZD[0]
        : this.TicketFieldObjectZD;

      const ticketField = ticketFieldWrapper?.ticket_field;

      if (ticketField && Array.isArray(ticketField.custom_field_options)) {
        ticketField.custom_field_options.push(newField);

        zendeskPromise = this.wizardBackendService.updateZendeskTicketFieldOption(ticketField).toPromise();
      } else {
        this.showToast('Zendesk field structure is invalid.', 'error');
        return;
      }
    }

    Promise.all([jiraPromise, zendeskPromise])
      .then(() => {
        this.fetchCustomFieldOptions();
        this.fetchZendeskticketFieldOptionsZD();
        this.showToast('Carrier option added successfully!', 'success');
        this.newCarrierForm.reset();
      })
      .catch(error => {
        console.error('Error while adding carrier:', error);
        this.showToast('Failed to add carrier field.', 'error');
      });
  }

  fetchZendeskticketFieldOptionsZD() {
    this.isLoading = true;
    this.wizardBackendService.GetZendeskTicketFieldOption().subscribe(
      response => {
        this.TicketFieldObjectZD = response;

        this.ticketFieldOptionsZD = response.ticket_field.custom_field_options.map(option =>
          this.processTicketFieldOptionZD(option),
        );

        this.ticketFieldOptionsZD.sort((a, b) => {
          if (a.conceptID === 'N/A') {
            return 1;
          }
          if (b.conceptID === 'N/A') {
            return -1;
          }
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

    const ticketField = (this.TicketFieldObjectZD as any)?.ticket_field;

    if (ticketField?.custom_field_options && Array.isArray(ticketField.custom_field_options)) {
      ticketField.custom_field_options.push(newField);
      console.log('New field added:', newField);
      console.log('Updated TicketFieldObjectZD:', this.TicketFieldObjectZD);

      this.wizardBackendService.updateZendeskTicketFieldOption(ticketField).subscribe({
        next: response => {
          this.fetchZendeskticketFieldOptionsZD();
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

    const TicketFieldObjectZD = Array.isArray(this.TicketFieldObjectZD)
      ? this.TicketFieldObjectZD[0]
      : this.TicketFieldObjectZD;

    if (
      TicketFieldObjectZD &&
      TicketFieldObjectZD.ticket_field &&
      Array.isArray(TicketFieldObjectZD.ticket_field.custom_field_options)
    ) {
      const customFieldOptions = TicketFieldObjectZD.ticket_field.custom_field_options;
      const indexToDelete = customFieldOptions.findIndex((field: any) => String(field.id) === String(option.id));

      if (indexToDelete !== -1) {
        customFieldOptions.splice(indexToDelete, 1);
        console.log('Deleted field:', option);
        console.log('Updated TicketFieldObjectZD:', this.TicketFieldObjectZD);

        this.wizardBackendService.updateZendeskTicketFieldOption(TicketFieldObjectZD.ticket_field).subscribe({
          next: response => {
            this.fetchZendeskticketFieldOptionsZD();
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
      console.error('TicketFieldObjectZD is invalid or does not contain ticket_field.');
    }
  }

  saveFieldEditZendesk(option: any) {
    console.log('Option ID:', option.id);
    console.log('Full TicketFieldObjectZD:', this.TicketFieldObjectZD);
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

    const TicketFieldObjectZD = Array.isArray(this.TicketFieldObjectZD)
      ? this.TicketFieldObjectZD[0]
      : this.TicketFieldObjectZD;

    console.log('Resolved TicketFieldObjectZD:', TicketFieldObjectZD);

    if (
      TicketFieldObjectZD &&
      TicketFieldObjectZD.ticket_field &&
      Array.isArray(TicketFieldObjectZD.ticket_field.custom_field_options)
    ) {
      const customFieldOptions = TicketFieldObjectZD.ticket_field.custom_field_options;
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
        console.log('Updated TicketFieldObjectZD:', this.TicketFieldObjectZD);

        this.wizardBackendService.updateZendeskTicketFieldOption(TicketFieldObjectZD.ticket_field).subscribe({
          next: () => {
            this.fetchZendeskticketFieldOptionsZD();
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
      console.error('TicketFieldObjectZD is invalid or does not contain ticket_field.');
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

  processTicketFieldOptionZD(option: any): any {
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

  get filteredZDData() {
    if (!this.searchTermZD) {
      return this.ticketFieldOptionsZD;
    }
    const lowerSearch = this.searchTermZD.toLowerCase();
    return this.ticketFieldOptionsZD.filter(option => option.name.toLowerCase().includes(lowerSearch));
  }
}
