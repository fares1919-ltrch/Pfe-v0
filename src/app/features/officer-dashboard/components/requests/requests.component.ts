import { AfterViewInit, Component, ViewChild, Inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
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
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CpfRequestService, CpfRequest } from '../../../../core/services/cpf-request.service';
import { isPlatformBrowser } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../../core/services/user.service';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../../../core/services/appointment.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
interface CpfRequestWithAppointment extends CpfRequest {
  appointmentCompleted?: boolean;
  appointmentData?: Appointment | null;
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
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatSelectModule
  ],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class OfficerRequestsComponent implements OnInit, AfterViewInit {
  // Add Math property to the component to use in template
  Math = Math;
  statusFilter: string = 'all';

  constructor(
    private cpfRequestService: CpfRequestService,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  displayedColumns: string[] = [
    'identityNumber',
    'user',
    'address',
    'status',
    'createdAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<CpfRequestWithAppointment>();
  isLoading = signal(false);
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    // Check query parameters for status filter
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter = params['status'];
        // Will be applied when data is loaded
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRequests();
    }
  }

  loadRequests(page: number = 1): void {
    this.isLoading.set(true);
    this.currentPage = page;

    this.cpfRequestService.getAllCpfRequests(page, this.pageSize).subscribe({
      next: (response) => {
        // Create initial requests with appointment status undefined
        const requestsWithAppointments: CpfRequestWithAppointment[] = response.requests.map(request => ({
          ...request,
          appointmentCompleted: undefined,
          appointmentData: null
        }));

        // Update the data source immediately to show requests
        this.dataSource.data = requestsWithAppointments;
        this.totalItems = response.totalItems;

        // Apply status filter if set
        if (this.statusFilter !== 'all') {
          this.applyStatusFilter(this.statusFilter);
        }

        // For each request, fetch its appointment data if it exists
        requestsWithAppointments.forEach((request, index) => {
          if (request._id) {
            this.appointmentService.getAppointmentByRequestId(request._id).subscribe({
              next: (appointment) => {
                if (appointment) {
                  // Update the specific request in the data source
                  requestsWithAppointments[index].appointmentCompleted = appointment.status === 'completed';
                  requestsWithAppointments[index].appointmentData = appointment;

                  // Update the data source to reflect changes
                  this.dataSource.data = [...requestsWithAppointments];

                  // Re-apply filter if needed
                  if (this.statusFilter !== 'all') {
                    this.applyStatusFilter(this.statusFilter);
                  }
                }
              },
              error: (err) => {
                // Only log error if it's not a 404, since 404 just means no appointment exists
                if (err.status !== 404) {
                  console.error(`Error fetching appointment for request ${request._id}:`, err);
                }
              }
            });
          }
        });

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.isLoading.set(false);

        // Check for specific error types
        if (err.status === 401 || err.status === 403) {
          this.snackBar.open('You are not authorized to view these requests', 'Close', { duration: 3000 });
          this.router.navigate(['/auth/login']);
        } else {
          this.snackBar.open('Failed to load CPF requests', 'Close', { duration: 3000 });
        }
      }
    });
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getAddressTooltip(request: CpfRequest): string {
    if (!request.address) return 'No address provided';
    return `${request.address.street}, ${request.address.city}, ${request.address.state} ${request.address.postalCode}`;
  }

  handleAction(request: CpfRequest, action: string): void {
    if (action === 'approve') {
      this.updateRequestStatus(request, 'approved');
    } else if (action === 'reject') {
      this.updateRequestStatus(request, 'rejected');
    }
  }

  updateRequestStatus(request: CpfRequest, status: 'approved' | 'rejected'): void {
    this.isLoading.set(true);
    this.cpfRequestService.updateRequestStatus(request._id, status).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open(`Request ${status} successfully`, 'Close', { duration: 3000 });
        this.loadRequests(this.currentPage);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(`Error ${status}ing request:`, err);

        if (err.status === 401 || err.status === 403) {
          this.snackBar.open('You are not authorized to perform this action', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(`Failed to ${status} request: ${err.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
        }
      }
    });
  }

  onPageChange(event: any): void {
    this.loadRequests(event.pageIndex + 1);
  }

  applyStatusFilter(status: string): void {
    this.statusFilter = status;

    if (status === 'all') {
      this.dataSource.filterPredicate = () => true;
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (data: CpfRequestWithAppointment) => data.status === status;
      this.dataSource.filter = status;
    }

    // Update URL with the status filter without navigating
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  refreshRequests(): void {
    this.loadRequests(this.currentPage);
  }
}
