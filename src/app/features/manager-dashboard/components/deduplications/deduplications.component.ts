import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DuplicateAccount {
  id: string;
  fullName: string;
  cin: string;
  matchPercentage: number;
  status: 'blocked';
  lastLogin: string;
  registrationDate: string;
  profileImage: string;
  uploadedImage: string;
  reason: string;
  blockedDate: string;
  blockedBy: string;
}

@Component({
  selector: 'app-deduplications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="deduplication-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="mb-2">Blocked Accounts</h1>
            <p class="text-muted mb-0">Accounts blocked due to face matching violations</p>
          </div>
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-value">{{ accounts.length }}</div>
              <div class="stat-label">Total Blocked</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ getHighMatchCount() }}</div>
              <div class="stat-label">High Risk</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search by name or CIN..."
                [(ngModel)]="searchTerm"
                (input)="filterAccounts()"
              >
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="matchFilter" (change)="filterAccounts()">
              <option value="all">All Match Percentages</option>
              <option value="90">90% and above</option>
              <option value="80">80% and above</option>
              <option value="70">70% and above</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="dateFilter" (change)="filterAccounts()">
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100" (click)="exportToExcel()">
              <i class="fas fa-file-excel me-2"></i>Export
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Match %</th>
                <th>Full Name</th>
                <th>CIN</th>
                <th>Registration Date</th>
                <th>Blocked Date</th>
                <th>Blocked By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let account of filteredAccounts">
                <td>
                  <div class="match-indicator">
                    <div class="progress">
                      <div 
                        class="progress-bar" 
                        [class.bg-danger]="account.matchPercentage >= 90"
                        [class.bg-warning]="account.matchPercentage >= 80 && account.matchPercentage < 90"
                        [class.bg-info]="account.matchPercentage < 80"
                        [style.width.%]="account.matchPercentage"
                      ></div>
                    </div>
                    <small>{{ account.matchPercentage }}%</small>
                  </div>
                </td>
                <td>{{ account.fullName }}</td>
                <td>{{ account.cin }}</td>
                <td>{{ account.registrationDate }}</td>
                <td>{{ account.blockedDate }}</td>
                <td>{{ account.blockedBy }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" (click)="openDetails(account)">
                    <i class="fas fa-eye me-1"></i>Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-section">
        <div class="d-flex justify-content-between align-items-center">
          <div class="text-muted">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredAccounts.length) }} of {{ filteredAccounts.length }} entries
          </div>
          <nav>
            <ul class="pagination mb-0">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <a class="page-link" (click)="changePage(currentPage - 1)">
                  <i class="fas fa-chevron-left"></i>
                </a>
              </li>
              <li class="page-item" *ngFor="let page of getPageNumbers()" [class.active]="page === currentPage">
                <a class="page-link" (click)="changePage(page)">{{ page }}</a>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <a class="page-link" (click)="changePage(currentPage + 1)">
                  <i class="fas fa-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Details Modal -->
      <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Account Details</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body" *ngIf="selectedAccount">
              <div class="row">
                <div class="col-md-6">
                  <div class="image-card">
                    <h6>Uploaded Image</h6>
                    <img [src]="selectedAccount.uploadedImage" class="img-fluid rounded" alt="Uploaded face">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="image-card">
                    <h6>Existing Account Image</h6>
                    <img [src]="selectedAccount.profileImage" class="img-fluid rounded" alt="Existing account face">
                  </div>
                </div>
              </div>
              <div class="account-info">
                <div class="row">
                  <div class="col-md-6">
                    <div class="info-group">
                      <label>Full Name</label>
                      <p>{{ selectedAccount.fullName }}</p>
                    </div>
                    <div class="info-group">
                      <label>CIN</label>
                      <p>{{ selectedAccount.cin }}</p>
                    </div>
                    <div class="info-group">
                      <label>Match Percentage</label>
                      <p>{{ selectedAccount.matchPercentage }}%</p>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-group">
                      <label>Registration Date</label>
                      <p>{{ selectedAccount.registrationDate }}</p>
                    </div>
                    <div class="info-group">
                      <label>Last Login</label>
                      <p>{{ selectedAccount.lastLogin }}</p>
                    </div>
                    <div class="info-group">
                      <label>Blocked Date</label>
                      <p>{{ selectedAccount.blockedDate }}</p>
                    </div>
                  </div>
                </div>
                <div class="blocking-info">
                  <h6>Blocking Information</h6>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="info-group">
                        <label>Blocked By</label>
                        <p>{{ selectedAccount.blockedBy }}</p>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="info-group">
                        <label>Reason</label>
                        <p>{{ selectedAccount.reason }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Close</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'"></div>
    </div>
  `,
  styles: [`
    .deduplication-container {
      padding: 2rem;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .header-section h1 {
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .stats-cards {
      display: flex;
      gap: 1rem;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      text-align: center;
      min-width: 120px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .search-box {
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }

    .search-box input {
      padding-left: 2.5rem;
    }

    .table-container {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .table {
      margin-bottom: 0;
    }

    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #dee2e6;
    }

    .table td {
      vertical-align: middle;
    }

    .match-indicator {
      width: 100px;
    }

    .match-indicator .progress {
      height: 6px;
      background-color: #e9ecef;
      border-radius: 3px;
    }

    .match-indicator small {
      display: block;
      text-align: center;
      margin-top: 4px;
      color: #6c757d;
      font-size: 0.8rem;
    }

    .pagination-section {
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      margin-top: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .page-link {
      color: #2c3e50;
      border: none;
      padding: 0.5rem 0.75rem;
      margin: 0 2px;
      border-radius: 4px;
    }

    .page-item.active .page-link {
      background-color: #3498db;
      color: white;
    }

    .page-item.disabled .page-link {
      color: #6c757d;
    }

    .modal-content {
      border: none;
      border-radius: 10px;
    }

    .modal-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      border-radius: 10px 10px 0 0;
    }

    .image-card {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .image-card h6 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .account-info {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .info-group {
      margin-bottom: 1rem;
    }

    .info-group label {
      display: block;
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .info-group p {
      margin: 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .blocking-info {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #dee2e6;
    }

    .blocking-info h6 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .btn-outline-primary {
      border-color: #3498db;
      color: #3498db;
    }

    .btn-outline-primary:hover {
      background-color: #3498db;
      color: white;
    }
  `]
})
export class DeduplicationsComponent {
  Math = Math;
  accounts: DuplicateAccount[] = [
    {
      id: '1',
      fullName: 'John Doe',
      cin: 'AB123456',
      matchPercentage: 92,
      status: 'blocked',
      lastLogin: '2024-03-15 14:30',
      registrationDate: '2024-02-01',
      profileImage: 'https://via.placeholder.com/300x300?text=Profile+1',
      uploadedImage: 'https://via.placeholder.com/300x300?text=Uploaded+1',
      reason: 'Multiple account creation detected',
      blockedDate: '2024-03-15',
      blockedBy: 'Admin User'
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      cin: 'CD789012',
      matchPercentage: 85,
      status: 'blocked',
      lastLogin: '2024-03-14 09:15',
      registrationDate: '2024-01-15',
      profileImage: 'https://via.placeholder.com/300x300?text=Profile+2',
      uploadedImage: 'https://via.placeholder.com/300x300?text=Uploaded+2',
      reason: 'Identity verification failed',
      blockedDate: '2024-03-14',
      blockedBy: 'System Admin'
    },
    // Add more sample data here
  ];

  filteredAccounts: DuplicateAccount[] = [];
  searchTerm: string = '';
  matchFilter: string = 'all';
  dateFilter: string = 'all';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  showModal: boolean = false;
  selectedAccount: DuplicateAccount | null = null;

  constructor() {
    this.filteredAccounts = [...this.accounts];
  }

  getHighMatchCount(): number {
    return this.accounts.filter(acc => acc.matchPercentage >= 90).length;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAccounts.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  filterAccounts(): void {
    this.filteredAccounts = this.accounts.filter(account => {
      const matchesSearch = account.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          account.cin.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesPercentage = this.matchFilter === 'all' ? true :
        account.matchPercentage >= parseInt(this.matchFilter);

      const matchesDate = this.dateFilter === 'all' ? true :
        this.isWithinDateRange(account.blockedDate, this.dateFilter);

      return matchesSearch && matchesPercentage && matchesDate;
    });
    this.currentPage = 1;
  }

  isWithinDateRange(date: string, filter: string): boolean {
    const blockedDate = new Date(date);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        return blockedDate.toDateString() === today.toDateString();
      case 'week':
        const weekAgo = new Date(today.setDate(today.getDate() - 7));
        return blockedDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
        return blockedDate >= monthAgo;
      default:
        return true;
    }
  }

  openDetails(account: DuplicateAccount): void {
    this.selectedAccount = account;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedAccount = null;
  }

  exportToExcel(): void {
    // Implement Excel export functionality
    console.log('Exporting to Excel...');
  }
}
