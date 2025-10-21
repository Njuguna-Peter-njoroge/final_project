import { Component } from '@angular/core';
import { Navbar } from '../../Shared/navbar/navbar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../services/loader.service';
import { UserRole } from '../../Shared/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    Navbar,
    ReactiveFormsModule,
    Footer,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private loaderService: LoaderService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toastr.warning('Please enter valid credentials', 'Validation Warning');
      return;
    }

    this.loaderService.show('Logging in, please wait...');
    const { email, password } = this.loginForm.value;
    this.loading = true;
    const start = Date.now();

    this.authService.login(email, password).subscribe({
      next: (success) => {
        this.loading = false;
        const elapsed = Date.now() - start;
        setTimeout(() => {
          this.loaderService.hide();
          if (success) {
            const user = this.authService.getCurrentUser();
            this.toastr.success('Login successful', 'Welcome!');
            if (user?.role === UserRole.ADMIN) {
              this.router.navigate(['/adminDashboard']);
            } else {
              this.router.navigate(['/homepage']);
            }
          } else {
            this.toastr.error('Invalid email or password', 'Login Failed');
          }
        }, Math.max(0, 1000 - elapsed)); // Ensure at least 1s loader
      },
      error: (error) => {
        this.loading = false;
        const elapsed = Date.now() - start;
        setTimeout(() => {
          this.loaderService.hide();
          console.error('Login error:', error);
          this.toastr.error('Login failed. Please try again.', 'Error');
        }, Math.max(0, 1000 - elapsed));
      }
    });
  }
}
