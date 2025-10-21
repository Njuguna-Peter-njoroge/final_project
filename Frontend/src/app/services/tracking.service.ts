import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  courierService: string;
  packageWeight: string;
  packageDimensions: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    name: string;
    email: string;
    phone: string;
  };
  recipient: {
    name: string;
    email: string;
    phone: string;
  };
  assignedCourier: {
    name: string;
    email: string;
    phone: string;
  } | null;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    reason: string;
    notes?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  trackOrder(trackingNumber: string): Observable<TrackingResult> {
    // If user is authenticated, use the authenticated endpoint with Authorization header
    if (this.authService.isAuthenticated()) {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      return this.http.get<TrackingResult>(`${this.apiUrl}/track/my/${trackingNumber}`, { headers });
    } else {
      // If user is not authenticated, use the public endpoint
      return this.http.get<TrackingResult>(`${this.apiUrl}/track/${trackingNumber}`);
    }
  }

  updateOrderLocation(orderId: string, locationData: { deliveryLat: number; deliveryLng: number }): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.patch(`${this.apiUrl}/${orderId}`, locationData, { headers });
  }
}
