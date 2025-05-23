# Plan de mise à jour du modèle utilisateur et des endpoints

Ce document détaille les modifications nécessaires au modèle utilisateur et aux endpoints pour implémenter toutes les fonctionnalités des sprints, en particulier le composant "Consulter liste des citoyens".

## 1. Modèle utilisateur final

### Modèle User actuel et modifications nécessaires

Le modèle User doit être étendu pour prendre en charge toutes les fonctionnalités des sprints, notamment la gestion des rendez-vous (sprint 2) et la gestion des CPF (sprint 3).

```javascript
// Modèle User final (back/models/user.model.js)
const userSchema = new mongoose.Schema({
  // Champs d'authentification
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Informations personnelles
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Adresse
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Brazil'
    }
  },
  
  // Contact
  phone: String,
  
  // Rôles et statut
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'blocked'],
    default: 'active'
  },
  
  // Vérification du compte
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Réinitialisation du mot de passe
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Données biométriques (références)
  biometricData: {
    face: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiometricData'
    },
    fingerprints: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiometricData'
    },
    iris: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BiometricData'
    }
  },
  
  // Informations CPF
  cpf: {
    number: {
      type: String,
      sparse: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['pending', 'generated', 'blocked'],
      default: 'pending'
    },
    issueDate: Date,
    expiryDate: Date
  },
  
  // Statut de déduplication
  deduplicationStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'verified', 'duplicate_found'],
    default: 'not_started'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
```

## 2. Endpoints nécessaires pour la gestion des utilisateurs

### 2.1 Endpoints pour l'authentification et la gestion du profil

Ces endpoints existent probablement déjà mais sont inclus pour référence:

```
POST /api/auth/signup - Inscription d'un nouvel utilisateur
POST /api/auth/signin - Connexion d'un utilisateur
POST /api/auth/refreshtoken - Rafraîchir le token d'authentification
GET /api/profile - Récupérer le profil de l'utilisateur connecté
PUT /api/profile - Mettre à jour le profil de l'utilisateur connecté
```

### 2.2 Endpoints pour la gestion des utilisateurs (pour les officiers et managers)

Ces endpoints sont nécessaires pour le composant "Consulter liste des citoyens":

```
GET /api/users - Récupérer la liste des utilisateurs (avec filtres)
GET /api/users/:id - Récupérer les détails d'un utilisateur spécifique
PUT /api/users/:id/status - Mettre à jour le statut d'un utilisateur (actif, suspendu, bloqué)
GET /api/users/cpf-status/:status - Filtrer les utilisateurs par statut CPF
GET /api/users/deduplication-status/:status - Filtrer les utilisateurs par statut de déduplication
```

## 3. Contrôleurs à implémenter ou modifier

### 3.1 UserController (back/controllers/user.controller.js)

```javascript
// Récupérer tous les utilisateurs avec filtres
exports.getUsers = async (req, res) => {
  try {
    const { 
      status, 
      cpfStatus, 
      deduplicationStatus, 
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    // Construire la requête avec les filtres
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (cpfStatus) {
      query['cpf.status'] = cpfStatus;
    }
    
    if (deduplicationStatus) {
      query.deduplicationStatus = deduplicationStatus;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'cpf.number': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculer le nombre total pour la pagination
    const total = await User.countDocuments(query);
    
    // Récupérer les utilisateurs avec pagination
    const users = await User.find(query)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un utilisateur spécifique
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour le statut d'un utilisateur
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).select('-password -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User status updated successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

## 4. Routes à implémenter ou modifier

### 4.1 User Routes (back/routes/user.routes.js)

```javascript
module.exports = function(app) {
  const { authJwt } = require("../middlewares");
  const controller = require("../controllers/user.controller");

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Routes pour la gestion des utilisateurs (officiers et managers)
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isOfficerOrManager],
    controller.getUsers
  );

  app.get(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isOfficerOrManager],
    controller.getUserById
  );

  app.put(
    "/api/users/:id/status",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateUserStatus
  );
};
```

## 5. Service Angular pour la gestion des utilisateurs

### 5.1 UserService (Front/app/core/services/user.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  status: 'active' | 'suspended' | 'blocked';
  isEmailVerified: boolean;
  biometricData: {
    face: string;
    fingerprints: string;
    iris: string;
  };
  cpf: {
    number: string;
    status: 'pending' | 'generated' | 'blocked';
    issueDate: Date;
    expiryDate: Date;
  };
  deduplicationStatus: 'not_started' | 'in_progress' | 'verified' | 'duplicate_found';
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Récupérer la liste des utilisateurs avec filtres
  getUsers(
    page: number = 1,
    limit: number = 10,
    status?: string,
    cpfStatus?: string,
    deduplicationStatus?: string,
    search?: string
  ): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (cpfStatus) {
      params = params.set('cpfStatus', cpfStatus);
    }

    if (deduplicationStatus) {
      params = params.set('deduplicationStatus', deduplicationStatus);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<UsersResponse>('/api/users', { params });
  }

  // Récupérer un utilisateur spécifique
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  // Mettre à jour le statut d'un utilisateur
  updateUserStatus(id: string, status: 'active' | 'suspended' | 'blocked'): Observable<any> {
    return this.http.put(`/api/users/${id}/status`, { status });
  }
}
```

## 6. Composant "Consulter liste des citoyens"

### 6.1 CitizenListComponent (Front/app/features/officer-dashboard/components/citizen-list/citizen-list.component.ts)

```typescript
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
    MatSortModule
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
```

