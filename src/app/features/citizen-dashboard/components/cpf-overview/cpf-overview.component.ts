import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

interface CPFStatus {
  number: string;
  status: 'active' | 'blocked' | 'pending';
  lastUpdate: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Notification {
  id: string;
  date: string;
  type: 'transaction' | 'status' | 'alert';
  message: string;
  read: boolean;
}

@Component({
  selector: 'app-cpf-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './cpf-overview.component.html',
  styleUrls: ['./cpf-overview.component.css']
})
export class CPFOverviewComponent implements OnInit {
  cpfStatus: CPFStatus = {
    number: '123.456.789-00',
    status: 'active',
    lastUpdate: '2024-03-15T10:30:00Z'
  };

  recentTransactions: Transaction[] = [
    {
      id: 'TRX001',
      date: '2024-03-15T14:30:00Z',
      type: 'credit',
      amount: 1500.00,
      description: 'Salary Deposit',
      status: 'completed'
    },
    {
      id: 'TRX002',
      date: '2024-03-14T09:15:00Z',
      type: 'debit',
      amount: 250.00,
      description: 'Utility Bill Payment',
      status: 'completed'
    },
    {
      id: 'TRX003',
      date: '2024-03-13T16:45:00Z',
      type: 'credit',
      amount: 500.00,
      description: 'Transfer Received',
      status: 'completed'
    }
  ];

  notifications: Notification[] = [
    {
      id: 'NOT001',
      date: '2024-03-15T15:00:00Z',
      type: 'transaction',
      message: 'New transaction completed: Salary Deposit',
      read: false
    },
    {
      id: 'NOT002',
      date: '2024-03-14T10:00:00Z',
      type: 'status',
      message: 'CPF status updated: Active',
      read: true
    },
    {
      id: 'NOT003',
      date: '2024-03-13T11:30:00Z',
      type: 'alert',
      message: 'Suspicious activity detected',
      read: false
    }
  ];

  blockComment: string = '';
  showBlockDialog = false;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  requestBlock(): void {
    this.blockComment = '';
    this.showBlockDialog = true;
  }

  confirmBlock(): void {
    this.cpfStatus.status = 'pending';
    this.cpfStatus.lastUpdate = new Date().toISOString();
    this.showBlockDialog = false;
    
    this.snackBar.open('CPF block request submitted successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  cancelBlock(): void {
    this.blockComment = '';
    this.showBlockDialog = false;
  }

  markNotificationAsRead(notification: Notification): void {
    notification.read = true;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  downloadCPF() {
    const content = `CPF Number: ${this.cpfStatus.number}\nStatus: ${this.cpfStatus.status}\nLast Update: ${this.formatDate(this.cpfStatus.lastUpdate)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpf_${this.cpfStatus.number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
} 