import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, ref, update } from '@angular/fire/database';
import { Router } from '@angular/router';
import { WizardbackendService } from '../../backend/wizardbackend.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './userticket.component.html',
  styleUrls: ['./userticket.component.scss'],
})
export class UserComponent implements OnInit {
  tickets: any[] = [];
  collectedData: any[] = [];
  isLoading = true;
  toastVisible = false;
  toastMessage = '';
  toastType = '';
  zendeskTicketCount = 0;
  ticketsMissingETACount = 0;
  assignedTickets: any[] = [];
  assignedTicketsBackup: any[] = [];
  activeFilter = '';
  responseType = 'public';

  unassignedTickets: any[] = [];
  jiraVisibility: boolean[] = [];
  ticketsToBeAnsweredCount = 0;
  allExpanded = false;
  user: any;
  ticketCountsByPriority: { [key: string]: number } = {};
  selectedTicket: any = null;
  selectedTemplate: string | null = null;
  newETA = '';
  adminEnabled = false;
  customMessage = '';
  includeRequesterName = false;
  ShouldBeInternal = false;
  requesterName = '';
  messageTemplates: { label: string; value: string }[] = [
    {
      label: 'Case Resolution Timeline',
      value:
        'Hi{{sender}}, we are diligently working to resolve your case. The current estimated timeline for resolution is {{newETA}}. Thank you for your understanding and patience.',
    },
    {
      label: 'Delayed Message',
      value:
        'Hi{{sender}}, we would like to inform you that the estimated resolution time for your case has been updated to {{newETA}}. Thank you for your understanding and patience.',
    },
    {
      label: 'Follow-Up Required',
      value:
        'Hi{{sender}}, we would like to follow up regarding your case. The updated resolution date is {{newETA}}. Please let us know if you have any further questions.',
    },
    {
      label: 'Further Updates',
      value:
        'Hi{{sender}}, we are continuing to investigate your issue and will provide updates as they become available. The estimated resolution date is {{newETA}}.',
    },
    {
      label: 'Thank You for Your Patience',
      value:
        'Hi{{sender}}, thank you for your patience while we resolve your issue. The updated resolution date is {{newETA}}. Please feel free to reach out if you need further information.',
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
      label: 'Working on Issue',
      value:
        'Hi{{sender}}, our team is actively working on resolving your issue, and the new estimated resolution time is {{newETA}}. We appreciate your patience and understanding.',
    },
  ];

  tier1Tickets = 0;
  tier2Tickets = 0;
  tier3Tickets = 0;
  ticketsMissingTACount = 0;
  unassignedPriorityLowCount = 0;
  unassignedPriorityMediumCount = 0;
  unassignedPriorityHighCount = 0;
  unassignedPriorityUrgentCount = 0;
  totalUnassignedCount = 0;
  filteredUnassignedTickets: any[] = [];
  sortKey = '';
  sortDirection = 'asc';
  constructor(
    private wizardBackendService: WizardbackendService, // Lägg till denna
  ) {}

  selectedEmail = ''; // För vald e-postadress

  // Lista med e-postadresser
  adminEmails = [
    'stefan.liden@nshift.com',
    'adriana.covrig@nshift.com',
    'andreas.elind@nshift.com',
    'crystal.aguilar@nshift.com',
    'anca.cava@nshift.com',
    'mark.austin@nshift.com',
    'karolina.karlsson@nshift.com',
    'siri.montell@nshift.com',
    'ciprian.balasa@nshift.com',
  ];

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

  handleEmailChange(email: string) {
    this.isLoading = true;
    this.fetchAllTickets(email);
    this.filterTickets('total');
  }

