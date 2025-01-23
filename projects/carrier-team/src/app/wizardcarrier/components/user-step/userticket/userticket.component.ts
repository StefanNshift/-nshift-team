import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth'; // Firebase Auth modules
import { Database, get, ref, update } from '@angular/fire/database';
import { Router } from '@angular/router';
import { send } from 'process';
import { WizardbackendService } from '../../backend/wizardbackend.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-introduction',
  templateUrl: './userticket.component.html',
  styleUrls: ['./userticket.component.scss'],
})
export class UserComponent implements OnInit {
  constructor(
    private wizardBackendService: WizardbackendService, 
    private cdr: ChangeDetectorRef // Lägg till detta

  ) {}
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
  latestPublic: any;
  latestInternal: any;
  latestAssigneeReply: any;
  unassignedTickets: any[] = [];
  jiraVisibility: boolean[] = [];
  ticketsToBeAnsweredCount = 0;
  allExpanded = false;
  user: any;
  ticketCountsByPriority: { [key: string]: number } = {};
  selectedTicket: any = null;
  selectedTemplate: string | null = null;
  newETA = '';
  ticketNumber = '';

  adminEnabled = false;
  customMessage = '';
  includeRequesterName = false;
  ShouldBeInternal = false;
  isChatHistoryTab = false;
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

  members = [
    { zendeskID: 5029634049180, email: 'stefan.liden@nshift.com' },
    { zendeskID: 392655027080, email: 'adriana.covrig@nshift.com' },
    { zendeskID: 115013890774, email: 'andreas.elind@nshift.com' },
    { zendeskID: 1901648861654, email: 'crystal.aguilar@nshift.com' },
    { zendeskID: 375464540999, email: 'anca.cava@nshift.com' },
    { zendeskID: 361633069534, email: 'mark.austin@nshift.com' },
    { zendeskID: 114863839473, email: 'karolina.karlsson@nshift.com' },
    { zendeskID: 115012328113, email: 'siri.montell@nshift.com' },
    { zendeskID: 4467698588828, email: 'ciprian.balasa@nshift.com' },
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

  activeTab = 'tab1'; // Default active tab

  toggleJiraVisibility(index: number) {
    this.jiraVisibility[index] = !this.jiraVisibility[index];
  }

  switchTab(tab: string) {
    this.isChatHistoryTab = tab !== 'tab1';
    this.activeTab = tab; // Set active tab when switching
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

        // Försök hämta tickets från sessionStorage
        this.fetchAllTickets(this.user.email);
        this.filterTickets('total');
      }
    }
  }

  private fetchAllTickets(user: string) {
    const cachedTickets = sessionStorage.getItem('assignedTickets');
    const cachedTimestamp = sessionStorage.getItem('assignedTicketsTimestamp');

    if (cachedTickets && cachedTimestamp) {
      const timestamp = new Date(cachedTimestamp).getTime();
      const now = new Date().getTime();
  
      if (now - timestamp < 3600000) {
        const parsedData = JSON.parse(cachedTickets);
        this.processTicketData(parsedData);
        return;
      } else {
        sessionStorage.removeItem('assignedTickets');
        sessionStorage.removeItem('assignedTicketsTimestamp');
      }
    }
  
    this.wizardBackendService.getAllUserTickets(user).subscribe(
      (response: any) => {
        if (response?.assignedTickets) {
          sessionStorage.setItem('assignedTickets', JSON.stringify(response.assignedTickets));
          sessionStorage.setItem('assignedTicketsTimestamp', new Date().toISOString());
          this.processTicketData(response.assignedTickets);
        } else {
          console.error('Invalid response from backend:', response);
          this.isLoading = false;
        }
      },
      error => {
        console.error('Error fetching tickets:', error);
        this.isLoading = false;
      },
    );
  }
  


  isDropdownOpen = false;
  selectedOption: { name: string; count: number; id: string } | null = null;
  options: { name: string; count: number; id: string }[] = [];


  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  
  selectOption(option: { name: string; count: number; id: string }, event: Event): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.isDropdownOpen = false;
  
    // Om "Total Carriers" är valt, visa alla tickets i det aktuella filtret
    if (option.id === 'all') {
      this.assignedTickets = [...this.assignedTicketsBackup.filter(ticket => this.filterMatchesActive(ticket))];
    } else {
      // Filtrera biljetterna baserat på carrier_id och det aktuella filtret
      this.assignedTickets = this.assignedTicketsBackup.filter(ticket => {
        const matchesCarrier = ticket.carrier_id?.toString() === option.id;
        const matchesActiveFilter = this.filterMatchesActive(ticket);
        return matchesCarrier && matchesActiveFilter;
      });
    }
  
    // Tvinga omrendering av vyer
    this.cdr.markForCheck();
  }

