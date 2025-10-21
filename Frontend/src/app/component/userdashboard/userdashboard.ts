import { Component } from '@angular/core';
import { Footer } from '../Shared/footer/footer';
import { NgClass } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../component/Shared/user.model';
import { CourierMapComponent } from '../map/map';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-userdashboard',
  standalone: true,
  imports: [
    Footer,
    NgClass,
    CourierMapComponent,
  ],
  templateUrl: './userdashboard.html',
  styleUrl: './userdashboard.css'
})
export class Userdashboard {
  sidebarOpen = true;
  currentUser: User | null = null;
  userOrders$: Observable<Order[]> = of([]);

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserOrders();
  }

  loadUserOrders(): void {
    if (this.currentUser) {
      const name = this.currentUser.name.toLowerCase();
      const email = this.currentUser.email.toLowerCase();

      this.userOrders$ = this.orderService.getOrders().pipe(
        map((orders: Order[]) =>
          orders.filter(order => {
            if (!order.customerName) return false;
            const customer = order.customerName.toLowerCase();
            return customer === name || customer === email;
          })
        )
      );
    }
  }

  refreshOrders(): void {
    this.loadUserOrders();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
