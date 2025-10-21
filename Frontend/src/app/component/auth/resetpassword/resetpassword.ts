// import { Component } from '@angular/core';
//
// @Component({
//   selector: 'app-resetpassword',
//   imports: [],
//   templateUrl: './resetpassword.html',
//   styleUrl: './resetpassword.css'
// })
// export class Resetpassword {
//
// }


import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {Navbar} from '../../Shared/navbar/navbar';
import {Footer} from '../../Shared/footer/footer';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  template: `
    <app-navbar></app-navbar>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="bg-white p-8 rounded shadow-md w-[400px]">
        <h2 class="text-xl font-bold mb-6 text-center">Reset Password</h2>

        <div class="mb-4">
          <label class="block mb-1 font-medium">Email</label>
          <input formControlName="email" type="email" placeholder="Enter email"
            class="w-full border border-gray-300 rounded px-4 py-2" />
        </div>

        <div class="mb-4">
          <label class="block mb-1 font-medium">Verification Token</label>
          <input formControlName="token" type="text" placeholder="Enter token"
            class="w-full border border-gray-300 rounded px-4 py-2" />
        </div>

        <div class="mb-6">
          <label class="block mb-1 font-medium">New Password</label>
          <input formControlName="newPassword" type="password" placeholder="New password"
            class="w-full border border-gray-300 rounded px-4 py-2" />
        </div>

        <button type="submit"
          [disabled]="resetForm.invalid"
          class="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition">
          Reset Password
        </button>
      </form>
    </div>
    <app-footer></app-footer>
  `
})
export class Resetpassword {
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.authService.resetPassword(this.resetForm.value).subscribe({
      next: () => {
        alert('Password reset successful!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Reset failed:', err);
        alert('Failed to reset password. Please check your inputs.');
      },
    });
  }
}

