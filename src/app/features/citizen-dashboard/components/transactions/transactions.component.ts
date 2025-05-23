import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';

interface Transaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

@Component({
  selector: 'app-transactions',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent {
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
}
