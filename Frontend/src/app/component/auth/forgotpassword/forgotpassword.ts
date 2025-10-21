// import { Component } from '@angular/core';
//
// @Component({
//   selector: 'app-forgotpassword',
//   imports: [],
//   templateUrl: './forgotpassword.html',
//   styleUrl: './forgotpassword.css'
// })
// export class Forgotpassword {
//
// }


import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import {Navbar} from '../../Shared/navbar/navbar';
import {Footer} from '../../Shared/footer/footer';

@Component({
  selector: 'app-forgotpassword',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  template: `
    <app-navbar></app-navbar>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-xl shadow-md w-[400px]">
        <h2 class="text-2xl font-bold text-center mb-6">Forgot Password</h2>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block font-medium mb-1">Email Address</label>
            <input
              type="email"
              formControlName="email"
              class="w-full border border-orange-600 rounded-xl px-4 py-2"
              placeholder="Enter your email"
            />
            <div *ngIf="forgotForm.controls['email'].invalid && forgotForm.controls['email'].touched" class="text-sm text-red-600 mt-1">
              A valid email is required.
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-orange-600 text-white py-2 rounded-xl hover:bg-orange-700 transition"
            [disabled]="forgotForm.invalid || isLoading"
          >
            {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
          </button>

          <p *ngIf="message" class="text-green-600 mt-4 text-center">{{ message }}</p>
          <p *ngIf="error" class="text-red-600 mt-4 text-center">{{ error }}</p>
        </form>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class Forgotpassword {
  forgotForm: FormGroup;
  isLoading = false;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.message = 'Reset link sent to your email.';
        this.isLoading = false;
        this.forgotForm.reset();


        setTimeout(() => {
          this.router.navigate(['/Resetpassword']);
        }, 2000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'An error occurred.';
        this.isLoading = false;
      },
    });
  }
}
