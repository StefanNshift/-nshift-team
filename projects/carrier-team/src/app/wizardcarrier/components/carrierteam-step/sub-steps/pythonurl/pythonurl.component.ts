import { Component } from '@angular/core';
import { WizardbackendService } from '../../../backend/wizardbackend.service';
import { pyCarriers } from '../../../../../shared/pythoncarriers';

@Component({
  selector: 'app-pythonurl',
  templateUrl: './pythonurl.component.html',
  styleUrls: ['./pythonurl.component.scss'],
})
export class PythonURL {
  selectedCarriers: any[] = []; // To track selected carriers
  searchTerm = '';
  filteredCarriers = [...pyCarriers];
  response: any[] = []; // Store responses for all analyzed carriers
  error: string | null = null;
  isLoading = false;
  toastVisible = false;
  toastMessage = '';
  toastType = '';
  isDropdownVisible = false; // Flagga för att visa/dölja dropdown

  constructor(private wizardBackendService: WizardbackendService) {}

  // Filter carriers based on the search term
  filterCarriers(): void {
    const term = this.searchTerm.toLowerCase();
  
    // Filtrera transportörer baserat på söktermen
    this.filteredCarriers = pyCarriers.filter(
      carrier =>
        carrier.title.toLowerCase().includes(term) ||
        carrier.number.includes(term)
    );
  
    // Visa dropdown endast om det finns resultat
    this.isDropdownVisible = this.filteredCarriers.length > 0;
  
    // Återställ listan om söktermen är tom
    if (!this.searchTerm) {
      this.filteredCarriers = [...pyCarriers];
    }
  
    console.log(this.filteredCarriers); // För felsökning
  }
  

  // Toggle carrier selection for analysis and update select list
  toggleCarrierSelection(carrier: any): void {
    const index = this.selectedCarriers.findIndex(c => c.number === carrier.number);
    if (index === -1) {
      this.selectedCarriers.push(carrier); // Lägg till transportör om den inte redan är vald
    } else {
      this.selectedCarriers.splice(index, 1); // Ta bort transportör om den redan är vald
    }
  
    this.filterCarriers(); // Uppdatera listan med prioritering
  }
  
  removeSelectedCarrier(carrier: any): void {
    const index = this.selectedCarriers.findIndex(c => c.number === carrier.number);
    if (index !== -1) {
      this.selectedCarriers.splice(index, 1); // Ta bort transportören
    }
  }
  // Analyze selected carriers
  analyzeSelectedCarriers(): void {
    if (this.selectedCarriers.length === 0) {
      this.showToast('Please select at least one carrier for analysis.', 'warning');
      return;
    }

    this.isLoading = true;
    this.response = []; // Clear previous responses
    this.error = null;

    // Analyze each selected carrier
    this.selectedCarriers.forEach((carrier, index) => {
      this.wizardBackendService.getPytUrls(carrier.number).subscribe(
        (urls) => {
          this.response.push({
            carrier: carrier.title,
            test_url: urls.test_url,
            prod_url: urls.prod_url,
          });
        },
        (error) => {
          this.error = `Failed to fetch URLs for ${carrier.title}`;
          console.error('Error fetching PYT URLs:', error);
          this.showToast(`Failed to fetch URLs for ${carrier.title}`, 'error');
          this.isLoading = false;

        },
        () => {
          // When all carriers are analyzed
          if (index === this.selectedCarriers.length - 1) {
            this.isLoading = false;
            this.showToast('Analysis complete!', 'success');
          }
        }
      );
    });
  }

  onOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
  
    // Kontrollera om klicket sker inom dropdownen eller sökfältet
    const isInsideDropdown =
      target.closest('.dropdown-menu') || target.closest('#carrierSearch');
  
    if (!isInsideDropdown) {
      this.isDropdownVisible = false; // Dölj dropdown
      this.searchTerm = ''; // Rensa söktermen
      this.filteredCarriers = [...pyCarriers]; // Återställ transportörslistan
    }
  }
  
  
  showDropdown(): void {
    this.isDropdownVisible = true;
    this.filterCarriers(); // Uppdatera listan så att valda transportörer är högst upp
  }
  

  // Show toast notifications
  showToast(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 8000);
  }

  // Hide toast notifications
  hideToast(): void {
    this.toastVisible = false;
  }
}
