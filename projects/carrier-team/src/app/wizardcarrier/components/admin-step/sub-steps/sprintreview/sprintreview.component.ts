import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { merge } from 'rxjs';
import { WizardbackendService } from '../../../backend/wizardbackend.service';

@Component({
  selector: 'app-sprintreview',
  templateUrl: './sprintreview.component.html',
  styleUrls: ['./sprintreview.component.scss'],
})
export class SprintreviewComponent implements OnInit {
  sprints: any[] = [];
  EnableCustomToggle = false;

  SummarySprintData = false;
  IncludeOldSprintCheckbox = false;
  IncludeFutureSprintCheckbox = false;
  selectedSprintDetails: any[] | null = null;
  ticketSummary: any = {
    total: 0,
    statusCounts: {},
    typeCounts: {},
    carrierCounts: {},
    carrierClosedCounts: {},
    totalCarriers: 0,
    totalClosedCarriers: 0,
    zendeskSummary: {
      totalResolved: 0,
      carriers: {},
    },
  };

  OldticketSummary: any = {
    total: 0,
    statusCounts: {},
    typeCounts: {},
    carrierCounts: {},
    carrierClosedCounts: {},
    totalCarriers: 0,
    totalClosedCarriers: 0,
    zendeskSummary: {
      totalResolved: 0,
      carriers: {},
    },
  };

  FutureticketSummary: any = {
    total: 0,
    statusCounts: {},
    typeCounts: {},
    carrierCounts: {},
    carrierClosedCounts: {},
    totalCarriers: 0,
    totalClosedCarriers: 0,
    zendeskSummary: {
      totalResolved: 0,
      carriers: {},
    },
  };

  loadingDetails = false;
  loadingZendesk = false;
  selectedSprintId: number | null = null;

