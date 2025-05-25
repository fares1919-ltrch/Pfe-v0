import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../core/services/notification.service';

export interface FraudReport {
  id: string;
  transactionId: string;
  amount: number;
  merchant: string;
  user: {
    name: string;
    id: string;
    accountStatus: 'active' | 'suspended' | 'blocked';
  };
  location: string;
  timestamp: Date;
  reportDetails: {
    reason: string;
    description: string;
    reportedDate: Date;
  };
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
}

@Component({
  selector: 'app-fraud-complaints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fraud-complaints.component.html',
  styleUrls: ['./fraud-complaints.component.scss']
})
export class FraudComplaintsComponent implements OnInit {
  fraudReports: FraudReport[] = [];
  filteredReports: FraudReport[] = [];
  isLoading: boolean = false;
  processingReports: Set<string> = new Set(); // Track which reports are being processed
  affectedReports: Set<string> = new Set(); // Track which reports are being affected by other actions

  // Filter states
  statusFilter: 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed' = 'all';
  riskFilter: 'all' | 'low' | 'medium' | 'high' = 'all';
  searchTerm: string = '';

  // Filter options with proper typing
  statusOptions: ('all' | 'pending' | 'investigating' | 'resolved' | 'dismissed')[] =
    ['all', 'pending', 'investigating', 'resolved', 'dismissed'];
  riskOptions: ('all' | 'low' | 'medium' | 'high')[] =
    ['all', 'low', 'medium', 'high'];

