import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ParcelService } from '../../../services/parcel.service';
import { OrderService } from '../../../services/order.service';
import { Parcel, ParcelStatus, Priority, ParcelFilter } from '../../../models/parcel.model';
import { Navbar } from '../../Shared/navbar/navbar';
import { Footer } from '../../Shared/footer/footer';
import { ToastService } from '../../../services/toast.service';

// Add GoodType enum for dropdown
export enum GoodType {
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  DOCUMENTS = 'DOCUMENTS',
  CLOTHING = 'CLOTHING',
  OTHER = 'OTHER'
}

@Component({
  selector: 'app-parcel-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer],
  templateUrl: './parcel-management.html',
  styleUrls: ['./parcel-management.css']
})
export class ParcelManagementComponent implements OnInit, OnDestroy {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  selectedParcel: Parcel | null = null;
  showStatusModal = false;
  showDeleteModal = false;
  showCreateModal = false;
  showDetailsModal = false;
  loading = false;

  // Filter properties
  filter: ParcelFilter = {};
  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';

  // Status update properties
  newStatus: ParcelStatus = ParcelStatus.PENDING;
  statusReason = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Enums for template
  ParcelStatus = ParcelStatus;
  Priority = Priority;
  GoodType = GoodType;

  // Math object for template
  Math = Math;

  private subscription = new Subscription();

  // For create parcel modal
  newParcel: any = {
    description: '',
    weight: null,
    dimensions: '',
    goodType: '',
    priority: 'NORMAL',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientAddress: '',
    deliveryDetails: '',
    cost: 0
  };

  filterDateFrom: string = '';
  filterDateTo: string = '';

