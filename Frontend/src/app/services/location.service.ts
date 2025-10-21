import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface County {
  id: string;
  name: string;
  zipCodes: string[];
}

export interface ZipCode {
  id: string;
  code: string;
  countyId: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getCounties(): Observable<County[]> {
    return this.http.get<County[]>(`${this.API_URL}/locations/counties`).pipe(
      catchError(error => {
        console.error('Error fetching counties:', error);
        // Return default counties if API fails
        return of([
          { id: '1', name: 'Nairobi', zipCodes: ['00100', '00101', '00102', '00103', '00104'] },
          { id: '2', name: 'Mombasa', zipCodes: ['80100', '80101', '80102', '80103', '80104'] },
          { id: '3', name: 'Kisumu', zipCodes: ['40100', '40101', '40102', '40103', '40104'] },
          { id: '4', name: 'Nakuru', zipCodes: ['20100', '20101', '20102', '20103', '20104'] },
          { id: '5', name: 'Eldoret', zipCodes: ['30100', '30101', '30102', '30103', '30104'] },
          { id: '6', name: 'Thika', zipCodes: ['01000', '01001', '01002', '01003', '01004'] }
        ]);
      })
    );
  }

  getZipCodesByCounty(countyId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/locations/counties/${countyId}/zipcodes`).pipe(
      catchError(error => {
        console.error('Error fetching zip codes:', error);
        return of([]);
      })
    );
  }

  getZipCodesByCountyName(countyName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/locations/counties/${countyName}/zipcodes`).pipe(
      catchError(error => {
        console.error('Error fetching zip codes:', error);
        return of([]);
      })
    );
  }

  searchLocations(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/locations/search?q=${query}`).pipe(
      catchError(error => {
        console.error('Error searching locations:', error);
        return of([]);
      })
    );
  }
} 