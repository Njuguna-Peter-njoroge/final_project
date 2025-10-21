import { UserRole } from '../../../component/Shared/user.model';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../../Shared/navbar/navbar';
import { Footer } from '../../Shared/footer/footer';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-driver-courier-form',
  standalone: true,
  imports: [Navbar, Footer, ReactiveFormsModule],
  templateUrl: './driver-courier-form.html',
  styleUrl: './manage-users.css'
})
export class DriverCourierForm {
  driverForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      location: ['', Validators.required],
      licenseNumber: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.driverForm.invalid) return;
    const driver = {
      ...this.driverForm.value,
      role: UserRole.COURIER,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false
    };
    this.userService.createUser(driver).subscribe();
    this.router.navigate(['/ManageUsers']);
  }
}
