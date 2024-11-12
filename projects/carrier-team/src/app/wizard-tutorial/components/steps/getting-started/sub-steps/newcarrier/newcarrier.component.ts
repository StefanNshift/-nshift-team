import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { COUNTRIES } from './countries'; // Adjust path if needed

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

  // List of countries
  countries = COUNTRIES;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private db: Database,
    private auth: Auth,
  ) {
    // Initialize the form with form controls
    this.newCarrierForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      country: ['', Validators.required],
    });
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

  ngOnInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (!storedAdmin) {
      this.router.navigate(['/']);
    }
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

    // Use the user-provided ID directly without padding
    const formattedValue = `${id} ${name} (${country})`; // Format as "ID NAME (COUNTRYCODE)"

    const body = {
      optionValue: formattedValue,
    };

    this.http
      .post('https://backendchatgpt-050f.onrender.com/addCustomFieldOption', body, { headers: headers })
      .subscribe(
        (response: any) => {
          this.showToast('New carrier option added successfully!', 'success');
          console.log(response);
        },
        (error: any) => {
          this.showToast('Failed to add new carrier option.', 'error');
          console.error(error);
        },
      );
  }
}
