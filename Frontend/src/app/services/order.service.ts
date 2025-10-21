import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  id?: string;
  orderId: string;
  customerName?: string;
  pickupAddress: string;
  deliveryAddress: string;
  courierService: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  packageWeight: string;
  packageDimensions: string;
  price: string;
  notes: string;
  customerId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = 'http://localhost:3000/orders'; 

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: any } {
    const token = localStorage.getItem('access_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl, this.getHeaders());
  }

  getOrdersByCustomer(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer/${customerId}`, this.getHeaders());
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  createOrder(order: Partial<Order>): Observable<any> {
    return this.http.post(`${this.apiUrl}`, order, this.getHeaders());
  }

  createPublicOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/public`, order);
  }

  addOrder(order: Partial<Order>): Observable<any> {
    return this.createOrder(order);
  }

  updateOrder(id: string, order: Partial<Order>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, order, this.getHeaders());
  }

  updateOrderStatus(id: string, status: string, updatedBy: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, {
      status,
      reason: 'Status updated from frontend',
      updatedBy,
    }, this.getHeaders());
  }


  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  assignCourier(orderId: string, courierId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/assign-courier/${orderId}`, { courierId }, this.getHeaders());
  }


  filterOrders(status?: string, fromDate?: string, toDate?: string): Observable<Order[]> {
    const body: any = {};
    if (status) body.status = status;
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;

    return this.http.post<Order[]>(`${this.apiUrl}/filter`, body, this.getHeaders());
  }
}
