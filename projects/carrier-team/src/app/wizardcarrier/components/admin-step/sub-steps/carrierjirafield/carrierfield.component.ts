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

  // List of countries and options
  countries = COUNTRIES;
  customFieldOptions: any[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;

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
    });
  }

  ngOnInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (!storedAdmin) {
      this.router.navigate(['/']);
    }
    this.fetchCustomFieldOptions();
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

  fetchCustomFieldOptions() {
    this.isLoading = true;
    this.wizardBackendService.GetJiraCustomFieldOptions().subscribe(
      response => {
        this.customFieldOptions = response.values.map(option => {
          const [conceptID, ...carrierParts] = option.value.split(' ');
          const carrier = carrierParts.join(' ');

          return {
            ...option,
            conceptID: parseInt(conceptID, 10),
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

    const { id, name, country } = this.newCarrierForm.value;
    const formattedValue = `${id} ${name} (${country})`;

    this.wizardBackendService.addJiraCustomFieldOption(formattedValue).subscribe(
      (response: any) => {
        this.fetchCustomFieldOptions();
        this.showToast('New carrier option added successfully!', 'success');
      },
      (error: any) => {
        this.showToast('Failed to add new carrier option.', 'error');
        console.error(error);
      },
    );
  }
}
