import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { UserService, User } from '../../../../core/services/user.service';

@Component({
  selector: 'app-citizen-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './citizen-list.component.html',
  styleUrls: ['./citizen-list.component.scss']
})
export class CitizenListComponent implements OnInit {
  citizens: User[] = [];
  displayedColumns: string[] = ['name', 'cpfNumber', 'cpfStatus', 'deduplicationStatus', 'status', 'actions'];

  // Filtres
  statusFilter: string = '';
  cpfStatusFilter: string = '';
  deduplicationStatusFilter: string = '';
  searchQuery: string = '';

  // Pagination
  totalItems: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;

  loading: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadCitizens();
  }

  loadCitizens(): void {
    this.loading = true;
    this.userService.getUsers(
      this.pageIndex + 1,
      this.pageSize,
      this.statusFilter,
      this.cpfStatusFilter,
      this.deduplicationStatusFilter,
      this.searchQuery
    ).subscribe({
      next: (response) => {
        this.citizens = response.users;
        this.totalItems = response.pagination.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading citizens:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.pageIndex = 0; // Reset to first page when filters change
    this.loadCitizens();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.cpfStatusFilter = '';
    this.deduplicationStatusFilter = '';
    this.searchQuery = '';
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCitizens();
  }

  viewCitizenDetails(id: string): void {
    // Navigate to citizen details page
    console.log('View citizen details:', id);
  }

  updateCitizenStatus(id: string, status: 'active' | 'suspended' | 'blocked'): void {
    this.userService.updateUserStatus(id, status).subscribe({
      next: () => {
        // Update the citizen in the list
        const index = this.citizens.findIndex(c => c._id === id);
        if (index !== -1) {
          this.citizens[index].status = status;
        }
      },
      error: (error) => {
        console.error('Error updating citizen status:', error);
      }
    });
  }
}
