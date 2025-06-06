// approvals.component.ts
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ThemePalette } from '@angular/material/core';
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService, Appointment } from '../../../../core/services/appointment.service';
import { CenterService } from '../../../../core/services/center.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../../../../core/services/profile.service';

interface UserData {
  appointmentId: string;
  username: string;
  centername: string;  // Will be populated from center.name
  centerId: string;
  status: 'pending' | 'validated' | 'rejected' | 'missed' | 'completed' | 'cancelled';
  createdAt: Date;
  address: string;
  meetingDate: Date;
  userId: string;
  center?: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      lat: number;
      lon: number;
    };
  };
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSlideToggleModule,
    MatTableModule,
    MatPaginatorModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['username', 'centername', 'address', 'status', 'createdAt', 'meetingDate', 'actions'];
  dataSource = new MatTableDataSource<UserData>([]);
  filteredDataSource = new MatTableDataSource<UserData>([]);
  isLoading = false;
  error: string | null = null;
  colorTheme: ThemePalette = 'warn';
  selectedStatus: string = 'all';
  userCache: Map<string, any> = new Map();
  centerCache: Map<string, any> = new Map();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private centerService: CenterService,
    private profileService: ProfileService
  ) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.paginator) {
      this.paginator.length = this.dataSource.data.length;
    }
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading = true;
    this.error = null;

    this.appointmentService.getAllAppointmentsOfficer('pending', undefined, undefined, undefined, undefined, 1, 100).pipe(
      catchError(err => {
        console.error('Error loading appointment requests:', err);
        this.error = 'Failed to load appointment requests';
        return of({ appointments: [], total: 0, page: 1, pages: 1 });
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(response => {
      console.log('Loaded pending appointments:', response);

      if (response && Array.isArray(response.appointments)) {
        // Map Appointment to UserData
        const appointments = response.appointments;
        const mappedData: UserData[] = [];

        appointments.forEach(appointment => {
          // Fetch user data if needed
          if (appointment.userId && typeof appointment.userId === 'string') {
            this.fetchUserData(appointment.userId);
          }

          // Format address
          let address = 'Not specified';
          if (appointment.center && appointment.center.address) {
            address = `${appointment.center.address.street || ''}, ${appointment.center.address.city || ''}, ${appointment.center.address.state || ''} ${appointment.center.address.postalCode || ''}`.trim();
            if (address === ',, ') address = 'Not specified';
          }

          // Use centerName property or fall back to cached data
          const centerName = appointment.center?.name || 'Loading center info...';

          // Handle centerId as string or object
          let centerId: string = '';
          if (typeof appointment.centerId === 'string') {
            centerId = appointment.centerId;
          } else if (appointment.centerId && typeof appointment.centerId === 'object' && '_id' in appointment.centerId) {
            centerId = appointment.centerId._id;
          }

          mappedData.push({
            appointmentId: appointment._id,
            username: this.getUserName(appointment.userId),
            centerId: centerId,
            centername: centerName,
            status: appointment.status,
            createdAt: new Date(appointment.createdAt),
            address: address,
            meetingDate: appointment.appointmentDate ? new Date(appointment.appointmentDate) : new Date(),
            userId: typeof appointment.userId === 'string' ? appointment.userId : 'unknown',
            center: appointment.center as any // Accept missing 'country' field
          });

          // Fetch center data if needed
          if (centerId) {
            this.fetchCenterData(centerId);
          }
        });

        this.dataSource.data = mappedData;
        this.applyFilter();
      }
    });
  }

  // Fetch user data and cache it
  fetchUserData(userId: string): void {
    if (this.userCache.has(userId)) {
      return;
    }

    // For now, getUserProfile only supports current user
    // TODO: Implement getUserById in ProfileService and backend if needed
    // Example placeholder:
    // this.profileService.getUserById(userId).subscribe({ ... })
    // For now, show error or skip
    this.snackBar.open('Fetching user by ID is not yet supported.', 'Close', {
      duration: 3000,
      panelClass: 'error-snackbar'
    });

    this.profileService.getUserProfile().subscribe({
      next: (userData) => {
        this.userCache.set(userId, userData);
        this.updateUserNames();
      },
      error: (err) => {
        console.error(`Error fetching user data:`, err);
        this.error = 'Failed to fetch user data';
      }
    });
  }

  // Fetch center data
  fetchCenterData(centerId: string): void {
    if (this.centerCache.has(centerId)) {
      return;
    }
    // Use CenterService instead of AppointmentService for center data
    // this.appointmentService.getCenterById(centerId).subscribe({ ... })
    // Instead, import CenterService and use it here if needed
    // For now, remove this method if not used, or update to use CenterService
  }

  // Update all user names in the table based on the cache
  updateUserNames(): void {
    const updatedData = this.dataSource.data.map(item => {
      if (typeof item.userId === 'string' && this.userCache.has(item.userId)) {
        const userData = this.userCache.get(item.userId);
        return {
          ...item,
          username: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username || 'Unknown User'
        };
      }
      return item;
    });

    this.dataSource.data = updatedData;
    this.applyFilter();
  }

  // Update all center names in the table based on the cache
  updateCenterNames(): void {
    const updatedData = this.dataSource.data.map(item => {
      // Use center object if available
      if (item.center && item.center.name) {
        return { ...item, centername: item.center.name };
      }
      // Otherwise use cached data
      else if (this.centerCache.has(item.centerId)) {
        const centerData = this.centerCache.get(item.centerId);
        return { ...item, centername: centerData.name || 'Unknown Center' };
      }
      return item;
    });

    this.dataSource.data = updatedData;
    this.applyFilter();
  }

  getUserName(userId: string | any): string {
    if (!userId) return 'Unknown User';

    // If userId is an object, it's already populated
    if (typeof userId !== 'string') {
      return `${userId.firstName || ''} ${userId.lastName || ''}`.trim() || userId.username || 'Unknown User';
    }

    // Check if we have the user in our cache
    const cachedUser = this.userCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.firstName || ''} ${cachedUser.lastName || ''}`.trim() || cachedUser.username || 'Unknown User';
    }

    // If not cached yet, return a placeholder and fetch user data
    this.fetchUserData(userId);
    return 'Loading...';
  }

  applyFilter(): void {
    if (this.selectedStatus === 'all') {
      this.filteredDataSource.data = this.dataSource.data;
    } else {
      this.filteredDataSource.data = this.dataSource.data.filter(
        item => item.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  handleAction(request: UserData, action: string): void {
    if (action === 'approve') {
      this.validateAppointment(request);
    } else if (action === 'reject') {
      this.rejectAppointment(request);
    }
  }

  private validateAppointment(request: UserData): void {
    this.isLoading = true;

    this.appointmentService.validateAppointment(request.appointmentId).subscribe({
      next: () => {
        // Update local data first for immediate feedback
        const index = this.dataSource.data.findIndex(r => r.appointmentId === request.appointmentId);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = { ...updatedData[index], status: 'validated' };
          this.dataSource.data = updatedData;
          this.applyFilter();
        }

        this.snackBar.open(`Appointment validated successfully`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error validating appointment:`, err);
        this.snackBar.open(`Failed to validate appointment`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private rejectAppointment(request: UserData): void {
    this.isLoading = true;

    this.appointmentService.rejectAppointment(request.appointmentId).subscribe({
      next: () => {
        // Update local data first for immediate feedback
        const index = this.dataSource.data.findIndex(r => r.appointmentId === request.appointmentId);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = { ...updatedData[index], status: 'rejected' };
          this.dataSource.data = updatedData;
          this.applyFilter();
        }

        this.snackBar.open(`Appointment rejected successfully`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error rejecting appointment:`, err);
        this.snackBar.open(`Failed to reject appointment`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  refreshPage() {
    this.loadAppointments();
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  updatePageSize(): void {
    this.currentPage = 1;
  }
}
