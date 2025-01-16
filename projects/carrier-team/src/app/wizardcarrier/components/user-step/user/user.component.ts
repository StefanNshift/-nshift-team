import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, ref, update } from '@angular/fire/database';
import { Router } from '@angular/router';
import { WizardbackendService } from '../../backend/wizardbackend.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  tickets: any[] = []; // Array to hold ticket data
  collectedData: any[] = []; // Holds the data retrieved from Firebase
  isLoading = true;
  members: any[] = [];
  members1: any[] = [];
  toastVisible = false; // Control visibility of the toast
  toastMessage = ''; // Message to display in the toast
  toastType = ''; // To control the type of toast
  probIssues: any[] = []; // Array to hold PROB issues data
  probIssueCount = 0; // Count of PROB issues
  zendeskTicketCount = 0; // Count of Zendesk tickets
  assignedTickets: any[] = [];
  unassignedTickets: any[] = [];
  jiraVisibility: boolean[] = []; // Håller reda på synligheten för JIRA-sektionerna
  ticketsToBeAnsweredCount = 0; // Variabel för att lagra antal ärenden
  allExpanded: boolean = false;
  user: any;

  ///Modal

  selectedTicket: any = null;

  selectedTemplate: string | null = null;
  newETA: string = '';
  customMessage: string = '';
  includeRequesterName: boolean = false; // Toggle for including requester name
  ShouldBeInternal: boolean = false; // Toggle for including requester name

  requesterName: string = ''; // Latest public message sender
  messageTemplates: { label: string; value: string }[] = [
    {
      label: 'Delayed Message',
      value:
        'Hi{{sender}}, we would like to inform you that the estimated resolution time for your case has been updated to {{newETA}}. Thank you for your understanding and patience.',
    },
    {
      label: 'Working on Issue',
      value:
        'Hi{{sender}}, our team is actively working on resolving your issue, and the new estimated resolution time is {{newETA}}. We appreciate your patience and understanding.',
    },
    {
      label: 'Updated Resolution Date',
      value:
        'Hi{{sender}}, thank you for your continued trust in us. Please note that the updated resolution date for your ticket is {{newETA}}.',
    },
    {
      label: 'Urgent Attention Required',
      value:
        'Hi{{sender}}, this issue requires urgent attention. The updated resolution date is {{newETA}}. Please let us know if you need further assistance.',
    },
    {
      label: 'Further Updates',
      value:
        'Hi{{sender}}, we are continuing to investigate your issue and will provide updates as they become available. The estimated resolution date is {{newETA}}.',
    },
    {
      label: 'Follow-Up Required',
      value:
        'Hi{{sender}}, we would like to follow up regarding your case. The updated resolution date is {{newETA}}. Please let us know if you have any further questions.',
    },
    {
      label: 'Case Resolution Timeline',
      value:
        'Hi{{sender}}, we are diligently working to resolve your case. The current estimated timeline for resolution is {{newETA}}. Thank you for your understanding and patience.',
    },
    {
      label: 'Thank You for Your Patience',
      value:
        'Hi{{sender}}, thank you for your patience while we resolve your issue. The updated resolution date is {{newETA}}. Please feel free to reach out if you need further information.',
    },
  ];

  tier1Tickets = 0;
  tier2Tickets = 0;
  tier3Tickets = 0;
  unassignedPriorityLowCount = 0;
  unassignedPriorityMediumCount = 0;
  unassignedPriorityHighCount = 0;
  unassignedPriorityUrgentCount = 0;
  totalUnassignedCount = 0;
  filteredUnassignedTickets: any[] = [];
  sortKey = ''; // Key to sort by
  sortDirection = 'asc'; // Direction of sorting: 'asc' or 'desc'

  constructor(
    private router: Router,
    private http: HttpClient,
    private db: Database,
    private auth: Auth,
    private wizardBackendService: WizardbackendService, // Lägg till denna
  ) {}

  toggleJiraVisibility(index: number) {
    this.jiraVisibility[index] = !this.jiraVisibility[index];
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

  ngOnInit() {
    // Check if user data is stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser) {
      this.user = JSON.parse(storedUser);

      this.fetchAllTickets(this.user.email);
    }
  }

  private fetchAllTickets(user: string) {
    this.wizardBackendService.getAllUserTickets(user).subscribe(
      (response: any) => {
        console.log('Fetched user ticket data:', response);

        // Assign ticket counts
        this.tier1Tickets = response.assignedTickets[0]?.tier1Tickets || 0;
        this.tier2Tickets = response.assignedTickets[0]?.tier2Tickets || 0;
        this.tier3Tickets = response.assignedTickets[0]?.tier3Tickets || 0;
        this.zendeskTicketCount = response.assignedTickets[0]?.ticket_count || 0;
        const processedTickets = this.calculateETA(response.assignedTickets[0]?.tickets || []);
        this.assignedTickets = processedTickets;

        // Sort tickets by priority (default order)
        this.sortKey = 'priority';
        this.sortDirection = 'asc';
        this.sortTickets();
        this.countTicketsToBeAnswered();
        this.isLoading = false;
      },
      error => {
        console.error('Error fetching tickets:', error);
        this.isLoading = false;
      },
    );
  }

  private calculateETA(tickets: any[]): any[] {
    return tickets.map(ticket => {
      let latestEndDate: string | null = null;

      ticket.jiraData.forEach((jira: any) => {
        const currentSprint = jira.sprints.currentSprint;
        if (currentSprint && currentSprint.endDate) {
          if (!latestEndDate || new Date(currentSprint.endDate) > new Date(latestEndDate)) {
            latestEndDate = currentSprint.endDate;
          }
        }
      });

      return {
        ...ticket,
        eta: latestEndDate ? new Date(latestEndDate).toISOString() : null,
      };
    });
  }

  toggleAllJiraSections(): void {
    this.allExpanded = !this.allExpanded;
    this.jiraVisibility = this.assignedTickets.map(() => this.allExpanded);
  }

  isToBeAnswered(updatedAt: string): boolean {
    const today = new Date().getTime();
    const updatedDate = new Date(updatedAt).getTime();
    const daysDiff = (today - updatedDate) / (1000 * 3600 * 24);

    return daysDiff > 5; // Returnerar true om mer än 5 dagar har gått
  }

  isOlderThanFiveDays(date: string | null): boolean {
    if (!date) {
      return false;
    }

    const updatedAt = new Date(date);
    const today = new Date();
    const timeDifference = today.getTime() - updatedAt.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    return daysDifference > 5;
  }

  private countTicketsToBeAnswered() {
    this.ticketsToBeAnsweredCount = this.assignedTickets.filter(ticket => {
      const updatedAt = new Date(ticket.updated_at);
      const today = new Date();
      const timeDifference = today.getTime() - updatedAt.getTime();
      const daysDifference = timeDifference / (1000 * 3600 * 24);

      return daysDifference > 5; // Ärenden äldre än 5 dagar
    }).length;
  }

  private sortTickets() {
    // Prioritetsordning
    const priorityOrder = ['urgent', 'high', 'normal', 'low'];
    const tierOrder = ['tier1', 'tier2', 'tier3', 'tier4'];

    this.assignedTickets.sort((a, b) => {
      let valueA = a[this.sortKey];
      let valueB = b[this.sortKey];

      // Anpassad sortering för Priority
      if (this.sortKey === 'priority') {
        const indexA = priorityOrder.indexOf(valueA);
        const indexB = priorityOrder.indexOf(valueB);

        if (indexA === -1 && indexB === -1) {
          return 0;
        }
        if (indexA === -1) {
          return 1;
        }
        if (indexB === -1) {
          return -1;
        }

        return this.sortDirection === 'asc' ? indexA - indexB : indexB - indexA;
      }

      // Anpassad sortering för Tier
      if (this.sortKey === 'tier') {
        const indexA = tierOrder.indexOf(valueA);
        const indexB = tierOrder.indexOf(valueB);

        if (indexA === -1 && indexB === -1) {
          return 0;
        }
        if (indexA === -1) {
          return 1;
        }
        if (indexB === -1) {
          return -1;
        }

        return this.sortDirection === 'asc' ? indexA - indexB : indexB - indexA;
      }

      // Sortera ärenden som borde bli besvarade
      if (this.sortKey === 'toBeAnswered') {
        const updatedAtA = new Date(a.updated_at).getTime();
        const updatedAtB = new Date(b.updated_at).getTime();

        const today = new Date().getTime();
        const daysDiffA = (today - updatedAtA) / (1000 * 3600 * 24);
        const daysDiffB = (today - updatedAtB) / (1000 * 3600 * 24);

        const isOlderA = daysDiffA > 5;
        const isOlderB = daysDiffB > 5;

        if (isOlderA && !isOlderB) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (!isOlderA && isOlderB) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }

        return 0;
      }

      // Hantera ETA och Updated At som datum
      if (this.sortKey === 'eta' || this.sortKey === 'updated_at') {
        valueA = valueA ? new Date(valueA).getTime() : null;
        valueB = valueB ? new Date(valueB).getTime() : null;

        if (valueA === null || valueA === undefined) {
          return 1;
        }
        if (valueB === null || valueB === undefined) {
          return -1;
        }

        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Sortera övriga värden
      if (valueA === null || valueA === undefined) {
        return 1;
      }
      if (valueB === null || valueB === undefined) {
        return -1;
      }

      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }

      return 0;
    });
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement; // Typantydning
    const sortOption = selectElement.value;

    if (!sortOption) {
      return; // Om inget val är gjort, gör inget
    }

    const [key, direction] = sortOption.split(':');
    this.sortKey = key;
    this.sortDirection = direction;

    this.sortTickets();
  }

  ///Modal

  openModal(ticket: any) {
    this.selectedTicket = ticket;
    this.newETA = ticket?.eta ? new Date(ticket.eta).toISOString().split('T')[0] : '';
    this.customMessage = '';
    this.requesterName = '';

    this.wizardBackendService.GetZendeskTicketRequesterName(ticket.ticket_id).subscribe(
      response => {
        this.requesterName = response.requesterName || 'Customer';
        console.log('Requester Name:', this.requesterName);
        this.updateEmailText(); // Uppdatera med rätt mall
      },
      error => {
        console.error('Error fetching ticket data:', error);
        this.requesterName = 'Customer';
      },
    );

    const modal = document.getElementById('customModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }

    // Återställ `selectedTemplate` och `customMessage`
    this.selectedTemplate = null;
    this.customMessage = '';
    this.newETA = ''; // Återställ ETA också om du vill
  }

  updateEmailText() {
    if (this.selectedTemplate && this.newETA) {
      let message = this.selectedTemplate.replace(/{{newETA}}/g, this.newETA);
      if (this.includeRequesterName && this.requesterName) {
        message = message.replace(/{{sender}}/g, ` ${this.requesterName}`);
      } else {
        message = message.replace(/{{sender}}/g, '');
      }

      this.customMessage = message.trim(); // Trimma för att undvika extra blanksteg
      console.log('Updated customMessage:', this.customMessage);
    }
  }

  onETAChange(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    if (inputValue) {
      this.newETA = inputValue;
      console.log('New ETA:', this.newETA);
      this.updateEmailText(); // Uppdatera med det nya datumet
    }
  }

  onTemplateSelect(event: Event) {
    if (!this.newETA) {
      this.showToast('Please provide an ETA before selecting a message.', 'error');
      return;
    }

    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected template:', selectedValue);

    if (selectedValue) {
      this.selectedTemplate = selectedValue;
      this.updateEmailText(); // Uppdatera meddelandet med den valda mallen
    }
  }

  sendETAUpdate() {
    if (!this.newETA) {
      this.showToast('Please provide an ETA before sending the update.', 'error');
      return;
    }
    var sendPublic;
    if (this.ShouldBeInternal == true) {
      sendPublic = false;
    } else {
      sendPublic = true;
    }
    if (this.newETA && this.customMessage) {
      const updatePayload = {
        ticketId: this.selectedTicket.ticket_id,
        email: this.user.email,
        message: this.customMessage,
        public: sendPublic,
      };

      this.closeModal();

      // Call the ReplyZendeskTicket method
      this.wizardBackendService
        .ReplyZendeskTicket(updatePayload.ticketId, updatePayload.email, updatePayload.message, updatePayload.public)
        .subscribe(
          response => {
            console.log('Update successful:', response);
            this.showToast('ETA updated successfully for ' + this.selectedTicket.ticket_id, 'success');
            this.fetchAllTickets(this.user.email);
          },
          error => {
            console.error('Error updating ETA:', error);
            this.showToast('Failed to update ETA.', 'error');
          },
        );
    } else {
      this.showToast('Please provide an ETA and message.', 'error');
    }
  }

  updateETA() {
    if (this.newETA && this.selectedTicket) {
      this.selectedTicket.eta = this.newETA;

      this.updateTicketETA(this.selectedTicket.ticket_id, this.newETA).subscribe(
        () => {
          console.log('ETA updated successfully!');
          this.showToast('ETA updated successfully!', 'success');
          this.closeModal();
        },
        error => {
          console.error('Error updating ETA:', error);
          this.showToast('Fawiled to update ETA!', 'error');
        },
      );
    }
  }

  updateTicketETA(ticketId: string, eta: string) {
    const url = `https://your-backend-api/tickets/${ticketId}/update-eta`;
    return this.http.post(url, { eta });
  }

  confirmAction() {
    console.log('Confirm button clicked!');
    this.closeModal();
  }
}
