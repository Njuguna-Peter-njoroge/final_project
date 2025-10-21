import { Component, OnInit } from '@angular/core';
import {Navbar} from '../../Shared/navbar/navbar';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-email-verification',
  imports: [
    Navbar,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css'
})
export class EmailVerification implements OnInit {
  otpForm: FormGroup;
  email: string = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.otpForm = this.fb.group({
      token: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    // Get email from query parameters
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.toastr.error('Email not found. Please register again.', 'Error');
        this.router.navigate(['/register']);
      }
    });
  }

  onSubmit() {
    if (this.otpForm.valid && this.email) {
      this.isLoading = true;
      const token = this.otpForm.value.token;

      this.authService.verifyEmail(this.email, token).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastr.success(response.message, 'Success');
            this.router.navigate(['/login']);
          } else {
            this.toastr.error(response.message, 'Error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Email verification failed. Please try again.', 'Error');
        }
      });
    } else {
      this.toastr.warning('Please enter a valid verification code', 'Warning');
    }
  }

  resendVerification() {
    if (this.email) {
      this.isLoading = true;
      this.authService.resendVerificationEmail(this.email).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastr.success(response.message, 'Success');
          } else {
            this.toastr.error(response.message, 'Error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to resend verification email', 'Error');
        }
      });
    } else {
      this.toastr.error('Email not found. Please register again.', 'Error');
    }
  }
}
