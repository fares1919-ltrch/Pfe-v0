import { AfterViewInit, Component, ViewChild, Inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CpfRequestService, CpfRequest } from '../../../../core/services/cpf-request.service';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from '../../../../core/services/user.service';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../../../core/services/appointment.service';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

interface CpfRequestWithAppointment extends CpfRequest {
  appointmentCompleted?: boolean;
  appointmentData?: Appointment | null;
}

@Component({
  selector: 'app-officer-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
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
    private router: Router,
    private route: ActivatedRoute,
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

  // Custom implementation to replace MatTableDataSource
  dataSource: {
    data: CpfRequestWithAppointment[];
    filteredData: CpfRequestWithAppointment[];
    filter: string;
    filterPredicate: (data: CpfRequestWithAppointment, filter: string) => boolean;
    paginator: any;
    sort: any;
  } = {
    data: [],
    filteredData: [],
    filter: '',
    filterPredicate: () => true,
    paginator: null,
    sort: null
  };

  isLoading = signal(false);
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild('paginator') paginator: any;
  @ViewChild('sort') sort: any;

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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
        this.dataSource.filteredData = [...requestsWithAppointments]; // Set initial filtered data
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

                  // Apply filter to update filtered data
                  this.updateFilteredData();

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
          alert('You are not authorized to view these requests');
          this.router.navigate(['/auth/login']);
        } else {
          alert('Failed to load CPF requests');
        }
      }
    });
  }

  // Helper method to update filtered data based on current filter
  updateFilteredData(): void {
    if (!this.dataSource.filter) {
      this.dataSource.filteredData = [...this.dataSource.data];
    } else {
      this.dataSource.filteredData = this.dataSource.data.filter(item =>
        this.dataSource.filterPredicate(item, this.dataSource.filter)
      );
    }
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
        alert(`Request ${status} successfully`);
        this.loadRequests(this.currentPage);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(`Error ${status}ing request:`, err);

        if (err.status === 401 || err.status === 403) {
          alert('You are not authorized to perform this action');
        } else {
          alert(`Failed to ${status} request: ${err.error?.message || 'Unknown error'}`);
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

    // Update filtered data based on new filter
    this.updateFilteredData();

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

  sortData(event: any) {
    const data = [...this.dataSource.data];
    if (!event.active || event.direction === '') {
      this.dataSource.data = data;
      this.updateFilteredData();
      return;
    }

    const sortedData = data.sort((a, b) => {
      const isAsc = event.direction === 'asc';
      switch (event.active) {
        case 'identityNumber':
          return this.compare(a.identityNumber, b.identityNumber, isAsc);
        case 'user':
          const aName = typeof a.userId === 'string' ? '' : a.userId?.firstName || '';
          const bName = typeof b.userId === 'string' ? '' : b.userId?.firstName || '';
          return this.compare(aName, bName, isAsc);
        case 'status':
          return this.compare(a.status, b.status, isAsc);
        case 'createdAt':
          return this.compare(a.createdAt, b.createdAt, isAsc);
        default:
          return 0;
      }
    });

    this.dataSource.data = sortedData;
    this.updateFilteredData();
  }

  private compare(a: any, b: any, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
