import { Component, OnInit, OnDestroy } from '@angular/core';
import {RouterLink} from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  logout(): void {
      this.authService.logout();
  }

  getUserName(): string {
    return this.authService.getUserName();
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  scrollToAboutSection(): void {
    // Implementation for scrolling to about section
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToWhatWeOffer(): void {
    // Implementation for scrolling to what we offer section
    const whatWeOfferSection = document.getElementById('what-we-offer');
    if (whatWeOfferSection) {
      whatWeOfferSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
