import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WizardbackendService {
  private readonly WIZARD_BACKEND_URL = environment.apiUrl;
  private readonly API_KEY = environment.apiKey;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.API_KEY,
    });
  }

  getReleaseOverview(boardId: number): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getReleaseOverview`;
    const headers = this.getHeaders();
    return this.http.post(url, { boardId }, { headers });
  }

  //Updated the endpoint due to ChatGPT - Multisupport cant handle VPN Endpoint this need to be changed in the future
  getHtmlById(htmlId: string): Observable<{ html: string }> {
    const url = `https://backendchatgpt-050f.onrender.com/gethtml/${htmlId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ',
    });
    return this.http.get<{ html: string }>(url, { headers });
  }

  //Updated the endpoint due to ChatGPT - Multisupport cant handle VPN Endpoint this need to be changed in the future
  getTicketDataById(ticketId: string): Observable<any> {
    const url = `https://backendchatgpt-050f.onrender.com/getticketdata/${ticketId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': 'zoYrWOhSUQ58KZkc2hpZnQuY29tOkFUQVRUM3hGZ',
    });
    return this.http.get(url, { headers });
  }

  createFlexibleTicket(projectKey: string, issueType: string, reporter: string | null, data: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/createFlexibleTicket`;
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('projectKey', projectKey)
      .set('issueType', issueType)
      .set('reporter', reporter ?? '');

    return this.http.post(url, data, { headers, params });
  }

  updateTicket(issueKey: string, data: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/updateTicket/${issueKey}`;
    const headers = this.getHeaders();
    return this.http.put(url, data, { headers });
  }

  getJiraAccountId(email: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraAccountId`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('email', email);
    return this.http.get(url, { headers, params });
  }

  uploadAttachments(issueKey: string, files: File[]): Observable<any> {
    const formData = new FormData();

    // APPEND flera filer:
    files.forEach(file => formData.append('attachment', file));

    // Se till att du *inte* sätter `Content-Type: application/json` här,
    // utan låter Angular sätta boundary för multipart.
    // Dina HEADERS kan t.ex. vara enbart x-api-key:

    const tokenHeaders = new HttpHeaders({
      'x-api-key': this.API_KEY,
      // Viktigt: INTE "Content-Type": "application/json"
    });

    return this.http.post(`${this.WIZARD_BACKEND_URL}/uploadAttachment/${issueKey}`, formData, {
      headers: tokenHeaders,
    });
  }

  searchJiraIssues(term: string): Observable<any> {
    // GET /searchIssues?term=...
    const url = `${this.WIZARD_BACKEND_URL}/searchIssues`;
    const headers = this.getHeaders(); // x-api-key etc.
    const params = new HttpParams().set('term', term);

    return this.http.get(url, { headers, params });
  }

  getLinkTypes(): Observable<any[]> {
    const headers = this.getHeaders(); // hämtar x-api-key mm

    return this.http.get<any[]>(`${this.WIZARD_BACKEND_URL}/getLinkTypes`, {
      headers,
    });
  }

  getZendeskLinksByIssueId(issueId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getZendeskByIssueId`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('issue_id', issueId);
    return this.http.get(url, { headers, params });
  }

  linkZDtoJira(issue_key: string, ticket_id: string): Observable<any> {
    // t.ex. "Relates", "Blocks", "Duplicates"
    const body = {
      issue_key,
      ticket_id,
    };

    const headers = this.getHeaders(); // hämtar x-api-key mm
    return this.http.post(`${this.WIZARD_BACKEND_URL}/LinkZendeskTicketToJira`, body, { headers });
  }

  getMotherTicket(childTicketId: string): Observable<{ motherTicket: string }> {
    const url = `${this.WIZARD_BACKEND_URL}/GetMotherTicketFromChild`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('ticketID', childTicketId);
    return this.http.get<{ motherTicket: string }>(url, { headers, params });
  }

  linkIssue(issueKeyFrom: string, issueKeyTo: string, linkType: string): Observable<any> {
    // t.ex. "Relates", "Blocks", "Duplicates"
    const body = {
      issueKeyFrom,
      issueKeyTo,
      linkType,
    };

    const headers = this.getHeaders(); // hämtar x-api-key mm

    return this.http.post(`${this.WIZARD_BACKEND_URL}/createIssueLink`, body, { headers });
  }

  suggestPublicReleaseNote(description: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/SuggestReleaseNote`;
    const headers = this.getHeaders();
    return this.http.post(url, { description }, { headers });
  }

  validateDescription(description: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/ValidateCarrierMapping`;
    const headers = this.getHeaders();
    return this.http.post(url, { description }, { headers });
  }

  improveJiraText(description: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/ImproveJiraText`;
    const headers = this.getHeaders();
    return this.http.post(url, { description }, { headers });
  }

  generateJiraTitle(description: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GenerateJiraTitle`;
    const headers = this.getHeaders();
    return this.http.post(url, { description }, { headers });
  }

  getLastSprints(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getLastSprints`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  recommendSprintForTicket(body: { sprintData: any; requstedJiraToCreate: any; allsprints: any }): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/recommendSprintForTicket`;
    const headers = this.getHeaders();

    return this.http.post(url, body, { headers });
  }

  getJiraSprintWork(sprintIds: number[], includeCarrier: boolean = false): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraSprintWork`;
    const headers = this.getHeaders();
    const body = {
      sprintIds,
      includeCarrier,
    };
    return this.http.post(url, body, { headers });
  }

  updateZendeskTickets(tickets: any[]): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/UpdateZendeskTickets`;
    const headers = this.getHeaders();
    return this.http.post(url, { tickets }, { headers });
  }

  getJiraSprint(sprintId: number): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraSprint/${sprintId}`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  evaluatePromptWithJira(prompt: { role: string; content: string }[], requstedJiraToCreate: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/evaluatePromptWithJira`;
    const headers = this.getHeaders();
    const body = {
      prompt,
      requstedJiraToCreate,
    };
    return this.http.post(url, body, { headers });
  }

  public isBreakingChange(requstedJiraToCreate: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/breakingChange`;
    const headers = this.getHeaders();
    return this.http.post(url, { requstedJiraToCreate }, { headers });
  }

  GetZendeskCarrierMangement(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetZendeskCarrierMangement`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  getAllTicketsClosed(startDate: string, endDate: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetAllTicketsClosed?startDate=${startDate}&endDate=${endDate}`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  getAllTickets(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetAllTickets`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getAllUserTickets(email: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetUserTicketIncludeGPT`;
    const params = new HttpParams().set('email', email); // Lägg till e-post som query-param
    return this.http.get(url, { headers: this.getHeaders(), params });
  }

  analyzeTicketsForCarrierID(tickets: any[]): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/AnalyzeTicketsForCarrierID`; // Se till att detta är rätt backend-URL
    const headers = this.getHeaders();
    return this.http.post(url, { tickets }, { headers });
  }

  getCarrierInfo(id: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetCarrierInfo`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('id', id);
    return this.http.get(url, { headers, params });
  }

  getCarrierInfoXML(id: string): Observable<string> {
    const url = `${this.WIZARD_BACKEND_URL}/GetFullCarrierXML`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('id', id);
    return this.http.get(url, { headers, params, responseType: 'text' });
  }

  getPROBIssues(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetPROBIssues`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  assignTicket(ticketId: number, userId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/assignTicket`;
    const body = {
      ticketId: ticketId,
      userId: userId,
    };
    return this.http.post(url, body, { headers: this.getHeaders() });
  }

  GetJiraCustomFieldOptions(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetJiraCustomFieldOptions`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getPytUrls(carrierId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/pythonbookingURL`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('id', carrierId);
    return this.http.get(url, { headers, params });
  }

  addJiraCustomFieldOption(optionValue: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/addJiraCustomFieldOption`;
    const headers = this.getHeaders();
    const body = { optionValue };
    return this.http.post(url, body, { headers });
  }

  deleteJiraCustomFieldOption(fieldId: string, contextId: string, optionId: number): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/deleteJiraCustomFieldOption`;
    const headers = this.getHeaders();
    const body = { fieldId, contextId, optionId };

    return this.http.request('delete', url, {
      headers,
      body,
    });
  }

  updateJiraCustomFieldOption(data: { value: string; newValue: string }): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/updateJiraCustomFieldOption1`;
    const headers = this.getHeaders();
    return this.http.put(url, data, { headers });
  }

  GetZendeskTicketFieldOption(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetZendeskTicketFieldOption`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  getZendeskTicket(ticketId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetZendeskTicket`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('ticketID', ticketId);
    return this.http.get(url, { headers, params });
  }

  getZendeskTicketComments(ticketId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetZendeskTicketComments`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('ticketID', ticketId);
    return this.http.get(url, { headers, params });
  }

  GetZendeskTicketRequesterName(ticketId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetZendeskRequesterName`;
    const headers = this.getHeaders();
    const params = new HttpParams().set('ticketID', ticketId);
    return this.http.get(url, { headers, params });
  }

  ReplyZendeskTicket(ticketId: number, email: string, message: string, isPublic: boolean): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/ReplyZendeskTicket`;
    const body = {
      ticketId: ticketId,
      email: email,
      message: message,
      public: isPublic,
    };
    return this.http.post(url, body, { headers: this.getHeaders() });
  }
  getJiraCreateFields(projectKey: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraCreateFields?projectKey=${projectKey}`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  updateZendeskTicketFieldOption(ticketField: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/UpdateZendeskTicketFieldOption`;
    const headers = this.getHeaders();
    return this.http.put(url, { ticket_field: ticketField }, { headers });
  }

  analyzeSprintData(sprintData: any): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/analyzeSprintData`;
    const headers = this.getHeaders();
    return this.http.post(url, sprintData, { headers });
  }

  analyzeCarrier(params: { id: string; model: string }): Observable<string> {
    const url = `${this.WIZARD_BACKEND_URL}/pyAI`;
    const headers = this.getHeaders();
    return this.http.get(url, {
      params,
      responseType: 'text',
      headers,
    });
  }

  getJiraComponents(projectKey: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraComponents/${projectKey}`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  addJiraComponent(projectKey: string, name: string, description?: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/addJiraComponent`;
    const headers = this.getHeaders();
    const body = { projectKey, name, ...(description && { description }) };
    return this.http.post(url, body, { headers });
  }
  deleteJiraComponent(componentId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/deleteJiraComponent/${componentId}`;
    const headers = this.getHeaders();
    return this.http.delete(url, { headers });
  }

  updateJiraComponent(componentId: string, data: { name: string; description?: string }): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/updateJiraComponent/${componentId}`;
    return this.http.put(url, data, { headers: this.getHeaders() });
  }

  getPostmanCollections(): Observable<Array<{ name: string; link: string }>> {
    const url = `${this.WIZARD_BACKEND_URL}/postmanCollections`;
    const headers = this.getHeaders();

    return this.http.get<Array<{ name: string; link: string }>>(url, { headers });
  }
}