  constructor(
    private parcelService: ParcelService,
    private orderService: OrderService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadParcels();
    this.setupPeriodicRefresh();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadParcels(): void {
    this.loading = true;
    console.log('🔄 Loading parcels...');
    this.subscription.add(
      this.parcelService.getOrders().subscribe({
        next: (parcels) => {
          console.log('📦 Parcels received from service:', parcels);
          console.log('📊 Number of parcels:', parcels?.length);
          if (parcels && parcels.length > 0) {
            console.log('👤 First parcel sender:', parcels[0].sender);
            console.log('📧 First parcel sender name:', parcels[0].sender?.name);
            console.log('📧 First parcel sender email:', parcels[0].sender?.email);
          }
          this.parcels = parcels;
          console.log('💾 Parcels assigned to component:', this.parcels);
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading parcels:', error);
          this.loading = false;
          this.toastService.error('Failed to load parcels. Please check your authentication.');
        }
      })
    );
  }

  setupPeriodicRefresh(): void {
    setInterval(() => {
      if (!this.loading) {
        this.parcelService.refreshData();
      }
    }, 5000);
  }


  // updatePagination(): void {
  //   this.totalPages = Math.ceil(this.filteredParcels.length / this.itemsPerPage);
  //   this.currentPage = this.totalPages === 0 ? 1 : Math.min(this.currentPage, this.totalPages);
  // }

  get paginatedParcels(): Parcel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredParcels.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Modal methods
  openStatusModal(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.newStatus = parcel.status;
    this.statusReason = '';
    this.showStatusModal = true;
  }

  openDeleteModal(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.showDeleteModal = true;
  }

  openDetailsModal(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.showDetailsModal = true;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newParcel = {
      description: '',
      weight: null,
      dimensions: '',
      goodType: '',
      priority: 'NORMAL',
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      recipientAddress: '',
      deliveryDetails: '',
      cost: 0
    };
  }

  submitCreateParcel(): void {
    if (!this.newParcel.description || !this.newParcel.weight || !this.newParcel.dimensions || !this.newParcel.goodType || !this.newParcel.priority) {
      this.showErrorMessage('Please fill all required fields.');
      return;
    }
    this.loading = true;

    this.subscription.add(
      this.parcelService.createParcel({
        goodType: this.newParcel.goodType || 'OTHER',
        goodDescription: this.newParcel.description || 'Parcel',
        goodWeight: this.newParcel.weight || 1,
        status: this.ParcelStatus.PENDING,
        senderId: 'default-sender-id', // This will be handled by the backend
        recipientName: this.newParcel.recipientName || 'Recipient',
        recipientEmail: this.newParcel.recipientEmail || 'recipient@example.com',
        recipientPhone: this.newParcel.recipientPhone || '+1234567890',
        recipientAddress: this.newParcel.recipientAddress || 'Recipient Address',
        deliveryDetails: this.newParcel.deliveryDetails || '',
        weight: this.newParcel.weight,
        dimensions: this.newParcel.dimensions,
        description: this.newParcel.description,
        priority: this.newParcel.priority,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        cost: this.newParcel.cost || 0
      }).subscribe({
        next: (createdParcel) => {
          this.showCreateModal = false;
          this.loading = false;
          this.showSuccessMessage('Parcel created successfully');
          this.loadParcels();
        },
        error: (error) => {
          console.error('Error creating parcel:', error);
          this.loading = false;
          this.showErrorMessage('Failed to create parcel');
        }
      })
    );
  }

  closeModals(): void {
    this.showStatusModal = false;
    this.showDeleteModal = false;
    this.showCreateModal = false;
    this.showDetailsModal = false;
    this.selectedParcel = null;
    this.statusReason = '';
  }

  // CRUD
  updateStatus(): void {
    if (!this.selectedParcel) return;
    this.loading = true;

    this.subscription.add(
      this.parcelService.updateOrderStatus(
        this.selectedParcel.orderUuid || this.selectedParcel.id,
        this.newStatus,
        this.statusReason
      ).subscribe({
        next: (response) => {
          if (response && response.order) {
            this.loadParcels();
            this.closeModals();
            this.showSuccessMessage('Status updated successfully');
          } else {
            this.showErrorMessage('Failed to update status');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.showErrorMessage('Error updating status');
          this.loading = false;
        }
      })
    );
  }

  deleteParcel(): void {
    if (!this.selectedParcel) return;
    this.loading = true;

    console.log('Deleting parcel:', this.selectedParcel.id, 'Current page:', this.currentPage);

    this.subscription.add(
      this.parcelService.deleteParcel(this.selectedParcel.id).subscribe({
        next: (success) => {
          if (success) {
            console.log('Parcel deleted successfully');
            // Removed resetting filteredParcels, totalPages, and currentPage here
            this.loadParcels();
            this.closeModals();
            this.showSuccessMessage('Parcel deleted successfully');
          } else {
            console.log('Failed to delete parcel');
            this.showErrorMessage('Failed to delete parcel');
          }
          this.loading = false;
          console.log('Loading state:', this.loading);
        },
        error: (error) => {
          console.error('Error deleting parcel:', error);
          this.showErrorMessage('Error deleting parcel');
          this.loading = false;
        }
      })
    );
  }

  updatePagination(): void {
    console.log('Updating pagination. Filtered parcels:', this.filteredParcels.length, 'Items per page:', this.itemsPerPage);
    this.totalPages = Math.ceil(this.filteredParcels.length / this.itemsPerPage);
    this.currentPage = this.totalPages === 0 ? 1 : Math.min(this.currentPage, this.totalPages);
    console.log('Total pages:', this.totalPages, 'Current page:', this.currentPage);
  }

  // goToPage(page: number): void {
  //   console.log('Go to page:', page, 'Total pages:', this.totalPages);
  //   if (page >= 1 && page <= this.totalPages) {
  //     this.currentPage = page;
  //   }
  // }

  applyFilters(): void {
    this.currentPage = 1; // Reset to first page on filter change
    this.loading = true;

    // Use the parcels endpoint directly since backend handles conversion
    this.parcelService.getOrders().subscribe({
      next: (parcels) => {
        console.log('Filtered parcels from backend:', parcels);
        this.parcels = parcels;
        this.filteredParcels = [...this.parcels];
        this.loading = false;
        this.updatePagination();
        console.log('Filtered parcels:', this.filteredParcels);
      },
      error: (error) => {
        console.error('Error loading parcels:', error);
        this.loading = false;
        this.showErrorMessage('Failed to load parcels');
      }
    });
  }

  // Utility Methods
  getStatusClass(status: ParcelStatus): string {
    const statusClasses = {
      [ParcelStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ParcelStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [ParcelStatus.PICKED_UP]: 'bg-purple-100 text-purple-800',
      [ParcelStatus.IN_TRANSIT]: 'bg-orange-100 text-orange-800',
      [ParcelStatus.OUT_FOR_DELIVERY]: 'bg-indigo-100 text-indigo-800',
      [ParcelStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [ParcelStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [ParcelStatus.RETURNED]: 'bg-gray-100 text-gray-800',
      [ParcelStatus.FAILED_DELIVERY]: 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: Priority): string {
    const priorityClasses = {
      [Priority.LOW]: 'bg-gray-100 text-gray-600',
      [Priority.NORMAL]: 'bg-blue-100 text-blue-600',
      [Priority.HIGH]: 'bg-orange-100 text-orange-600',
      [Priority.URGENT]: 'bg-red-100 text-red-600'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-600';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToPage(page: number): void {
    console.log('Go to page:', page, 'Total pages:', this.totalPages);
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters(); // Refresh displayed parcels after page change
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Toast
  private showSuccessMessage(message: string): void {
    this.toastService.success(message);
  }

  private showErrorMessage(message: string): void {
    this.toastService.error(message);
  }

  // Bulk Operations
  bulkUpdateStatus(status: ParcelStatus): void {
    console.log('Bulk update to status:', status);
  }

  exportParcels(): void {
    console.log('Exporting parcels...');
  }

  // Filters
  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onPriorityFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.applyFilters();
  }

  deleteAllParcels(): void {
    // Add confirmation dialog
    if (!confirm('Are you sure you want to delete ALL parcels? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    this.parcelService.deleteAllParcels().subscribe({
      next: (response) => {
        this.loading = false;
        // Clear the parcels arrays
        this.parcels = [];
        this.filteredParcels = [];
        this.currentPage = 1;
        this.totalPages = 1;

        // Show success message with count if available
        const message = response?.message || 'All parcels deleted successfully';
        this.showSuccessMessage(message);

        console.log('Delete all response:', response);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting all parcels:', error);
        this.showErrorMessage('Error deleting all parcels. Please check your authentication.');
      }
    });
  }
}
