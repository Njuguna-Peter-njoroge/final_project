import { Component } from '@angular/core';
import {Navbar} from '../../Shared/navbar/navbar';
import {Footer} from '../../Shared/footer/footer';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [
    Navbar,
    Footer,
    ReactiveFormsModule,
    RouterLink,
    NgIf
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill in all fields correctly', 'Validation Warning');
      return;
    }

    const { name, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.toastr.error('Passwords do not match!', 'Error');
      return;
    }

    this.isLoading = true;

    console.log('Starting registration for:', email);
    console.log('Form data:', { name, email, password });
    this.authService.register({ name, email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration response:', response);
        if (response.success) {
          this.toastr.success(response.message, 'Success');
          console.log('Registration successful, requiresVerification:', response.requiresVerification);
          if (response.requiresVerification) {
            console.log('Redirecting to email verification with email:', email);
            // Navigate to email verification page
            this.router.navigate(['/email-verification'], { 
              queryParams: { email: email } 
            });
          } else {
            console.log('User already verified, redirecting to login');
            this.router.navigate(['/login']);
          }
        } else {
          this.toastr.error(response.message, 'Error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration error:', err);
        const errorMessage = err?.error?.message || 'Registration failed. Please try again.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control && control.touched && control.errors) {
      if (control.errors['required']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
      }
    }
    return '';
  }
}