  // Add a variable to store the analysis result
  analysisResult: any = null;
  analyzingData = false;
  toastVisible = false;
  toastMessage = '';
  toastType = '';
  constructor(private http: HttpClient, private wizardBackendService: WizardbackendService) {}

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }

  ngOnInit(): void {
    this.wizardBackendService.getLastSprints().subscribe({
      next: (data: any) => {
        const allSprints = data.values;

        const activeSprintIndex = allSprints.findIndex(sprint => sprint.state.toLowerCase() === 'active');

        if (activeSprintIndex !== -1) {
          const previousClosedSprints = allSprints
            .slice(0, activeSprintIndex)
            .reverse()
            .filter(sprint => sprint.state.toLowerCase() === 'closed')
            .slice(0, 2)
            .reverse(); //

          const activeSprint = allSprints[activeSprintIndex];

          const futureSprints = allSprints
            .slice(activeSprintIndex + 1)
            .filter(sprint => sprint.state.toLowerCase() === 'future')
            .slice(0, 2);

          this.sprints = [...previousClosedSprints, activeSprint, ...futureSprints];
        } else {
          console.warn('No active sprint found.');
        }
      },
      error: error => {
        console.error('Error fetching sprint data:', error);
      },
    });
  }

  onSprintSelect(event: Event): void {
    const selectedId = Number((event.target as HTMLSelectElement).value);
    this.SummarySprintData = false;
    this.IncludeFutureSprintCheckbox = false;
    this.IncludeOldSprintCheckbox = false;

    if (selectedId) {
      this.fetchCurrentSprintDetails(selectedId);

      const selectedIndex = this.sprints.findIndex(sprint => sprint.id === selectedId);
      if (selectedIndex === -1) {
        return;
      }

      const selectedSprint = this.sprints[selectedIndex];

      if (!selectedSprint.startDate) {
        console.error('Vald sprint saknar startDate:', selectedSprint);
        return;
      }

      if (selectedIndex > 0) {
        const previousSprint = this.sprints[selectedIndex - 1];
        this.fetchOldSprintDetails(previousSprint.id);

        if (!previousSprint.startDate) {
        }
      } else {
      }

      if (selectedIndex < this.sprints.length - 1) {
        const nextSprint = this.sprints[selectedIndex + 1];
        this.fetchFutureSprintDetails(nextSprint.id);

        if (!nextSprint.startDate) {
        }
      } else {
      }
    }
  }

  compareCarrierCounts(a: { key: string; value: number }, b: { key: string; value: number }): number {
    // Return positive, negative, or zero for sorting
    // Sort by value (count) descending
    return b.value - a.value;
  }

  fetchOldSprintDetails(sprintId: number): void {
    this.loadingDetails = true;
    this.selectedSprintDetails = null;

    const processedIssues: any[] = [];
    const OldticketSummary: any = {
      totalJiraTickets: 0,
      jiraStatusCounts: {},
      jiraTypeCounts: {},
      jiraCarrierCounts: {},
      jiraReleasedTicketInProduction: 0,
      jiraPriorityCounts: {
        blocker: 0,
        critical: 0,
        major: 0,
        normal: 0,
        low: 0,
        undefined: 0,
      },
      totalJiraCarriers: 0,
      zendeskSummary: {
        totalZendeskTickets: 0,
        zendeskTierCounts: {
          tier1: 0,
          tier2: 0,
          tier3: 0,
          undefined: 0,
          'n/a': 0,
        },
        zendeskPriorityCounts: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
          undefined: 0,
        },
      },
      jiraSprintTickets: [],
    };

    this.wizardBackendService.getJiraSprint(sprintId).subscribe({
      next: (data: any) => {
        const sprint = this.sprints.find(s => s.id === sprintId);
        const startDate = new Date(sprint.startDate).toISOString().split('T')[0];
        const endDate = new Date(sprint.endDate).toISOString().split('T')[0];

        data.issues.forEach((element: any) => {
          const carrier = element.fields?.customfield_10378?.value || 'Unknown Carrier';
          const status = element.fields?.status?.name || 'No status';
          const priority = element.fields?.priority?.name?.toLowerCase() || 'undefined';

          const issueObject = {
            key: element.key,
            summary: element.fields?.summary || 'No summary provided',
            description: element.fields?.description || 'No description provided',
            status,
            priority,
            type: element.key.split('-')[0], // Extract ticket type (e.g., CART, PYT)
            carrier,
          };

          processedIssues.push(issueObject);

          // Update Jira statistics
          OldticketSummary.totalJiraTickets++;

          // Count by status
          OldticketSummary.jiraStatusCounts[status] = (OldticketSummary.jiraStatusCounts[status] || 0) + 1;

          // Count by type
          OldticketSummary.jiraTypeCounts[issueObject.type] =
            (OldticketSummary.jiraTypeCounts[issueObject.type] || 0) + 1;

          // Count by carrier
          OldticketSummary.jiraCarrierCounts[carrier] = (OldticketSummary.jiraCarrierCounts[carrier] || 0) + 1;

          // Count by priority
          OldticketSummary.jiraPriorityCounts[priority] = (OldticketSummary.jiraPriorityCounts[priority] || 0) + 1;

          // Add to Jira sprint tickets if status is "Closed"
          if (status.toLowerCase() === 'closed') {
            OldticketSummary.jiraSprintTickets.push({
              key: issueObject.key,
              summary: issueObject.summary,
              carrier,
              status,
              priority,
            });
          }
        });

        // Set calculated summary values
        OldticketSummary.totalJiraCarriers = Object.keys(OldticketSummary.jiraCarrierCounts).length;
        OldticketSummary.jiraReleasedTicketInProduction = OldticketSummary.jiraStatusCounts['Closed'] || 0;

        this.fetchOldZendeskTickets(startDate, endDate, OldticketSummary);
        this.selectedSprintDetails = processedIssues;
        this.OldticketSummary = OldticketSummary;
        this.loadingDetails = false;
      },
      error: error => {
        console.error('Error fetching sprint details:', error);
        this.loadingDetails = false;
      },
    });
  }

  fetchFutureSprintDetails(sprintId: number): void {
    this.loadingDetails = true;
    this.selectedSprintDetails = null;

    const processedIssues: any[] = [];
    const FutureticketSummary: any = {
      totalJiraTickets: 0,
      jiraStatusCounts: {},
      jiraTypeCounts: {},
      jiraCarrierCounts: {},
      jiraReleasedTicketInProduction: 0,
      jiraPriorityCounts: {
        blocker: 0,
        critical: 0,
        major: 0,
        normal: 0,
        low: 0,
        undefined: 0,
      },
      totalJiraCarriers: 0,
      zendeskSummary: {
        totalZendeskTickets: 0,
        zendeskTierCounts: {
          tier1: 0,
          tier2: 0,
          tier3: 0,
          undefined: 0,
          'n/a': 0,
        },
        zendeskPriorityCounts: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
          undefined: 0,
        },
      },
      jiraSprintTickets: [],
    };

    this.wizardBackendService.getJiraSprint(sprintId).subscribe({
      next: (data: any) => {
        const sprint = this.sprints.find(s => s.id === sprintId);
        const startDate = new Date(sprint.startDate).toISOString().split('T')[0];
        const endDate = new Date(sprint.endDate).toISOString().split('T')[0];

        data.issues.forEach((element: any) => {
          const carrier = element.fields?.customfield_10378?.value || 'Unknown Carrier';
          const status = element.fields?.status?.name || 'No status';
          const priority = element.fields?.priority?.name?.toLowerCase() || 'undefined';

          const issueObject = {
            key: element.key,
            summary: element.fields?.summary || 'No summary provided',
            description: element.fields?.description || 'No description provided',
            status,
            priority,
            type: element.key.split('-')[0], // Extract ticket type (e.g., CART, PYT)
            carrier,
          };

          processedIssues.push(issueObject);

          // Update Jira statistics
          FutureticketSummary.totalJiraTickets++;

          // Count by status
          FutureticketSummary.jiraStatusCounts[status] = (FutureticketSummary.jiraStatusCounts[status] || 0) + 1;

          // Count by type
          FutureticketSummary.jiraTypeCounts[issueObject.type] =
            (FutureticketSummary.jiraTypeCounts[issueObject.type] || 0) + 1;

          // Count by carrier
          FutureticketSummary.jiraCarrierCounts[carrier] = (FutureticketSummary.jiraCarrierCounts[carrier] || 0) + 1;

          // Count by priority
          FutureticketSummary.jiraPriorityCounts[priority] =
            (FutureticketSummary.jiraPriorityCounts[priority] || 0) + 1;

          // Add to Jira sprint tickets if status is "Closed"
          if (status.toLowerCase() === 'closed') {
            FutureticketSummary.jiraSprintTickets.push({
              key: issueObject.key,
              summary: issueObject.summary,
              carrier,
              status,
              priority,
            });
          }
        });

        // Set calculated summary values
        FutureticketSummary.totalJiraCarriers = Object.keys(FutureticketSummary.jiraCarrierCounts).length;
        FutureticketSummary.jiraReleasedTicketInProduction = FutureticketSummary.jiraStatusCounts['Closed'] || 0;

        this.fetchFutureZendeskTickets(startDate, endDate, FutureticketSummary);
        this.selectedSprintDetails = processedIssues;
        this.FutureticketSummary = FutureticketSummary;
        this.loadingDetails = false;
      },
      error: error => {
        console.error('Error fetching sprint details:', error);
        this.loadingDetails = false;
      },
    });
  }

  fetchCurrentSprintDetails(sprintId: number): void {
    this.loadingDetails = true;
    this.selectedSprintDetails = null;

    const processedIssues: any[] = [];
    const ticketSummary: any = {
      totalJiraTickets: 0,
      jiraStatusCounts: {},
      jiraTypeCounts: {},
      jiraCarrierCounts: {},
      jiraReleasedTicketInProduction: 0,
      jiraPriorityCounts: {
        blocker: 0,
        critical: 0,
        major: 0,
        normal: 0,
        low: 0,
        undefined: 0,
      },
      totalJiraCarriers: 0,
      zendeskSummary: {
        totalZendeskTickets: 0,
        zendeskTierCounts: {
          tier1: 0,
          tier2: 0,
          tier3: 0,
          undefined: 0,
          'n/a': 0,
        },
        zendeskPriorityCounts: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
          undefined: 0,
        },
      },
      jiraSprintTickets: [],
    };

    this.wizardBackendService.getJiraSprint(sprintId).subscribe({
      next: (data: any) => {
        const sprint = this.sprints.find(s => s.id === sprintId);
        const startDate = new Date(sprint.startDate).toISOString().split('T')[0];
        const endDate = new Date(sprint.endDate).toISOString().split('T')[0];

        data.issues.forEach((element: any) => {
          const carrier = element.fields?.customfield_10378?.value || 'Unknown Carrier';
          const status = element.fields?.status?.name || 'No status';
          const priority = element.fields?.priority?.name?.toLowerCase() || 'undefined';

          const issueObject = {
            key: element.key,
            summary: element.fields?.summary || 'No summary provided',
            description: element.fields?.description || 'No description provided',
            status,
            priority,
            type: element.key.split('-')[0], // Extract ticket type (e.g., CART, PYT)
            carrier,
          };

          processedIssues.push(issueObject);

          // Update Jira statistics
          ticketSummary.totalJiraTickets++;

          // Count by status
          ticketSummary.jiraStatusCounts[status] = (ticketSummary.jiraStatusCounts[status] || 0) + 1;

          // Count by type
          ticketSummary.jiraTypeCounts[issueObject.type] = (ticketSummary.jiraTypeCounts[issueObject.type] || 0) + 1;

          // Count by carrier
          ticketSummary.jiraCarrierCounts[carrier] = (ticketSummary.jiraCarrierCounts[carrier] || 0) + 1;

          // Count by priority
          ticketSummary.jiraPriorityCounts[priority] = (ticketSummary.jiraPriorityCounts[priority] || 0) + 1;

          // Add to Jira sprint tickets if status is "Closed"
          if (status.toLowerCase() === 'closed') {
            const truncatedDescription = (issueObject.description || '').substring(0, 500);

            ticketSummary.jiraSprintTickets.push({
              key: issueObject.key,
              summary: issueObject.summary,
              description: truncatedDescription,
              carrier,
              status,
              priority,
            });
          }
        });

        // Set calculated summary values
        ticketSummary.totalJiraCarriers = Object.keys(ticketSummary.jiraCarrierCounts).length;
        ticketSummary.jiraReleasedTicketInProduction = ticketSummary.jiraStatusCounts['Closed'] || 0;

        this.fetchZendeskTickets(startDate, endDate, ticketSummary);
        this.selectedSprintDetails = processedIssues;
        this.ticketSummary = ticketSummary;
        this.loadingDetails = false;
      },
      error: error => {
        console.error('Error fetching sprint details:', error);
        this.loadingDetails = false;
      },
    });
  }

  fetchOldZendeskTickets(startDate: string, endDate: string, OldticketSummary: any): void {
    this.loadingZendesk = true;

    // Increase endDate by 5 days
    const end = new Date(endDate);
    end.setDate(end.getDate() + 5);
    const newEndDate = end.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    this.wizardBackendService.getAllTicketsClosed(startDate, newEndDate).subscribe({
      next: (response: any) => {
        let totalZendeskTickets = 0;
        const zendeskTierCounts = { tier1: 0, tier2: 0, tier3: 0, undefined: 0, 'n/a': 0 };
        const zendeskPriorityCounts = { low: 0, normal: 0, high: 0, urgent: 0, undefined: 0 };

        response.assignedTickets.forEach((user: any) => {
          user.tickets.forEach((ticket: any) => {
            totalZendeskTickets++;

            // Map tier key
            const tierKey = ticket.tier?.toLowerCase().replace(' ', '') || 'undefined';
            if (zendeskTierCounts[tierKey] === undefined) {
              zendeskTierCounts[tierKey] = 0;
            }
            zendeskTierCounts[tierKey]++;

            // Map priority key
            const priorityKey = ticket.priority?.toLowerCase() || 'undefined';
            if (zendeskPriorityCounts[priorityKey] === undefined) {
              zendeskPriorityCounts[priorityKey] = 0;
            }
            zendeskPriorityCounts[priorityKey]++;
          });
        });

        // Update Zendesk summary
        OldticketSummary.zendeskSummary.totalZendeskTickets = totalZendeskTickets;
        OldticketSummary.zendeskSummary.zendeskTierCounts = zendeskTierCounts;
        OldticketSummary.zendeskSummary.zendeskPriorityCounts = zendeskPriorityCounts;

        console.log('Old Sprint:', OldticketSummary);

        this.OldticketSummary = OldticketSummary;
        this.loadingZendesk = false;
      },
      error: error => {
        console.error('Error fetching Zendesk tickets:', error);
        this.loadingZendesk = false;
      },
    });
  }

  fetchFutureZendeskTickets(startDate: string, endDate: string, FutureticketSummary: any): void {
    this.loadingZendesk = true;

    // Increase endDate by 5 days
    const end = new Date(endDate);
    end.setDate(end.getDate() + 5);
    const newEndDate = end.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    this.wizardBackendService.getAllTicketsClosed(startDate, newEndDate).subscribe({
      next: (response: any) => {
        let totalZendeskTickets = 0;
        const zendeskTierCounts = { tier1: 0, tier2: 0, tier3: 0, undefined: 0, 'n/a': 0 };
        const zendeskPriorityCounts = { low: 0, normal: 0, high: 0, urgent: 0, undefined: 0 };

        response.assignedTickets.forEach((user: any) => {
          user.tickets.forEach((ticket: any) => {
            totalZendeskTickets++;

            // Map tier key
            const tierKey = ticket.tier?.toLowerCase().replace(' ', '') || 'undefined';
            if (zendeskTierCounts[tierKey] === undefined) {
              zendeskTierCounts[tierKey] = 0;
            }
            zendeskTierCounts[tierKey]++;

            // Map priority key
            const priorityKey = ticket.priority?.toLowerCase() || 'undefined';
            if (zendeskPriorityCounts[priorityKey] === undefined) {
              zendeskPriorityCounts[priorityKey] = 0;
            }
            zendeskPriorityCounts[priorityKey]++;
          });
        });

        // Update Zendesk summary
        FutureticketSummary.zendeskSummary.totalZendeskTickets = totalZendeskTickets;
        FutureticketSummary.zendeskSummary.zendeskTierCounts = zendeskTierCounts;
        FutureticketSummary.zendeskSummary.zendeskPriorityCounts = zendeskPriorityCounts;
        console.log('Future Sprint:', FutureticketSummary);

        this.FutureticketSummary = FutureticketSummary;
        this.loadingZendesk = false;
      },
      error: error => {
        console.error('Error fetching Zendesk tickets:', error);
        this.loadingZendesk = false;
      },
    });
  }

  fetchZendeskTickets(startDate: string, endDate: string, ticketSummary: any): void {
    this.loadingZendesk = true;

    // Increase endDate by 5 days
    const end = new Date(endDate);
    end.setDate(end.getDate() + 5);
    const newEndDate = end.toISOString().split('T')[0]; // Format to YYYY-MM-DD

    this.wizardBackendService.getAllTicketsClosed(startDate, newEndDate).subscribe({
      next: (response: any) => {
        let totalZendeskTickets = 0;
        const zendeskTierCounts = { tier1: 0, tier2: 0, tier3: 0, undefined: 0, 'n/a': 0 };
        const zendeskPriorityCounts = { low: 0, normal: 0, high: 0, urgent: 0, undefined: 0 };

        response.assignedTickets.forEach((user: any) => {
          user.tickets.forEach((ticket: any) => {
            totalZendeskTickets++;

            // Map tier key
            const tierKey = ticket.tier?.toLowerCase().replace(' ', '') || 'undefined';
            if (zendeskTierCounts[tierKey] === undefined) {
              zendeskTierCounts[tierKey] = 0;
            }
            zendeskTierCounts[tierKey]++;

            // Map priority key
            const priorityKey = ticket.priority?.toLowerCase() || 'undefined';
            if (zendeskPriorityCounts[priorityKey] === undefined) {
              zendeskPriorityCounts[priorityKey] = 0;
            }
            zendeskPriorityCounts[priorityKey]++;
          });
        });

        // Update Zendesk summary
        ticketSummary.zendeskSummary.totalZendeskTickets = totalZendeskTickets;
        ticketSummary.zendeskSummary.zendeskTierCounts = zendeskTierCounts;
        ticketSummary.zendeskSummary.zendeskPriorityCounts = zendeskPriorityCounts;
        console.log('Current Sprint:', ticketSummary);

        this.ticketSummary = ticketSummary;
        this.loadingZendesk = false;
      },
      error: error => {
        console.error('Error fetching Zendesk tickets:', error);
        this.loadingZendesk = false;
      },
    });
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  isNotObject(val: any): boolean {
    return !this.isObject(val);
  }

  scrollToBottom() {
    window.scrollTo(0, window.document.body.scrollHeight - window.innerHeight);
  }

  // New function to analyze sprint data using the analyzed endpoint
  analyzeSprintData(): void {
    this.showToast('Analyzing data. Please wait...', 'warning');

    const IncludeBothFutureOldSprint = {
      CurrentSprint: this.ticketSummary,
      FutureSprint: this.FutureticketSummary,
      OldSprint: this.OldticketSummary,
    };

    console.log(IncludeBothFutureOldSprint);

    this.analyzingData = true;
    this.analysisResult = null;

    const scrollingElement = document.scrollingElement || document.body;
    scrollingElement.scrollTop = scrollingElement.scrollHeight;

    // Använd WizardbackendService för att analysera sprintdata
    this.wizardBackendService.analyzeSprintData(IncludeBothFutureOldSprint).subscribe({
      next: (response: any) => {
        this.analysisResult = response; // Store the result
        this.analyzingData = false;
        this.scrollToBottom();
        this.SummarySprintData = true;
        this.showToast('Response loaded! Please scroll down to view it.', 'success');
      },
      error: error => {
        console.error('Error analyzing sprint data:', error);
        this.analyzingData = false;
      },
    });
  }
}