  ngOnInit() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      this.adminEnabled = true;
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
        this.fetchAllTickets(this.user.email);
        this.filterTickets('total');
      }
    }
  }

  private fetchAllTickets(user: string) {
    this.wizardBackendService.getAllUserTickets(user).subscribe(
      (response: any) => {
        this.tier1Tickets = response.assignedTickets[0]?.tier1Tickets || 0;
        this.tier2Tickets = response.assignedTickets[0]?.tier2Tickets || 0;
        this.tier3Tickets = response.assignedTickets[0]?.tier3Tickets || 0;
        this.zendeskTicketCount = response.assignedTickets[0]?.ticket_count || 0;

        // Process tickets and convert "tier" to numerical value
        const processedTickets = this.calculateETA(
          (response.assignedTickets[0]?.tickets || []).map(ticket => ({
            ...ticket,
            tier: this.convertTierToNumber(ticket.tier),
          })),
        );

        console.log(processedTickets);
        this.ticketCountsByPriority = this.countTicketsByPriority(processedTickets);
        this.ticketsMissingETACount = processedTickets.filter(ticket => !ticket.eta).length;
        this.assignedTickets = processedTickets;
        this.assignedTicketsBackup = [...processedTickets];
        this.sortKey = 'priority';
        this.sortDirection = 'asc';

        this.sortTickets();
        this.countTicketsToBeAnswered();
        console.log(this.tickets);
        this.isLoading = false;
      },
      error => {
        console.error('Error fetching tickets:', error);
        this.isLoading = false;
      },
    );
  }

  private convertTierToNumber(tier: string): number | null {
    switch (tier) {
      case 'tier 1':
        return 1;
      case 'tier 2':
        return 2;
      case 'tier 3':
        return 3;
      default:
        return null;
    }
  }

  private countTicketsByPriority(tickets: any[]): { [key: string]: number } {
    return tickets.reduce((counts, ticket) => {
      const priority = ticket.priority || 'Unknown';
      counts[priority] = (counts[priority] || 0) + 1;
      return counts;
    }, {});
  }

  private calculateETA(tickets: any[]): any[] {
    return tickets.map(ticket => {
      let latestEndDate: string | null = null;

      ticket.jiraData.forEach((jira: any) => {
        const currentSprint = jira.sprints?.currentSprint; // Kontrollera om sprints finns
        const futureSprintEndDates = jira.sprints?.futureSprints?.map((sprint: any) => sprint.endDate) || []; // Hantera undefined futureSprints

        // Hitta det senaste slutdatumet från framtida sprints eller nuvarande sprint
        const relevantDates = [
          ...(currentSprint && currentSprint.endDate ? [currentSprint.endDate] : []),
          ...futureSprintEndDates,
        ];

        const latestDateInSprints = relevantDates.reduce((latest, date) => {
          return !latest || new Date(date) > new Date(latest) ? date : latest;
        }, null);

        if (!latestEndDate || (latestDateInSprints && new Date(latestDateInSprints) > new Date(latestEndDate))) {
          latestEndDate = latestDateInSprints;
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

  private getDaysOld(updatedAt: string): number {
    if (!updatedAt) {
      return 0;
    }
    const updatedDate = new Date(updatedAt).getTime();
    const today = new Date().getTime();
    return Math.floor((today - updatedDate) / (1000 * 3600 * 24));
  }

  isToBeAnswered(updatedAt: string, ticket: any): boolean {
    const daysOld = this.getDaysOld(updatedAt);

    const hasUpcomingFutureSprint = ticket.jiraData?.some(
      jira =>
        jira.sprints?.futureSprints?.some(futureSprint => {
          const startDate = new Date(futureSprint.startDate);
          const today = new Date();
          const diffInDays = (startDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
          return diffInDays <= 5; // Sprint börjar inom 5 dagar
        }) ?? false, // Fall tillbaka till false om futureSprints inte existerar
    );

    if (hasUpcomingFutureSprint) {
      return false;
    }

    // console.log(`Analyzing ticket ID: ${ticket.ticket_id}`);
    // console.log(`Days since last update: ${daysOld}`);
    // console.log(`Priority: ${ticket.priority}`);
    // console.log(`Custom Status: ${ticket.customStatus}`);
    // console.log(`Jira Data:`, ticket.jiraData);

    // Carrier Development: Kräver uppdatering efter 10 dagar
    if (ticket.customStatus === 'Carrier Development') {
      if (daysOld > 10) {
        // console.log(`Ticket ID ${ticket.ticket_id} requires update due to Carrier Development older than 10 days.`);
        return true;
      }
      return false;
    }

    // Prioritet:
    if (ticket.priority === 'urgent' && daysOld > 2) {
      // console.log(`Ticket ID ${ticket.ticket_id} requires update due to Urgent priority older than 2 days.`);
      return true;
    }
    if (ticket.priority === 'high' && daysOld > 3) {
      // console.log(`Ticket ID ${ticket.ticket_id} requires update due to High priority older than 3 days.`);
      return true;
    }

    // Jira-data koppling:
    if (ticket.jiraData?.length > 0) {
      const allJiraClosed = ticket.jiraData.every(jira => jira.sprints?.ticketStatus === 'Closed');
      const hasActiveSprint = ticket.jiraData.some(jira => jira.sprints?.currentSprint);

      if (allJiraClosed && !['Closed', 'Resolved', 'Verified Fix'].includes(ticket.customStatus)) {
        // console.log(
        //   `Ticket ID ${ticket.ticket_id} requires update because all Jira tickets are closed but Zendesk status is not.`,
        // );
        return true;
      }

      if (hasActiveSprint) {
        // console.log(`Ticket ID ${ticket.ticket_id} does not require update due to active Jira sprint.`);
        return false;
      }
    }

    // Status Pending Customer eller Carrier Feedback: Kräver uppdatering efter 10 dagar
    if (['Pending Customer', 'Carrier Feedback'].includes(ticket.customStatus) && daysOld > 10) {
      // console.log(
      //   `Ticket ID ${ticket.ticket_id} requires update due to Pending Customer or Carrier Feedback status older than 10 days.`,
      // );
      return true;
    }

    // Status Open eller In Progress: Kräver uppdatering efter 5 dagar
    if (['Open', 'In Progress'].includes(ticket.customStatus) && daysOld > 5) {
      // console.log(`Ticket ID ${ticket.ticket_id} requires update due to Open or In Progress status older than 5 days.`);
      return true;
    }

    // Default: Kräver ingen uppdatering
    // console.log(`Ticket ID ${ticket.ticket_id} does not require an update.`);
    return false;
  }

  private countTicketsToBeAnswered() {
    this.ticketsToBeAnsweredCount = this.assignedTicketsBackup.filter(ticket =>
      this.isToBeAnswered(ticket.updated_at, ticket),
    ).length;
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

  hasPreviousSprints(ticket: any): boolean {
    if (!ticket.jiraData) {
      return false;
    }
    return ticket.jiraData.some((jira: any) => jira.sprints?.previousSprints?.length > 0);
  }

  isHoldStatus(status: string): boolean {
    const specialStatuses = [
      'Carrier Development',
      'Product Development',
      'Account Management',
      'Awaiting',
      'Accounting Services',
      'Customer meeting',
      'Software release',
    ];
    return specialStatuses.includes(status);
  }

  isPendingStatus(status: string): boolean {
    const pendingStatuses = [
      'Pending Customer',
      'Config feedback',
      'Subject Matter Expert',
      'Carrier feedback',
      'Release feedback',
      'Temporary fix',
      'Permanent fix',
    ];
    return pendingStatuses.includes(status);
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement; // Typantydning
    const sortOption = selectElement.value;

    if (!sortOption) {
      return;
    }

    const [key, direction] = sortOption.split(':');
    this.sortKey = key;
    this.sortDirection = direction;

    this.sortTickets();
  }

  getTierTicketsCount(tier: number): number {
    return this.assignedTicketsBackup.filter(ticket => ticket.tier === tier).length;
  }

  filterTickets(filter: string) {
    this.activeFilter = filter;
    this.jiraVisibility = this.assignedTicketsBackup.map(() => false);

    switch (filter) {
      case 'total':
        this.assignedTickets = [...this.assignedTicketsBackup];
        break;
      case 'needUpdate':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket =>
          this.isToBeAnswered(ticket.updated_at, ticket),
        );
        break;
      case 'urgent':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.priority === 'urgent');
        break;
      case 'high':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.priority === 'high');
        break;
      case 'normal':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.priority === 'normal');
        break;
      case 'low':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.priority === 'low');
        break;
      case 'missingETA':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => !ticket.eta);
        break;
      case 'delayed':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket =>
          ticket.jiraData?.some(jira => jira.sprints.previousSprints?.length > 0),
        );
        break;
      case 'closedJira':
        this.assignedTickets = this.assignedTicketsBackup.filter(
          ticket =>
            ticket.jiraData?.length > 0 && ticket.jiraData.every(jira => jira.sprints.ticketStatus === 'Closed'),
        );
        break;
      case 'tier1':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.tier === 1);
        break;
      case 'tier2':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.tier === 2);
        break;
      case 'tier3':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket => ticket.tier === 3);
        break;
      default:
        this.assignedTickets = [...this.assignedTicketsBackup];
        break;
    }

    // Sort tickets by priority after filtering
    this.sortTicketsByPriority();
  }

  private sortTicketsByPriority() {
    const priorityOrder = ['urgent', 'high', 'normal', 'low'];

    this.assignedTickets.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.priority);
      const indexB = priorityOrder.indexOf(b.priority);

      // Om prioritet inte finns i listan, lägg dem sist
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }

      return indexA - indexB;
    });
  }

  isJiraWithoutSprint(ticket: any): boolean {
    return (
      ticket.jiraData?.length > 0 &&
      ticket.jiraData.every(
        jira =>
          !jira.sprints?.currentSprint && (!jira.sprints?.futureSprints || jira.sprints.futureSprints.length === 0),
      )
    );
  }

  getDelayedTicketsCount(): number {
    return this.assignedTicketsBackup.filter(ticket =>
      ticket.jiraData?.some(jira => jira.sprints.previousSprints?.length > 0),
    ).length;
  }

  getClosedJiraTicketsCount(): number {
    return this.assignedTicketsBackup.filter(
      ticket => ticket.jiraData?.length > 0 && ticket.jiraData.every(jira => jira.sprints.ticketStatus === 'Closed'), // Kontrollera att det finns Jira-biljetter // Kontrollera att alla är 'Closed'
    ).length;
  }

  hasAllJiraClosed(ticket: any): boolean {
    // Kontrollera att alla Jira-biljetter i ticketens jiraData har status 'Closed'
    return (
      ticket.jiraData?.length > 0 && ticket.jiraData.every(jira => jira.sprints.ticketStatus === 'Closed') // Se till att det finns Jira-biljetter // Kontrollera att alla är 'Closed'
    );
  }

  openModal(ticket: any) {
    this.selectedTicket = ticket;

    this.newETA = ticket?.eta ? new Date(ticket.eta).toISOString().split('T')[0] : '';

    const delayedMessageTemplate = this.messageTemplates.find(template => template.label === 'Delayed Message');
    if (delayedMessageTemplate) {
      this.selectedTemplate = delayedMessageTemplate.value;
      this.updateEmailText();
    }

    // Visa placeholder medan datan laddas
    this.requesterName = 'Loading...';

    this.wizardBackendService.GetZendeskTicketRequesterName(ticket.ticket_id).subscribe(
      response => {
        this.requesterName = response.requesterName || 'Customer';
        this.updateEmailText();
      },
      error => {
        console.error('Error fetching ticket data:', error);
        this.requesterName = 'Customer';
        this.updateEmailText();
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

    this.selectedTemplate = null;
    this.ShouldBeInternal = false;
    this.includeRequesterName = false;
    this.customMessage = '';
    this.newETA = '';
  }

  updateEmailText() {
    if (this.selectedTemplate && this.newETA) {
      let message = this.selectedTemplate.replace(/{{newETA}}/g, this.newETA);
      if (this.includeRequesterName && this.requesterName) {
        message = message.replace(/{{sender}}/g, ` ${this.requesterName}`);
      } else {
        message = message.replace(/{{sender}}/g, '');
      }

      this.customMessage = message.trim();
    }
  }

  onETAChange(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    if (inputValue) {
      this.newETA = inputValue;
      this.updateEmailText();
    }
  }

  onTemplateSelect(event: Event) {
    if (!this.newETA) {
      this.showToast('Please provide an ETA before selecting a message.', 'error');
      return;
    }

    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue) {
      this.selectedTemplate = selectedValue;
      this.updateEmailText();
    }
  }

  sendETAUpdate() {
    if (!this.newETA) {
      this.showToast('Please provide an ETA before sending the update.', 'error');
      return;
    }
    let sendPublic;
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
      this.wizardBackendService
        .ReplyZendeskTicket(updatePayload.ticketId, updatePayload.email, updatePayload.message, updatePayload.public)
        .subscribe(
          response => {
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

  confirmAction() {
    this.closeModal();
  }
}
