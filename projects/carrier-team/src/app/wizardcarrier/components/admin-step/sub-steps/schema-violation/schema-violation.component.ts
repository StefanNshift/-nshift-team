import { Component, OnInit } from '@angular/core';
import { Database, ref, push, get, update, remove } from '@angular/fire/database';

interface Prompt {
  key?: string;
  name: string;
  instruction: string;
  definition?: string;
  steps: string[];
  rules: string[];
  expectedResult?: string;
}

@Component({
  selector: 'app-schema-violation',
  templateUrl: './schema-violation.component.html',
  styleUrls: ['./schema-violation.component.scss'],
})
export class SchemaViolationComponent implements OnInit {
  prompts: Prompt[] = [];
  newPromptName = '';
  newInstruction = '';
  newDefinition = '';
  newExpectedResult = '';
  newStep = '';
  newStepsList: string[] = [];
  newRule = '';
  newRulesList: string[] = [];
  isLoading = true;
  selectedPrompt: Prompt | null = null;
  editStep = '';
  editRule = '';
  toastVisible = false;
  toastMessage = '';
  toastType = '';

  constructor(private db: Database) {}

  ngOnInit(): void {

    this.fetchPrompts();
  }

  fetchPrompts(): void {
    const promptsRef = ref(this.db, 'prompts');
    get(promptsRef).then(snapshot => {
      if (snapshot.exists()) {
        this.prompts = Object.entries(snapshot.val()).map(([key, value]: [string, any]) => ({
          key,
          name: value.name || '',
          instruction: value.instruction || '',
          definition: value.definition || '',
          steps: this.convertToArray(value.steps),
          rules: this.convertToArray(value.rules),
          expectedResult: value.expectedResult || '',
        }));
      }
      this.isLoading = false;
    });
  }

  private convertToArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') return value.split('\n');
    return [];
  }

  addPrompt(): void {
    if (!this.newPromptName.trim() || !this.newInstruction.trim()) return;

    const newPrompt: Prompt = {
      name: this.newPromptName.trim(),
      instruction: this.newInstruction.trim(),
      definition: this.newDefinition.trim(),
      steps: this.newStepsList,
      rules: this.newRulesList,
      expectedResult: this.newExpectedResult.trim(),
    };

    const promptsRef = ref(this.db, 'prompts');
    push(promptsRef, newPrompt)
      .then(() => {
        this.resetForm();
        this.fetchPrompts();
        this.showToast('Schema Created', 'success');

      })
      .catch(error => console.error('Error adding prompt:', error));
  }

  private resetForm(): void {
    this.newPromptName = '';
    this.newInstruction = '';
    this.newDefinition = '';
    this.newExpectedResult = '';
    this.newStep = '';
    this.newStepsList = [];
    this.newRule = '';
    this.newRulesList = [];
  }

  updatePrompt(): void {
    if (!this.selectedPrompt?.key) return;

    const promptRef = ref(this.db, `prompts/${this.selectedPrompt.key}`);
    update(promptRef, {
      name: this.selectedPrompt.name,
      instruction: this.selectedPrompt.instruction,
      definition: this.selectedPrompt.definition || '',
      steps: this.selectedPrompt.steps,
      rules: this.selectedPrompt.rules,
      expectedResult: this.selectedPrompt.expectedResult || '',
    })
      .then(() => {
        this.showToast('Updated Schema', 'success');

        this.fetchPrompts();
      })
      .catch(error => console.error('Error updating prompt:', error));
  }

  deletePrompt(prompt: Prompt): void {
    if (!prompt.key) return;

    const promptRef = ref(this.db, `prompts/${prompt.key}`);
    remove(promptRef)
      .then(() => {
        if (this.selectedPrompt?.key === prompt.key) {
          this.selectedPrompt = null;
        }
        this.fetchPrompts();
      })
      .catch(error => console.error('Error deleting prompt:', error));
  }

  // Steps methods
  addNewStep(): void {
    if (this.newStep.trim()) {
      this.newStepsList.push(this.newStep.trim());
      this.newStep = '';
    }
  }

  removeNewStep(index: number): void {
    this.newStepsList.splice(index, 1);
  }

  addEditStep(): void {
    if (this.editStep.trim() && this.selectedPrompt) {
      if (!this.selectedPrompt.steps) {
        this.selectedPrompt.steps = [];
      }
      this.selectedPrompt.steps.push(this.editStep.trim());
      this.editStep = '';
    }
  }

  removeEditStep(index: number): void {
    if (this.selectedPrompt?.steps) {
      this.selectedPrompt.steps.splice(index, 1);
    }
  }

  // Rules methods
  addNewRule(): void {
    if (this.newRule.trim()) {
      this.newRulesList.push(this.newRule.trim());
      this.newRule = '';
    }
  }

  removeNewRule(index: number): void {
    this.newRulesList.splice(index, 1);
  }

  addEditRule(): void {
    if (this.editRule.trim() && this.selectedPrompt) {
      if (!this.selectedPrompt.rules) {
        this.selectedPrompt.rules = [];
      }
      this.selectedPrompt.rules.push(this.editRule.trim());
      this.editRule = '';
    }
  }

  removeEditRule(index: number): void {
    if (this.selectedPrompt?.rules) {
      this.selectedPrompt.rules.splice(index, 1);
    }
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
