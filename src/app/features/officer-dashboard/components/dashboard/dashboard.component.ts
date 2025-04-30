import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field'; // Already imported
import { MatInputModule } from '@angular/material/input'; // Add if using an input
interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend: number;
  trendDirection: 'up' | 'down';
}

interface ProgressItem {
  label: string;
  value: number;
  total: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatDatepickerModule, 
    MatNativeDateModule,
    FormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  selectedDate: Date = new Date();
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  isRescheduling: boolean = false;

  stats: StatCard[] = [
    {
      title: 'Total Citizens',
      value: 1250,
      icon: 'people',
      color: '#7FB3D5',
      trend: 12,
      trendDirection: 'up'
    },
    {
      title: 'Active Requests',
      value: 48,
      icon: 'assignment',
      color: '#82E0AA',
      trend: 8,
      trendDirection: 'up'
    },
    {
      title: 'Pending Approvals',
      value: 23,
      icon: 'pending_actions',
      color: '#F5B7B1',
      trend: 5,
      trendDirection: 'down'
    },
    {
      title: 'Completed Today',
      value: 156,
      icon: 'check_circle',
      color: '#BB8FCE',
      trend: 15,
      trendDirection: 'up'
    }
  ];

  progressItems: ProgressItem[] = [
    {
      label: 'ID Card Requests',
      value: 75,
      total: 100,
      color: '#7FB3D5'
    },
    {
      label: 'Passport Applications',
      value: 45,
      total: 100,
      color: '#82E0AA'
    },
    {
      label: 'Driving License',
      value: 30,
      total: 100,
      color: '#F5B7B1'
    },
    {
      label: 'Birth Certificates',
      value: 90,
      total: 100,
      color: '#BB8FCE'
    }
  ];

  recentActivities = [
    {
      type: 'ID Card',
      citizen: 'John Doe',
      status: 'Approved',
      time: '2 hours ago',
      color: '#82E0AA'
    },
    {
      type: 'Passport',
      citizen: 'Sarah Smith',
      status: 'Pending',
      time: '3 hours ago',
      color: '#F9E79F'
    },
    {
      type: 'Driving License',
      citizen: 'Mike Johnson',
      status: 'Rejected',
      time: '5 hours ago',
      color: '#F5B7B1'
    },
    {
      type: 'Birth Certificate',
      citizen: 'Emma Wilson',
      status: 'Approved',
      time: '6 hours ago',
      color: '#82E0AA'
    }
  ];

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
  }

  getProgressPercentage(item: ProgressItem): string {
    return `${(item.value / item.total) * 100}%`;
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.value);
    const today = new Date();
    
    // Reset time part for comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.selectedDate = today;
      this.showDateErrorSnackbar();
    }
  }

  showDateErrorSnackbar() {
    this.snackBar.open('Please select a future date', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  startRescheduling() {
    this.isRescheduling = true;
  }

  cancelRescheduling() {
    this.isRescheduling = false;
    this.selectedDate = new Date();
  }

  confirmRescheduling() {
    if (this.selectedDate < new Date()) {
      this.showDateErrorSnackbar();
      return;
    }
    
    this.snackBar.open('Appointment rescheduled successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
    
    this.isRescheduling = false;
  }
} 