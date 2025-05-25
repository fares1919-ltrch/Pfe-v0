import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../core/services/notification.service';

interface Transaction {
  id: string;
  transactionId: string;
  merchant: string;
  amount: number;
  date: Date;
  location: string;
  cardNumber: string;
  status: 'completed' | 'pending' | 'failed' | 'reported';
  type: 'purchase' | 'refund' | 'transfer';
  category: string;
  isReported?: boolean;
}

interface FraudReport {
  transactionId: string;
  fraudType: string;
  description: string;
  reportDate: Date;
  status: 'submitted' | 'investigating' | 'resolved';
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  fraudReports: FraudReport[] = [];
  isLoading: boolean = false;

  // Modal state
  showFraudModal: boolean = false;
  selectedTransaction: Transaction | null = null;

  // Form data
  fraudType: string = '';
  fraudDescription: string = '';

  // Processing states
  processingReports: Set<string> = new Set();

  fraudTypeOptions = [
    { value: 'identity_theft', label: 'Identity Theft' },
    { value: 'unauthorized_transaction', label: 'Unauthorized Transaction' },
    { value: 'wrong_amount', label: 'Wrong Amount Charged' },
    { value: 'duplicate_charge', label: 'Duplicate Charge' },
    { value: 'subscription_error', label: 'Subscription Error' },
    { value: 'merchant_fraud', label: 'Merchant Fraud' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.transactions = [
        {
          id: 'TXN001',
          transactionId: 'TXN001',
          merchant: 'Amazon',
          amount: 1500.00,
          date: new Date('2024-01-15T14:30:00'),
          location: 'Paris, France',
          cardNumber: '****4532',
          status: 'completed',
          type: 'purchase',
          category: 'Shopping'
        },
        {
          id: 'TXN002',
          transactionId: 'TXN002',
          merchant: 'Carrefour',
          amount: 250.00,
          date: new Date('2024-01-14T18:45:00'),
          location: 'Lyon, France',
          cardNumber: '****4532',
          status: 'completed',
          type: 'purchase',
          category: 'Groceries'
        },
        {
          id: 'TXN003',
          transactionId: 'TXN003',
          merchant: 'Netflix',
          amount: 15.99,
          date: new Date('2024-01-13T09:00:00'),
          location: 'Online',
          cardNumber: '****4532',
          status: 'completed',
          type: 'purchase',
          category: 'Entertainment'
        },
        {
          id: 'TXN004',
          transactionId: 'TXN004',
          merchant: 'Shell',
          amount: 85.50,
          date: new Date('2024-01-12T16:20:00'),
          location: 'Nice, France',
          cardNumber: '****4532',
          status: 'completed',
          type: 'purchase',
          category: 'Fuel'
        },
        {
          id: 'TXN005',
          transactionId: 'TXN005',
          merchant: 'PayPal',
          amount: 299.99,
          date: new Date('2024-01-11T11:30:00'),
          location: 'Online',
          cardNumber: '****4532',
          status: 'completed',
          type: 'purchase',
          category: 'Online Payment'
        }
      ];

      this.filteredTransactions = [...this.transactions];
      this.isLoading = false;
    }, 800);
  }

  openFraudModal(transaction: Transaction): void {
    if (transaction.isReported) {
      this.notificationService.showWarning('This transaction has already been reported as fraudulent.');
      return;
    }

    this.selectedTransaction = transaction;
    this.showFraudModal = true;
    this.fraudType = '';
    this.fraudDescription = '';
  }

  closeFraudModal(): void {
    this.showFraudModal = false;
    this.selectedTransaction = null;
    this.fraudType = '';
    this.fraudDescription = '';
  }

  submitFraudReport(): void {
    if (!this.selectedTransaction || !this.fraudType || !this.fraudDescription.trim()) {
      this.notificationService.showError('Please fill in all required fields.');
      return;
    }

    const transactionId = this.selectedTransaction.transactionId;
    this.processingReports.add(transactionId);

    // Simulate API call
    setTimeout(() => {
      // Create fraud report
      const fraudReport: FraudReport = {
        transactionId: transactionId,
        fraudType: this.fraudType,
        description: this.fraudDescription.trim(),
        reportDate: new Date(),
        status: 'submitted'
      };

      this.fraudReports.push(fraudReport);

      // Update transaction status
      const transaction = this.transactions.find(t => t.transactionId === transactionId);
      if (transaction) {
        transaction.status = 'reported';
        transaction.isReported = true;
      }

      // Update filtered transactions
      this.filteredTransactions = [...this.transactions];

      this.processingReports.delete(transactionId);
      this.closeFraudModal();

      this.notificationService.showSuccess(
        `Fraud report submitted successfully for transaction ${transactionId}. Our security team will investigate this matter.`
      );
    }, 1000);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'reported': return 'status-reported';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'pending': return 'schedule';
      case 'failed': return 'error';
      case 'reported': return 'report_problem';
      default: return 'help';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'shopping': return 'shopping_cart';
      case 'groceries': return 'local_grocery_store';
      case 'entertainment': return 'movie';
      case 'fuel': return 'local_gas_station';
      case 'online payment': return 'payment';
      default: return 'credit_card';
    }
  }

  isTransactionProcessing(transactionId: string): boolean {
    return this.processingReports.has(transactionId);
  }

  getFraudTypeLabel(value: string): string {
    const option = this.fraudTypeOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }
}
