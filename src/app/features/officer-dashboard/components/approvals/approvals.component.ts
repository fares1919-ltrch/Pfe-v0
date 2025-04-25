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
import { ApprovalsService } from '../../../../core/services/approvals.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemePalette } from '@angular/material/core';
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface UserData {
  requestId: string;
  username: string;
  centername: string;
  centerId: string;
  status: string;
  createdAt: Date;
  address: string;
  meetingDate: Date | null;
}

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  tooltip?: string;
  isAvailable?: boolean;
  isSunday?: boolean;
  availableSlots?: number;
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
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['username', 'centername', 'address', 'status', 'createdAt', 'meetingDate', 'actions'];
  dataSource = new MatTableDataSource<UserData>([]);
  rawRequests: any[] = [];
  isLoading = true;
  error: string | null = null;
  colorTheme: ThemePalette = 'warn';
  availableDays: string[] = [];
  availableSlots: {[key: string]: number} = {};

  showCalendar: boolean = false;
  currentDate: Date = new Date();
  currentYear: number = this.currentDate.getFullYear();
  currentMonth: number = this.currentDate.getMonth();
  currentMonthName: string = '';
  selectedDate: Date | null = null;
  calendarDays: CalendarDay[] = [];
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  currentElement: UserData | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  Math = Math; // For the template to access Math functions

  constructor(
    private approvalsService: ApprovalsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.paginator) {
      this.paginator.length = this.dataSource.data.length;
    }
  }

  getAvailableDays(centerId: string): void {
    if (!centerId || centerId === 'N/A' || centerId.trim() === '') {
      console.error('Invalid center ID provided:', centerId);
      this.availableDays = [];
      this.availableSlots = {};
      this.snackBar.open('Invalid center ID. Please contact support.', 'Close', { duration: 3000 });
      return;
    }

    console.log(`Fetching available days for center ID: ${centerId}`);
    this.approvalsService.getAvailableDays(centerId).subscribe({
      next: (response) => {
        console.log('Available days fetched:', response);
        this.availableDays = response.map(item => item.date);
        this.availableSlots = response.reduce((map, item) => {
          map[item.date] = item.availableSlots;
          return map;
        }, {} as { [key: string]: number });

        console.log('Available days:', this.availableDays);
        console.log('Available slots data:', this.availableSlots);
        if (this.showCalendar) {
          this.generateCalendarDays();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching available days:', err);
        this.availableDays = [];
        this.availableSlots = {};
        this.snackBar.open('Failed to fetch available days.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  openCalendar(element: UserData): void {
    console.log('Opening calendar for element:', element);
    this.currentElement = element;
    this.selectedDate = element.meetingDate ? new Date(element.meetingDate) : null;

    if (!element.centerId || element.centerId === 'N/A') {
      console.warn('No valid center ID for request:', element.requestId);
      this.snackBar.open('No center assigned to this request.', 'Close', { duration: 3000 });
      return;
    }

    if (this.selectedDate) {
      this.currentMonth = this.selectedDate.getMonth();
      this.currentYear = this.selectedDate.getFullYear();
    } else {
      this.currentMonth = this.currentDate.getMonth();
      this.currentYear = this.currentDate.getFullYear();
    }

    this.getAvailableDays(element.centerId);
    this.generateCalendarDays();
    this.showCalendar = true;
    this.cdr.detectChanges();
  }

  closeCalendar(event: MouseEvent): void {
    if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains('cancel')) {
      this.showCalendar = false;
      this.cdr.detectChanges();
    }
  }

  generateCalendarDays(): void {
    this.calendarDays = [];
    this.currentMonthName = new Date(this.currentYear, this.currentMonth, 1).toLocaleString('default', { month: 'long' });

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonthDay = daysInPrevMonth - i;
      const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      
      const date = new Date(prevYear, prevMonth, prevMonthDay);
      const isSunday = date.getDay() === 0;
      
      this.calendarDays.push({
        date: prevMonthDay,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        isToday: this.isToday(prevYear, prevMonth, prevMonthDay),
        isDisabled: true,
        isSunday
      });
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = this.isToday(this.currentYear, this.currentMonth, i);
      const dateStr = this.formatDateYYYYMMDD(this.currentYear, this.currentMonth, i);
      const isAvailable = this.availableDays.includes(dateStr);
      const availableSlots = this.availableSlots[dateStr] || 0;
      
      const date = new Date(this.currentYear, this.currentMonth, i);
      const isSunday = date.getDay() === 0;
      
      this.calendarDays.push({
        date: i,
        month: this.currentMonth,
        year: this.currentYear,
        isCurrentMonth: true,
        isToday: isToday,
        isDisabled: false,
        isAvailable: isAvailable,
        isSunday,
        availableSlots
      });
    }

    const totalDaysNeeded = 42;
    const remainingDays = totalDaysNeeded - this.calendarDays.length;

    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      
      const date = new Date(nextYear, nextMonth, i);
      const isSunday = date.getDay() === 0;
      
      this.calendarDays.push({
        date: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isToday: this.isToday(nextYear, nextMonth, i),
        isDisabled: true,
        isSunday
      });
    }
    this.cdr.detectChanges();
  }

  formatDateYYYYMMDD(year: number, month: number, day: number): string {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  isToday(year: number, month: number, day: number): boolean {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendarDays();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarDays();
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;

    this.selectedDate = new Date(day.year, day.month, day.date);
    this.generateCalendarDays();
  }

  getDayClass(day: CalendarDay): string {
    let classes = '';
    if (!day.isCurrentMonth) classes += 'day-disabled ';
    if (day.isToday) classes += 'day-today ';
    if (this.selectedDate &&
        day.date === this.selectedDate.getDate() &&
        day.month === this.selectedDate.getMonth() &&
        day.year === this.selectedDate.getFullYear()) {
      classes += 'day-selected ';
    }
    if (day.isAvailable) classes += 'day-available ';
    if (day.isSunday) classes += 'day-sunday ';
    
    if (day.isCurrentMonth && day.availableSlots === 0 && day.isAvailable) {
      classes += 'day-zero-slots ';
    }
    
    return classes;
  }

  getDayTooltip(day: CalendarDay): string {
    if (day.tooltip) {
      return day.tooltip;
    }
    if (day.isToday) {
      return 'Today';
    }
    if (day.isAvailable && day.availableSlots !== undefined) {
      return `Available slots: ${day.availableSlots}`;
    }
    if (day.isSunday) {
      return 'Sunday - Closed';
    }
    return '';
  }

  getTooltipClass(day: CalendarDay): string {
    if (day.isAvailable && day.availableSlots && day.availableSlots > 0) {
      return 'available-tooltip';
    }
    
    if (day.isSunday || (day.isAvailable && day.availableSlots === 0)) {
      return 'unavailable-tooltip';
    }
    
    return '';
  }

  applyDate(): void {
    if (!this.currentElement || !this.selectedDate) return;

    this.currentElement.meetingDate = this.selectedDate;
    console.log('Date applied:', {
      requestId: this.currentElement.requestId,
      meetingDate: this.formatSelectedDate()
    });

    this.showCalendar = false;
    this.cdr.detectChanges();
  }

  verifyRequest(requestId: string, meetingDate: Date | null): void {
    console.log('Verification request initiated:', {
      requestId,
      meetingDate: meetingDate ? this.formatDate(meetingDate) : null
    });

    if (!meetingDate) {
      const errorMsg = 'Please set meeting date';
      console.error('Verification failed:', errorMsg);
      this.error = errorMsg;
      this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
      return;
    }

    this.approvalsService.verifyRequest(requestId, meetingDate).subscribe({
      next: (response) => {
        console.log('Request verified successfully:', { requestId, response });
        this.loadRequests();
        this.snackBar.open('Request verified successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        const errorMsg = 'Failed to verify request';
        console.error('Verification error:', { requestId, error: err });
        this.error = errorMsg;
        this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
      }
    });
  }

  private loadRequests(): void {
    console.log('Loading pending requests...');
    this.isLoading = true;
    this.approvalsService.getPendingRequests().subscribe({
      next: (data) => {
        console.log('Raw requests from server:', data.requests);
        this.rawRequests = data.requests;
        const tableData: UserData[] = this.rawRequests.map(request => {
          const userData = {
            requestId: request.requestId,
            username: request.username || '',
            centername: request.centerName || '',
            centerId: request.centerId || '',
            status: request.status || 'Pending',
            createdAt: new Date(request.createdAt) || new Date(),
            address: request.address.street + ' ' + request.address.city + ' ' + request.address.state || '',
            meetingDate: request.meetingDate ? new Date(request.meetingDate) : null
          };
          console.log('Mapped UserData:', userData);
          return userData;
        });
        this.dataSource = new MatTableDataSource<UserData>(tableData);
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
          this.paginator.length = tableData.length;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.error = 'Failed to load requests';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  onMeetingDateChange(element: UserData, event: any): void {
    console.log('Meeting date changed:', {
      requestId: element.requestId,
      oldDate: element.meetingDate,
      newDate: event.value
    });
    element.meetingDate = event.value;
    this.cdr.detectChanges();
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    const year = this.selectedDate.getFullYear();
    const month = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = this.selectedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle page change
  onPageChange(page: number): void {
    this.currentPage = page;
    // You might need to implement server-side pagination here
    // or use the dataSource's paginator
  }

  // Update page size
  updatePageSize(): void {
    this.currentPage = 1;
    // You might need to implement server-side pagination here
    // or use the dataSource's paginator
  }

  // Refresh data
  getPendingRequests(): void {
    console.log('Refreshing pending requests...');
    this.approvalsService.getPendingRequests().subscribe({
      next: (response: any) => {
        console.log('Pending requests received:', response);
        this.dataSource.data = response;
      },
      error: (error) => {
        console.error('Error fetching pending requests:', error);
      }
    });
  }
}