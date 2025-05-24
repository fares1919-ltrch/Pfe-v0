import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FraudCase {
  id: string;
  username: string;
  userAccount: string;
  status: 'pending' | 'completed';
  comment: string;
  submittedDate: string;
  lastUpdated: string;
  accountStatus: 'blocked' | 'unblocked';
  actionTaken?: string;
  actionDate?: string;
}

@Component({
  selector: 'app-fraud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fraud-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="mb-2">Fraud Management</h1>
            <p class="text-muted mb-0">Handle fraud cases and suspicious activities</p>
          </div>
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-value">{{ getFraudCasesByStatus('pending').length }}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ getFraudCasesByStatus('completed').length }}</div>
              <div class="stat-label">Completed</div>
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
                placeholder="Search by username..."
                [(ngModel)]="searchTerm"
                (input)="filterComplaints()"
              >
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="statusFilter" (change)="filterComplaints()">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="accountStatusFilter" (change)="filterComplaints()">
              <option value="all">All Accounts</option>
              <option value="blocked">Blocked</option>
              <option value="unblocked">Unblocked</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" (click)="refreshComplaints()">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Fraud Cases List -->
      <div class="fraud-list">
        <table class="table">
          <thead>
            <tr>
              <th>Account Status</th>
              <th>Username</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let fraudCase of filteredFraudCases">
              <td>
                <span class="account-status-badge" [class]="fraudCase.accountStatus">
                  {{ fraudCase.accountStatus }}
                </span>
              </td>
              <td>{{ fraudCase.username }}</td>
              <td>
                <span class="status-badge" [class]="fraudCase.status">
                  {{ fraudCase.status }}
                </span>
              </td>
              <td>{{ fraudCase.submittedDate }}</td>
              <td>{{ fraudCase.lastUpdated }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-outline-primary" (click)="viewFraudCase(fraudCase)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    *ngIf="fraudCase.status === 'pending'"
                    (click)="blockAccount(fraudCase)"
                  >
                    <i class="fas fa-ban"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fraud Case Details Modal -->
      <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Fraud Case Details</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body" *ngIf="selectedFraudCase">
              <div class="fraud-header">
                <div class="row">
                  <div class="col-md-6">
                    <div class="info-group">
                      <label>Username</label>
                      <p>{{ selectedFraudCase.username }}</p>
                    </div>
                    <div class="info-group">
                      <label>User Account</label>
                      <p>{{ selectedFraudCase.userAccount }}</p>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-group">
                      <label>Status</label>
                      <p>
                        <span class="status-badge" [class]="selectedFraudCase.status">
                          {{ selectedFraudCase.status }}
                        </span>
                      </p>
                    </div>
                    <div class="info-group">
                      <label>Account Status</label>
                      <p>
                        <span class="account-status-badge" [class]="selectedFraudCase.accountStatus">
                          {{ selectedFraudCase.accountStatus }}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="fraud-content">
                <div class="info-group">
                  <label>Comment</label>
                  <div class="comment-box">
                    {{ selectedFraudCase.comment }}
                  </div>
                </div>
              </div>

              <div class="fraud-timeline">
                <h6>Timeline</h6>
                <div class="timeline">
                  <div class="timeline-item">
                    <div class="timeline-date">{{ selectedFraudCase.submittedDate }}</div>
                    <div class="timeline-content">
                      <strong>Fraud Case Submitted</strong>
                      <p>Initial fraud case received</p>
                    </div>
                  </div>
                  <div class="timeline-item" *ngIf="selectedFraudCase.actionTaken">
                    <div class="timeline-date">{{ selectedFraudCase.actionDate }}</div>
                    <div class="timeline-content">
                      <strong>Action Taken</strong>
                      <p>{{ selectedFraudCase.actionTaken }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="fraud-actions" *ngIf="selectedFraudCase.status === 'pending'">
                <button
                  class="btn btn-danger w-100"
                  (click)="blockAccount(selectedFraudCase)"
                >
                  <i class="fas fa-ban me-2"></i>Block Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'"></div>
    </div>
  `,
  styles: [`
    .fraud-container {
      padding: 2rem;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .header-section {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
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

    .complaints-list {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
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

    .account-status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .account-status-badge.blocked {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .account-status-badge.unblocked {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-badge.pending {
      background-color: #fef3c7;
      color: #d97706;
    }

    .status-badge.completed {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
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

    .complaint-header {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
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

    .comment-box {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
      white-space: pre-wrap;
    }

    .timeline {
      margin-top: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-left: 2px solid #dee2e6;
      margin-left: 1rem;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -0.5rem;
      top: 1.5rem;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: #3498db;
    }

    .timeline-date {
      min-width: 150px;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-content strong {
      display: block;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .timeline-content p {
      margin: 0;
      color: #6c757d;
    }

    .complaint-actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #dee2e6;
    }
  `]
})
export class FraudComponent implements OnInit {
  Math = Math;
  fraudCases: FraudCase[] = [
    {
      id: '1',
      username: 'john.doe',
      userAccount: 'john.doe@example.com',
      status: 'pending',
      comment: 'My account was blocked without any reason. I need access to my account for important transactions.',
      submittedDate: '2024-03-15 14:30',
      lastUpdated: '2024-03-15 14:30',
      accountStatus: 'blocked'
    },
    {
      id: '2',
      username: 'jane.smith',
      userAccount: 'jane.smith@example.com',
      status: 'pending',
      comment: 'I want to block my account temporarily as I will be traveling abroad.',
      submittedDate: '2024-03-14 09:15',
      lastUpdated: '2024-03-14 10:30',
      accountStatus: 'unblocked'
    },
    {
      id: '3',
      username: 'mike.wilson',
      userAccount: 'mike.wilson@example.com',
      status: 'completed',
      comment: 'My account was blocked due to suspicious activity. I can provide additional verification.',
      submittedDate: '2024-03-13 16:45',
      lastUpdated: '2024-03-14 11:20',
      accountStatus: 'blocked',
      actionTaken: 'Account blocked after verification',
      actionDate: '2024-03-14 11:20'
    }
  ];

  filteredComplaints: Complaint[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  accountStatusFilter: string = 'all';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  showModal: boolean = false;
  selectedComplaint: Complaint | null = null;

  ngOnInit() {
    this.filterComplaints();
  }

  getComplaintsByStatus(status: string): Complaint[] {
    return this.complaints.filter(complaint => complaint.status === status);
  }

  filterComplaints(): void {
    this.filteredComplaints = this.complaints.filter(complaint => {
      const matchesSearch = complaint.username.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' ? true : complaint.status === this.statusFilter;
      const matchesAccountStatus = this.accountStatusFilter === 'all' ? true : complaint.accountStatus === this.accountStatusFilter;

      return matchesSearch && matchesStatus && matchesAccountStatus;
    });
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredComplaints.length / this.itemsPerPage);
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

  viewComplaint(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedComplaint = null;
  }

  blockAccount(complaint: Complaint): void {
    // In a real application, this would make an API call to block the account
    const index = this.complaints.findIndex(c => c.id === complaint.id);
    if (index !== -1) {
      this.complaints[index] = {
        ...complaint,
        status: 'completed',
        accountStatus: 'blocked',
        actionTaken: 'Account blocked successfully',
        actionDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      this.filterComplaints();
    }
    this.closeModal();
  }

  refreshComplaints(): void {
    // In a real application, this would fetch fresh data from the API
    this.filterComplaints();
  }
}