private filterMatchesActive(ticket: any): boolean {
  switch (this.activeFilter) {
    case 'currentSprint':
      return ticket.jiraData?.some(jira => jira.sprints?.currentSprint);

    case 'missingSprint':
      return ticket.jiraData?.some(jira => {
        const isClosed = jira.sprints?.ticketStatus === 'Closed';
        const hasCurrentSprint = jira.sprints?.currentSprint !== null;
        const hasNoSprints = !jira.sprints || jira.sprints.length === 0;
        const hasPreviousSprints = jira.sprints?.previousSprints && jira.sprints.previousSprints.length > 0;
        return !isClosed && !hasCurrentSprint && (hasNoSprints || hasPreviousSprints);
      });

    case 'futureSprint':
      return ticket.jiraData?.some(jira => jira.sprints?.futureSprints && jira.sprints.futureSprints.length > 0);

    case 'needUpdate':
      return this.isToBeAnswered(ticket.updated_at, ticket);

    case 'missingETA':
      return !ticket.eta;

    case 'delayed':
      return ticket.jiraData?.some(jira => {
        const ticketStatus = jira.sprints?.ticketStatus;
        const hasPreviousSprints = jira.sprints?.previousSprints?.length > 0;
        return hasPreviousSprints && ticketStatus !== 'Closed';
      });

    case 'closedJira':
      return (
        ticket.jiraData?.length > 0 &&
        ticket.jiraData.every(jira => jira.sprints.ticketStatus === 'Closed')
      );

    case 'tier1':
      return ticket.tier === 1;

    case 'tier2':
      return ticket.tier === 2;

    case 'tier3':
      return ticket.tier === 3;

    case 'urgent':
      return ticket.priority === 'urgent';

    case 'high':
      return ticket.priority === 'high';

    case 'normal':
      return ticket.priority === 'normal';

    case 'low':
      return ticket.priority === 'low';

    default:
      return true; // För 'total' och generella fall
  }
}


  
  
  // Separat funktion för att bearbeta datan
  private processTicketData(assignedTickets: any[]) {
    this.tier1Tickets = assignedTickets[0]?.tier1Tickets || 0;
    this.tier2Tickets = assignedTickets[0]?.tier2Tickets || 0;
    this.tier3Tickets = assignedTickets[0]?.tier3Tickets || 0;
    this.zendeskTicketCount = assignedTickets[0]?.ticket_count || 0;
    // Process tickets and convert "tier" to numerical value
    const processedTickets = this.calculateETA(
      (assignedTickets[0]?.tickets || []).map(ticket => ({
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

    // Calculate ticket counts grouped by carrier ID
    const carrierCounts: { [key: string]: number } = {};
    processedTickets.forEach(ticket => {
        if (ticket.carrier_id) {
            carrierCounts[ticket.carrier_id] = (carrierCounts[ticket.carrier_id] || 0) + 1;
        }
    });

    // Calculate total number of tickets
    const totalTickets = Object.values(carrierCounts).reduce((sum, count) => sum + count, 0);

    // Create and sort the dropdown options by count (descending)
    const sortedOptions = Object.entries(carrierCounts)
      .map(([id, count]) => ({
        id: id, // Include the id property
        name: `Carrier ID ${id}`,
        
        count: count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Add static "All Carriers" option at the top
    this.options = [
      { id: 'all', name: 'Total Carriers', count: totalTickets }, // Static option
      ...sortedOptions, // Dynamic options
    ];

    // Set default selection to "All Carriers"
    this.selectedOption = this.options[0];
    this.sortTickets();
    this.countTicketsToBeAnswered();
    this.isLoading = false;
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
    return tickets[0].tickets.map(ticket => {
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

  private isDateBefore(date1: string, date2: string): boolean {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    return d1 < d2; // Compare timestamps
  }

  private getDaysDifference(date1: string, date2: string): number {
    const time1 = new Date(date1).getTime();
    const time2 = new Date(date2).getTime();
    return Math.floor((time2 - time1) / (1000 * 3600 * 24));
  }

  isToBeAnswered(updatedAt: string, ticket: any): boolean {

    if (ticket.latestAnswerWasAutomated) {
      return false;
    }
    
    if (
      ticket.latestInternalComment?.created_at &&
      this.isDateBefore(ticket.latestInternalComment.created_at, updatedAt)
    ) {
      return true;
    }

    if (ticket.latestPublicComment?.created_at && this.isDateBefore(ticket.latestPublicComment.created_at, updatedAt)) {
      return true;
    }

    // Rule 2
    if (ticket.ticketStatus === 'open') {
      const latestCommentDate = ticket.latestInternalComment?.created_at || ticket.latestPublicComment?.created_at;

      if (latestCommentDate) {
        const daysSinceLastComment = this.getDaysDifference(latestCommentDate, new Date().toISOString());

        if (daysSinceLastComment > 3) {
          return true;
        }
      } else {
        const daysSinceCreated = this.getDaysDifference(ticket.created_at, new Date().toISOString());

        if (daysSinceCreated > 3) {
          return true;
        }
      }
    }

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
  
    // Kontrollera om det finns tidigare sprintar och status inte är "Closed"
    return ticket.jiraData.some((jira: any) => {
      const ticketStatus = jira.sprints?.ticketStatus;
      const hasPrevious = jira.sprints?.previousSprints?.length > 0;
  
      // Returnera true endast om det finns tidigare sprintar och status inte är "Closed"
      return hasPrevious && ticketStatus !== "Closed";
    });
  }
  
  getJiraBadgeClass(ticketStatus: string): string {
    return `jira-badge jira-badge-${ticketStatus.toLowerCase().replace(/\s+/g, '-')}`;
  }

  isHoldStatus(status: string): boolean {
    const specialStatuses = [
      'Carrier Dev',
      'Product Development',
      'Account Management',
      'Awaiting',
      '3.Party feedback',
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


    if (
      (filter === 'currentSprint' && this.getCurrentSprintTicketsCount() === 0) ||
      (filter === 'futureSprint' && this.getFutureSprintTicketsCount() === 0) ||
      (filter === 'missingSprint' && this.getMissingSprintTicketsCount() === 0) ||

      (filter === 'delayed' && this.getDelayedTicketsCount() === 0) ||
      (filter === 'closedJira' && this.getClosedJiraTicketsCount() === 0) ||
      (filter === 'needUpdate' && (this.ticketsToBeAnsweredCount || 0) === 0) ||
      (filter === 'missingETA' && (this.ticketsMissingETACount || 0) === 0) ||
      (filter === 'total' && (this.zendeskTicketCount || 0) === 0)
    ) {
      return;
    }
    this.activeFilter = filter;
    this.jiraVisibility = this.assignedTicketsBackup.map(() => false);

    switch (filter) {
      case 'currentSprint':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket =>
          ticket.jiraData?.some(jira => jira.sprints?.currentSprint),
        );
        break;
        case 'missingSprint':
          this.assignedTickets = this.assignedTicketsBackup.filter(ticket =>
            ticket.jiraData?.some(jira => {
              const isClosed = jira.sprints?.ticketStatus === 'Closed';
              const hasCurrentSprint = jira.sprints?.currentSprint !== null;
              const hasNoSprints = !jira.sprints || jira.sprints.length === 0;
              const hasPreviousSprints = jira.sprints?.previousSprints && jira.sprints.previousSprints.length > 0;
        
              // Include tickets that are not closed, do not have a current sprint, and either lack sprints or have previous sprints
              return !isClosed && !hasCurrentSprint && (hasNoSprints || hasPreviousSprints);
            })
          );
                  break;
        

      case 'futureSprint':
        this.assignedTickets = this.assignedTicketsBackup.filter(ticket =>
          ticket.jiraData?.some(jira => jira.sprints?.futureSprints && jira.sprints.futureSprints.length > 0),
        );
        break;

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
            ticket.jiraData?.some(jira => {
              const ticketStatus = jira.sprints?.ticketStatus;
              const hasPreviousSprints = jira.sprints?.previousSprints?.length > 0;
        
              // Inkludera endast biljetter som har tidigare sprintar och inte är "Closed"
              return hasPreviousSprints && ticketStatus !== "Closed";
            })
          );
          break;
        
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
    this.updateCarrierDropdown();
    this.selectedOption = this.options[0]; // Återställ till "Total Carriers"


  }
  
  private updateCarrierDropdown() {
    // Skapa ett set för unika transportörer i de filtrerade tickets
    const carrierCounts: { [key: string]: { carrierName: string; count: number } } = {};
  
    this.assignedTickets.forEach(ticket => {
      if (ticket.carrier_id) {
        const carrierName = ticket.carrierName || `Carrier ID ${ticket.carrier_id}`;
        if (!carrierCounts[ticket.carrier_id]) {
          carrierCounts[ticket.carrier_id] = { carrierName, count: 0 };
        }
        carrierCounts[ticket.carrier_id].count++;
      }
    });
  
    // Skapa och sortera dropdown-alternativ
    const sortedOptions = Object.entries(carrierCounts)
      .map(([id, { carrierName, count }]) => ({
        id: id,
        carrierName: carrierName,
        name: carrierName, // Lägg till `name` för att undvika felet
        count: count,
      }))
      .sort((a, b) => b.count - a.count);
  
    // Lägg till "Total Carriers" som första alternativ
    this.options = [
      {
        id: 'all',
        carrierName: 'Total Carriers',
        name: 'Total Carriers', // Lägg till `name` här också
        count: this.assignedTickets.length,
      },
      ...sortedOptions,
    ];
  
    // Återställ valt alternativ till "Total Carriers" om den valda transportören inte längre finns kvar
    if (!this.options.some(option => option.id === this.selectedOption?.id)) {
      this.selectedOption = this.options[0];
    }
  
    // Säkerställ att dropdown uppdateras
    this.cdr.detectChanges();
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
  getCurrentSprintTicketsCount(): number {
    return this.assignedTicketsBackup.filter(ticket => ticket.jiraData?.some(jira => jira.sprints?.currentSprint))
      .length;
  }

  getMissingSprintTicketsCount(): number {
    const missingSprintTickets = this.assignedTicketsBackup.filter(ticket =>
      ticket.jiraData?.some(jira => {
        // Kontrollera Jira-status och sprintar
        const isClosed = jira.sprints?.ticketStatus === 'Closed';
        const hasCurrentSprint = jira.sprints?.currentSprint !== null;
        const hasNoSprints = !jira.sprints || jira.sprints.length === 0;
        const hasPreviousSprints = jira.sprints?.previousSprints && jira.sprints.previousSprints.length > 0;
  
        // Inkludera endast om status inte är Closed och det saknas current sprint
        if (!isClosed && !hasCurrentSprint && (hasNoSprints || hasPreviousSprints)) {
          console.log('Found missing sprint ticket:', ticket); // Logga varje matchande ticket
          return true;
        }
  
        return false;
      })
    );
  
    // Logga resultatet
    console.log('Tickets missing sprint:', missingSprintTickets);
  
    return missingSprintTickets.length;
  }
  
  
  

  getFutureSprintTicketsCount(): number {
    return this.assignedTicketsBackup.filter(ticket =>
      ticket.jiraData?.some(jira => jira.sprints?.futureSprints && jira.sprints.futureSprints.length > 0),
    ).length;
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
      ticket.jiraData?.some(jira => {
        const ticketStatus = jira.sprints?.ticketStatus;
        const hasPreviousSprints = jira.sprints?.previousSprints?.length > 0;
  
        // Räkna endast biljetter som har tidigare sprintar och inte är "Closed"
        return hasPreviousSprints && ticketStatus !== "Closed";
      })
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
    this.ticketNumber = ticket.ticket_id;
    this.newETA = ticket?.eta ? new Date(ticket.eta).toISOString().split('T')[0] : '';

    const delayedMessageTemplate = this.messageTemplates.find(template => template.label === 'Delayed Message');
    if (delayedMessageTemplate) {
      this.selectedTemplate = delayedMessageTemplate.value;
      this.updateEmailText();
    }

    // Visa placeholder medan datan laddas
    this.requesterName = 'Loading...';

    // Fetch requester name
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

    // Fetch comments and determine latest reply by assignee
    this.wizardBackendService.getZendeskTicketComments(ticket.ticket_id).subscribe(
      response => {
        if (response && response.comments) {
          const { latestPublic, latestInternal } = this.getLatestComments(response.comments);
          this.latestPublic = latestPublic;
          this.latestInternal = latestInternal;

          // Find and store latest reply by assignee
          const latestAssigneeReply = this.getLatestReplyByAssignee(response.comments);
          if (latestAssigneeReply) {
            this.latestAssigneeReply = {
              body: latestAssigneeReply.body,
              date: new Date(latestAssigneeReply.created_at).toLocaleString(),
              public: latestAssigneeReply.public, // Capture the public/internal status
            };
          } else {
            this.latestAssigneeReply = null;
          }
        } else {
          console.error('Invalid comments response:', response);
        }
      },
      error => {
        console.error('Error fetching ticket data:', error);
      },
    );

    const modal = document.getElementById('customModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  getLatestReplyByAssignee(comments: any[]) {
    // Get the Zendesk ID of the current user
    const currentUserZendeskID = this.members.find(member => member.email === this.user.email)?.zendeskID;

    if (!currentUserZendeskID) {
      console.warn('Zendesk ID not found for the current user.');
      return null;
    }

    // Filter comments to find those authored by the assignee
    const assigneeComments = comments.filter(comment => comment.author_id === currentUserZendeskID);

    // Sort comments by `created_at` in descending order to find the latest reply
    const sortedAssigneeComments = assigneeComments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Return the latest reply, or null if none are found
    return sortedAssigneeComments.length > 0 ? sortedAssigneeComments[0] : null;
  }

  getLatestComments(comments: any[]) {
    if (!Array.isArray(comments) || comments.length === 0) {
      return { latestPublic: null, latestInternal: null };
    }

    // Filtrera ut publika och interna kommentarer
    const publicComments = comments.filter(comment => comment.public);
    const internalComments = comments.filter(comment => !comment.public);

    // Sortera efter `created_at` i fallande ordning (senaste först)
    const sortedPublicComments = publicComments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const sortedInternalComments = internalComments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Hämta senaste från varje kategori
    const latestPublic = sortedPublicComments.length > 0 ? sortedPublicComments[0] : null;
    const latestInternal = sortedInternalComments.length > 0 ? sortedInternalComments[0] : null;

    return { latestPublic, latestInternal };
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
    this.activeTab = 'tab1';
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

    const sendPublic = this.ShouldBeInternal === true ? false : true;

    if (this.newETA && this.customMessage) {
      const updatePayload = {
        ticketId: this.selectedTicket.ticket_id,
        email: this.user.email,
        message: this.customMessage,
        public: sendPublic,
      };

      const currentDateTime = new Date().toISOString();
      this.selectedTicket.updated_at = currentDateTime;
      this.selectedTicket.eta = this.newETA;

      if (sendPublic === true) {
        this.selectedTicket.latestPublicComment = { created_at: currentDateTime }; // Update latestPublicComment
      } else {
        this.selectedTicket.latestInternalComment = { created_at: currentDateTime }; // Update latestInternalComment
      }


      // Overwrite sessionStorage with updated tickets
      const cachedTickets = sessionStorage.getItem('assignedTickets');
      if (cachedTickets) {
        const parsedTickets = JSON.parse(cachedTickets);

        // Update the relevant ticket in the parsedTickets array
        parsedTickets.forEach((team: any) => {
          team.tickets = team.tickets.map((ticket: any) => {
            if (`${ticket.ticket_id}` === `${this.selectedTicket.ticket_id}`) {

              // Update the ticket with new fields
              return {
                ...ticket,
                updated_at: currentDateTime,
                eta: this.newETA,
                latestPublicComment: sendPublic ? { created_at: currentDateTime } : ticket.latestPublicComment,
                latestInternalComment: !sendPublic ? { created_at: currentDateTime } : ticket.latestInternalComment,
              };
            }
            return ticket;
          });
        });

        // Save the updated data to sessionStorage
        sessionStorage.setItem('assignedTickets', JSON.stringify(parsedTickets));
      } else {
        console.warn('No tickets found in sessionStorage. Creating new entry...');
        const newTicketsData = [
          {
            name: this.user.name,
            zendeskID: this.user.zendeskID,
            ticket_count: 1,
            tickets: [this.selectedTicket],
          },
        ];
        sessionStorage.setItem('assignedTickets', JSON.stringify(newTicketsData));
      }

      // Close modal and reset state
      this.closeModal();
      this.isChatHistoryTab = false;

      // Call backend to update ticket
      this.wizardBackendService
        .ReplyZendeskTicket(updatePayload.ticketId, updatePayload.email, updatePayload.message, updatePayload.public)
        .subscribe(
          response => {
            this.showToast('ETA updated successfully for ' + this.selectedTicket.ticket_id, 'success');
            // Fetch updated tickets
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
