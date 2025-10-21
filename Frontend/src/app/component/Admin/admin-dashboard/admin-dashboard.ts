import { Component, OnInit, OnDestroy } from '@angular/core';
import { Navbar } from '../../Shared/navbar/navbar';
import { Footer } from '../../Shared/footer/footer';
import { NgClass, NgForOf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dasdboardservice';
import { User } from '../../../component/Shared/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [Navbar, Footer, NgClass, RouterLink, NgForOf],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'] // ✅ Fixed
})
export class AdminDashboard implements OnInit, OnDestroy {
  sidebarOpen = true;
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();
  private sessionCheckInterval: any;

  stats: { title: string; value: string | number }[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.sessionCheckInterval = setInterval(() => {
      this.authService.checkSessionTimeout();
    }, 60000);

    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    clearInterval(this.sessionCheckInterval);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.authService.extendSession();
  }

  logout(): void {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) this.authService.logout();
  }

  getUserName(): string {
    return this.authService.getUserName() ?? '';
  }

  getUserRole(): string {
    return this.authService.getUserRole() ?? '';
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private loadDashboardStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = [
          { title: 'total customers', value: `${data.totalCustomers} customers` },
          { title: 'total couriers', value: data.totalCouriers },
          { title: 'placement orders', value: data.totalOrders },
          { title: 'pending orders', value: data.pendingOrders },
          { title: 'approved orders', value: data.approvedOrders },
        ];
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        // Set default values if API fails
        this.stats = [
          { title: 'total customers', value: '0 customers' },
          { title: 'total couriers', value: 0 },
          { title: 'placement orders', value: 0 },
          { title: 'pending orders', value: 0 },
          { title: 'approved orders', value: 0 },
        ];
      }
    });
  }
}
