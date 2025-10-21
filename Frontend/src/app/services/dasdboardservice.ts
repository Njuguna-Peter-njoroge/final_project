import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:3000/orders/admin/stats/public';

  constructor(private http: HttpClient) {}

  getStats(): Observable<{
    totalCustomers: number;
    totalCouriers: number;
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
  }> {
    return this.http.get<{
      totalCustomers: number;
      totalCouriers: number;
      totalOrders: number;
      pendingOrders: number;
      approvedOrders: number;
    }>(this.apiUrl);
  }
}
