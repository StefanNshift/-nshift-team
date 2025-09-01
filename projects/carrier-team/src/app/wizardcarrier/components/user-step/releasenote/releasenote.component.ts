import { Component, OnInit } from "@angular/core";
import { WizardbackendService } from "../../backend/wizardbackend.service";

interface Issue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  issuetype: string;
  parent: any;
  carrier: string;
  reporter: string;
  releaseNote: string;
  components: string[];
  description: string;
  linkedZendeskTickets?: Array<{
    ticket_id: string;
    created_at: string;
    updated_at?: string;
    link_id?: number;
    link_url?: string;
    subject?: string;
    priority?: string;
    type?: string;
    status?: string;
    requester_name?: string;
    updated_at_ticket?: string;
  }>;
}

interface Sprint {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sprintType: string;
  issues: Issue[];
}

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: "app-releasenote",
  templateUrl: "./releasenote.component.html",
  styleUrls: ["./releasenote.component.scss"],
})
export class ReleasenoteComponent implements OnInit {
  releaseOverview: Sprint[] = [];
  filteredOverview: Sprint[] = [];
  isLoading = false;
  error: string | null = null;
  selectedSprintId: number | null = null;
  showSprintDetails = false;

  // Filter and search properties
  selectedStatus = "all";
  selectedPriority = "all";
  selectedType = "all";
  selectedCarrier = "all";
  selectedReporter = "all";
  selectedComponent = "all";
  selectedSprintType = "all";
  searchTerm = "";
  hasReleaseNote = false;
  expandedSprintIds: Set<number> = new Set();

  statisticsList: {
    label: string;
    value: number;
    class: string;
    icon: string;
  }[] = [];

  // Date filters
  startDateFilter: string = "";
  endDateFilter: string = "";

  // Statistics
  statistics = {
    totalSprints: 0,
    totalIssues: 0,
    closedIssues: 0,
    openIssues: 0,
    criticalIssues: 0,
    blockerIssues: 0,
    avgIssuesPerSprint: 0,
    issuesWithReleaseNotes: 0,
  };
  selectedIssue: Issue | null = null;

  // Filter options
  statusOptions: FilterOption[] = [];
  priorityOptions: FilterOption[] = [];
  typeOptions: FilterOption[] = [];
  carrierOptions: FilterOption[] = [];
  reporterOptions: FilterOption[] = [];
  componentOptions: FilterOption[] = [];
  sprintTypeOptions: FilterOption[] = [];
  isFilterExpanded: boolean = false;

  badgeStyles = {
    priority: {
      blocker: "jira-badge bg-high",
      critical: "jira-badge bg-critical",
      major: "jira-badge bg-major",
      normal: "jira-badge bg-normal",
      low: "jira-badge bg-low",
    },
    status: {
      closed: "jira-badge bg-closed",
      resolved: "jira-badge bg-resolved",
      "in progress": "jira-badge bg-pending",
      open: "jira-badge bg-open",
      reopened: "jira-badge bg-open",
      done: "jira-badge bg-jiracompleted",
    },
    sprintType: {
      past: "badge-secondary-custom",
      active: "badge-active-custom",
      future: "badge-future-custom",
    },
  };

  constructor(private wizardbackendService: WizardbackendService) {}