  // Statistics
  totalReports: number = 0;
  pendingReports: number = 0;
  highRiskReports: number = 0;
  resolvedReports: number = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadFraudReports();
  }

  loadFraudReports(): void {
    this.isLoading = true;

    // Mock data - replace with actual API call
    setTimeout(() => {
      this.fraudReports = [
        {
          id: 'FR001',
          transactionId: 'TXN001',
          amount: 1500.00,
          merchant: 'Amazon',
          user: {
            name: 'Jean Dupont',
            id: 'USR001',
            accountStatus: 'active'
          },
          location: 'Paris, France',
          timestamp: new Date('2024-01-15T14:30:00'),
          reportDetails: {
            reason: 'wrong_amount',
            description: 'Transaction amount is incorrect, I was charged more than expected',
            reportedDate: new Date('2025-05-24')
          },
          riskLevel: 'high',
          status: 'pending'
        },
        {
          id: 'FR002',
          transactionId: 'TXN002',
          amount: 250.75,
          merchant: 'PayPal',
          user: {
            name: 'Marie Claire',
            id: 'USR002',
            accountStatus: 'blocked'
          },
          location: 'Lyon, France',
          timestamp: new Date('2024-01-14T09:15:00'),
          reportDetails: {
            reason: 'unauthorized_transaction',
            description: 'I did not authorize this transaction',
            reportedDate: new Date('2025-05-23')
          },
          riskLevel: 'medium',
          status: 'investigating'
        },
        {
          id: 'FR003',
          transactionId: 'TXN003',
          amount: 89.99,
          merchant: 'Netflix',
          user: {
            name: 'Pierre Martin',
            id: 'USR003',
            accountStatus: 'active'
          },
          location: 'Marseille, France',
          timestamp: new Date('2024-01-13T20:45:00'),
          reportDetails: {
            reason: 'duplicate_charge',
            description: 'I was charged twice for the same service',
            reportedDate: new Date('2025-05-22')
          },
          riskLevel: 'low',
          status: 'resolved'
        },
        {
          id: 'FR004',
          transactionId: 'TXN004',
          amount: 750.50,
          merchant: 'Apple Store',
          user: {
            name: 'Sophie Bernard',
            id: 'USR004',
            accountStatus: 'blocked'
          },
          location: 'Nice, France',
          timestamp: new Date('2024-01-12T16:20:00'),
          reportDetails: {
            reason: 'identity_theft',
            description: 'Someone used my card without permission',
            reportedDate: new Date('2025-05-21')
          },
          riskLevel: 'high',
          status: 'pending'
        },
        {
          id: 'FR005',
          transactionId: 'TXN005',
          amount: 125.00,
          merchant: 'Spotify',
          user: {
            name: 'Lucas Moreau',
            id: 'USR005',
            accountStatus: 'active'
          },
          location: 'Toulouse, France',
          timestamp: new Date('2024-01-11T11:45:00'),
          reportDetails: {
            reason: 'subscription_error',
            description: 'Charged for premium but still have basic account',
            reportedDate: new Date('2025-05-20')
          },
          riskLevel: 'low',
          status: 'investigating'
        },
        {
          id: 'FR006',
          transactionId: 'TXN006',
          amount: 1200.00,
          merchant: 'Amazon',
          user: {
            name: 'Emma Dubois',
            id: 'USR006',
            accountStatus: 'active'
          },
          location: 'Paris, France',
          timestamp: new Date('2024-01-10T13:30:00'),
          reportDetails: {
            reason: 'wrong_amount',
            description: 'Charged incorrect amount for my order',
            reportedDate: new Date('2025-05-19')
          },
          riskLevel: 'medium',
          status: 'pending'
        },
        {
          id: 'FR007',
          transactionId: 'TXN007',
          amount: 300.75,
          merchant: 'PayPal',
          user: {
            name: 'Jean Dupont',
            id: 'USR001',
            accountStatus: 'active'
          },
          location: 'Paris, France',
          timestamp: new Date('2024-01-09T10:15:00'),
          reportDetails: {
            reason: 'unauthorized_transaction',
            description: 'I did not make this PayPal transaction',
            reportedDate: new Date('2025-05-18')
          },
          riskLevel: 'high',
          status: 'pending'
        },
        {
          id: 'FR008',
          transactionId: 'TXN008',
          amount: 450.00,
          merchant: 'Apple Store',
          user: {
            name: 'Thomas Martin',
            id: 'USR008',
            accountStatus: 'active'
          },
          location: 'Nice, France',
          timestamp: new Date('2024-01-08T15:45:00'),
          reportDetails: {
            reason: 'identity_theft',
            description: 'Fraudulent purchase on my account',
            reportedDate: new Date('2025-05-17')
          },
          riskLevel: 'medium',
          status: 'pending'
        }
      ];

      this.filteredReports = [...this.fraudReports];
      this.calculateStatistics();
      this.isLoading = false;
    }, 1000);
  }

  calculateStatistics(): void {
    this.totalReports = this.fraudReports.length;
    this.pendingReports = this.fraudReports.filter(r => r.status === 'pending').length;
    this.highRiskReports = this.fraudReports.filter(r => r.riskLevel === 'high').length;
    this.resolvedReports = this.fraudReports.filter(r => r.status === 'resolved').length;
  }

  applyFilters(): void {
    this.filteredReports = this.fraudReports.filter(report => {
      const matchesStatus = this.statusFilter === 'all' || report.status === this.statusFilter;
      const matchesRisk = this.riskFilter === 'all' || report.riskLevel === this.riskFilter;
      const matchesSearch = this.searchTerm === '' ||
        report.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        report.user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        report.merchant.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesRisk && matchesSearch;
    });
  }

  onStatusFilterChange(status: 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onRiskFilterChange(risk: 'all' | 'low' | 'medium' | 'high'): void {
    this.riskFilter = risk;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  toggleAccountBlock(report: FraudReport): void {
    // Add this report to processing set
    this.processingReports.add(report.id);

    // Mark potentially affected reports
    this.markAffectedReports(report);

    // Simulate API call
    setTimeout(() => {
      if (report.user.accountStatus === 'blocked') {
        // Unblock the account
        this.unblockAccount(report);
      } else {
        // Block the account
        this.blockAccount(report);
      }

      // Remove this report from processing set and clear affected reports
      this.processingReports.delete(report.id);
      this.affectedReports.clear();
    }, 800);
  }

  private markAffectedReports(report: FraudReport): void {
    const userId = report.user.id;

    // Mark all reports from the same user as potentially affected
    this.fraudReports.forEach(r => {
      if (r.user.id === userId && r.id !== report.id) {
        this.affectedReports.add(r.id);
      }
    });

    // Mark reports with similar patterns as potentially affected
    this.fraudReports.forEach(r => {
      if (r.id !== report.id &&
          r.user.id !== userId &&
          (r.reportDetails.reason === report.reportDetails.reason ||
           r.merchant === report.merchant ||
           r.location === report.location)) {
        this.affectedReports.add(r.id);
      }
    });
  }

  private blockAccount(report: FraudReport): void {
    const userName = report.user.name;
    const userId = report.user.id;

    // Block the current account
    report.user.accountStatus = 'blocked';
    report.status = 'resolved';

    // Find all other reports from the same user and update them
    const userReports = this.fraudReports.filter(r => r.user.id === userId && r.id !== report.id);
    let affectedReports = userReports.length;

    userReports.forEach(userReport => {
      userReport.user.accountStatus = 'blocked';
      if (userReport.status === 'pending') {
        userReport.status = 'resolved';
      }
    });

    // Check for similar fraud patterns and mark high-risk reports
    const similarPatterns = this.fraudReports.filter(r =>
      r.id !== report.id &&
      r.user.id !== userId &&
      (r.reportDetails.reason === report.reportDetails.reason ||
       r.merchant === report.merchant ||
       r.location === report.location) &&
      r.user.accountStatus === 'active'
    );

    similarPatterns.forEach(similarReport => {
      if (similarReport.riskLevel !== 'high') {
        similarReport.riskLevel = 'high';
        affectedReports++;
      }
      if (similarReport.status === 'pending') {
        similarReport.status = 'investigating';
      }
    });

    // Auto-block accounts with multiple high-risk reports
    const usersWithMultipleReports = this.getUsersWithMultipleHighRiskReports();
    usersWithMultipleReports.forEach(user => {
      const userReportsToBlock = this.fraudReports.filter(r =>
        r.user.id === user.userId &&
        r.user.accountStatus === 'active'
      );

      userReportsToBlock.forEach(reportToBlock => {
        reportToBlock.user.accountStatus = 'blocked';
        reportToBlock.status = 'resolved';
        affectedReports++;
      });
    });

    this.calculateStatistics();
    this.applyFilters(); // Refresh filtered results

    // Show comprehensive notification
    if (affectedReports > 0) {
      this.notificationService.showSuccess(
        `Account for ${userName} blocked successfully.`
      );
    } else {
      this.notificationService.showSuccess(
        `Account for ${userName} has been blocked successfully.`
      );
    }
  }

  private unblockAccount(report: FraudReport): void {
    const userName = report.user.name;
    const userId = report.user.id;

    // Unblock the current account
    report.user.accountStatus = 'active';

    // Find all other reports from the same user and update them
    const userReports = this.fraudReports.filter(r => r.user.id === userId && r.id !== report.id);
    let affectedReports = userReports.length;

    userReports.forEach(userReport => {
      userReport.user.accountStatus = 'active';
      if (userReport.status === 'resolved') {
        userReport.status = 'investigating';
      }
    });

    // Reduce risk level for similar patterns if this was a false positive
    const similarPatterns = this.fraudReports.filter(r =>
      r.id !== report.id &&
      r.user.id !== userId &&
      (r.reportDetails.reason === report.reportDetails.reason ||
       r.merchant === report.merchant) &&
      r.riskLevel === 'high' &&
      r.user.accountStatus === 'active'
    );

    // Reduce risk level for similar patterns (assuming this unblock indicates false positive)
    similarPatterns.slice(0, 2).forEach(similarReport => { // Only affect first 2 similar reports
      if (similarReport.riskLevel === 'high') {
        similarReport.riskLevel = 'medium';
        affectedReports++;
      }
    });

    this.calculateStatistics();
    this.applyFilters(); // Refresh filtered results

    // Show comprehensive notification
    if (affectedReports > 0) {
      this.notificationService.showSuccess(
        `Account for ${userName} unblocked successfully.`
      );
    } else {
      this.notificationService.showSuccess(
        `Account for ${userName} has been unblocked successfully.`
      );
    }
  }

  private getUsersWithMultipleHighRiskReports(): Array<{userId: string, count: number}> {
    const userRiskCounts = new Map<string, number>();

    this.fraudReports.forEach(report => {
      if (report.riskLevel === 'high' && report.user.accountStatus === 'active') {
        const currentCount = userRiskCounts.get(report.user.id) || 0;
        userRiskCounts.set(report.user.id, currentCount + 1);
      }
    });

    return Array.from(userRiskCounts.entries())
      .filter(([userId, count]) => count >= 2)
      .map(([userId, count]) => ({ userId, count }));
  }

  getRiskLevelClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'investigating': return 'status-investigating';
      case 'resolved': return 'status-resolved';
      case 'dismissed': return 'status-dismissed';
      default: return '';
    }
  }

  getAccountStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'account-active';
      case 'suspended': return 'account-suspended';
      case 'blocked': return 'account-blocked';
      default: return '';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.riskFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  getBlockButtonText(report: FraudReport): string {
    return report.user.accountStatus === 'blocked' ? 'Unblock Account' : 'Block Account';
  }

  getBlockButtonIcon(report: FraudReport): string {
    return report.user.accountStatus === 'blocked' ? 'lock_open' : 'block';
  }

  isBlockButtonDisabled(report: FraudReport): boolean {
    return (report.status === 'resolved' && report.user.accountStatus === 'active') ||
           this.isReportProcessing(report.id);
  }

  isReportProcessing(reportId: string): boolean {
    return this.processingReports.has(reportId);
  }

  isReportBeingAffected(reportId: string): boolean {
    return this.affectedReports.has(reportId);
  }
}
