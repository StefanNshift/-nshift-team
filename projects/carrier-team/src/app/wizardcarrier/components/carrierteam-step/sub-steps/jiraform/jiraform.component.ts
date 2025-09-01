import { Component, OnInit } from "@angular/core";
import { WizardbackendService } from "../../../backend/wizardbackend.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import * as Prism from "prismjs";
import {
  Database,
  ref,
  push,
  get,
  update,
  remove,
} from "@angular/fire/database";
import { issueTypeOptions, projectOptions } from "./jiraform.options";

import { AdfConverter } from "../../../../../shared/adf-converter";
import { tinyMceInit } from "../../../../../shared/tinymce-editor-config";
import { Observable, Subject, of, concat } from "rxjs";
import {
  switchMap,
  tap,
  catchError,
  distinctUntilChanged,
} from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-jiraform",
  templateUrl: "./jiraform.component.html",
  styleUrls: ["./jiraform.component.scss"],
})
export class JiraformComponent implements OnInit {
  // Angular standard
  jiraForm!: FormGroup;
  init: any;

  // Loading states
  loading = true;
  isLoading = false;
  editorLoading = false;
  error: string | null = null;
  errorMessage = "";
  jiraCreationFailed = false;

  // ADF (editor conversion etc)
  private adfConverter = new AdfConverter();
  content: string = "";
  description: string = "";
  descriptionJson: string = "";

  // Toast notifications
  toastVisible = false;
  toastMessage = "";
  toastType = "";

  // Sprint / issue management
  fields: any[] = [];
  rightColumnFields: any[] = [];
  sprintOptions: any[] = [];
  allSprints: any[] = [];
  issueTypeOptions = issueTypeOptions;
  projectOptions = projectOptions;
  selectedProjectKey: string = "CART";
  selectedIssueTypeId: string = "10001";

  // Carrier information
  carrierInfo: any = null;
  carrierOptions: any[] = [];
  priorityOptions: any[] = [];
  carrierInfoOptions: any[] = [];
  selectedCarrierId: string = "";
  selectedSubcarrier: any = null;
  selectedProduct: any = null;
  selectedaddons: any = null;
  carrierPrefix: string = "";

  // AI Tools
  aiToolsOptions = [];
  selectedAiTool: any = null;
  aiToolResponse: string = "";
  assignYourselfQa: string = "yes";
  assignYourselfCI: string = "no";

  // Link handling
  linkTypes = [];
  selectedLinkType: string = "Relates";
  linkTargetKey = "";
  linkSearchTerm: string = "";
  linkSearchResults: any[] = [];
  selectedLinks: Array<{ key: string; linkType: string }> = [];

  // Zendesk autocomplete
  zendeskTicket: string = "";
  zendeskInput$ = new Subject<string>();
  zendeskTickets$: Observable<any[]>;
  zendeskAutocompleteLoading = false;
  zendeskLinkSearchTerm: string = "";
  selectedZendeskAutocomplete: Array<{ id: string; subject: string }> = [];
  selectedZendeskLinks: Array<{ ticketId: string; subject: string }> = [];
  linkedZendeskSummary: Array<{ id: string; type: "child" | "mother" }> = [];
  postmanCollections: Array<{ name: string; link: string }> = [];

  // File uploads
  uploadedFiles: File[] = [];
  selectedFile: File | null = null;
  createdNewIssue = false;
  createdIssueKey: string | null = null;

  // Custom notes
  customNote: string = "";

  // User
  userEmail: string = "";

  formloading: boolean = false;
  private urlParams: any = {};

