
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Parcel, ParcelStatus, Priority } from '../models/parcel.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private apiUrl = 'http://localhost:3000/parcels';
  private orderUrl = 'http://localhost:3000/orders';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAllParcels(): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.apiUrl}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching parcels:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  getParcelByTrackingNumber(trackingNumber: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/track/${trackingNumber}`, {
      headers: this.getAuthHeaders()
    });
  }

  createParcel(parcel: any): Observable<Parcel> {
    return this.http.post<Parcel>(`${this.apiUrl}`, parcel, {
      headers: this.getAuthHeaders()
    });
  }

  deleteParcel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAllParcels(): Observable<any> {
    return this.http.delete(`${this.orderUrl}/all/public`);
  }

  updateParcelStatus(parcelId: string, newStatus: ParcelStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${parcelId}`, { status: newStatus }, {
      headers: this.getAuthHeaders()
    });
  }

  getParcelsBySender(senderId: string): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.apiUrl}/sender/${senderId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getParcelsByStatus(status: ParcelStatus): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.apiUrl}/status/${status}`, {
      headers: this.getAuthHeaders()
    });
  }

  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/parcel/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getOrders(): Observable<any[]> {
    const url = `${this.orderUrl}/parcels`;
    console.log('🔍 Calling URL:', url);
    return this.http.get<any[]>(url).pipe(
      tap(response => {
        console.log('✅ Raw parcels API response:', response);
        if (response && response.length > 0) {
          console.log('📦 First parcel from API:', response[0]);
          console.log('👤 Sender data in first parcel:', response[0].sender);
          console.log('📧 Sender name:', response[0].sender?.name);
          console.log('📧 Sender email:', response[0].sender?.email);
        }
      }),
      catchError(error => {
        console.error('❌ Error fetching parcels:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  updateOrderStatus(orderId: string, newStatus: ParcelStatus, statusReason: string): Observable<any> {
    return this.http.patch(`${this.orderUrl}/${orderId}/status`, {
      status: newStatus,
      reason: statusReason
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // COMMENTED OUT - Using backend conversion instead
  // convertOrdersToParcels(orders: any[]): Parcel[] {
  //   console.log('Converting orders to parcels:', orders);
  //   return orders.map(order => {
  //             console.log('Processing order:', order.orderId, 'Customer:', order.customer);
  //       console.log('Customer name:', order.customer?.name);
  //       console.log('Customer email:', order.customer?.email);
  //       console.log('Full customer object:', order.customer);
  //       console.log('Order ID:', order.orderId);
  //       console.log('Customer name from order:', order.customer?.name);
  //       console.log('Customer email from order:', order.customer?.email);
  //       console.log('Is customer object defined?', !!order.customer);
  //       console.log('Full order object:', order);
  //     // Parse recipient info from notes or use defaults
  //     // Try to extract receiver info from notes if it exists
  //     let recipientName = 'Recipient';
  //     let recipientEmail = 'recipient@example.com';
  //     let recipientPhone = '+1987654321';

  //     if (order.notes) {
  //       // Try different patterns to extract receiver info
  //       const patterns = [
  //         /Receiver:\s*([^()]+)\s*\(([^,]+),\s*([^)]+)\)/i,
  //         /receiver:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i,
  //         /to:\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i
  //       ];

  //       for (const pattern of patterns) {
  //         const match = order.notes.match(pattern);
  //         if (match) {
  //           recipientName = match[1].trim();
  //           recipientEmail = match[2].trim();
  //           recipientPhone = match[3].trim();
  //           break;
  //         }
  //       }
  //     }

  //     return {
  //       id: order.id || order.orderId,
  //       orderUuid: order.id,
  //       trackingNumber: order.orderId || 'ORD' + Date.now(),
  //       status: this.mapOrderStatusToParcelStatus(order.status),
  //       sender: {
  //         id: order.customer?.id || 'unknown',
  //         name: order.customer?.name || 'Unknown Sender',
  //         email: order.customer?.email || 'sender@example.com',
  //         phone: order.customer?.phone || '+1234567890',
  //         address: this.parseAddress(order.pickupAddress)
  //       },
  //       recipient: {
  //         id: 'recipient_' + (order.orderId || order.id),
  //         name: recipientName,
  //         email: recipientEmail,
  //         phone: recipientPhone,
  //         address: this.parseAddress(order.deliveryAddress)
  //       },
  //       createdAt: new Date(order.createdAt || Date.now()),
  //       updatedAt: new Date(order.updatedAt || Date.now()),
  //       statusHistory: [{
  //         status: this.mapOrderStatusToParcelStatus(order.status),
  //         timestamp: new Date(order.createdAt || Date.now()),
  //         updatedBy: 'system',
  //         reason: 'Order converted to parcel'
  //       }],
  //       deliveryDetails: {
  //         pickupAddress: this.parseAddress(order.pickupAddress),
  //         deliveryAddress: this.parseAddress(order.deliveryAddress),
  //         specialInstructions: order.notes || '',
  //         signatureRequired: false
  //       },
  //       weight: parseFloat(order.packageWeight) || 1.0,
  //       dimensions: order.packageDimensions || '20x15x10 cm',
  //       description: order.courierService || 'Standard delivery',
  //       priority: Priority.NORMAL,
  //       estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  //       cost: parseFloat(order.price) || 0
  //     };

  //             const parcel = {
  //         id: order.id || order.orderId,
  //         orderUuid: order.id,
  //         trackingNumber: order.orderId || 'ORD' + Date.now(),
  //         status: this.mapOrderStatusToParcelStatus(order.status),
  //         sender: {
  //           id: order.customer?.id || 'unknown',
  //           name: order.customer?.name || 'Unknown Sender',
  //           email: order.customer?.email || 'sender@example.com',
  //           phone: order.customer?.phone || '+1234567890',
  //           address: this.parseAddress(order.pickupAddress)
  //         },
  //         recipient: {
  //           id: 'recipient_' + (order.orderId || order.id),
  //           name: recipientName,
  //           email: recipientEmail,
  //           phone: recipientPhone,
  //           address: this.parseAddress(order.deliveryAddress)
  //         },
  //         createdAt: new Date(order.createdAt || Date.now()),
  //         updatedAt: new Date(order.updatedAt || Date.now()),
  //         statusHistory: [{
  //           status: this.mapOrderStatusToParcelStatus(order.status),
  //           timestamp: new Date(order.createdAt || Date.now()),
  //           updatedBy: 'system',
  //           reason: 'Order converted to parcel'
  //         }],
  //         deliveryDetails: {
  //           pickupAddress: this.parseAddress(order.pickupAddress),
  //           deliveryAddress: this.parseAddress(order.deliveryAddress),
  //           specialInstructions: order.notes || '',
  //           signatureRequired: false
  //         },
  //         weight: parseFloat(order.packageWeight) || 1.0,
  //         dimensions: order.packageDimensions || '20x15x10 cm',
  //         description: order.courierService || 'Standard delivery',
  //         priority: Priority.NORMAL,
  //         estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  //         cost: parseFloat(order.price) || 0
  //       };

  //       console.log('Created parcel for order', order.orderId, ':', {
  //         sender: parcel.sender,
  //         recipient: parcel.recipient,
  //         trackingNumber: parcel.trackingNumber
  //       });
  //       console.log('Final sender name:', parcel.sender.name);
  //       console.log('Final sender email:', parcel.sender.email);
  //       console.log('Customer data used for sender:', {
  //         id: order.customer?.id,
  //         name: order.customer?.name,
  //         email: order.customer?.email
  //       });

  //       return parcel;
  //   });
  // }

  private mapOrderStatusToParcelStatus(orderStatus: string): ParcelStatus {
    const statusMap: { [key: string]: ParcelStatus } = {
      'pending': ParcelStatus.PENDING,
      'confirmed': ParcelStatus.CONFIRMED,
      'picked_up': ParcelStatus.PICKED_UP,
      'in_transit': ParcelStatus.IN_TRANSIT,
      'delivered': ParcelStatus.DELIVERED,
      'cancelled': ParcelStatus.CANCELLED
    };
    return statusMap[orderStatus?.toLowerCase()] || ParcelStatus.PENDING;
  }

  private parseAddress(addressString: string): any {
    // Simple address parsing - in real app, this would be more sophisticated
    const parts = addressString?.split(',') || ['Unknown Address'];
    return {
      street: parts[0]?.trim() || 'Unknown Street',
      city: parts[1]?.trim() || 'Unknown City',
      state: parts[2]?.trim() || 'Unknown State',
      zipCode: parts[3]?.trim() || '00000',
      country: 'USA'
    };
  }

  refreshData(): Observable<Parcel[]> {
    return this.getAllParcels();
  }
}
