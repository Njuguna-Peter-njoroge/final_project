import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { User, UserRole } from '../component/Shared/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly STORAGE_KEY = 'currentUser';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_URL = 'http://localhost:3000';

  constructor(
    private router: Router, 
    private toastService: ToastService,
    private http: HttpClient
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearUserData();
      }
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/auth/login`, { email, password })
        .subscribe({
          next: (response) => {
            if (response && response.access_token) {
              // Store the token
              localStorage.setItem('access_token', response.access_token);
              
              // Create user object from response
              const user: User = {
                id: response.user?.id || this.generateUserId(),
                name: response.user?.name || this.getUserNameFromEmail(email),
                email: email,
                phone: response.user?.phone || '',
                isVerified: response.user?.isVerified || true,
                location: response.user?.location || '',
                role: this.mapBackendRoleToUserRole(response.user?.role),
                createdAt: new Date(response.user?.createdAt || Date.now()),
                updatedAt: new Date(response.user?.updatedAt || Date.now()),
                goodType: response.user?.goodType || '',
                goodWeight: response.user?.goodWeight || '',
                goodPrice: response.user?.goodPrice || '',
                goodDescription: response.user?.goodDescription || '',
                zipcode: response.user?.zipcode || ''
              };

              this.setCurrentUser(user);
              observer.next(true);
            } else {
              observer.next(false);
            }
            observer.complete();
          },
          error: (error) => {
            console.error('Login error:', error);
            observer.next(false);
            observer.complete();
          }
        });
    });
  }

  register(userData: { name: string; email: string; password: string }): Observable<any> {
    return new Observable(observer => {
      console.log('Sending registration request to backend:', userData);
      this.http.post<any>(`${this.API_URL}/auth/register`, userData)
        .subscribe({
          next: (response) => {
            console.log('Backend registration response:', response);
            if (response && response.access_token) {
              // Store the token
              localStorage.setItem('access_token', response.access_token);
              
              // Create user object from response
              const user: User = {
                id: response.user?.id || this.generateUserId(),
                name: response.user?.name || userData.name,
                email: userData.email,
                phone: response.user?.phone || '',
                isVerified: response.user?.isVerified || false,
                location: response.user?.location || '',
                role: this.mapBackendRoleToUserRole(response.user?.role),
                createdAt: new Date(response.user?.createdAt || Date.now()),
                updatedAt: new Date(response.user?.updatedAt || Date.now()),
                goodType: response.user?.goodType || '',
                goodWeight: response.user?.goodWeight || '',
                goodPrice: response.user?.goodPrice || '',
                goodDescription: response.user?.goodDescription || '',
                zipcode: response.user?.zipcode || ''
              };

              console.log('Created user object:', user);
              this.setCurrentUser(user);
              
              observer.next({ 
                success: true, 
                message: response.message || 'Registration successful! Please check your email for verification.',
                requiresVerification: !response.user?.isVerified,
                user: user
              });
            } else {
              console.log('Registration failed - no access_token in response');
              observer.next({ success: false, message: 'Registration failed' });
            }
            observer.complete();
          },
          error: (error) => {
            console.error('Registration error:', error);
            observer.next({ 
              success: false, 
              message: error.error?.message || 'Registration failed' 
            });
            observer.complete();
          }
        });
    });
  }

  verifyEmail(email: string, token: string): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/auth/verify-email`, { email, token })
        .subscribe({
          next: (response) => {
            if (response && response.message) {
              observer.next({ 
                success: true, 
                message: response.message || 'Email verified successfully' 
              });
            } else {
              observer.next({ success: false, message: 'Email verification failed' });
            }
            observer.complete();
          },
          error: (error) => {
            console.error('Email verification error:', error);
            observer.next({ 
              success: false, 
              message: error.error?.message || 'Email verification failed' 
            });
            observer.complete();
          }
        });
    });
  }

  resendVerificationEmail(email: string): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/auth/resend-verification`, { email })
        .subscribe({
          next: (response) => {
            if (response && response.message) {
              observer.next({ 
                success: true, 
                message: response.message || 'Verification email resent successfully' 
              });
            } else {
              observer.next({ success: false, message: 'Failed to resend verification email' });
            }
            observer.complete();
          },
          error: (error) => {
            console.error('Resend verification error:', error);
            observer.next({ 
              success: false, 
              message: error.error?.message || 'Failed to resend verification email' 
            });
            observer.complete();
          }
        });
    });
  }

  forgotPassword(email: string): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/auth/forgot-password`, { email })
        .subscribe({
          next: (response) => {
            observer.next({ success: true, message: 'Password reset email sent' });
            observer.complete();
          },
          error: (error) => {
            console.error('Forgot password error:', error);
            observer.next({ success: false, message: error.error?.message || 'Failed to send reset email' });
            observer.complete();
          }
        });
    });
  }

  resetPassword(resetData: { email: string; token: string; newPassword: string }): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/auth/reset-password`, resetData)
        .subscribe({
          next: (response) => {
            observer.next({ success: true, message: 'Password reset successful' });
            observer.complete();
          },
          error: (error) => {
            console.error('Reset password error:', error);
            observer.next({ success: false, message: error.error?.message || 'Password reset failed' });
            observer.complete();
          }
        });
    });
  }



  private getUserNameFromEmail(email: string): string {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private getUserRoleFromEmail(email: string): UserRole {
    if (email.includes('admin')) return UserRole.ADMIN;
    if (email.includes('courier')) return UserRole.COURIER;
    return UserRole.USER;
  }

  private mapBackendRoleToUserRole(backendRole: string): UserRole {
    switch (backendRole?.toLowerCase()) {
      case 'admin':
        return UserRole.ADMIN;
      case 'courier':
        return UserRole.COURIER;
      case 'user':
      default:
        return UserRole.USER;
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    this.clearUserData();
    this.clearApplicationData();
    this.router.navigate(['/homepage']);
    this.toastService.success('Successfully logged out');
  }

  private clearUserData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  private clearApplicationData(): void {
    const keysToKeep = ['theme', 'language'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        // Optionally clear other data
      }
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === UserRole.ADMIN : false;
  }

  isCourier(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === UserRole.COURIER : false;
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    return user ? user.role : 'guest';
  }

  getUserName(): string {
    const user = this.getCurrentUser();
    return user ? user.name : 'Guest';
  }

  getUserEmail(): string {
    const user = this.getCurrentUser();
    return user ? user.email : '';
  }

  checkSessionTimeout(): void {
    // Session timeout logic can be implemented here
  }

  extendSession(): void {
    // Session extension logic can be implemented here
  }
}
