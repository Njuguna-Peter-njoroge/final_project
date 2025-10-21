import { UserRole } from '../../../component/Shared/user.model';
import { Component, OnInit } from '@angular/core';
import { Navbar } from '../../Shared/navbar/navbar';
import { Footer } from '../../Shared/footer/footer';
import { CommonModule } from '@angular/common';
import { Order, OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-vieworders',
  standalone: true,
  imports: [Navbar, Footer, CommonModule],
  templateUrl: './vieworders.html',
  styleUrls: ['./vieworders.css']
})
export class ViewOrders implements OnInit {
  orders: Order[] = [];
  pageSize = 3;
  currentPage = 1;
  paginatedOrders: Order[] = [];
  totalPages = 1;

  couriers: any[] = [];
  isAdmin = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === UserRole.ADMIN;

    this.userService.findAll().subscribe(users => {
      this.couriers = users.filter((u: any) => u.role === UserRole.COURIER);
    });
  }

  assignCourier(order: Order, courierId: string) {
    const courier = this.couriers.find(c => c.id === courierId);
    if (courier) {
      order.courierService = courier.name;
      order.updatedAt = new Date().toISOString();

      this.orderService.getOrders().subscribe(allOrders => {
        const idx = allOrders.findIndex((o: Order) => o.orderId === order.orderId);
        if (idx !== -1) {
          allOrders[idx] = order;
          localStorage.setItem('orders', JSON.stringify(allOrders));
          this.orders = allOrders;
          this.setPagination();
        }
      });
    }
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(allOrders => {
      const user = this.authService.getCurrentUser();
      if (user && user.role !== UserRole.ADMIN) {
        this.orders = allOrders.filter((order: Order) =>
          order.customerName === user.name ||
          order.customerName === user.email ||
          order.customerId === user.id
        );
      } else {
        this.orders = allOrders;
      }
      this.setPagination();
    });
  }

  setPagination() {
    this.totalPages = Math.ceil(this.orders.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.currentPage = Math.max(this.currentPage, 1);
    this.setPaginatedOrders();
  }

  setPaginatedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.orders.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.setPaginatedOrders();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.setPaginatedOrders();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.setPaginatedOrders();
    }
  }
}
