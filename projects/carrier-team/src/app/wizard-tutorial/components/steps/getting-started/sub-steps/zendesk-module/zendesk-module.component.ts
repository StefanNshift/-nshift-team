import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Database, ref, get, update } from '@angular/fire/database';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth'; // Firebase Auth modules
import { Router } from '@angular/router';

@Component({
  selector: 'app-zendesk-module',
  templateUrl: './zendesk-module.component.html',
})
export class ZendeskModuleComponent implements OnInit {
  tickets: any[] = []; // Array to hold ticket data
  collectedData: any[] = []; // Holds the data retrieved from Firebase
  isLoading: boolean = true;
  members: any[] = [];
  members1: any[] = [];
  toastVisible = false; // Control visibility of the toast
  toastMessage = ''; // Message to display in the toast
  toastType = ''; // To control the type of toast

  // To store the retrieved members data
  constructor(private router: Router, private http: HttpClient, private db: Database, private auth: Auth) { }
  probIssues: any[] = []; // Array to hold PROB issues data
  probIssueCount: number = 0; // Count of PROB issues
  zendeskTicketCount: number = 0; // Count of Zendesk tickets
  assignedTickets: any[] = [];
  unassignedTickets: any[] = [];

  unassignedTier1Count: number = 0;
  unassignedTier2Count: number = 0;
  unassignedTier3Count: number = 0;
  unassignedPriorityLowCount: number = 0;
  unassignedPriorityMediumCount: number = 0;
  unassignedPriorityHighCount: number = 0;
  unassignedPriorityUrgentCount: number = 0;
  totalUnassignedCount: number = 0;
  filteredUnassignedTickets: any[] = [];

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type; // Set the toast type
    this.toastVisible = true;

    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }

  ngOnInit() {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedAdmin) {
      this.retrieveCollectedData().then(() => {
        // Now call the methods that depend on collectedData being loaded
        this.retrieveMembers();
        this.fetchPROBIssues();
        this.fetchAllTickets();
      });
    } else {
      this.router.navigate(['/  ']);
    }

    // Sign in and fetch Firebase data, then fetch PROB issues and tickets
    this.signInWithEmailAndPassword('stefan@admin.com', 'hemligt123').then(() => {

    });
  }

  getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  updateTicketAssignee(ticketId: number, assigneeId: string) {
    this.isLoading = true;
    this.retrieveMembers();
    let vacation = false;
    if (assigneeId === '1') {
      this.showToast('No valid assignee selected!', 'warning'); // Show warning toast
      return;
    }

    // Check if the assignee is on vacation by iterating through displayMembers
    this.displayMembers.forEach(user => {
      if (user.zendeskID == assigneeId && user.vacation == true) {
        this.showToast(`${user.name} is on vacation`, 'warning'); // Show warning toast
        vacation = true;
        this.isLoading = false;
      }
    });

    if (!vacation) {
      const headers = { 'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ' }; // Replace with your actual API key

      this.http
        .post(
          'https://backendchatgpt-050f.onrender.com/assignTicket',
          {
            ticketId: ticketId,
            userId: assigneeId,
          },
          { headers },
        )
        .subscribe({
          next: (response: any) => {
            localStorage.removeItem('zendeskTickets');
            localStorage.removeItem('zendeskTicketsTimestamp');
            this.isLoading = true;
            this.showToast('Ticket assigned successfully!', 'success');

            this.fetchAllTickets();
          },
          error: error => {
            this.showToast('Error assigning ticket!', 'error'); // Show error toast
            console.error('Error assigning ticket:', error); // Keep error logging for debugging
          },
        });
    }
  }

  displayMembers: any[] = []; // Array to store filtered members for display

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
            .filter(member => member.name !== 'All'); // Filter out the member named "All"

          // Sort members by name in ascending order, add "Select Assignee" option at the start
          this.members.sort((a: any, b: any) => a.name.localeCompare(b.name));
          this.members.unshift({ zendeskID: 'none', name: 'Select Assignee' });

          // Exclude "Select Assignee" for the displayMembers array
          this.displayMembers = this.members.filter(member => member.name !== 'Select Assignee');
        } else {
          console.log('No members data available.');
        }
      })
      .catch(error => {
        console.error('Error retrieving members data:', error);
      });
  }

  fetchPROBIssues() {
    const headers = { 'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ' };
    this.http.get('https://backendchatgpt-050f.onrender.com/GetPROBIssues', { headers }).subscribe(
      (response: any) => {
        this.probIssues = response.issues.map(issue => {
          const tier = this.getCarrierTier(issue.carrierID);
          const carrierCIS = this.getCarrierCIS(issue.carrierID); // Hämtar CIS för Carrier ID

          return {
            ...issue,
            carrierID: issue.carrierID || 'N/A',
            carrierName: issue.carrierName || 'N/A',
            title: issue.title || 'No Title',
            tier,
            carrierCIS, // Lägger till CIS till varje issue
          };
        });
        this.probIssueCount = this.probIssues.length; // Uppdaterar antal PROB-issues
        this.fetchAllTickets();
      },
      error => {
        console.error('Error fetching PROB issues:', error);
      },
    );
  }

  getCarrierTier(carrierID: number) {
    if (!carrierID) {
      return 'Not Found';
    }
    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierID.toString(),
    );

    return carrierEntry ? carrierEntry.tier : 'Not Found'; // Return Tier or 'Not Found'
  }

  toggleVacationStatus(index: number) {
    const member = this.members[index + 1];
    member.vacation = !member.vacation;

    // Update the specific member's vacation status in Firebase
    const memberRef = ref(this.db, `members/${member.key}`); // Using the key for the specific member
    update(memberRef, { vacation: member.vacation })
      .then(() => {
        const status = member.vacation ? 'on vacation' : 'available'; // Determine the status
        this.showToast(`${member.name} is now ${status}`, 'success'); // Show success toast
      })
      .catch(error => {
        console.error('Error updating vacation status:', error);
        this.showToast('Error updating vacation status!', 'error'); // Show error toast
      });
  }

  signInWithEmailAndPassword(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(userCredential => {
        console.log('Signed in successfully:', userCredential.user);
      })
      .catch(error => {
        console.error('Error signing in:', error);
      });
  }

  retrieveCollectedData(): Promise<void> {
    const dataRef = ref(this.db, 'Collected Data');

    return get(dataRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.collectedData = Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return { key, ...value };
            } else {
              return { key, value };
            }
          });
        } else {
          console.log('No data available at the specified path.');
        }
      })
      .catch(error => {
        console.error('Error retrieving data from Firebase:', error);
      });
  }

  fetchAllTickets() {
    const headers = { 'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ' };
    // Check if data is stored in localStorage and if it is still valid
    const storedData = localStorage.getItem('zendeskTickets');
    const storedTimestamp = localStorage.getItem('zendeskTicketsTimestamp');

    if (storedData && storedTimestamp) {
      const now = new Date().getTime();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

      // If the stored data is still within the 30-minute window, use it
      if (now - parseInt(storedTimestamp) < thirtyMinutes) {
        const response = JSON.parse(storedData);
        this.processTicketResponse(response);
        return;
      } else {
        localStorage.removeItem('zendeskTickets');
        localStorage.removeItem('zendeskTicketsTimestamp');
      }
    }

    // If not in localStorage or expired, call the API
    this.http.get('https://backendchatgpt-050f.onrender.com/GetAllTickets', { headers }).subscribe(
      (response: any) => {
        console.log('Fetched new ticket data from API');
        localStorage.setItem('zendeskTickets', JSON.stringify(response)); // Save data to localStorage
        localStorage.setItem('zendeskTicketsTimestamp', new Date().getTime().toString()); // Save timestamp
        this.processTicketResponse(response); // Process the data
      },
      error => {
        console.error('Error fetching tickets:', error);
      },
    );
  }

  syncTier1AndTier2Unassigned() {
    this.isLoading = true;
    this.filteredUnassignedTickets = this.unassignedTickets
      .filter(ticket => ticket.tier === 'tier 1' || ticket.tier === 'tier 2')
      .map(ticket => {
        const assignedMember = this.members.find(member => member.name === ticket.assigned_to);

        if (assignedMember) {
          ticket.zendeskID = assignedMember.zendeskID;
          console.log(
            `Ticket ${ticket.ticket_id} assigned to ${ticket.assigned_to} with Zendesk ID ${assignedMember.zendeskID}`,
          );

          // Kontrollera om tilldelad person är på semester
          let vacation = false;
          this.displayMembers.forEach(user => {
            if (user.zendeskID === assignedMember.zendeskID && user.vacation) {
              console.log(`${user.name} is on vacation`);
              this.showToast(`${user.name} is on vacation`, 'warning'); // Show warning toast

              vacation = true;
            }
          });

          if (!vacation) {
            console.log('Updating ticket:', ticket.ticket_id, 'to assignee:', assignedMember.zendeskID);
            const headers = { 'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ' }; // Ersätt med din API-nyckel
            this.http
              .post(
                'https://backendchatgpt-050f.onrender.com/assignTicket',
                {
                  ticketId: ticket.ticket_id,
                  userId: assignedMember.zendeskID,
                },
                { headers },
              )
              .subscribe({
                next: (response: any) => {
                  this.showToast('Tickets assigned successfully!', 'success'); // Show success toast
                  localStorage.removeItem('zendeskTickets');
                  localStorage.removeItem('zendeskTicketsTimestamp');
                  this.fetchAllTickets();
                },
                error: error => {
                  console.error('Error assigning ticket:', error);
                },
              });
          } else {
            console.log(`Cannot assign ticket ${ticket.ticket_id} because ${assignedMember.name} is on vacation`);
          }
        } else {
          console.log(`Zendesk ID not found for ${ticket.assigned_to} in ticket ${ticket.ticket_id}`);
        }

        return ticket;
      });

    console.log('Filtered Unassigned Tickets with Zendesk IDs:', this.filteredUnassignedTickets);
  }

  // Separate method to process the ticket response data
  processTicketResponse(response: any) {
    this.assignedTickets = response.assignedTickets;
    this.unassignedTickets = response.unassignedTickets;

    // Format created_at and updated_at dates
    this.unassignedTickets.forEach(ticket => {
      ticket.created_at = this.formatDate(ticket.created_at);
      ticket.updated_at = this.formatDate(ticket.updated_at);

      // Assign responsibility based on carrierCIS
      const carrierCIS = this.getCarrierCIS(ticket.carrier_id);
      ticket.assigned_to = carrierCIS !== 'Not Found' ? carrierCIS : 'All';

      // Now check if tier is missing, and retrieve it from collectedData if necessary
      let tier = ticket.tier || 'Not found';
      if (tier === 'N/A') {
        const carrierEntry = this.collectedData.find(data =>
          data.carrierConceptID != null && ticket.carrier_id != null && data.carrierConceptID.toString() === ticket.carrier_id.toString()
        );

        // If found, format the tier correctly
        if (carrierEntry) {
          tier = typeof carrierEntry.tier === 'number' ? `tier ${carrierEntry.tier}` : carrierEntry.tier;
        }
      }
      ticket.tier = tier;
    });

    // Sort unassigned tickets by priority in order: urgent > high > medium > low
    const priorityOrder = { urgent: 1, high: 2, normal: 3, low: 4 };

    // Sort unassigned tickets by priority
    this.unassignedTickets.sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 5; // Default to lowest if priority missing
      const priorityB = priorityOrder[b.priority] || 5;
      return priorityA - priorityB; // Sort by priority order
    });

    // Calculate totals for unassigned tickets by tier and priority
    this.unassignedTier1Count = this.unassignedTickets.filter(ticket => ticket.tier === 'tier 1').length;
    this.unassignedTier2Count = this.unassignedTickets.filter(ticket => ticket.tier === 'tier 2').length;
    this.unassignedTier3Count = this.unassignedTickets.filter(ticket => ticket.tier === 'tier 3').length;
    this.unassignedPriorityLowCount = this.unassignedTickets.filter(ticket => ticket.priority === 'low').length;
    this.unassignedPriorityMediumCount = this.unassignedTickets.filter(ticket => ticket.priority === 'medium').length;
    this.unassignedPriorityHighCount = this.unassignedTickets.filter(ticket => ticket.priority === 'high').length;
    this.unassignedPriorityUrgentCount = this.unassignedTickets.filter(ticket => ticket.priority === 'urgent').length;
    this.totalUnassignedCount = this.unassignedTickets.length;

    // Update each member's ticket counts
    this.members.forEach(member => {
      const memberTickets = this.assignedTickets.find(assigned => assigned.zendeskID === member.zendeskID);
      member.ticket_count = memberTickets ? memberTickets.ticket_count : 0;
      member.tier1Tickets = memberTickets ? memberTickets.tier1Tickets : 0;
      member.tier2Tickets = memberTickets ? memberTickets.tier2Tickets : 0;
      member.tier3Tickets = memberTickets ? memberTickets.tier3Tickets : 0;
      member.priorityLowTickets = memberTickets ? memberTickets.priorityLowTickets : 0;
      member.priorityMediumTickets = memberTickets ? memberTickets.priorityMediumTickets : 0;
      member.priorityHighTickets = memberTickets ? memberTickets.priorityHighTickets : 0;
      member.priorityUrgentTickets = memberTickets ? memberTickets.priorityUrgentTickets : 0;
    });

    this.isLoading = false;
  }

  // Helper function to format date to yyyy-mm-dd:hh:mm
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  assignTicketResponsibility(ticket) {
    // Logic to determine the responsible member for unassigned tickets based on carrier_id or tier
    return this.members.find(member => {
      // Example condition: replace this with actual logic to match based on carrier_id or tier
      return member.zendeskID === ticket.carrier_id; // Placeholder, adapt as needed
    });
  }

  fetchFilteredUnassignedTickets() {
    const headers = { 'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ' };

    this.http.get('https://backendchatgpt-050f.onrender.com/GetFilteredUnassignedTickets', { headers }).subscribe(
      (response: any) => {
        console.log('Filtered Tickets Response:', response); // Log response from API
        this.tickets = response.filteredTickets.map(ticket => {
          const carrierCIS = this.getCarrierCIS(ticket.carrier_number);
          console.log('Mapped Ticket:', { ...ticket, carrierCIS }); // Log mapped tickets
          return { ...ticket, carrierCIS };
        });
        this.zendeskTicketCount = this.tickets.length; // Update the count
        this.isLoading = false; // Data loaded
      },
      error => {
        console.error('Error fetching tickets:', error);
        this.isLoading = false;
      },
    );
  }

  // Method to get CIS responsible for a carrier from Firebase data
  getCarrierCIS(carrierNumber: number) {
    if (!carrierNumber) {
      return 'Not Found'; // Early return if the carrierNumber is invalid
    }

    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierNumber.toString(),
    );

    return carrierEntry ? carrierEntry.cis : 'Not Found'; // Return CIS or 'Not Found'
  }
}