  ngOnInit(): void {
    this.fetchReleaseOverview(184);
  }
  openIssueDetails(issue: Issue): void {
    this.selectedIssue = {
      ...issue,
      linkedZendeskTickets: [], 
    };

    this.wizardbackendService.getZendeskLinksByIssueId(issue.id).subscribe({
      next: (response) => {
        const tickets = response?.linkedTickets ?? response?.links ?? [];
        if (this.selectedIssue) {
          this.selectedIssue.linkedZendeskTickets = tickets;
        }
      },
      error: (err) => {
        console.warn(
          "Failed to load linked Zendesk tickets:",
          err.message || err
        );
      },
    });

    const modalElement = document.getElementById("issueDetailsModal");
    if (modalElement) {
      modalElement.style.display = "block";
      modalElement.classList.add("show");
      modalElement.removeAttribute("aria-hidden");
      document.body.classList.add("modal-open");
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById("issueDetailsModal");
    if (modalElement) {
      modalElement.style.display = "none";
      modalElement.classList.remove("show");
      document.body.classList.remove("modal-open");
      this.selectedIssue = null;
    }
  }

  formatDescription(description: string): string {
    if (!description) return "";

    let formatted = description
      .replace(/\n/g, "<br>")
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\{\{([^}]+)\}\}/g, "<code>$1</code>")
      .replace(/^h1\.\s/gm, "<h4>")
      .replace(/^h2\.\s/gm, "<h5>")
      .replace(/^h3\.\s/gm, "<h6>")
      .replace(/^\*\s(.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    return formatted;
  }

  sortSprintsByOldestFirst(): void {
    this.releaseOverview.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }

  fetchReleaseOverview(boardId: number): void {
    this.isLoading = true;
    this.error = null;

    this.wizardbackendService.getReleaseOverview(boardId).subscribe({
      next: (res) => {
        this.releaseOverview = res.overview || [];

        this.sortSprintsByOldestFirst();
        this.filteredOverview = [...this.releaseOverview];
        this.calculateStatistics();
        this.extractFilterOptions();

        this.statisticsList = [
          {
            label: "Total Issues",
            value: this.statistics.totalIssues,
            class: "jira-total-issues",
            icon: "fa-tasks",
          },
          {
            label: "Closed Issues",
            value: this.statistics.closedIssues,
            class: "jira-closed-issues",
            icon: "fa-check-circle",
          },
          //  { label: 'Critical Issues', value: this.statistics.criticalIssues, class: 'jira-critical-issues', icon: 'fa-exclamation-triangle' },
          //  { label: 'Blocker Issues', value: this.statistics.blockerIssues, class: 'jira-blocker-issues', icon: 'fa-ban' },
          {
            label: "With Release Notes",
            value: this.statistics.issuesWithReleaseNotes,
            class: "jira-release-notes",
            icon: "fa-file-alt",
          },
        ];

        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || "Failed to fetch release overview";
        this.isLoading = false;
      },
    });
  }

  sortSprintsByActivity(): void {
    this.releaseOverview.sort((a, b) => {
      if (a.sprintType === "active" && b.sprintType !== "active") return -1;
      if (a.sprintType !== "active" && b.sprintType === "active") return 1;

      if (a.sprintType === "future" && b.sprintType === "past") return -1;
      if (a.sprintType === "past" && b.sprintType === "future") return 1;

      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }

  getSortedSprintsForTimeline(): Sprint[] {
    return [...this.releaseOverview].sort((a, b) => {
      if (a.sprintType === "past" && b.sprintType !== "past") return -1;
      if (a.sprintType !== "past" && b.sprintType === "past") return 1;
      if (a.sprintType === "active" && b.sprintType === "future") return -1;
      if (a.sprintType === "future" && b.sprintType === "active") return 1;

      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }

  calculateStatistics(): void {
    this.statistics.totalSprints = this.releaseOverview.length;

    let allIssues: Issue[] = [];
    this.releaseOverview.forEach((sprint) => {
      allIssues = [...allIssues, ...sprint.issues];
    });

    this.statistics.totalIssues = allIssues.length;
    this.statistics.closedIssues = allIssues.filter(
      (issue) => issue.status.toLowerCase() === "closed"
    ).length;
    this.statistics.openIssues =
      this.statistics.totalIssues - this.statistics.closedIssues;
    this.statistics.criticalIssues = allIssues.filter(
      (issue) => issue.priority.toLowerCase() === "critical"
    ).length;
    this.statistics.blockerIssues = allIssues.filter(
      (issue) => issue.priority.toLowerCase() === "blocker"
    ).length;
    this.statistics.issuesWithReleaseNotes = allIssues.filter(
      (issue) => issue.releaseNote && issue.releaseNote.trim() !== ""
    ).length;

    this.statistics.avgIssuesPerSprint =
      this.statistics.totalSprints > 0
        ? Math.round(this.statistics.totalIssues / this.statistics.totalSprints)
        : 0;
  }

  extractFilterOptions(): void {
    const statuses = new Set<string>();
    const priorities = new Set<string>();
    const types = new Set<string>();
    const carriers = new Set<string>();
    const reporters = new Set<string>();
    const components = new Set<string>();
    const sprintTypes = new Set<string>();

    this.releaseOverview.forEach((sprint) => {
      sprintTypes.add(sprint.sprintType);

      sprint.issues.forEach((issue) => {
        statuses.add(issue.status);
        priorities.add(issue.priority);
        types.add(issue.issuetype);
        if (issue.carrier) carriers.add(issue.carrier);
        if (issue.reporter) reporters.add(issue.reporter);
        issue.components.forEach((component) => components.add(component));
      });
    });

    this.statusOptions = [
      { value: "all", label: "All Statuses" },
      ...Array.from(statuses)
        .sort()
        .map((s) => ({ value: s, label: s })),
    ];

    this.priorityOptions = [
      { value: "all", label: "All Priorities" },
      ...Array.from(priorities)
        .sort()
        .map((p) => ({ value: p, label: p })),
    ];

    this.typeOptions = [
      { value: "all", label: "All Types" },
      ...Array.from(types)
        .sort()
        .map((t) => ({ value: t, label: t })),
    ];

    this.carrierOptions = [
      { value: "all", label: "All Carriers" },
      ...Array.from(carriers)
        .sort()
        .map((c) => ({ value: c, label: c })),
    ];

    this.reporterOptions = [
      { value: "all", label: "All Reporters" },
      ...Array.from(reporters)
        .sort()
        .map((r) => ({ value: r, label: r })),
    ];

    this.componentOptions = [
      { value: "all", label: "All Components" },
      ...Array.from(components)
        .sort()
        .map((c) => ({ value: c, label: c })),
    ];

    this.sprintTypeOptions = [
      { value: "all", label: "All Sprint Types" },
      ...Array.from(sprintTypes)
        .sort()
        .map((st) => ({ value: st, label: st })),
    ];
  }

  applyFilters(): void {
    setTimeout(() => {
      this.filteredOverview = this.releaseOverview
        .map((sprint) => {
          const sprintTypeMatch =
            this.selectedSprintType === "all" ||
            sprint.sprintType === this.selectedSprintType;

          const sprintDateMatch = this.checkSprintDateRange(sprint);

          if (!sprintTypeMatch || !sprintDateMatch) {
            return { ...sprint, issues: [] };
          }

          return {
            ...sprint,
            issues: sprint.issues.filter((issue) => {
              const statusMatch =
                this.selectedStatus === "all" ||
                issue.status === this.selectedStatus;
              const priorityMatch =
                this.selectedPriority === "all" ||
                issue.priority === this.selectedPriority;
              const typeMatch =
                this.selectedType === "all" ||
                issue.issuetype === this.selectedType;
              const carrierMatch =
                this.selectedCarrier === "all" ||
                issue.carrier === this.selectedCarrier;
              const reporterMatch =
                this.selectedReporter === "all" ||
                issue.reporter === this.selectedReporter;
              const componentMatch =
                this.selectedComponent === "all" ||
                issue.components.includes(this.selectedComponent);

              const searchMatch =
                this.searchTerm === "" ||
                issue.summary
                  .toLowerCase()
                  .includes(this.searchTerm.toLowerCase()) ||
                issue.key
                  .toLowerCase()
                  .includes(this.searchTerm.toLowerCase()) ||
                (issue.carrier &&
                  issue.carrier
                    .toLowerCase()
                    .includes(this.searchTerm.toLowerCase())) ||
                (issue.description &&
                  issue.description
                    .toLowerCase()
                    .includes(this.searchTerm.toLowerCase()));

              const releaseNoteMatch =
                !this.hasReleaseNote ||
                (issue.releaseNote && issue.releaseNote.trim() !== "");

              return (
                statusMatch &&
                priorityMatch &&
                typeMatch &&
                carrierMatch &&
                reporterMatch &&
                componentMatch &&
                searchMatch &&
                releaseNoteMatch
              );
            }),
          };
        })
        .filter((sprint) => sprint.issues.length > 0);
    }, 0);
  }

  checkSprintDateRange(sprint: Sprint): boolean {
    if (!this.startDateFilter && !this.endDateFilter) return true;

    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);

    if (this.startDateFilter) {
      const filterStart = new Date(this.startDateFilter);
      if (sprintEnd < filterStart) return false;
    }

    if (this.endDateFilter) {
      const filterEnd = new Date(this.endDateFilter);
      if (sprintStart > filterEnd) return false;
    }

    return true;
  }

  onStatusChange(value: string): void {
    this.selectedStatus = value;
    this.applyFilters();
  }

  onPriorityChange(value: string): void {
    this.selectedPriority = value;
    this.applyFilters();
  }

  onTypeChange(value: string): void {
    this.selectedType = value;
    this.applyFilters();
  }

  onCarrierChange(value: string): void {
    this.selectedCarrier = value;
    this.applyFilters();
  }

  onReporterChange(value: string): void {
    this.selectedReporter = value;
    this.applyFilters();
  }

  onComponentChange(value: string): void {
    this.selectedComponent = value;
    this.applyFilters();
  }

  onSprintTypeChange(value: string): void {
    this.selectedSprintType = value;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onReleaseNoteFilterChange(): void {
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedStatus = "all";
    this.selectedPriority = "all";
    this.selectedType = "all";
    this.selectedCarrier = "all";
    this.selectedReporter = "all";
    this.selectedComponent = "all";
    this.selectedSprintType = "all";
    this.searchTerm = "";
    this.hasReleaseNote = false;
    this.startDateFilter = "";
    this.endDateFilter = "";
    this.filteredOverview = [...this.releaseOverview];
  }

  selectSprintFromMain(sprint: Sprint): void {
    this.selectedSprintId = sprint.sprintId;
    this.showSprintDetails = true;
  }

  getPriorityBadgeClass(priority: string): string {
    const priorityLower = priority.toLowerCase();
    return this.badgeStyles.priority[priorityLower] || "badge-secondary-custom";
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status.toLowerCase().replace(/\s+/g, "");
    return this.badgeStyles.status[statusLower] || "badge-secondary-custom";
  }

  getSprintTypeBadgeClass(type: string): string {
    const typeLower = type.toLowerCase();
    return this.badgeStyles.sprintType[typeLower] || "badge-light-custom";
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getSprintRemainingProgress(sprint: Sprint): number {
    if (sprint.issues.length === 0) return 0;
    const closedIssues = sprint.issues.filter(
      (issue) => issue.status.toLowerCase() === "closed"
    ).length;
    const completed = (closedIssues / sprint.issues.length) * 100;
    return Math.round(100 - completed);
  }

  getSprintTimePassedPercentage(sprint: Sprint): number {
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    if (now <= start) return 0;
    if (now >= end) return 100;
    const totalTime = end.getTime() - start.getTime();
    const timeElapsed = now.getTime() - start.getTime();

    const percentage = (timeElapsed / totalTime) * 100;
    return Math.round(percentage);
  }

  isSprintExpanded(sprintId: number): boolean {
    return this.expandedSprintIds.has(sprintId);
  }

  toggleSprintExpansion(sprintId: number): void {
    if (this.expandedSprintIds.has(sprintId)) {
      this.expandedSprintIds.delete(sprintId);
    } else {
      this.expandedSprintIds.add(sprintId);
    }
  }

  toggleFilters(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffTime = startOfDate.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  }

  getSprintTypeIcon(sprintType: string): string {
    switch (sprintType.toLowerCase()) {
      case "active":
        return "fa-play-circle";
      case "future":
        return "fa-clock";
      case "past":
        return "fa-check-circle";
      default:
        return "fa-calendar";
    }
  }

  getClosedIssuesCount(sprint: Sprint): number {
    return sprint.issues.filter(
      (issue) =>
        issue.status.toLowerCase() === "closed" ||
        issue.status.toLowerCase() === "done"
    ).length;
  }

  getCriticalBlockerCount(sprint: Sprint): number {
    return sprint.issues.filter(
      (issue) =>
        issue.priority.toLowerCase() === "critical" ||
        issue.priority.toLowerCase() === "blocker"
    ).length;
  }

  getReleaseNotesCount(sprint: Sprint): number {
    return sprint.issues.filter(
      (issue) => issue.releaseNote && issue.releaseNote.trim() !== ""
    ).length;
  }

  // Calculate days until sprint starts (for future sprints)
  getDaysUntilStart(sprint: Sprint): string {
    const now = new Date();
    const startDate = new Date(sprint.startDate);
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays > 1) return `in ${diffDays} days`;
    return "started";
  }

  // Scroll to a specific sprint in the main view
  scrollToSprint(sprintId: number): void {
    // Ensure the sprint is expanded
    this.expandedSprintIds.add(sprintId);

    // Wait for DOM update, then scroll
    setTimeout(() => {
      const element = document.getElementById(`sprint-${sprintId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });

        // Optional: Highlight the scrolled-to sprint
        element.classList.add("highlighted-sprint");
        setTimeout(() => {
          element.classList.remove("highlighted-sprint");
        }, 2000);
      }
    }, 100);
  }

  // Expand all sprints in the main view
  expandAllSprints(): void {
    this.releaseOverview.forEach((sprint) => {
      this.expandedSprintIds.add(sprint.sprintId);
    });
  }

  getIssueProgress(sprint: Sprint): number {
    if (sprint.issues.length === 0) return 0;
    const closedIssues = sprint.issues.filter(
      (issue) => issue.status.toLowerCase() === "closed"
    ).length;
    return (closedIssues / sprint.issues.length) * 100;
  }

  // Export funktioner
  exportToCSV(): void {
    let csvContent =
      "Sprint Name,Sprint Type,Start Date,End Date,Issue Key,Issue Type,Summary,Status,Priority,Reporter,Carrier,Release Note,Components\n";

    this.filteredOverview.forEach((sprint) => {
      sprint.issues.forEach((issue) => {
        const row = [
          `"${sprint.sprintName}"`,
          `"${sprint.sprintType}"`,
          `"${this.formatDate(sprint.startDate)}"`,
          `"${this.formatDate(sprint.endDate)}"`,
          `"${issue.key}"`,
          `"${issue.issuetype}"`,
          `"${issue.summary}"`,
          `"${issue.status}"`,
          `"${issue.priority}"`,
          `"${issue.reporter}"`,
          `"${issue.carrier || ""}"`,
          `"${issue.releaseNote || ""}"`,
          `"${issue.components.join("; ")}"`,
        ].join(",");
        csvContent += row + "\n";
      });
    });

    this.downloadFile(csvContent, "release-notes.csv", "text/csv");
  }

  exportToJSON(): void {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      statistics: this.statistics,
      sprints: this.filteredOverview.map((sprint) => ({
        ...sprint,
        progress: this.getIssueProgress(sprint),
      })),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    this.downloadFile(jsonString, "release-notes.json", "application/json");
  }

  exportReleaseNotes(): void {
    let content = "# Release Notes\n\n";
    content += `Generated on: ${new Date().toLocaleDateString("sv-SE")}\n\n`;

    this.filteredOverview.forEach((sprint) => {
      content += `## ${sprint.sprintName} (${sprint.sprintType})\n`;
      content += `**Period:** ${this.formatDate(
        sprint.startDate
      )} - ${this.formatDate(sprint.endDate)}\n\n`;

      const issuesWithReleaseNotes = sprint.issues.filter(
        (issue) => issue.releaseNote && issue.releaseNote.trim() !== ""
      );

      if (issuesWithReleaseNotes.length > 0) {
        content += "### Features & Changes\n\n";
        issuesWithReleaseNotes.forEach((issue) => {
          content += `- **${issue.key}**: ${issue.releaseNote}\n`;
        });
        content += "\n";
      }

      content += "### All Issues\n\n";
      sprint.issues.forEach((issue) => {
        content += `- [${issue.key}] ${issue.summary} (${issue.status})\n`;
      });
      content += "\n---\n\n";
    });

    this.downloadFile(content, "release-notes.md", "text/markdown");
  }

  private downloadFile(
    content: string,
    filename: string,
    contentType: string
  ): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
