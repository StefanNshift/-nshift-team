import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, ref, update } from '@angular/fire/database';
import { Router } from '@angular/router';
import { WizardbackendService } from '../../../backend/wizardbackend.service';

@Component({
  selector: 'app-carriertickets',
  templateUrl: './carriertickets.component.html',
})
export class CarrierTicketComponent implements OnInit {
  constructor(
    private router: Router,
    private http: HttpClient,
    private db: Database,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private wizardBackendService: WizardbackendService,
  ) {}

  tickets: any[] = [];
  collectedData: any[] = [];
  isLoading = true;
  members: any[] = [];
  members1: any[] = [];
  toastVisible = false;
  toastMessage = '';
  toastType = ''; //
  probIssues: any[] = [];
  probIssueCount = 0;
  zendeskTicketCount = 0;
  assignedTickets: any[] = [];
  unassignedTickets: any[] = [];

  unassignedTier1Count = 0;
  unassignedTier2Count = 0;
  unassignedTier3Count = 0;
  unassignedPriorityLowCount = 0;
  unassignedPriorityMediumCount = 0;
  unassignedPriorityHighCount = 0;
  unassignedPriorityUrgentCount = 0;
  totalUnassignedCount = 0;
  filteredUnassignedTickets: any[] = [];

  displayMembers: any[] = []; // Array to store filtered members for display
  private listener: () => void;

