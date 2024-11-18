import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { COUNTRIES } from './countries';

@Component({
  selector: 'app-newcarrier',
  templateUrl: './newcarrier.component.html',
})
export class NewCarrierModuleComponent implements OnInit {
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

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
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
    const headers = new HttpHeaders({
      'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ', // Replace with your actual API key
    });

    this.http
      .get<any>('https://backendchatgpt-050f.onrender.com/GetCustomFieldOptions', { headers })
      .subscribe(
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

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ', // Replace with your actual API key
    });

    const { id, name, country } = this.newCarrierForm.value;
    const formattedValue = `${id} ${name} (${country})`; // Format as "ID NAME (COUNTRYCODE)"

    const body = {
      optionValue: formattedValue,
    };

    this.http.post('https://backendchatgpt-050f.onrender.com/addCustomFieldOption', body, { headers }).subscribe(
      (response: any) => {
        this.showToast('New carrier option added successfully!', 'success');
        console.log(response);
        this.fetchCustomFieldOptions(); // Call the GET request to refresh the list
      },
      (error: any) => {
        this.showToast('Failed to add new carrier option.', 'error');
        console.error(error);
      },
    );
  }
}