### 6.2 CitizenListComponent Template (Front/app/features/officer-dashboard/components/citizen-list/citizen-list.component.html)

```html
<div class="citizen-list-container">
  <div class="header">
    <h1>Citizens List</h1>
    <div class="search-filters">
      <div class="search-box">
        <mat-form-field appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="searchQuery" placeholder="Search by name, email, CPF...">
          <button mat-icon-button matSuffix (click)="applyFilters()">
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>
      </div>
      
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="suspended">Suspended</mat-option>
            <mat-option value="blocked">Blocked</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>CPF Status</mat-label>
          <mat-select [(ngModel)]="cpfStatusFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="generated">Generated</mat-option>
            <mat-option value="blocked">Blocked</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Deduplication Status</mat-label>
          <mat-select [(ngModel)]="deduplicationStatusFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option value="not_started">Not Started</mat-option>
            <mat-option value="in_progress">In Progress</mat-option>
            <mat-option value="verified">Verified</mat-option>
            <mat-option value="duplicate_found">Duplicate Found</mat-option>
          </mat-select>
        </mat-form-field>
        
        <button mat-button color="primary" (click)="clearFilters()">
          Clear Filters
        </button>
      </div>
    </div>
  </div>
  
  <div class="loading-container" *ngIf="loading">
    <mat-spinner diameter="40"></mat-spinner>
    <p>Loading citizens...</p>
  </div>
  
  <div class="table-container" *ngIf="!loading">
    <table mat-table [dataSource]="citizens" matSort class="citizens-table">
      <!-- Name Column -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let citizen">
          {{ citizen.firstName }} {{ citizen.lastName }}
        </td>
      </ng-container>
      
      <!-- CPF Number Column -->
      <ng-container matColumnDef="cpfNumber">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>CPF Number</th>
        <td mat-cell *matCellDef="let citizen">
          {{ citizen.cpf?.number || 'Not Generated' }}
        </td>
      </ng-container>
      
      <!-- CPF Status Column -->
      <ng-container matColumnDef="cpfStatus">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>CPF Status</th>
        <td mat-cell *matCellDef="let citizen">
          <span class="status-badge" [ngClass]="citizen.cpf?.status || 'pending'">
            {{ citizen.cpf?.status || 'Pending' | titlecase }}
          </span>
        </td>
      </ng-container>
      
      <!-- Deduplication Status Column -->
      <ng-container matColumnDef="deduplicationStatus">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Deduplication</th>
        <td mat-cell *matCellDef="let citizen">
          <span class="status-badge" [ngClass]="citizen.deduplicationStatus">
            {{ citizen.deduplicationStatus | titlecase }}
          </span>
        </td>
      </ng-container>
      
      <!-- Status Column -->
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
        <td mat-cell *matCellDef="let citizen">
          <span class="status-badge" [ngClass]="citizen.status">
            {{ citizen.status | titlecase }}
          </span>
        </td>
      </ng-container>
      
      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let citizen">
          <button mat-icon-button color="primary" (click)="viewCitizenDetails(citizen._id)" matTooltip="View Details">
            <mat-icon>visibility</mat-icon>
          </button>
          
          <button mat-icon-button [matMenuTriggerFor]="statusMenu" matTooltip="Change Status">
            <mat-icon>more_vert</mat-icon>
          </button>
          
          <mat-menu #statusMenu="matMenu">
            <button mat-menu-item (click)="updateCitizenStatus(citizen._id, 'active')" [disabled]="citizen.status === 'active'">
              <mat-icon>check_circle</mat-icon>
              <span>Set Active</span>
            </button>
            <button mat-menu-item (click)="updateCitizenStatus(citizen._id, 'suspended')" [disabled]="citizen.status === 'suspended'">
              <mat-icon>pause_circle</mat-icon>
              <span>Set Suspended</span>
            </button>
            <button mat-menu-item (click)="updateCitizenStatus(citizen._id, 'blocked')" [disabled]="citizen.status === 'blocked'">
              <mat-icon>block</mat-icon>
              <span>Set Blocked</span>
            </button>
          </mat-menu>
        </td>
      </ng-container>
      
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
    
    <mat-paginator
      [length]="totalItems"
      [pageSize]="pageSize"
      [pageSizeOptions]="[5, 10, 25, 50]"
      [pageIndex]="pageIndex"
      (page)="onPageChange($event)"
      showFirstLastButtons
    ></mat-paginator>
  </div>
</div>
```

## 7. Plan d'implémentation

1. **Mettre à jour le modèle User**
   - Ajouter les champs manquants au modèle User existant
   - Ajouter les validations nécessaires

2. **Implémenter les contrôleurs backend**
   - Créer ou mettre à jour UserController avec les méthodes nécessaires
   - Tester les endpoints avec Postman ou Swagger

3. **Configurer les routes backend**
   - Ajouter les nouvelles routes dans user.routes.js
   - Configurer les middlewares d'authentification et d'autorisation

4. **Mettre à jour le service Angular**
   - Étendre UserService avec les nouvelles méthodes
   - Définir les interfaces TypeScript pour les modèles

5. **Créer le composant CitizenList**
   - Implémenter le composant avec filtrage et pagination
   - Créer le template HTML avec Material Design
   - Ajouter les styles SCSS nécessaires

6. **Intégrer le composant dans le dashboard de l'officier**
   - Ajouter le composant aux routes de l'officier
   - Mettre à jour le menu de navigation

7. **Tester l'ensemble du flux**
   - Vérifier que les filtres fonctionnent correctement
   - Vérifier que la pagination fonctionne
   - Tester les actions sur les utilisateurs
