import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WizardbackendService } from '../../../backend/wizardbackend.service';
import { COUNTRIES } from '../../../../../shared/countries';

@Component({
  selector: 'app-componentjira',
  templateUrl: './componentjira.component.html',
  styleUrls: ['./componentjira.component.scss'],
})
export class ComponentjiraComponent implements OnInit {
  newJiraComponentForm: FormGroup;
  jiraComponents: any[] = [];
  countries = COUNTRIES;
  currentPage = 1;
  itemsPerPage = 10;
  searchTerm = '';
  isLoading = true;

  toastVisible = false;
  toastMessage = '';
  toastType = '';

  selectedProjectKey = 'CART'; // default selection
  availableProjects = ['CART', 'PYT']; // Add more as needed

  constructor(private fb: FormBuilder, private wizardBackendService: WizardbackendService) {
    this.newJiraComponentForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      projectKey: ['CART', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchJiraComponents();
  }

  showToast(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3000);
  }

  fetchJiraComponents() {
    this.isLoading = true;
    const projectKey = this.newJiraComponentForm.value.projectKey;
    this.wizardBackendService.getJiraComponents(projectKey).subscribe({
      next: components => {
        this.jiraComponents = components.map((comp: any) => ({
          ...comp,
          isEditing: false,
          editedName: comp.name,
          editedDescription: comp.description || '',
        }));
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Failed to load Jira components.', 'error');
        this.isLoading = false;
      },
    });
  }

  onProjectChange() {
    const key = this.selectedProjectKey;
    this.newJiraComponentForm.get('projectKey')?.setValue(key);
    this.fetchJiraComponents();
  }

  get filteredJiraComponents() {
    const term = this.searchTerm.toLowerCase();
    return this.jiraComponents.filter(component => component.name.toLowerCase().includes(term));
  }

  addJiraComponent() {
    if (this.newJiraComponentForm.invalid) {
      this.showToast('Please fill out all fields.', 'warning');
      return;
    }

    // Sätt rätt projektKey från dropdown
    const { name, description } = this.newJiraComponentForm.value;
    const projectKey = this.selectedProjectKey;

    this.wizardBackendService.addJiraComponent(projectKey, name, description).subscribe({
      next: () => {
        this.fetchJiraComponents();
        this.showToast('Component added successfully!', 'success');
        this.newJiraComponentForm.reset({ name: '', description: '' }); // Återställ fälten
      },
      error: () => this.showToast('Failed to add component.', 'error'),
    });
  }

  deleteJiraComponent(component: any) {
    if (!confirm(`Are you sure you want to delete "${component.name}"?`)) return;

    this.wizardBackendService.deleteJiraComponent(component.id).subscribe({
      next: () => {
        this.fetchJiraComponents();
        this.showToast('Component deleted successfully!', 'success');
      },
      error: () => this.showToast('Failed to delete component.', 'error'),
    });
  }

  editComponent(component: any) {
    component.isEditing = true;
  }

  cancelEdit(component: any) {
    component.isEditing = false;
    component.editedName = component.name;
    component.editedDescription = component.description || '';
  }

  saveComponentEdit(component: any) {
    const { editedName, editedDescription, id } = component;

    if (!editedName || editedName.trim() === '') {
      this.showToast('Name cannot be empty.', 'warning');
      return;
    }

    this.wizardBackendService
      .updateJiraComponent(id, {
        name: editedName.trim(),
        description: editedDescription?.trim() || '',
      })
      .subscribe({
        next: () => {
          component.name = editedName.trim();
          component.description = editedDescription?.trim() || '';
          component.isEditing = false;
          this.showToast('Component updated successfully!', 'success');
        },
        error: () => this.showToast('Failed to update component.', 'error'),
      });
  }
}
