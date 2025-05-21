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

interface UserData {
  requestId: string;
  username: string;
  centername: string;
  centerId: string;
  status: 'pending' | 'validated' | 'rejected';
  createdAt: Date;
  address: string;
  meetingDate: Date;
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  constructor(
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.paginator) {
      this.paginator.length = this.dataSource.data.length;
    }
  }

  ngOnInit(): void {
    this.loadStaticData();
  }

  private loadStaticData(): void {
    const staticData: UserData[] = [
      {
        requestId: '1',
        username: 'John Doe',
        centername: 'Downtown Center',
        centerId: 'C001',
        status: 'pending',
        createdAt: new Date('2024-03-15'),
        address: '123 Main St, New York, NY 10001',
        meetingDate: new Date('2024-03-20')
      },
      {
        requestId: '2',
        username: 'Jane Smith',
        centername: 'Westside Center',
        centerId: 'C002',
        status: 'validated',
        createdAt: new Date('2024-03-14'),
        address: '456 Oak Ave, Los Angeles, CA 90001',
        meetingDate: new Date('2024-03-19')
      },
      {
        requestId: '3',
        username: 'Mike Johnson',
        centername: 'North Center',
        centerId: 'C003',
        status: 'rejected',
        createdAt: new Date('2024-03-13'),
        address: '789 Pine Rd, Chicago, IL 60601',
        meetingDate: new Date('2024-03-18')
      }
    ];

    this.dataSource.data = staticData;
    this.applyFilter();
    this.cdr.detectChanges();
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
      this.updateRequestStatus(request, 'validated');
    } else if (action === 'reject') {
      this.updateRequestStatus(request, 'rejected');
    }
  }

  private updateRequestStatus(request: UserData, newStatus: 'validated' | 'rejected'): void {
    const index = this.dataSource.data.findIndex(r => r.requestId === request.requestId);
    if (index !== -1) {
      const updatedData = [...this.dataSource.data];
      updatedData[index] = { ...updatedData[index], status: newStatus };
      this.dataSource.data = updatedData;
      this.applyFilter();
      
      this.snackBar.open(`Request ${newStatus} successfully`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      }
  }
  
  refreshPage() {
    this.loadStaticData();
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
