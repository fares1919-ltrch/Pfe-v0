import { AfterViewInit, Component, ViewChild, Inject, PLATFORM_ID, signal, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { isPlatformBrowser } from '@angular/common';
import { CpfRequest, ApiResponse } from '../../../../core/services/request.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../../core/services/user.service';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../../../core/services/appointment.service';

interface CpfRequestWithAppointment extends CpfRequest {
  appointmentCompleted?: boolean;
}

@Component({
  selector: 'app-officer-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class OfficerRequestsComponent implements AfterViewInit {
  // Add Math property to the component to use in template
  Math = Math;

  constructor(
    private requestService: RequestService,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  displayedColumns: string[] = [
    'username',
    'address',
    'status',
    'createdAt',
    'actions'
  ];
  dataSource = new MatTableDataSource<CpfRequest>();
  isLoading = signal(false);
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.dataSource.paginator = this.paginator;
      this.loadRequests();
    }
  }
  loadRequests(page: number = 1): void {
    this.isLoading.set(true);
    this.requestService.getAllStatusRequests(page, this.pageSize).subscribe({
      next: (res: ApiResponse) => {
        const requests = res.requests;

        // For each request, check if appointment is completed
        const appointmentChecks = requests.map(request => {
          return this.appointmentService.getAppointmentByRequestId(request._id).pipe(
            map((appointment: Appointment | null) => {
              (request as CpfRequestWithAppointment).appointmentCompleted = !!appointment && appointment.status === 'completed';
              return request;
            }),
            catchError(() => {
              (request as CpfRequestWithAppointment).appointmentCompleted = false;
              return of(request);
            })
          );
        });

        // Prepare all username fetch observables
        function isPopulatedUser(user: any): user is { _id: string; username: string } {
          return user && typeof user === 'object' && 'username' in user;
        }
        const usernameFetches = requests.map(request => {
          if (isPopulatedUser(request.userId)) {
            request.username = request.userId.username;
            return of(request);
          } else if (request.userId && typeof request.userId === 'string') {
            // If userId is a string, fetch user from backend
            return this.userService.getUserById(request.userId).pipe(
              map(user => {
                request.username = user.username;
                return request;
              }),
              catchError(() => {
                request.username = 'Unknown';
                return of(request);
              })
            );
          } else {
            request.username = 'Unknown';
            return of(request);
          }
        });

        // Wait for both appointment and username fetches
        forkJoin([...appointmentChecks, ...usernameFetches]).subscribe(() => {
          this.dataSource.data = requests;
          this.totalItems = res.totalItems || requests.length;
          this.currentPage = res.currentPage || page;
          this.isLoading.set(false);
        });
      },
      error: (error: any) => {
        console.error('Error loading requests:', error);
        if (isPlatformBrowser(this.platformId)) {
          this.snackBar.open('Error loading requests', 'Close', { duration: 3000 });
        }
        this.isLoading.set(false);
      }
    });
  }


  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getAddressTooltip(request: CpfRequest): string {
    if (!request.address) return 'No address information';
    const address = request.address;
    return `Street: ${address.street || 'N/A'}
            Postal Code: ${address.postalCode || 'N/A'}
  Country: ${address.country || 'N/A'}`;
  }
  handleAction(request: CpfRequest, action: string): void {
    let status: string;
    let message: string;

    switch (action) {
      case 'approve':
        status = 'approved';
        message = 'Request approved';
        break;
      case 'reject':
        status = 'rejected';
        message = 'Request rejected';
        break;
      case 'complete':
        // Only allow completing if appointment is completed
        const reqWithAppt = request as CpfRequestWithAppointment;
        if (!reqWithAppt.appointmentCompleted || reqWithAppt.status !== 'approved') {
          this.snackBar.open('Cannot complete request until appointment is completed and request is approved.', 'Close', { duration: 3000 });
          this.isLoading.set(false);
          return;
        }
        status = 'completed';
        message = 'Request completed';
        break;
      case 'schedule':
        this.router.navigate(['/officer-dashboard/appointments/new'], {
          queryParams: { requestId: request._id }
        });
        return;
      default:
        return;
    }

    this.isLoading.set(true);
    this.requestService.updateRequestStatus(request._id, status).subscribe({
      next: () => {
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.loadRequests(this.currentPage);
      },
      error: (error: any) => {
        console.error('Error updating request status:', error);
        this.snackBar.open('Error updating request status', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }


  viewDetails(request: CpfRequest): void {
    this.router.navigate(['/officer-dashboard/requests/', request._id]);
  }
/**
  viewAppointment(request: CpfRequest): void {
    this.AppointmentService.getAppointmentByRequestId(request._id).subscribe({
      next: (appointment: Appointment | null) => {
        if (appointment) {
          this.router.navigate(['/officer-dashboard/appointments/', appointment._id]);
        } else {
          this.snackBar.open('No appointment found for this request', 'Close', { duration: 3000 });
        }
      },
      error: (error: any) => {
        console.error('Error fetching appointment:', error);
        this.snackBar.open('Error fetching appointment details', 'Close', { duration: 3000 });
      }
    });
  }
   */
}
