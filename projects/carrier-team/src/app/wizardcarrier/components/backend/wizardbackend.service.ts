import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class WizardbackendService {
  private readonly WIZARD_BACKEND_URL = environment.apiUrl;
  private readonly API_KEY = environment.apiKey;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.API_KEY
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

  getPROBIssues(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetPROBIssues`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  assignTicket(ticketId: number, userId: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/assignTicket`;
    const body = {
      ticketId: ticketId,
      userId: userId
    };
    return this.http.post(url, body, { headers: this.getHeaders() });
  }

  getFilteredUnassignedTickets(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetFilteredUnassignedTickets`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getCustomFieldOptions(): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/GetCustomFieldOptions`;
    return this.http.get(url, { headers: this.getHeaders() });
  }
  
  addCustomFieldOption(optionValue: string): Observable<any> {
    const url = `${this.WIZARD_BACKEND_URL}/addCustomFieldOption`;
    const headers = this.getHeaders();
    const body = { optionValue };
    return this.http.post(url, body, { headers });
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
