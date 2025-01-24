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

  getLastSprints(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getLastSprints`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers });
  }

  getJiraSprint(sprintId: number): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/getJiraSprint/${sprintId}`;
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
    const url = `${this.WIZARD_BACKEND_URL}/GetUserTickets`;
    const params = new HttpParams().set('email', email); // Lägg till e-post som query-param
    return this.http.get(url, { headers: this.getHeaders(), params });
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

  getFilteredUnassignedTickets(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetFilteredUnassignedTickets`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  GetJiraCustomFieldOptions(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetJiraCustomFieldOptions`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  addJiraCustomFieldOption(optionValue: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/addJiraCustomFieldOption`;
    const headers = this.getHeaders();
    const body = { optionValue };
    return this.http.post(url, body, { headers });
  }

  updateJiraCustomFieldOption(data: { value: string; newValue: string }): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/updateJiraCustomFieldOption`;
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
}
