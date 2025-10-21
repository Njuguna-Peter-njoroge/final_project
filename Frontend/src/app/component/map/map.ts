import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Order, OrderService } from '../../services/order.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Navbar } from '../Shared/navbar/navbar';
import { Footer } from '../Shared/footer/footer';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingResult } from '../../services/tracking.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  imports: [
    NgIf,
    NgFor,
    NgClass,
    MapMarker,
    GoogleMap,
    Navbar,
    Footer
  ],
  styleUrls: ['./map.css']
})
export class CourierMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(GoogleMap) map!: GoogleMap;

  orders: Order[] = [];
  selectedOrder: Order | null = null;
  isTracking = false;
  trackingNumber: string = '';
  trackingResult: TrackingResult | null = null;
  isLoadingTracking = false;

  zoom = 12;
  center: google.maps.LatLngLiteral = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  pickupMarker: google.maps.LatLngLiteral | null = null;
  deliveryMarker: google.maps.LatLngLiteral | null = null;
  courierMarker: google.maps.LatLngLiteral | null = null;

  isAdmin = false; // Add a flag to check if user is admin

  private socket$: WebSocketSubject<any>;
  private socketSubscription: Subscription | null = null;

  private directionsService = new google.maps.DirectionsService();
  private directionsRenderer = new google.maps.DirectionsRenderer();

  private animationIndex = 0;
  private animationTimer: any;

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {
    const wsUrl = 'ws://localhost:3000'; // Adjust to your backend websocket URL
    this.socket$ = webSocket(wsUrl);
  }

  ngOnInit(): void {
    // Determine if user is admin (this is a placeholder, replace with actual auth check)
    this.isAdmin = true; // For testing, set to true. Replace with real check.

    this.orderService.getOrders().subscribe((orders: Order[]) => {
      this.orders = orders;
    });

    // Check for tracking number in URL parameters
    this.route.queryParams.subscribe(params => {
      const trackingNumber = params['trackingNumber'];
      if (trackingNumber) {
        this.trackingNumber = trackingNumber;
        this.trackOrderByNumber(trackingNumber);
      }
    });

    this.socketSubscription = this.socket$.subscribe({
      next: (msg) => this.handleSocketMessage(msg),
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.warn('WebSocket connection closed')
    });
  }

  ngAfterViewInit(): void {
    if (this.map && this.map.googleMap) {
      this.directionsRenderer.setMap(this.map.googleMap);
    } else {
      console.error('Map or googleMap is undefined');
    }
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.socket$.complete();
  }

  // New method to handle map click for admin to update location
  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!this.isAdmin || !this.selectedOrder || !this.selectedOrder.id) {
      return;
    }

    const latLng = event.latLng;
    if (!latLng) {
      return;
    }

    // For this example, let's update the delivery location on click
    const newLat = latLng.lat();
    const newLng = latLng.lng();

    // Update delivery marker position
    this.deliveryMarker = { lat: newLat, lng: newLng };

    // Call backend to update order delivery location
    this.trackingService.updateOrderLocation(this.selectedOrder.id, {
      deliveryLat: newLat,
      deliveryLng: newLng,
    }).subscribe({
      next: (response) => {
        console.log('Location updated successfully', response);
        // Optionally refresh order data or UI here
      },
      error: (error) => {
        console.error('Failed to update location', error);
      }
    });
  }

  trackOrderByNumber(trackingNumber: string): void {
    this.isLoadingTracking = true;
    this.trackingResult = null;

    this.trackingService.trackOrder(trackingNumber).subscribe({
      next: (result) => {
        this.trackingResult = result;
        this.isLoadingTracking = false;
        
        // Convert tracking result to order format and track it
        const orderFromTracking: Order = {
          id: result.trackingNumber,
          orderId: result.trackingNumber,
          pickupAddress: result.pickupAddress,
          deliveryAddress: result.deliveryAddress,
          courierService: result.courierService,
          status: result.status,
          packageWeight: result.packageWeight,
          packageDimensions: result.packageDimensions,
          price: result.price,
          notes: '',
          customerName: result.sender.name
        };
        
        this.selectOrder(orderFromTracking);
        this.startTracking(orderFromTracking);
      },
      error: (error) => {
        this.isLoadingTracking = false;
        console.error('Error tracking order:', error);
      }
    });
  }

  private handleSocketMessage(msg: any): void {
    if (msg.type === 'orderUpdate' && msg.data) {
      const updatedOrder: Order = msg.data;
      const index = this.orders.findIndex(o => o.id === updatedOrder.id);
      if (index !== -1) {
        this.orders[index] = updatedOrder;
      } else {
        this.orders.push(updatedOrder);
      }
      if (this.isTracking && this.selectedOrder && this.selectedOrder.id === updatedOrder.id) {
        this.centerOnOrder(updatedOrder);
      }
    }
  }

  selectOrder(order: Order): void {
    this.selectedOrder = order;
    this.centerOnOrder(order);
  }

  centerOnOrder(order: Order): void {
    const pickupAddress = order.pickupAddress ?? '';
    const deliveryAddress = order.deliveryAddress ?? '';

    if (!pickupAddress || !deliveryAddress) {
      console.error('Pickup or delivery address is missing');
      return;
    }

    this.geocodeAddress(pickupAddress, (pickupLocation) => {
      this.pickupMarker = pickupLocation;
      this.center = pickupLocation;

      this.geocodeAddress(deliveryAddress, (deliveryLocation) => {
        this.deliveryMarker = deliveryLocation;
        this.drawRoute(pickupLocation, deliveryLocation);
      });

      // Courier marker could be updated from order data if available
      this.courierMarker = {
        lat: pickupLocation.lat + 0.01,
        lng: pickupLocation.lng + 0.01,
      };
    });
  }

  startTracking(order: Order): void {
    this.isTracking = true;
    this.selectOrder(order);
  }

  stopTracking(): void {
    this.isTracking = false;
    this.courierMarker = null;
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  refreshMap(): void {
    this.orderService.getOrders().subscribe((orders: Order[]) => {
      this.orders = orders;
    });
  }

  toggleRoutes(): void {
    alert('Toggle routes is not implemented yet');
  }

  private geocodeAddress(address: string, callback: (location: google.maps.LatLngLiteral) => void): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        callback({ lat: location.lat(), lng: location.lng() });
      } else {
        console.error('Geocode failed:', status);
      }
    });
  }

  private drawRoute(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral): void {
    if (!this.map || !this.map.googleMap) {
      console.error('Map not initialized');
      return;
    }

    this.directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          this.directionsRenderer.setDirections(result);
          this.animateCourierAlongRoute(result.routes[0].overview_path);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }

  private animateCourierAlongRoute(path: google.maps.LatLng[]) {
    if (!this.map || !this.map.googleMap) {
      console.error('Map not initialized');
      return;
    }

    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }

    this.animationIndex = 0;

    this.animationTimer = setInterval(() => {
      if (this.animationIndex >= path.length) {
        clearInterval(this.animationTimer);
        return;
      }

      const point = path[this.animationIndex];
      this.courierMarker = { lat: point.lat(), lng: point.lng() };
      this.center = { lat: point.lat(), lng: point.lng() };
      this.animationIndex++;
    }, 500); // Adjust speed here (milliseconds per step)
  }

  private clusterMarkers(): void {
    if (!this.map || !this.map.googleMap) {
      console.error('Map not initialized');
      return;
    }
    // Implement marker clustering or offsetting logic here
    // For example, use MarkerClusterer library if available
    // This is a placeholder for clustering logic
    console.log('Clustering markers');
  }
}
