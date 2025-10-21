import { Component, OnInit, OnDestroy } from '@angular/core';
import { Navbar } from '../Shared/navbar/navbar';
import { Footer } from '../Shared/footer/footer';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../component/Shared/user.model';
import { Subscription } from 'rxjs';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { ParcelService } from '../../services/parcel.service';
import { TrackingService, TrackingResult } from '../../services/tracking.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-homepage',
  imports: [
    Navbar,
    Footer,
    RouterLink,
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
    FormsModule
  ],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css'
})
export class Homepage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  trackingNumber: string = '';
  isTrackingNumberVerified: boolean = false;
  verificationMessage: string = '';
  trackingResult: TrackingResult | null = null;
  isLoading: boolean = false;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService, 
    private parcelService: ParcelService, 
    private trackingService: TrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  scrollToPricing() {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToAboutSection(): void {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  verifyTrackingNumber(): void {
    this.isTrackingNumberVerified = false;
    this.verificationMessage = '';
    this.trackingResult = null;
    this.isLoading = true;

    if (!this.trackingNumber || this.trackingNumber.trim() === '') {
      this.verificationMessage = 'Please enter a tracking number.';
      this.isLoading = false;
      return;
    }

    this.trackingService.trackOrder(this.trackingNumber.trim()).subscribe({
      next: (result) => {
        this.trackingResult = result;
        this.isTrackingNumberVerified = true;
        this.verificationMessage = '';
        this.isLoading = false;
        
        // Automatically navigate to map with tracking number after successful verification
        this.navigateToMapWithTracking();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 404) {
          this.verificationMessage = 'Tracking number not found.';
        } else {
          this.verificationMessage = 'Error tracking order. Please try again.';
        }
      }
    });
  }

  navigateToMapWithTracking(): void {
    if (this.isTrackingNumberVerified && this.trackingNumber.trim()) {
      this.router.navigate(['/map'], { 
        queryParams: { 
          trackingNumber: this.trackingNumber.trim() 
        } 
      });
    }
  }

  onTrackClick(): void {
    if (this.isTrackingNumberVerified) {
      this.navigateToMapWithTracking();
    }
  }
}
