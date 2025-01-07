import { Component, OnInit } from '@angular/core';
import { Auth, User } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, ref } from '@angular/fire/database'; // Firebase Database modules

@Component({
  selector: 'app-introduction',
  templateUrl: './carrierteam.component.html',
})
export class CarrierTeamComponent implements OnInit {
  user: User | null = null; // Hold the logged-in user
  isAdmin = false; // Check if the user is admin
  collectedData: any[] = []; // Holds the data retrieved from Firebase
  searchTerm = ''; // Holds the search term for filtering
  isLoading = true;
  showTable = false;
  currentPage = 1; // Tracks the current page
  itemsPerPage = 10; // Controls how many items per page

  constructor(private db: Database, private auth: Auth) {}
  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = storedAdmin === 'true';

      // Load data regardless of admin status
      this.retrieveCollectedData(this.user!);
    } else {
    }
  }

  retrieveCollectedData(user: User) {
    this.isLoading = true; // Start loading
    const dataRef = ref(this.db, 'Collected Data');

    get(dataRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.collectedData = Object.entries(data).map(([key, value]) => {
            return {
              key, // Capture the Firebase key to identify each entry
              ...(typeof value === 'object' && value !== null ? value : {}), // Safely spread only if it's an object
            };
          });
          this.showTable = true; // Display the table when data is ready
        } else {
          console.log('No data available at the specified path.');
        }
      })
      .catch(error => {
        console.error('Error retrieving data from Firebase Realtime Database:', error);
      })
      .finally(() => {
        this.isLoading = false; // Stop loading after data is fetched
      });
  }

  // Method to filter data based on search term
  filteredData() {
    if (!this.searchTerm) {
      return this.collectedData; // If no search term, return all data
    }

    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();

    return this.collectedData.filter(carrierData => {
      return (
        (carrierData.carrier &&
          typeof carrierData.carrier === 'string' &&
          carrierData.carrier.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (carrierData.carrierConceptID && carrierData.carrierConceptID.toString().includes(lowerCaseSearchTerm)) || // Convert number to string
        (carrierData.cis &&
          typeof carrierData.cis === 'string' &&
          carrierData.cis.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (carrierData.team &&
          typeof carrierData.team === 'string' &&
          carrierData.team.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (carrierData.tier && carrierData.tier.toString().includes(lowerCaseSearchTerm)) // Convert number to string
      );
    });
  }
}
