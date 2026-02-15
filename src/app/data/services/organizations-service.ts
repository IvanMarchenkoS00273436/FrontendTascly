import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { GetOrganizationOverview } from '../interfaces/Organizations/get-organization-overview';
import { Observable } from 'rxjs';
import { PutOrganization } from '../interfaces/Organizations/put-organization';

@Injectable({
    providedIn: 'root',
})

export class OrganizationsService {
    http: HttpClient = inject(HttpClient);
    baseUrl = environment.apiUrl + '/Organization';

    getOrganizationOverview(): Observable<GetOrganizationOverview> {
        return this.http.get<GetOrganizationOverview>(this.baseUrl + '/getOrganizationOverview');
    }

    putOrganization(putOrganization: PutOrganization): Observable<void> { 
        return this.http.put<void>(this.baseUrl + '/updateOrganization', putOrganization);
    }
}