  constructor(
    private backend: WizardbackendService,
    private fb: FormBuilder,
    private db: Database,
    private route: ActivatedRoute,
    private router: Router // Lägg till denna
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      console.log("🔍 URL params received:", params);

      if (params["id"]) {
        console.log("🔍 Found ticket ID, fetching all data:", params["id"]);

        this.backend.getTicketDataById(params["id"]).subscribe({
          next: (response) => {
            console.log("✅ Successfully loaded all ticket data:", response);

            this.description = response.html;
            this.selectedProjectKey = response.project || "CART";

            this.urlParams = {
              summary: response.summary,
              carrier: response.carrier,
              priority: response.priority,
              project: response.project,
              zendesk_ticket_id: response.zendesk_ticket_id,
            };

            console.log("✅ Set all fields from ticket data");
          },
          error: (error) => {
            console.error("❌ Failed to load ticket data:", error);
            this.showToast("Failed to load ticket data", "error");
          },
        });
      } else {
        this.urlParams = {
          title: params["title"] ? decodeURIComponent(params["title"]) : null,
          carrier: params["carrier"] || null,
          priority: params["priority"] || null,
          project: params["project"] || null,
        };

        if (params["htmlId"]) {
          this.backend.getHtmlById(params["htmlId"]).subscribe({
            next: (response) => {
              this.description = response.html;
            },
            error: (error) => {
              console.error("❌ Failed to load HTML:", error);
            },
          });
        }
      }
    });

    const savedDescription = localStorage.getItem("jiraFormDraftDescription");
    if (savedDescription && !this.description) {
      this.description = savedDescription;
    }

    const cachedPostmanCollections =
      sessionStorage.getItem("postmanCollections");
    if (cachedPostmanCollections) {
      try {
        this.postmanCollections = JSON.parse(cachedPostmanCollections);
        console.log(
          "✅ Loaded Postman Collections from sessionStorage:",
          this.postmanCollections
        );
      } catch (e) {
        console.error("❌ Failed to parse cached Postman Collections:", e);
        this.loadPostmanCollections();
      }
    } else {
      this.loadPostmanCollections();
    }

    this.loadZendeskAutocomplete();

    this.init = tinyMceInit(
      this.highlightCodeBlocksInEditor.bind(this),
      this.improveSubjectFromEditor.bind(this),
      this.suggestReleaseNoteFromEditor.bind(this),
      this.insertTemplate.bind(this),
      () => this.carrierInfoOptions,
      () => Promise.resolve(this.postmanCollections)
    );

    this.loadProjectFields(this.selectedProjectKey);
    this.fetchPrompts();
    this.fetchLinkTypes();

    setTimeout(() => {
      this.loading = false;
      this.formloading = true;
    }, 1000);
  }

  loadPostmanCollections(): void {
    this.backend.getPostmanCollections().subscribe({
      next: (collections) => {
        this.postmanCollections = collections || [];
        console.log("✅ Loaded Postman Collections:", this.postmanCollections);

        sessionStorage.setItem(
          "postmanCollections",
          JSON.stringify(this.postmanCollections)
        );
      },
      error: (err) => {
        console.error("❌ Failed to load Postman Collections:", err);
        this.postmanCollections = [];
        sessionStorage.removeItem("postmanCollections");
      },
    });
  }

  loadZendeskAutocomplete() {
    this.zendeskTickets$ = this.zendeskInput$.pipe(
      distinctUntilChanged(),
      tap(() => (this.zendeskAutocompleteLoading = true)),
      switchMap((term) =>
        this.backend.getZendeskTicket(term).pipe(
          tap((res) => console.log("🔍 Fetched from backend:", res)),
          catchError(() => of(null)),
          tap(() => (this.zendeskAutocompleteLoading = false)),
          switchMap((res) => {
            if (!res) return of([]);
            const result = [
              { id: term, subject: res.TicketSubject || `Ticket #${term}` },
            ];
            return of(result);
          })
        )
      )
    );
  }

  fetchLinkTypes(): void {
    this.backend.getLinkTypes().subscribe({
      next: (res: any[]) => {
        this.linkTypes = res;

        const defaultType = this.linkTypes.find(
          (t) =>
            (t.inward && t.inward.toLowerCase() === "relates to") ||
            (t.outward && t.outward.toLowerCase() === "relates to")
        );

        if (defaultType) {
          this.selectedLinkType = defaultType.name;
        }
      },
      error: (err) => {
        console.error("❌ Failed to load link types:", err);
        this.linkTypes = [];
      },
    });
  }

  ngAfterViewInit() {
    Prism.highlightAll();

    setTimeout(() => {
      this.applyUrlParametersToForm();
    }, 3000);
  }

  private applyUrlParametersToForm(): void {
    if (!this.urlParams || !this.jiraForm) return;

    console.log("🔍 Applying URL params:", this.urlParams);

    if (this.urlParams.summary) {
      this.jiraForm.get("summary")?.setValue(this.urlParams.summary);
      console.log("✅ Set title:", this.urlParams.summary);
    }

    if (this.urlParams.carrier && this.carrierOptions.length > 0) {
      console.log("🔍 Looking for carrier:", this.urlParams.carrier);
      console.log("🔍 Available carriers:", this.carrierOptions);

      let carrier = this.carrierOptions.find((opt) =>
        opt.value?.includes(`(${this.urlParams.carrier})`)
      );

      if (!carrier) {
        carrier = this.carrierOptions.find(
          (opt) => opt.id === this.urlParams.carrier
        );
      }

      if (!carrier) {
        carrier = this.carrierOptions.find((opt) =>
          opt.value?.includes(this.urlParams.carrier)
        );
      }

      if (!carrier) {
        carrier = this.carrierOptions.find((opt) =>
          opt.value?.startsWith(this.urlParams.carrier)
        );
      }

      console.log("🔍 Found carrier:", carrier);

      if (carrier) {
        this.jiraForm.get("customfield_10378")?.setValue(carrier.id);
        console.log("✅ Set carrier:", carrier.value);
      } else {
        console.log("❌ Could not find carrier:", this.urlParams.carrier);
      }
    }

    if (this.urlParams.zendesk_ticket_id) {
      console.log(
        "✅ Setting Zendesk ticket ID:",
        this.urlParams.zendesk_ticket_id
      );
      this.zendeskTicket = this.urlParams.zendesk_ticket_id;

      this.selectedZendeskAutocomplete = [
        {
          id: this.urlParams.zendesk_ticket_id,
          subject: `Ticket #${this.urlParams.zendesk_ticket_id}`,
        },
      ];

      this.backend
        .getZendeskTicket(this.urlParams.zendesk_ticket_id)
        .subscribe({
          next: (res) => {
            if (res && res.TicketSubject) {
              this.selectedZendeskAutocomplete = [
                {
                  id: this.urlParams.zendesk_ticket_id,
                  subject: res.TicketSubject,
                },
              ];
            }
          },
          error: (err) => {
            console.error("❌ Failed to load Zendesk ticket info:", err);
          },
        });
    }

    if (this.urlParams.priority && this.priorityOptions.length > 0) {
      const priority = this.priorityOptions.find(
        (opt) => opt.name === this.urlParams.priority
      );
      if (priority) {
        this.jiraForm.get("priority")?.setValue(priority.id);
        console.log("✅ Set priority:", priority.name);
      }
    }
  }

  onLinkSearchChange(): void {
    if (!this.linkSearchTerm || this.linkSearchTerm.trim().length < 2) {
      this.linkSearchResults = [];
      return;
    }

    this.backend.searchJiraIssues(this.linkSearchTerm).subscribe({
      next: (res) => {
        this.linkSearchResults = res.issues || [];
      },
      error: (err) => {
        this.linkSearchResults = [];
      },
    });
  }

  onSelectSearchResult(item: any): void {
    this.linkSearchResults = [];

    const newEntry = {
      key: item.key,
      linkType: this.selectedLinkType,
    };

    this.selectedLinks.push(newEntry);
    this.linkSearchTerm = "";
  }

  removeLinkedIssue(index: number): void {
    this.selectedLinks.splice(index, 1);
  }

  private highlightCodeBlocksInEditor(): void {
    setTimeout(() => {
      const iframe = (window as any).tinymce?.activeEditor?.iframeElement;
      if (iframe && iframe.contentDocument) {
        const codeBlocks = iframe.contentDocument.querySelectorAll("pre code");
        codeBlocks.forEach((block: any) => {
          Prism.highlightElement(block);
        });
      }
    }, 50);
  }

  onLinkIssue(): void {
    if (!this.createdIssueKey) {
      return;
    }
    if (!this.linkTargetKey) {
      return;
    }

    this.backend
      .linkIssue(
        this.createdIssueKey,
        this.linkTargetKey,
        this.selectedLinkType
      )
      .subscribe({
        next: (res) => {
          console.log("✅ Linked issue:", res);
        },
        error: (err) => {
          console.error("❌ Error linking issue:", err);
        },
      });
  }

  fetchPrompts(): void {
    this.isLoading = true;

    const promptsRef = ref(this.db, "prompts");

    get(promptsRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          console.warn("⚠️ No prompts found in Firebase.");
          this.isLoading = false;
          return;
        }

        const promptData = snapshot.val();

        const prompts = Object.entries(promptData).map(
          ([key, value]: [string, any]) => ({
            name: value.name || "",
            instruction: value.instruction || "",
            definition: value.definition || "",
            steps: value.steps || "",
            rules: value.rules || "",
            expectedResult: value.expectedResult || "",
          })
        );

        this.aiToolsOptions = prompts.map((p) => ({
          value: p.name,
          label: p.name.replace(/([a-z])([A-Z])/g, "$1 $2"),
          icon: "fas fa-magic",
          promptData: p,
        }));

        this.aiToolsOptions.push({
          value: "recommendSprint",
          label: "Sprint Capacity Recommendation",
          icon: "fas fa-chart-line",
          promptData: {
            name: "Sprint Capacity Recommendation",
            instruction:
              "Use GPT to recommend which sprint to assign the ticket based on capacity, risk, and priority.",
            definition: "",
            steps: "",
            rules: "",
            expectedResult:
              "The recommended sprint name and reason why it is suitable.",
          },
        });

        console.log("✅ AI Tools loaded:", this.aiToolsOptions);
        this.isLoading = false;

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        this.userEmail = storedUser?.email || "";
      })
      .catch((err) => {
        console.error("❌ Failed to fetch prompts:", err);
        this.isLoading = false;
      });
  }
  allTextFields: { [key: string]: string } = {};

  onProjectChange(): void {
    this.saveFormFields();
    if (this.jiraForm && this.jiraForm.contains("components")) {
      this.jiraForm.get("components")?.reset("");
      console.log("🧹 Rensade komponentfält p.g.a. projektbyte");
    }
    this.loadProjectFields(this.selectedProjectKey);
  }

  saveFormFields(): void {
    if (!this.jiraForm) return;

    for (const key of Object.keys(this.jiraForm.controls)) {
      const value = this.jiraForm.get(key)?.value;
      if (typeof value === "string" && value.trim() !== "") {
        this.allTextFields[key] = value;
      }
    }

    const sprintControl = this.jiraForm.get("customfield_10008");
    if (sprintControl && sprintControl.value) {
      this.allTextFields["customfield_10008"] = sprintControl.value;
    }

    if (this.description && this.description.trim() !== "") {
      this.allTextFields["description"] = this.description;
    }

    console.log("💾 Sparade formulärfält:", this.allTextFields);
  }

  loadProjectFields(
    projectKey: string,
    previousValues?: any,
    previousSummary?: string
  ): void {
    this.loading = true;
    const cachedFields = sessionStorage.getItem(
      `jiraCreateFields_${projectKey}`
    );

    this.backend.getJiraCreateFields(projectKey).subscribe({
      next: (res) => {
        sessionStorage.setItem(
          `jiraCreateFields_${projectKey}`,
          JSON.stringify(res)
        );
        console.log(
          `📥 Fetched Jira fields for ${projectKey} from backend and saved to sessionStorage`
        );
        this.processFields(res);
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load Jira fields.";
        console.error(err);
        this.loading = false;
      },
    });

    if (cachedFields) {
      console.log(
        `✅ Loaded Jira fields for ${projectKey} from sessionStorage`
      );
      this.processFields(JSON.parse(cachedFields));
      this.loading = false;
    } else {
      this.backend.getJiraCreateFields(projectKey).subscribe({
        next: (res) => {
          sessionStorage.setItem(
            `jiraCreateFields_${projectKey}`,
            JSON.stringify(res)
          );
          console.log(
            `📥 Fetched Jira fields for ${projectKey} from backend and saved to sessionStorage`
          );
          this.processFields(res);
          this.loading = false;
        },
        error: (err) => {
          this.error = "Failed to load Jira fields.";
          console.error(err);
          this.loading = false;
        },
      });
    }
  }

  escapeXml(xmlString: string): string {
    return xmlString
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  get selectedIssueTypeName(): string {
    return (
      this.issueTypeOptions.find((opt) => opt.id === this.selectedIssueTypeId)
        ?.name || ""
    );
  }

  carrierSearchTerm: string = "";
  filteredMultiCarriers: any[] = [];
  selectedMultiCarriers: any[] = [];

  onAiToolSelected(): void {
    const description = this.description;
    const haveContent = description.replace(/<[^>]*>/g, "").trim();

    if (!haveContent) {
      this.showToast("You need to add description", "warning");
      return;
    }

    const priorityId = this.jiraForm.get("priority")?.value;
    const priority = this.priorityOptions.find((p) => p.id === priorityId);
    const carrierId = this.jiraForm.get("customfield_10378")?.value;
    const carrier = this.carrierOptions.find((c) => c.id === carrierId);

    this.isLoading = true;

    if (this.selectedAiTool?.value === "recommendSprint") {
      const ticketData = {
        selectedJiraTitle: this.jiraForm.get("summary")?.value || "",
        selectedJiraDecription: description,
        selectedJiraPriority: priority?.name || priorityId,
        selectedJiraCarrier: carrier?.value || carrierId,
        suggestedSprintId: this.jiraForm.get("customfield_10008")?.value,
      };

      const sprintIds = this.sprintOptions.map((s) => s.id);
      const allsprints = [...this.sprintOptions];

      this.backend.getJiraSprintWork(sprintIds, false).subscribe({
        next: (response) => {
          const sprintResults = response?.results || [];

          const recommendationPayload = {
            sprintData: sprintResults,
            requstedJiraToCreate: ticketData,
            allsprints,
          };

          this.backend
            .recommendSprintForTicket(recommendationPayload)
            .subscribe({
              next: (recommendation) => {
                this.isLoading = false;

                this.aiToolResponse = `🧠 Recommended Sprint: <strong>${recommendation.recommendedSprint}</strong><br>
              📌 <em>${recommendation.reason}</em>`;

                const exists = this.sprintOptions.some(
                  (opt) => opt.value === recommendation.recommendedSprint
                );
                if (!exists) {
                  this.sprintOptions.push({
                    id: 9999999,
                    value: `${recommendation.recommendedSprint} (GPT Recommendation)`,
                  });
                }
              },
              error: (err) => {
                console.error("❌ GPT Sprint Recommendation error:", err);
                this.isLoading = false;
                this.aiToolResponse = "Error getting sprint recommendation.";
              },
            });
        },
        error: (err) => {
          console.error("❌ Failed to fetch sprint data:", err);
          this.isLoading = false;
          this.aiToolResponse = "Error fetching sprint data.";
        },
      });

      return;
    }

    const bcData = {
      SelectedJiraprojectKey: this.selectedProjectKey,
      selectedJiraDecription: description,
      selectedJiraPriority: priority?.name || priorityId,
      selectedJiraCarrier: carrier?.value || carrierId,
      jirasprint: this.jiraForm.get("customfield_10008")?.value,
      selectedIssueType: this.selectedIssueTypeName,
    };

    this.backend
      .evaluatePromptWithJira(this.selectedAiTool.promptData, bcData)
      .subscribe({
        next: (res: any) => {
          console.log("✅ AI Tool response:", res);
          this.aiToolResponse = res?.reason?.trim() || "No response.";
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error("❌ Error from evaluatePromptWithJira:", err);
          this.aiToolResponse = "Error executing prompt.";
          this.isLoading = false;
        },
      });
  }

  filterMultiCarriers(): void {
    const allOptions =
      this.rightColumnFields.find((f) => f.key === "customfield_10378")
        ?.allowedValues || [];
    const term = this.carrierSearchTerm.toLowerCase();
    this.filteredMultiCarriers = allOptions.filter(
      (c: any) =>
        (c.value || "").toLowerCase().includes(term) &&
        !this.selectedMultiCarriers.some((sel) => sel.id === c.id)
    );
  }

  selectCarrierMulti(carrier: any): void {
    this.selectedMultiCarriers.push(carrier);
    this.carrierSearchTerm = "";
    this.filteredMultiCarriers = [];
    this.updateSummaryFromCarrier();
  }

  removeCarrier(carrier: any): void {
    this.selectedMultiCarriers = this.selectedMultiCarriers.filter(
      (c) => c.id !== carrier.id
    );
    this.updateSummaryFromCarrier();
  }

  updateSummaryFromCarrier(): void {
    const names = this.selectedMultiCarriers.map((c) => c.value);
    const joined = names.join(", ");
    const current = this.jiraForm.get("summary")?.value || "";
    const stripped = current.split(" - ")[1] || "";
    this.jiraForm.get("summary")?.setValue(`${joined} - ${stripped}`);
  }

  validateDescription() {
    const description = this.jiraForm.get("description")?.value;
    if (!description) return;

    this.backend.validateDescription(description).subscribe({
      next: (response: any) => {
        console.log(response);
        let raw = response?.validation || response;
        const match = raw.match(/```html\s*([\s\S]*?)```/);
        const htmlContent = match ? match[1].trim() : raw;
        this.jiraForm.get("description")?.setValue(htmlContent);
      },
      error: (err) => {
        console.error("Validation error", err);
      },
    });
  }

  processFields(res: any): void {
    const allFields = res.fields;
    console.log(allFields);
    this.error = null;

    const getField = (key: string) => allFields.find((f: any) => f.key === key);

    const fieldsWithLayout = [
      {
        key: "customfield_10378",
        location: "main",
        order: 1,
        columnWidth: 3,
        type: "searchable-select",
        required: true,
      },
      {
        key: "priority",
        location: "main",
        order: 2,
        columnWidth: 3,
        type: "searchable-select",
        required: true,
        defaultValue: "Normal",
      },
      {
        key: "components",
        location: "main",
        order: 3,
        columnWidth: 3,
        type: "searchable-multiselect",
        required: true,
      },
      {
        key: "customfield_10008",
        location: "main",
        order: 4,
        columnWidth: 3,
        type: "searchable-select",
      },
      { key: "summary", location: "main", order: 5, columnWidth: 12 },
      {
        key: "customfield_10023",
        location: "sidebar",
        order: 7,
        columnWidth: 6,
        type: "searchable-select",
        defaultValue: "No",
      },
      {
        key: "customfield_10018",
        location: "sidebar",
        order: 8,
        columnWidth: 6,
        type: "textfield",
      },
      {
        key: "customfield_10393",
        location: "sidebar",
        order: 3,
        columnWidth: 6,
        defaultValue: "No",
        type: "searchable-select",
      },
    ];

    const carrierField = getField("customfield_10378");
    const enhancedFields = fieldsWithLayout
      .map((config) => {
        const field = getField(config.key);
        if (!field) return null;
        return {
          ...field,
          ...config,
          required:
            config.required !== undefined
              ? config.required
              : field.required || false,
        };
      })
      .filter(Boolean);

    enhancedFields.forEach((field: any) => {
      if (field.key === "customfield_10378") {
        (field.allowedValues || []).forEach((opt: any) => {
          const match = opt.value?.match(/\(([^)]+)\)/);
          let rawCode = match?.[1]?.toUpperCase();

          if (rawCode === "UK") {
            rawCode = "GB";
          }
          if (rawCode === "INT" || rawCode === "INTERNATIONAL") {
            opt.iconUrl = null;
            opt.emojiFlag = "🌐";
          } else if (rawCode && rawCode.length === 2) {
            opt.iconUrl = `https://flagsapi.com/${rawCode}/flat/24.png`;
            opt.emojiFlag = "";
          } else {
            opt.iconUrl = null;
            opt.emojiFlag = "🌐";
          }
        });
      }

      if (field.type === "searchable-select") {
        field.searchTerm = "";
        field.filteredOptions = field.allowedValues || [];
      }
      if (field.type === "searchable-multiselect") {
        field.searchTerm = "";
        field.selectedOptions = [];
        field.filteredOptions = field.allowedValues || [];
      }
    });

    enhancedFields.sort((a, b) => a.order - b.order);

    this.carrierOptions = carrierField?.allowedValues || [];
    this.priorityOptions = getField("priority")?.allowedValues || [];

    const sprintField = enhancedFields.find(
      (f) => f.key === "customfield_10008"
    );

    if (sprintField) {
      this.backend.getLastSprints().subscribe({
        next: (data: any) => {
          const allSprints = (data.values || []).filter(
            (s: any) => s.state.toLowerCase() !== "closed"
          );
          this.sprintOptions = allSprints.map((s: any) => ({
            id: s.id,
            value:
              s.state.toLowerCase() === "active"
                ? `${s.name} (Active)`
                : s.name,
          }));
          sprintField.allowedValues = this.sprintOptions;

          this.fields = enhancedFields.filter((f) => f.location === "main");
          this.rightColumnFields = enhancedFields.filter(
            (f) => f.location === "sidebar"
          );
          this.buildForm();
          this.setupJiraFormAutosave();
          this.restoreFormFields();

          if (this.allTextFields) {
            for (const key of Object.keys(this.allTextFields)) {
              if (this.jiraForm.contains(key)) {
                this.jiraForm.get(key)?.setValue(this.allTextFields[key]);
              }
            }
          }

          this.setupCarrierSummaryUpdater(carrierField);
        },
        error: (err) => {
          console.error("❌ Failed to fetch sprints:", err);
          this.fields = enhancedFields.filter((f) => f.location === "main");
          this.rightColumnFields = enhancedFields.filter(
            (f) => f.location === "sidebar"
          );
          this.buildForm();
          this.setupCarrierSummaryUpdater(carrierField);
        },
      });
      return;
    }

    this.fields = enhancedFields.filter((f) => f.location === "main");

    this.fields.sort((a, b) => a.order - b.order);

    this.rightColumnFields = enhancedFields.filter(
      (f) => f.location === "sidebar"
    );
    this.buildForm();
    this.restoreFormFields();

    this.setupCarrierSummaryUpdater(carrierField);
  }

  restoreFormFields(): void {
    if (!this.allTextFields || !this.jiraForm) return;

    for (const key of Object.keys(this.allTextFields)) {
      if (!this.jiraForm.contains(key)) continue;

      const control = this.jiraForm.get(key);
      const value = this.allTextFields[key];

      if (key === "customfield_10008") {
        const match = this.sprintOptions?.find((opt) => opt.id == value);
        if (match) {
          control?.setValue(match.id);
        } else {
          console.warn(
            `⚠️ Sprintvärde '${value}' hittades inte bland sprintOptions`
          );
        }
        continue;
      }

      control?.setValue(value);
    }
    if (this.allTextFields["description"]) {
      this.description = this.allTextFields["description"];
    }
  }

  setupJiraFormAutosave(): void {
    const saved = localStorage.getItem("jiraFormDraft");
    if (saved && this.jiraForm) {
      try {
        const values = JSON.parse(saved);
        Object.keys(values).forEach((key) => {
          if (this.jiraForm.contains(key)) {
            this.jiraForm.get(key)?.setValue(values[key], { emitEvent: false });
          }
        });
      } catch (e) {}
    }

    this.jiraForm?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        try {
          const hasValue = Object.values(value).some(
            (v) => v !== null && v !== undefined && v !== ""
          );
          if (hasValue) {
            localStorage.setItem("jiraFormDraft", JSON.stringify(value));
          }
        } catch (e) {}
      });
  }

  setupCarrierSummaryUpdater(carrierField: any): void {
    console.log("now");
    this.jiraForm
      .get("customfield_10378")
      ?.valueChanges.subscribe((selectedId) => {
        const option = carrierField?.allowedValues?.find(
          (opt: any) => opt.id === selectedId
        );

        const rawValue = option?.value || "";
        const currentSummary = this.jiraForm.get("summary")?.value || "";
        const strictPattern = /^(\d+)\s*-?\s*(.*?)\s*\((\w+)\)$/;
        const loosePattern = /^(\d+)?\s*-?\s*([^\(]+)?\s*\((\w+)\)/;

        const match = rawValue.match(strictPattern);

        let newPrefix = "";
        let carrierId = "";

        if (match) {
          const [_, number, name, country] = match;
          newPrefix = `${country} - ${name} (${number})`;
          carrierId = number.replace(/^0+/, "");
        } else {
          newPrefix = rawValue;

          const looseMatch = rawValue.match(loosePattern);
          if (looseMatch && looseMatch[1]) {
            carrierId = looseMatch[1].replace(/^0+/, "");
          }
        }

        console.log(carrierId);
        this.loadCarrierInfo(carrierId);

        const stripped = currentSummary.includes(" - ")
          ? currentSummary.split(" - ").slice(1).join(" - ")
          : "";

        const updatedSummary = `${newPrefix} - `;

        console.log("📌 Saved carrier prefix to localStorage:", updatedSummary);
        this.carrierPrefix = updatedSummary;
        localStorage.setItem("jiraFormCarrierPrefix", updatedSummary);
        //  this.jiraForm.get('summary')?.setValue(updatedSummary, { emitEvent: false });
      });
  }

  loadCarrierInfo(carrierId: string): void {
    if (!carrierId) return;
    console.log("Carrier ID:", carrierId);
    this.backend.getCarrierInfoXML(carrierId).subscribe({
      next: (res: any) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(res, "text/xml");

        this.carrierInfoOptions = [];

        const allCarrierServices = Array.from(
          xml.querySelectorAll("CarrierService")
        );
        allCarrierServices.forEach((service) => {
          const id = service.getAttribute("serviceid");
          const name = service.getAttribute("name");
          if (name && id) {
            this.carrierInfoOptions.push({
              section: "addon",
              label: `${name} (${id})`,
              value: `${name} (${id})`,
              level: "Carrier",
            });
          }
        });
        const carrierValidationRules = Array.from(
          xml.querySelectorAll("Carrier > ValidationRules > ValidationRule")
        );
        carrierValidationRules.forEach((rule) => {
          this.carrierInfoOptions.push({
            section: "Validation",
            label: buildValidationLabel(rule, "Carrier"),
            value: `<pre>${this.escapeXml(rule.outerHTML)}</pre>`,
            level: "Carrier",
          });
        });

        const subcarrierNodes = xml.querySelectorAll("SubCarrier");
        subcarrierNodes.forEach((subcarrierNode) => {
          const subName = subcarrierNode.getAttribute("name") || "";
          const subValue = subcarrierNode.getAttribute("value") || "";

          this.carrierInfoOptions.push({
            section: "Subcarrier",
            label: `${subName} (${subValue})`,
            value: `${subName} (${subValue})`,
            level: "Subcarrier",
          });

          const subValidations = subcarrierNode.querySelectorAll(
            "ValidationRules > ValidationRule"
          );
          subValidations.forEach((rule) => {
            this.carrierInfoOptions.push({
              section: "Validation",
              label: buildValidationLabel(rule, `Carrier`),
              value: `<pre>${this.escapeXml(rule.outerHTML)}</pre>`,
              level: "Carrier",
            });
          });

          const productNodes =
            subcarrierNode.querySelectorAll("Products > Product");
          productNodes.forEach((productNode) => {
            const prodName = productNode.getAttribute("name") || "";
            const prodCodefile = productNode.getAttribute("codefile") || "";
            const prodValue = productNode.getAttribute("value") || "";
            const label = ` ${prodName} (${prodValue})`;

            this.carrierInfoOptions.push({
              section: "Product",
              label,
              value: label,
              level: "Product",
            });

            const productValidations = productNode.querySelectorAll(
              "ValidationRules > ValidationRule"
            );
            productValidations.forEach((rule) => {
              this.carrierInfoOptions.push({
                section: "Validation",
                label: buildValidationLabel(rule, `Product: ${prodName}`),
                value: `<pre>${this.escapeXml(rule.outerHTML)}</pre>`,
                level: "Product",
              });
            });
          });
        });

        console.log(this.carrierInfoOptions);

        function buildValidationLabel(
          rule: Element,
          levelLabel: string
        ): string {
          const msg = rule.getAttribute("custommessage")?.trim();
          if (msg && msg.length > 0) {
            return `${msg} (${levelLabel})`;
          }

          const ruleName = rule.getAttribute("name") || "";
          const field = rule.getAttribute("field") || "";
          const min = rule.getAttribute("min") || "";
          const max = rule.getAttribute("max") || "";

          const shortDesc = `${ruleName}${field ? " on " + field : ""}${
            min || max ? ` (${min}-${max})` : ""
          }`;
          return `${shortDesc} (${levelLabel})`;
        }
      },
      error: (err) => {
        console.error("❌ Failed to load carrier info:", err);
      },
    });
  }

  selectMultiOption(option: any, field: any): void {
    if (!field.selectedOptions) {
      field.selectedOptions = [];
    }
    const alreadySelected = field.selectedOptions.find(
      (o: any) => o.id === option.id
    );
    if (!alreadySelected) {
      field.selectedOptions.push(option);
      const selectedValues = field.selectedOptions.map(
        (opt: any) => opt.id || opt.value
      );
      this.jiraForm.get(field.key)?.setValue(selectedValues);
    }

    field.searchTerm = "";
    field.filteredOptions = [];
  }

  removeMultiOption(option: any, field: any): void {
    field.selectedOptions = field.selectedOptions.filter(
      (o: any) => o.id !== option.id
    );
    const selectedValues = field.selectedOptions.map(
      (opt: any) => opt.id || opt.value
    );
    this.jiraForm.get(field.key)?.setValue(selectedValues);
  }

  suggestReleaseNoteFromEditor(editor: any) {
    const description = this.description;
    const haveContent = description.replace(/<[^>]*>/g, "").trim();
    this.editorLoading = true;

    if (!haveContent) {
      this.showToast("You need to add description", "warning");
    } else {
      this.backend.suggestPublicReleaseNote(description).subscribe({
        next: (res: any) => {
          const suggestion = res.releaseNote || "No suggestion returned.";
          this.jiraForm.get("customfield_10018")?.setValue(suggestion);
          this.editorLoading = false;
        },
        error: (err: any) => {
          console.error("❌ Failed to generate release note:", err);
          editor.insertContent(`<p>Error generating release note</p>`);
          this.editorLoading = false;
        },
      });
    }
  }

  improveSubjectFromEditor(editor: any) {
    const description = this.description?.replace(/<[^>]*>/g, "").trim();
    this.editorLoading = true;

    if (!description) {
      this.showToast("You need to add description and summary", "warning");
      this.editorLoading = false;
      return;
    }

    const content = editor.getContent() || "";
    this.backend.generateJiraTitle(content).subscribe({
      next: (res: any) => {
        const suggested = res.suggestedTitle?.trim() || "";
        this.jiraForm.get("summary")?.setValue(suggested);
        console.log("✅ Updated summary:", suggested);
        this.editorLoading = false;
      },
      error: (err) => {
        console.error("❌ Failed to generate Jira title:", err);
        this.editorLoading = false;
      },
    });
  }

  insertTemplate(editor: any) {
    const haveContent = !!(this.description || "")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!haveContent) {
      this.showToast("You need to add description", "warning");
    } else {
      this.editorLoading = true;
      const description = editor.getContent() || "";
      this.backend.improveJiraText(description).subscribe({
        next: (res: any) => {
          const improved = res.improvedText || "No content returned.";
          editor.setContent(improved);
          this.description = improved;
          this.editorLoading = false;
        },
        error: (err: any) => {
          this.editorLoading = false;
          console.error("Failed to improve Jira text:", err);
          editor.insertContent(`<p>Error generating improved text</p>`);
        },
      });
    }
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.uploadedFiles.push(...files);

    input.value = "";
  }
  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  shouldShowPublicNotes(): boolean {
    const field = this.jiraForm?.get("customfield_10023");
    return field?.value === "12745";
  }

  buildForm(): void {
    const group: { [key: string]: any } = {};

    [...this.fields, ...this.rightColumnFields].forEach((field) => {
      if (field.key === "description") return;

      const isRequired = field.required || false;
      let defaultValue: any = field.defaultValue || "";

      if (field.allowedValues && typeof defaultValue === "string") {
        const match = field.allowedValues.find(
          (opt: any) => opt.value === defaultValue || opt.name === defaultValue
        );
        if (match) {
          defaultValue = match.id;
        }
      }

      group[field.key] = isRequired
        ? [defaultValue, Validators.required]
        : [defaultValue];
    });

    this.jiraForm = this.fb.group(group);
  }

  submitForm(): void {
    if (!this.jiraForm.valid) {
      this.jiraForm.markAllAsTouched();
      return;
    }

    const formValue = this.jiraForm.value;
    const allFields = [...this.fields, ...this.rightColumnFields];
    const cleanedFormValue: any = {};
    this.jiraCreationFailed = false;

    let ticketInput = this.zendeskTicket?.trim();
    const ticketMatch = ticketInput?.match(/tickets\/(\d+)/);
    const ticketId = ticketMatch ? ticketMatch[1] : ticketInput;

    for (const key in formValue) {
      let value = formValue[key];
      if (value === "" || value === null || value === undefined) continue;

      if (key === "customfield_10018") {
        const adfDoc = this.adfConverter.convertTextToAdf(value);
        cleanedFormValue[key] = adfDoc;
        continue;
      }

      const field = allFields.find((f) => f.key === key);

      const adfDoc = this.adfConverter.convertHtmlToAdf(this.description);
      cleanedFormValue["description"] = adfDoc;

      if (field?.allowedValues) {
        if (Array.isArray(value)) {
          const matched = value
            .map((val) => {
              const match = field.allowedValues.find(
                (opt: any) =>
                  opt.id === val || opt.value === val || opt.name === val
              );
              return match ? { id: match.id } : null;
            })
            .filter(Boolean);
          cleanedFormValue[key] = matched;
        } else {
          const match = field.allowedValues.find(
            (opt: any) =>
              opt.id === value || opt.value === value || opt.name === value
          );
          if (match) {
            const shouldWrapInIdObject =
              (key.startsWith("customfield_") && key !== "customfield_10008") ||
              key === "priority";
            cleanedFormValue[key] = shouldWrapInIdObject
              ? { id: match.id }
              : match.id;
          } else {
            cleanedFormValue[key] = value;
          }
        }
      } else {
        cleanedFormValue[key] = value;
      }
    }

    const projectKey = this.selectedProjectKey;
    const issueTypeOption = this.issueTypeOptions.find(
      (opt) => opt.id === this.selectedIssueTypeId
    );
    const issueType = issueTypeOption?.name || this.selectedIssueTypeId;

    cleanedFormValue["customfield_10577"] = "CarrierConsole";
    const prefix =
      localStorage.getItem("jiraFormCarrierPrefix") || this.carrierPrefix || "";
    cleanedFormValue["summary"] = `${prefix}${cleanedFormValue["summary"]}`;
    this.backend
      .createFlexibleTicket(
        projectKey,
        issueType,
        this.userEmail,
        cleanedFormValue
      )
      .subscribe({
        next: (createResponse) => {
          console.log("✅ Ticket created:", createResponse);
          this.createdIssueKey = createResponse.issueKey;

          if (this.uploadedFiles && this.uploadedFiles.length > 0) {
            this.backend
              .uploadAttachments(this.createdIssueKey, this.uploadedFiles)
              .subscribe({
                next: (uploadResponse) => {
                  this.uploadedFiles = [];
                },
                error: (uploadErr) => {
                  console.error("❌ Failed to upload attachments:", uploadErr);
                },
              });
          }

          if (
            this.selectedZendeskAutocomplete.length > 0 &&
            this.createdIssueKey
          ) {
            const linkedTickets = new Set<string>();

            this.selectedZendeskAutocomplete.forEach((z) => {
              if (!linkedTickets.has(z.id)) {
                this.backend
                  .linkZDtoJira(this.createdIssueKey!, z.id)
                  .subscribe({
                    next: (res) => {
                      linkedTickets.add(z.id);
                      this.linkedZendeskSummary.push({
                        id: z.id,
                        type: "child",
                      });
                    },
                  });
              }
            });

            this.selectedZendeskAutocomplete.forEach((z) => {
              this.backend.getMotherTicket(z.id).subscribe({
                next: (res) => {
                  const motherTicket = res.motherTicket;
                  if (motherTicket && !linkedTickets.has(motherTicket)) {
                    this.backend
                      .linkZDtoJira(this.createdIssueKey!, motherTicket)
                      .subscribe({
                        next: (res) => {
                          linkedTickets.add(motherTicket);
                          this.linkedZendeskSummary.push({
                            id: motherTicket,
                            type: "mother",
                          });
                        },
                      });
                  }
                },
              });
            });
          }

          this.backend.getJiraAccountId(this.userEmail).subscribe({
            next: (accountResponse) => {
              const accountId = accountResponse.accountId;

              const updatePayload: any = {
                reporter: { id: accountId },
              };

              if (this.assignYourselfCI === "yes") {
                updatePayload.customfield_10503 = { id: accountId };
              }

              if (this.assignYourselfQa === "yes") {
                updatePayload.customfield_10379 = { id: accountId };
              }

              if (this.selectedLinks.length > 0) {
                this.selectedLinks.forEach((link) => {
                  this.backend
                    .linkIssue(this.createdIssueKey, link.key, link.linkType)
                    .subscribe({
                      next: (linkRes) => {
                        console.log(
                          `🔗 Linked ${this.createdIssueKey} → ${link.key} as ${link.linkType}`,
                          linkRes
                        );
                      },
                      error: (linkErr) => {
                        console.error(
                          `❌ Failed to link ${this.createdIssueKey} → ${link.key}:`,
                          linkErr
                        );
                      },
                    });
                });
              }

              this.backend
                .updateTicket(this.createdIssueKey!, updatePayload)
                .subscribe({
                  next: (updateResponse) => {
                    this.resetFormAfterSubmit(this.createdIssueKey);
                    console.log(
                      "✅ Ticket updated with reporter:",
                      updateResponse
                    );
                  },
                  error: (updateErr) => {
                    console.error(
                      "❌ Error updating ticket with reporter:",
                      updateErr
                    );
                  },
                });
            },
            error: (acctErr) => {
              console.error("❌ Error getting reporter account ID:", acctErr);
            },
          });
        },
        error: (err) => {
          this.jiraCreationFailed = true;
        },
      });
  }

  private clearUrlParameters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
    this.urlParams = {};
    console.log("✅ Cleared URL parameters");
  }

  resetFormAfterSubmit(ticket: string): void {
    this.zendeskTicket = "";
    this.selectedZendeskAutocomplete = [];
    this.selectedZendeskLinks = [];
    this.linkedZendeskSummary = [];
    this.zendeskLinkSearchTerm = "";
    this.jiraForm?.reset({
      priority: "Normal",
    });
    this.selectedFile = null;
    localStorage.removeItem("jiraFormDraftDescription");
    localStorage.removeItem("jiraFormDraft");
    localStorage.removeItem("jiraFormCarrierPrefix");
    this.carrierPrefix = "";
    this.description = "";
    this.selectedLinks = [];
    this.zendeskTicket = "";
    this.uploadedFiles = [];
    this.aiToolResponse = "";
    const bcField = this.rightColumnFields.find(
      (f) => f.key === "customfield_10393"
    );
    const noOption = bcField?.allowedValues?.find(
      (opt: any) => opt.value === "No" || opt.namez === "No"
    );
    if (noOption) {
      this.jiraForm.get("customfield_10393")?.setValue(noOption.id);
    }

    const releaseField = this.rightColumnFields.find(
      (f) => f.key === "customfield_10023"
    );
    const noReleaseOption = releaseField?.allowedValues?.find(
      (opt: any) => opt.value === "No" || opt.name === "No"
    );
    if (noReleaseOption) {
      this.jiraForm.get("customfield_10023")?.setValue(noReleaseOption.id);
    }
    this.createdIssueKey = undefined;
    this.createdNewIssue = true;
    this.selectedZendeskAutocomplete = [];
    this.selectedZendeskLinks = [];
    this.assignYourselfQa = "yes";
    this.assignYourselfCI = "no";

    const url = `https://nshiftgroup.atlassian.net/browse/${ticket}`;
    window.open(url, "_blank");
    setTimeout(() => {
      this.createdNewIssue = false;
      this.linkedZendeskSummary = [];
    }, 5000);
    this.clearUrlParameters();
  }

  getIssueSummary(key: string): string {
    const issue =
      this.linkSearchResults.find((item) => item.key === key) ||
      this.selectedLinks.find((item) => item.key === key);
    return issue?.fields?.summary || "";
  }

  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    const zone = event.target as HTMLElement;
    zone.classList.add("border-primary");
    zone.style.backgroundColor = "rgba(13, 110, 253, 0.05)";
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const zone = event.target as HTMLElement;
    zone.classList.remove("border-primary");
    zone.style.backgroundColor = "";
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const zone = event.target as HTMLElement;
    zone.classList.remove("border-primary");
    zone.style.backgroundColor = "";

    if (event.dataTransfer?.files) {
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    }
  }

  trackByTicket(index: number, item: any): any {
    return item ? item.id : index;
  }

  handleFiles(files: FileList) {
    this.uploadedFiles = Array.from(files);
  }

  hasAllowedValues(field: any): boolean {
    return Array.isArray(field.allowedValues) && field.allowedValues.length > 0;
  }

  onZendeskChange(val: any) {}

  showDescriptionAsAdf(): void {
    const html = this.description || "";
    const adfDoc = this.adfConverter.convertHtmlToAdf(html);
    this.descriptionJson = JSON.stringify(adfDoc, null, 2);
  }

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }
}
