import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, push, ref, remove, update } from '@angular/fire/database'; // Firebase Database modules

interface CollectedDataItem {
  key: string;
  carrier?: string;
  carrierConceptID?: number;
  cis?: string;
  team?: string;
  tier?: number;
}

@Component({
  selector: 'app-admincarrierteam',
  templateUrl: './admincarrierteam.component.html',
})
export class AdminModuleComponent implements OnInit {
  user: User | null = null; // Hold the logged-in user
  isAdmin = false; // Check if the user is admin
  collectedData: any[] = []; // Holds the data retrieved from Firebase
  searchTerm = ''; // Holds the search term for filtering
  currentPage = 1; // Tracks the current page
  itemsPerPage = 10; // Controls how many items per page
  members: any[] = []; // To store the retrieved members data
  isLoading = true;
  showTable = false;
  toastVisible = false; // Control visibility of the toast
  toastMessage = ''; // Message to display in the toast
  toastType = ''; // To control the type of toast

  constructor(private db: Database, private auth: Auth) {} // Inject Database and Auth

  ngOnInit() {
    this.retrieveMembers();

    // Check if the user and admin status are stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser && storedAdmin) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = JSON.parse(storedAdmin) === true;

      if (this.isAdmin) {
        this.retrieveCollectedData(this.user!); // Assert that user is not null
      }
    }
  }

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type; // Set the toast type
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }

  retrieveMembers() {
    const membersRef = ref(this.db, 'members');

    get(membersRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          this.members = Object.entries(snapshot.val())
            .map(([key, member]: [string, any]) => ({
              key,
              ...member,
            }))
            .sort((a: any, b: any) => {
              if (a.name === 'All') { return 1; } // Move "All" to the end of the list
              if (b.name === 'All') { return -1; }
              return a.name.localeCompare(b.name); // Sort others alphabetically
            });
        } else {
          console.log('No members data available.');
        }
      })
      .catch(error => {
        console.error('Error retrieving members data:', error);
      });
  }

  updateCIS(index: number, selectedMemberName: string) {
    const key = this.collectedData[index].key;
    const dataRef = ref(this.db, `Collected Data/${key}`);
    update(dataRef, { cis: selectedMemberName })
      .then(() => {
        console.log(`Updated CIS to '${selectedMemberName}' for entry with key '${key}'`);
      })
      .catch(error => {
        console.error('Error updating CIS:', error);
      });
  }

  checkAdminStatus(user: User) {
    const adminRef = ref(this.db, `admins/${user.uid}`);

    get(adminRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          this.isAdmin = snapshot.val();
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));

          if (this.isAdmin) {
            location.reload();
          }
        } else {
          console.log('User is not an admin.');
        }
      })
      .catch(error => {
        console.error('Error checking admin status:', error);
      });
  }

  retrieveCollectedData(user: User) {
    const dataRef = ref(this.db, 'Collected Data');

    get(dataRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.collectedData = Object.entries(data)
            .map(([key, value]) => {
              return {
                key, // Capture the Firebase key to identify each entry
                ...(typeof value === 'object' && value !== null ? value : {}), // Safely spread only if it's an object
              } as CollectedDataItem; // Cast each entry as CollectedDataItem
            })
            .sort((a, b) => (a.tier ?? Number.MAX_SAFE_INTEGER) - (b.tier ?? Number.MAX_SAFE_INTEGER)); // Sort by tier
          this.isLoading = false;
        } else {
          console.log('No data available at the specified path.');
        }
      })
      .catch(error => {
        console.error('Error retrieving data from Firebase Realtime Database:', error);
      });
  }

  // Update Firebase using the key from carrierData directly
  updateFirebase({ carrierData, field, value }: { carrierData: CollectedDataItem; field: string; value: any }) {
    if (!carrierData.key) {
      console.error('No key provided in carrierData:', carrierData);
      return;
    }

    const dataRef = ref(this.db, `Collected Data/${carrierData.key}`);

    let validatedValue;
    if (field === 'tier' || field === 'carrierConceptID') {
      validatedValue = this.validateNumber(value);
    } else {
      validatedValue = this.validateString(value);
    }

    update(dataRef, { [field]: validatedValue })
      .then(() => {
        console.log(`Updated field '${field}' with value '${validatedValue}' for key '${carrierData.key}'`);
        this.showToast(
          `Updated field '${field}' with value '${validatedValue}' for key '${carrierData.key}'`,
          'success',
        );
      })
      .catch(error => {
        console.error('Error updating Firebase:', error);
        this.showToast('Error Updating!', 'error'); // Show error toast
      });
  }

  validateNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num; // Returnera 0 om ogiltigt nummer, annars korrekt nummer
  }

  validateString(value: any): string {
    return String(value).trim(); // Konvertera till sträng och trimma eventuella mellanslag
  }

  validateTierNumber(value: any): number {
    const num = Number(value);
    if (isNaN(num)) { return 1; } // Default to 1 if the value is not a number
    // Ensure the value is between 1 and 3
    if (num < 1) { return 1; }
    if (num > 3) { return 3; }
    return num;
  }

  addNewRow() {
    const dataRef = ref(this.db, 'Collected Data');

    get(dataRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const keys = Object.keys(data).filter(key => !isNaN(Number(key))); // Filter only numeric keys
          const lastKey = keys.length ? Math.max(...keys.map(Number)) : -1; // Get the highest numeric key
          const newKey = lastKey + 1; // Increment to get the next key

          const newEntry: CollectedDataItem = {
            key: String(newKey),
            carrier: '',
            carrierConceptID: 0,
            cis: '',
            team: '',
            tier: 0,
          };

          const newEntryRef = ref(this.db, `Collected Data/${newKey}`);
          update(newEntryRef, newEntry)
            .then(() => {
              this.retrieveCollectedData(this.user!); // Reload data after adding the new row
              this.showToast(`Added Row  '${newKey}'`, 'success');
            })
            .catch(error => {
              console.error('Error adding new row:', error);
            });
        } else {
        }
      })
      .catch(error => {
        console.error('Error fetching data for new key:', error);
      });
  }

  // Remove a row from Firebase by its index
  removeRow(key: string) {
    const dataRef = ref(this.db, `Collected Data/${key}`);

    remove(dataRef)
      .then(() => {
        this.retrieveCollectedData(this.user!); // Reload the data after removing
        this.showToast(`Removed Carrier '${key}'`, 'success');
      })
      .catch(error => {
        console.error('Error removing row:', error);
        this.showToast(`Error removing '${key}'`, 'warning');
      });
  }

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
        (carrierData.carrierConceptID && carrierData.carrierConceptID.toString().includes(lowerCaseSearchTerm)) ||
        (carrierData.cis &&
          typeof carrierData.cis === 'string' &&
          carrierData.cis.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (carrierData.team &&
          typeof carrierData.team === 'string' &&
          carrierData.team.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (carrierData.tier && carrierData.tier.toString().includes(lowerCaseSearchTerm))
      );
    });
  }
}
