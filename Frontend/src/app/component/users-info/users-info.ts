import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User, UserRole } from '../Shared/user.model';
import { Navbar } from '../Shared/navbar/navbar';
import { Footer } from '../Shared/footer/footer';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { LocationService, County } from '../../services/location.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './users-info.html',
  imports: [
    ReactiveFormsModule,
    Navbar,
    Footer,
    CommonModule
  ],
  styleUrls: ['./users-info.css']
})
export class UsersInfo implements OnInit {
  parcelForm: FormGroup;
  
  // Location properties
  counties: County[] = [];
  senderZipCodes: string[] = [];
  receiverZipCodes: string[] = [];
  loadingCounties = false;

  // ✅ Inject OrderService here
  courierServices = [
    'Express Delivery',
    'Standard Delivery',
    'Same Day Delivery',
    'Next Day Delivery',
    'International Shipping'
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private orderService: OrderService,
    private locationService: LocationService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.parcelForm = this.fb.group({
      senderName: ['', Validators.required],
      senderEmail: ['', [Validators.required, Validators.email]],
      senderPhone: ['', Validators.required],
      senderHometown: ['', Validators.required],
      senderZip: ['', Validators.required],
      receiverName: ['', Validators.required],
      receiverEmail: ['', [Validators.required, Validators.email]],
      receiverPhone: ['', Validators.required],
      receiverHometown: ['', Validators.required],
      receiverZip: ['', Validators.required],
      packageName: ['', Validators.required],
      packageWeight: ['', [Validators.required, Validators.min(0.1)]],
      packageDimensions: [''],
      courierService: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCounties();
  }

  loadCounties(): void {
    this.loadingCounties = true;
    this.locationService.getCounties().subscribe({
      next: (counties) => {
        this.counties = counties;
        this.loadingCounties = false;
      },
      error: (error) => {
        console.error('Error loading counties:', error);
        this.loadingCounties = false;
        this.toastService.error('Failed to load counties. Using default data.');
      }
    });
  }



  onSubmit(): void {
    if (this.parcelForm.valid) {
      const formValue = this.parcelForm.value;

      // Prepare user data
      const userData = {
        name: formValue.senderName,
        email: formValue.senderEmail,
        phone: formValue.senderPhone,
        location: formValue.senderHometown,
        zipcode: formValue.senderZip || '',
        role: UserRole.USER
      };

      // Prepare order data with receiver information
      const orderData = {
        customerName: formValue.senderName,
        customerEmail: formValue.senderEmail,
        customerPhone: formValue.senderPhone,
        customerZipcode: formValue.senderZip || '',
        pickupAddress: `${formValue.senderHometown}${formValue.senderZip ? ', ' + formValue.senderZip : ''}`,
        deliveryAddress: `${formValue.receiverHometown}${formValue.receiverZip ? ', ' + formValue.receiverZip : ''}`,
        receiverName: formValue.receiverName,
        receiverEmail: formValue.receiverEmail,
        receiverPhone: formValue.receiverPhone,
        courierService: formValue.courierService,
        status: 'Pending',
        packageWeight: formValue.packageWeight + ' kg',
        packageDimensions: formValue.packageDimensions || 'Not specified',
        price: formValue.price,
        notes: `Package: ${formValue.packageName}. ${formValue.notes || ''}`
      };

      // First check if user exists, then create order
      this.createOrderWithUser(userData, orderData);
    } else {
      this.toastService.warning('Please fill in all required fields correctly.');
      this.markFormGroupTouched();
    }
  }

  private createOrderWithUser(userData: any, orderData: any): void {
    // Backend will handle user creation/finding, just send the order data
    this.createOrder(orderData);
  }

  private createOrder(orderData: any): void {
    // Prepare order data for public endpoint
    const publicOrderData = {
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      customerZipcode: orderData.customerZipcode,
      pickupAddress: orderData.pickupAddress,
      deliveryAddress: orderData.deliveryAddress,
      receiverName: orderData.receiverName,
      receiverEmail: orderData.receiverEmail,
      receiverPhone: orderData.receiverPhone,
      courierService: orderData.courierService,
      packageWeight: orderData.packageWeight,
      packageDimensions: orderData.packageDimensions,
      price: orderData.price,
      notes: orderData.notes
    };

    console.log('Sending order data to backend:', publicOrderData);
    this.orderService.createPublicOrder(publicOrderData).subscribe({
      next: (orderResponse: any) => {
        console.log('Order created successfully:', orderResponse);
        this.toastService.success('Order created successfully! Redirecting to orders page...');
        setTimeout(() => {
          this.router.navigate(['/Vieworders']);
        }, 2000);
      },
      error: (orderError: any) => {
        console.error('Error creating order:', orderError);
        this.toastService.error('Failed to create order. Please try again.');
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.parcelForm.controls).forEach(key => {
      const control = this.parcelForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  resetForm(): void {
    this.parcelForm.reset();
    this.senderZipCodes = [];
    this.receiverZipCodes = [];
  }

  onCountyChange(type: 'sender' | 'receiver', event: any): void {
    const selectedCountyName = event.target.value;
    const selectedCounty = this.counties.find(county => county.name === selectedCountyName);
    
    if (selectedCounty) {
      // Use the zip codes from the county object
      if (type === 'sender') {
        this.senderZipCodes = selectedCounty.zipCodes;
        // Automatically set the first zip code for the sender
        if (selectedCounty.zipCodes.length > 0) {
          this.parcelForm.patchValue({ senderZip: selectedCounty.zipCodes[0] });
        }
      } else {
        this.receiverZipCodes = selectedCounty.zipCodes;
        // Automatically set the first zip code for the receiver
        if (selectedCounty.zipCodes.length > 0) {
          this.parcelForm.patchValue({ receiverZip: selectedCounty.zipCodes[0] });
        }
      }
    } else {
      // If county not found in local data, try to fetch from API
      this.locationService.getZipCodesByCountyName(selectedCountyName).subscribe({
        next: (zipCodes) => {
          if (type === 'sender') {
            this.senderZipCodes = zipCodes;
            // Automatically set the first zip code for the sender
            if (zipCodes.length > 0) {
              this.parcelForm.patchValue({ senderZip: zipCodes[0] });
            }
          } else {
            this.receiverZipCodes = zipCodes;
            // Automatically set the first zip code for the receiver
            if (zipCodes.length > 0) {
              this.parcelForm.patchValue({ receiverZip: zipCodes[0] });
            }
          }
        },
        error: (error) => {
          console.error('Error fetching zip codes:', error);
          this.toastService.error('Failed to load zip codes for selected county.');
        }
      });
    }
  }
}
