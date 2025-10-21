import { Injectable } from '@angular/core';
import { User, UserRole } from '../component/Shared/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private STORAGE_KEY = 'users_data';
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  private loadUsers(): void {
    // Fetch real users from backend
    this.fetchUsersFromBackend().subscribe({
      next: (users) => {
        this.usersSubject.next(users);
      },
      error: (error) => {
        console.error('Error loading users from backend:', error);
        // Fallback to dummy users if backend fails
        this.initializeDummyUsers();
      }
    });
  }

  private fetchUsersFromBackend(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/all/public`).pipe(
      map(backendUsers => backendUsers.map(backendUser => ({
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone || '',
        isVerified: backendUser.isVerified,
        location: backendUser.location || '',
        role: this.mapBackendRoleToFrontend(backendUser.role),
        createdAt: new Date(backendUser.createdAt),
        updatedAt: new Date(backendUser.updatedAt),
        goodType: 'N/A',
        goodWeight: 'N/A',
        goodPrice: 'N/A',
        goodDescription: 'N/A',
        zipcode: backendUser.zipcode || ''
      })))
    );
  }

  private mapBackendRoleToFrontend(backendRole: string): UserRole {
    switch (backendRole) {
      case 'ADMIN': return UserRole.ADMIN;
      case 'COURIER': return UserRole.COURIER;
      case 'USER': return UserRole.USER;
      default: return UserRole.USER;
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
  }

  private initializeDummyUsers(): void {
    const dummyUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        isVerified: true,
        location: 'New York, NY',
        role: UserRole.USER,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        goodType: 'Electronics',
        goodWeight: '2.5 kg',
        goodPrice: '$150',
        goodDescription: 'Laptop accessories',
        zipcode: '10001'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        isVerified: false,
        location: 'Los Angeles, CA',
        role: UserRole.COURIER,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
        goodType: 'Documents',
        goodWeight: '0.5 kg',
        goodPrice: '$25',
        goodDescription: 'Legal documents',
        zipcode: '90210'
      },
      {
        id: '3',
        name: 'Admin User',
        email: 'admin@express.com',
        phone: '+1555123456',
        isVerified: true,
        location: 'Chicago, IL',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        goodType: 'N/A',
        goodWeight: 'N/A',
        goodPrice: 'N/A',
        goodDescription: 'System administrator',
        zipcode: '60601'
      }
    ];
    this.saveUsers(dummyUsers);
  }

  // CRUD Operations
  getUsers(): User[] {
    return this.usersSubject.value;
  }

  getUsersObservable(): Observable<User[]> {
    return this.users$;
  }

  addUser(user: User): void {
    const users = this.usersSubject.value;
    user.id = this.generateId();
    user.createdAt = new Date();
    user.updatedAt = new Date();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(updatedUser: User): void {
    const users = this.usersSubject.value;
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      updatedUser.updatedAt = new Date();
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.usersSubject.value;
    const filteredUsers = users.filter(u => u.id !== userId);
    this.saveUsers(filteredUsers);
  }

  getUserById(id: string): User | undefined {
    return this.usersSubject.value.find(u => u.id === id);
  }

  private generateId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Add missing methods
  createUser(userData: any): Observable<any> {
    return new Observable(observer => {
      const user: User = {
        id: this.generateId(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        isVerified: false,
        location: userData.location || '',
        role: userData.role || UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        goodType: userData.goodType || '',
        goodWeight: userData.goodWeight || '',
        goodPrice: userData.goodPrice || '',
        goodDescription: userData.goodDescription || '',
        zipcode: userData.zipcode || ''
      };

      this.addUser(user);
      observer.next({ success: true, message: 'User created successfully' });
      observer.complete();
    });
  }

  findAll(): Observable<User[]> {
    return new Observable(observer => {
      observer.next(this.getUsers());
      observer.complete();
    });
  }

  findUserByEmail(email: string): Observable<User | null> {
    return new Observable(observer => {
      const user = this.usersSubject.value.find(u => u.email === email);
      observer.next(user || null);
      observer.complete();
    });
  }
}
