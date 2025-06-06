import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../../../core/services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { TokenStorageService } from '../../../../core/services/token-storage.service';

@Component({
  selector: 'app-workers-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './workers-management.component.html',
  styleUrls: ['./workers-management.component.scss']
})
export class WorkersManagementComponent implements OnInit {
  workers: AdminUser[] = [];
  loading = false;
  error: string | null = null;

  filterRole: '' | 'manager' | 'officer' = '';
  filterStatus: '' | 'active' | 'blocked' | 'pending' = '';
  search: string = '';

  private adminService = inject(AdminService);
  private tokenStorage = inject(TokenStorageService);

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers(): void {
    if (!this.tokenStorage.getToken()) {
      this.workers = [];
      this.loading = false;
      this.error = null;
      return;
    }
    this.loading = true;
    this.error = null;
    this.adminService.getAdminUsers({
      role: this.filterRole || undefined,
      status: this.filterStatus || undefined,
      search: this.search || undefined
    }).subscribe({
      next: (res: { users: AdminUser[] }) => {
        this.workers = res.users;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load workers';
        this.loading = false;
      }
    });
  }

  get filteredWorkers(): AdminUser[] {
    return this.workers;
  }

  onFilterChange(): void {
    this.loadWorkers();
  }

  activate(worker: AdminUser) {
    this.adminService.updateUserStatus(worker._id, 'active').subscribe({
      next: () => {
        this.snackBar.open('User activated', 'Close', { duration: 2000 });
        this.loadWorkers();
      },
      error: () => {
        this.error = 'Failed to activate user';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
      }
    });
  }
  block(worker: AdminUser) {
    this.adminService.updateUserStatus(worker._id, 'blocked').subscribe({
      next: () => {
        this.snackBar.open('User blocked', 'Close', { duration: 2000 });
        this.loadWorkers();
      },
      error: () => {
        this.error = 'Failed to block user';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
      }
    });
  }
  unblock(worker: AdminUser) {
    this.adminService.updateUserStatus(worker._id, 'active').subscribe({
      next: () => {
        this.snackBar.open('User unblocked', 'Close', { duration: 2000 });
        this.loadWorkers();
      },
      error: () => {
        this.error = 'Failed to unblock user';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
      }
    });
  }
  delete(worker: AdminUser) {
    this.adminService.deleteUser(worker._id).subscribe({
      next: () => {
        this.snackBar.open('User deleted', 'Close', { duration: 2000 });
        this.loadWorkers();
      },
      error: () => {
        this.error = 'Failed to delete user';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
      }
    });
  }
  viewDetails(worker: AdminUser) {
    this.adminService.getAdminUserById(worker._id).subscribe({
      next: (user) => {
        // Show user details in a dialog or console for now
        console.log('User details:', user);
        this.snackBar.open(`User: ${user.username}, Email: ${user.email}`, 'Close', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('Failed to fetch user details', 'Close', { duration: 3000 });
      }
    });
  }
}
