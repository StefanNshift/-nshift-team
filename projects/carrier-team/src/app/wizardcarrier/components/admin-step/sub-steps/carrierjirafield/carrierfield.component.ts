import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WizardbackendService } from '../../../backend/wizardbackend.service';
import { COUNTRIES } from './countries';

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

  fetchCustomFieldOptions() {
    this.isLoading = true;

    this.wizardBackendService.getCustomFieldOptions().subscribe(
      response => {
        this.customFieldOptions = response.values.sort((a, b) => b.id - a.id);
        this.isLoading = false;
      },
      error => {
        console.error('Failed to fetch custom field options:', error);
        this.isLoading = false;
      },
    );
  }

  // Getter for filtered data only
  get filteredData() {
    let filteredData = this.customFieldOptions;

    // Apply search term filter
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
    const formattedValue = `${id} ${name} (${country})`; // Format as "ID NAME (COUNTRYCODE)"

    this.wizardBackendService.addCustomFieldOption(formattedValue).subscribe(
      (response: any) => {
        this.showToast('New carrier option added successfully!', 'success');
        console.log(response);
        this.fetchCustomFieldOptions(); // Uppdatera listan med nya alternativ
      },
      (error: any) => {
        this.showToast('Failed to add new carrier option.', 'error');
        console.error(error);
      },
    );
  }
}