  TicketFieldObject: any[] = [];
  ticketFieldOptions: any[] = [];

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
    const observer = new MutationObserver(() => {
      const refreshBtn = document.querySelector('.btn-clear-session');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.isLoading = true;
          localStorage.removeItem('zendeskTickets');
          localStorage.removeItem('zendeskTicketsTimestamp');
          this.retrieveCollectedData().then(() => {
            // Now call the methods that depend on collectedData being loaded
            this.retrieveMembers();
            this.fetchPROBIssues();
            this.fetchZendeskTicketFieldOptions();
            this.fetchAllTickets();
          });
        });
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedAdmin) {
      this.retrieveCollectedData().then(() => {
        // Now call the methods that depend on collectedData being loaded
        this.retrieveMembers();
        this.fetchPROBIssues();
        this.fetchZendeskTicketFieldOptions();
        this.fetchAllTickets();
      });
    } else {
      this.router.navigate(['/  ']);
    }
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
      this.isLoading = false;
      return;
    }

    // Kontrollera om tilldelad person är på semester
    this.displayMembers.forEach(user => {
      if (user.zendeskID === assigneeId && user.vacation) {
        this.showToast(`${user.name} is on vacation`, 'warning'); // Show warning toast
        vacation = true;
        this.isLoading = false;
      }
    });

    if (!vacation) {
      // Använd WizardbackendService för att tilldela ticket
      this.wizardBackendService.assignTicket(ticketId, assigneeId).subscribe({
        next: (response: any) => {
          localStorage.removeItem('zendeskTickets');
          localStorage.removeItem('zendeskTicketsTimestamp');
          this.showToast('Ticket assigned successfully!', 'success');
          this.isLoading = false;
          this.fetchAllTickets(); // Uppdatera tickets efter lyckad tilldelning
        },
        error: error => {
          this.showToast('Error assigning ticket!', 'error'); // Show error toast
          console.error('Error assigning ticket:', error); // Håll kvar fel-loggning för debugging
          this.isLoading = false;
        },
      });
    }
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
    this.wizardBackendService.getPROBIssues().subscribe(
      (response: any) => {
        this.probIssues = response.issues.map(issue => {
          const tier = this.getCarrierTier(issue.carrierID);
          const carrierCIS = this.getCarrierCIS(issue.carrierID);

          return {
            ...issue,
            carrierID: issue.carrierID || 'N/A',
            carrierName: issue.carrierName || 'N/A',
            title: issue.title || 'No Title',
            tier,
            carrierCIS,
          };
        });
        this.probIssueCount = this.probIssues.length;
        this.fetchAllTickets(); // Fortsätt flödet efter data hämtats
      },
      error => {
        console.error('Error fetching PROB issues:', error);
      },
    );
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
    // Check if data is stored in localStorage and if it is still valid
    const storedData = localStorage.getItem('zendeskTickets');
    const storedTimestamp = localStorage.getItem('zendeskTicketsTimestamp');

    if (storedData && storedTimestamp) {
      const now = new Date().getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (now - parseInt(storedTimestamp, 10) < thirtyMinutes) {
        const response = JSON.parse(storedData);
        this.processTicketResponse(response);
        return;
      } else {
        localStorage.removeItem('zendeskTickets');
        localStorage.removeItem('zendeskTicketsTimestamp');
      }
    }

    // If not in localStorage or expired, call the API using WizardbackendService
    this.wizardBackendService.getAllTickets().subscribe(
      (response: any) => {
        localStorage.setItem('zendeskTickets', JSON.stringify(response)); // Save data to localStorage
        localStorage.setItem('zendeskTicketsTimestamp', new Date().getTime().toString()); // Save timestamp
        this.processTicketResponse(response); // Process the data
      },
      error => {
        console.error('Error fetching tickets from Wizard Backend:', error);
      },
    );
  }

  analyzeTicketsForCarrierID() {
    const ticketsWithoutCarrierID = this.unassignedTickets.filter(
      ticket => !ticket.carrier_id || ticket.carrier_id === 'N/a',
    );

    if (ticketsWithoutCarrierID.length === 0) {
      this.showToast('No tickets without Carrier ID found.', 'warning');
      return;
    }

    this.wizardBackendService.analyzeTicketsForCarrierID(ticketsWithoutCarrierID).subscribe({
      next: (response: any) => {
        const updatedTicketsForZendesk = response.updatedTickets
          .map((updatedTicket: any) => {
            const index = this.unassignedTickets.findIndex(ticket => ticket.ticket_id === updatedTicket.ticket_id);
            if (index !== -1) {
              const carrierID = updatedTicket.carrier_id;
              console.log(updatedTicket);
              const zendeskCarrier = this.ticketFieldOptions.find(option => option.conceptID === carrierID);

              if (!zendeskCarrier) {
                return null;
              }

              const tier = this.getCarrierTier(carrierID);
              const formattedTier = tier ? `tier_${tier}` : 'N/A';

              // Flytta uppdatering av ticket-data efter bekräftelse
              const confirmUpdate = confirm(
                `Carrier Match Found!\nDo you want to update Ticket ID: ${updatedTicket.ticket_id}?\nCarrier Field: ${zendeskCarrier.carrierName}`,
              );

              if (confirmUpdate) {
                this.unassignedTickets[index].carrier_id = carrierID;
                this.unassignedTickets[index].carrierName = this.getCarrierName(carrierID);
                this.unassignedTickets[index].assigned_to = this.getAssignedMember(carrierID);

                return {
                  ticket_id: updatedTicket.ticket_id,
                  zendeskCarrierName: zendeskCarrier.carrierName,
                  tier: formattedTier,
                };
              }
              this.showToast('Auto-detect Completed', 'success');

              return null;
            }
          })
          .filter(ticket => ticket !== null);

        if (updatedTicketsForZendesk.length > 0) {
          this.wizardBackendService.updateZendeskTickets(updatedTicketsForZendesk).subscribe({
            next: () => {
              this.showToast('Tickets updated in Zendesk!', 'success');
            },
            error: error => {
              console.error('Error updating Zendesk tickets:', error);
              this.showToast('Failed to update Zendesk tickets.', 'error');
            },
          });
        }
      },
      error: error => {
        console.error('Error analyzing carrier ID:', error);
        this.showToast('Error analyzing Carrier ID.', 'error');
      },
    });
  }

  syncAllUnassignedTickets() {
    this.isLoading = true;
    this.filteredUnassignedTickets = this.unassignedTickets.map(ticket => {
      const assignedMember = this.members.find(member => member.name === ticket.assigned_to);

      if (assignedMember) {
        ticket.zendeskID = assignedMember.zendeskID;
        let vacation = false;
        this.displayMembers.forEach(user => {
          if (user.zendeskID === assignedMember.zendeskID && user.vacation) {
            this.showToast(`${user.name} is on vacation`, 'warning');
            vacation = true;
          }
        });

        if (!vacation) {
          this.wizardBackendService.assignTicket(ticket.ticket_id, assignedMember.zendeskID).subscribe({
            next: (response: any) => {
              this.showToast('Tickets assigned successfully!', 'success');
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

    if (this.filteredUnassignedTickets.length === 0) {
      this.showToast(`No unassigned tickets to assign`, 'warning'); // Show warning toast
      this.isLoading = false;
    }
  }

  // Separate method to process the ticket response data
  processTicketResponse(response: any) {
    this.assignedTickets = response.assignedTickets;
    this.unassignedTickets = response.unassignedTickets;

    // Format created_at and updated_at dates
    this.unassignedTickets.forEach(ticket => {
      ticket.created_at = this.formatDate(ticket.created_at);
      ticket.updated_at = this.formatDate(ticket.updated_at);
      ticket.carrierName = this.getCarrierName(ticket.carrier_id);
      if (ticket.carrier_id == null) {
        ticket.carrier_id = 'N/a';
      }

      // Assign responsibility based on carrierCIS
      const carrierCIS = this.getCarrierCIS(ticket.carrier_id);
      ticket.assigned_to = carrierCIS !== 'Not Found' ? carrierCIS : 'All';

      // Now check if tier is missing, and retrieve it from collectedData if necessary
      let tier = ticket.tier || 'Not found';
      const carrierEntry = this.collectedData.find(
        data =>
          data.carrierConceptID != null &&
          ticket.carrier_id != null &&
          data.carrierConceptID.toString() === ticket.carrier_id.toString(),
      );

      if (carrierEntry) {
        tier = typeof carrierEntry.tier === 'number' ? `tier ${carrierEntry.tier}` : carrierEntry.tier;
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

  // Hämta Carrier-namn baserat på carrier_id
  getCarrierName(carrierID: number): string {
    if (!carrierID) {
      return 'N/a';
    } // Om ingen carrier_id finns, returnera "N/a"

    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierID.toString(),
    );

    return carrierEntry ? carrierEntry.carrier : 'Not Found';
  }

  // Hämta Tier baserat på carrier_id
  getCarrierTier(carrierID: number): string {
    if (!carrierID) {
      return 'Not Found';
    }

    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierID.toString(),
    );

    return carrierEntry ? `Tier ${carrierEntry.tier}` : 'Not Found';
  }

  // Hämta Carrier CIS baserat på carrier_id
  getCarrierCIS(carrierID: number): string {
    if (!carrierID) {
      return 'Not Found';
    }

    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierID.toString(),
    );

    return carrierEntry ? carrierEntry.cis : 'Not Found';
  }

  getAssignedMember(carrierID: number | string): string {
    if (!carrierID) {
      return 'All';
    }

    const carrierEntry = this.collectedData.find(
      data => data.carrierConceptID && data.carrierConceptID.toString() === carrierID.toString(),
    );

    return carrierEntry ? carrierEntry.cis : 'All'; // Om inget hittas, sätt 'All' som default
  }

  fetchZendeskTicketFieldOptions() {
    this.wizardBackendService.GetZendeskTicketFieldOption().subscribe(
      response => {
        this.TicketFieldObject = response;

        this.ticketFieldOptions = response.ticket_field.custom_field_options.map(option =>
          this.processTicketFieldOption(option),
        );

        this.ticketFieldOptions.sort((a, b) => {
          if (a.conceptID === 'N/A') {
            return 1;
          }
          if (b.conceptID === 'N/A') {
            return -1;
          }
          return (b.conceptID || 0) - (a.conceptID || 0);
        });
      },
      error => {
        console.error('Failed to fetch ticket fields:', error);
      },
    );
  }

  processTicketFieldOption(option: any): any {
    const trimmedName = option.name.trim();

    let conceptID: any = 'N/A';

    if (!trimmedName.match(/^01\s*-\s*N\/A$/)) {
      const conceptIDMatch = trimmedName.match(/(\d+)(?=\s*-|\)$|$)/);
      conceptID =
        conceptIDMatch && !isNaN(parseInt(conceptIDMatch[1], 10))
          ? parseInt(conceptIDMatch[1].replace(/^0/, ''), 10)
          : 'N/A';
    }

    return {
      carrierName: option.value,
      conceptID: conceptID,
    };
  }
}
