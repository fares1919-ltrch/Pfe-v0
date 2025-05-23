# Plan d'implémentation du Sprint 2 : Gérer Rendez-vous

## Résumé du Sprint

Le sprint 2 "Gérer Rendez-vous" est centré sur la mise en place d'un système complet de gestion des rendez-vous pour l'obtention du CPF. Ce sprint permet aux citoyens de soumettre des demandes de rendez-vous en sélectionnant un centre et une date, de consulter leurs rendez-vous existants, et aux officiers de police de valider ou rejeter ces demandes.

**Durée totale du sprint**: 7 jours

**Objectifs principaux**:
- Permettre aux citoyens de soumettre des demandes de rendez-vous
- Permettre aux citoyens de consulter et gérer leurs rendez-vous
- Permettre aux officiers de valider ou rejeter les demandes de rendez-vous

## Backlog du Sprint

| ID | User Story | Tâche | Durée |
|----|------------|-------|-------|
| 5.1 | En tant que citoyen, je peux soumettre un rendez-vous en choisissant un centre selon le map et une date selon les créneaux disponibles dans un calendrier | 5.1.1 Créer les interfaces pour la sélection d'un centre et d'un créneau | 2j |
| | | 5.1.2 Développer les API pour la gestion des rendez-vous | 1j |
| | | 5.1.3 Tester les fonctionnalités de soumission de rendez-vous | 1j |
| 5.2 | En tant que citoyen, je peux consulter les détails de mes rendez-vous tels que la date, le statut, le centre, etc. | 5.2.1 Créer les interfaces pour la consultation et la filtration des rendez-vous | 1j |
| | | 5.2.2 Développer les API pour la consultation et la filtration des rendez-vous | 1j |
| | | 5.2.3 Tester les fonctionnalités de consultation et de filtration des rendez-vous | 1j |
| 5.3 | En tant qu'officier, je peux planifier les rendez-vous en les validant ou les rejetant | 5.3.1 Créer les interfaces pour la modification du statut d'un rendez-vous | 1j |
| | | 5.3.2 Développer les API pour modifier le statut un rendez-vous | 1j |
| | | 5.3.3 Tester les fonctionnalités de modification des rendez-vous | 1j |

## Plan de modification du code

### 1. Modèles de données à implémenter

#### 1.1 Modèle Appointment (Rendez-vous)
```javascript
const appointmentSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

#### 1.2 Modèle Center (Centre)
```javascript
const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  availableSlots: [{
    date: Date,
    slots: [String] // Heures disponibles: "09:00", "10:00", etc.
  }]
});
```

### 2. APIs Backend à développer

#### 2.1 APIs pour les citoyens
- `POST /api/appointments` - Créer un nouveau rendez-vous
- `GET /api/appointments` - Récupérer les rendez-vous du citoyen connecté
- `DELETE /api/appointments/:id` - Supprimer un rendez-vous
- `PUT /api/appointments/:id` - Modifier la date d'un rendez-vous rejeté
- `GET /api/centers` - Récupérer la liste des centres
- `GET /api/centers/:centerId/availability` - Récupérer les disponibilités d'un centre

#### 2.2 APIs pour les officiers
- `GET /api/officer/appointments` - Récupérer tous les rendez-vous (avec filtres)
- `PUT /api/officer/appointments/:id/validate` - Valider un rendez-vous
- `PUT /api/officer/appointments/:id/reject` - Rejeter un rendez-vous

### 3. Interfaces Frontend à développer

#### 3.1 Interface "Soumettre rendez-vous" (Citoyen)
**Fichiers à créer/modifier**:
- `src/app/citizen/cpf-request/cpf-request.component.ts`
- `src/app/citizen/cpf-request/cpf-request.component.html`
- `src/app/citizen/cpf-request/cpf-request.component.scss`

**Fonctionnalités**:
- Carte interactive pour sélectionner un centre
- Demande d'autorisation de géolocalisation
- Calendrier pour sélectionner une date disponible
- Soumission de la demande de rendez-vous

**Maquette simplifiée**:
```html
<div class="appointment-submission">
  <h2>CPF Request</h2>
  
  <!-- Carte pour sélectionner un centre -->
  <div class="map-container">
    <div id="map"></div>
    <button>Use My Location</button>
  </div>
  
  <!-- Sélection de la date -->
  <div class="date-selection">
    <h3>Choose Date</h3>
    <div class="calendar">
      <!-- Calendrier avec indication des disponibilités -->
    </div>
  </div>
  
  <!-- Bouton de soumission -->
  <button class="submit-button">Submit Request</button>
</div>
```

#### 3.2 Interface "Consulter rendez-vous" (Citoyen)
**Fichiers à créer/modifier**:
- `src/app/citizen/my-appointments/my-appointments.component.ts`
- `src/app/citizen/my-appointments/my-appointments.component.html`
- `src/app/citizen/my-appointments/my-appointments.component.scss`

**Fonctionnalités**:
- Affichage des rendez-vous du citoyen
- Détails de chaque rendez-vous (date, statut, centre)
- Option pour supprimer un rendez-vous
- Option pour changer la date d'un rendez-vous rejeté

**Maquette simplifiée**:
```html
<div class="appointments-view">
  <h2>My Appointment</h2>
  
  <div class="appointment-card">
    <div class="appointment-status">
      Status: Pending/Validated/Rejected
    </div>
    
    <div class="appointment-details">
      <h3>Center Name</h3>
      <p>Date: 01/01/2023</p>
      <p>Address: Center address</p>
    </div>
    
    <div class="appointment-actions">
      <button *ngIf="status === 'rejected'">Reschedule</button>
      <button>Delete</button>
    </div>
  </div>
</div>
```

#### 3.3 Interface "Planifier rendez-vous" (Officier)
**Fichiers à créer/modifier**:
- `src/app/officer/manage-appointments/manage-appointments.component.ts`
- `src/app/officer/manage-appointments/manage-appointments.component.html`
- `src/app/officer/manage-appointments/manage-appointments.component.scss`

**Fonctionnalités**:
- Liste de tous les rendez-vous
- Filtrage des rendez-vous
- Boutons pour valider ou rejeter un rendez-vous

**Maquette simplifiée**:
```html
<div class="appointments-management">
  <h2>Requests</h2>
  
  <!-- Filtres -->
  <div class="filters">
    <select>
      <option value="all">All</option>
      <option value="pending">Pending</option>
      <option value="validated">Validated</option>
      <option value="rejected">Rejected</option>
    </select>
  </div>
  
  <!-- Liste des rendez-vous -->
  <table class="appointments-table">
    <thead>
      <tr>
        <th>Citizen</th>
        <th>Center</th>
        <th>Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let appointment of appointments">
        <td>Citizen Name</td>
        <td>Center Name</td>
        <td>01/01/2023</td>
        <td>Status</td>
        <td>
          <button class="validate-btn">Validate</button>
          <button class="reject-btn">Reject</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4. Services à développer

#### 4.1 AppointmentService
```typescript
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private http: HttpClient) {}
  
  // Méthodes pour les citoyens
  createAppointment(data: any): Observable<any> {
    return this.http.post('/api/appointments', data);
  }
  
  getAppointments(): Observable<any> {
    return this.http.get('/api/appointments');
  }
  
  deleteAppointment(id: string): Observable<any> {
    return this.http.delete(`/api/appointments/${id}`);
  }
  
  rescheduleAppointment(id: string, data: any): Observable<any> {
    return this.http.put(`/api/appointments/${id}`, data);
  }
  
  // Méthodes pour les officiers
  getAllAppointments(filters?: any): Observable<any> {
    return this.http.get('/api/officer/appointments', { params: filters });
  }
  
  validateAppointment(id: string): Observable<any> {
    return this.http.put(`/api/officer/appointments/${id}/validate`, {});
  }
  
  rejectAppointment(id: string): Observable<any> {
    return this.http.put(`/api/officer/appointments/${id}/reject`, {});
  }
}
```

#### 4.2 CenterService
```typescript
@Injectable({
  providedIn: 'root'
})
export class CenterService {
  constructor(private http: HttpClient) {}
  
  getCenters(): Observable<any> {
    return this.http.get('/api/centers');
  }
  
  getCenterAvailability(centerId: string): Observable<any> {
    return this.http.get(`/api/centers/${centerId}/availability`);
  }
}
```

### 5. Contrôleurs Backend à développer

#### 5.1 AppointmentController (Citoyen)
```javascript
const appointmentController = {
  createAppointment: async (req, res) => {
    try {
      const { centerId, date } = req.body;
      const citizenId = req.user.id;
      
      // Créer le rendez-vous
      const appointment = new Appointment({
        citizen: citizenId,
        center: centerId,
        date: new Date(date),
        status: 'pending'
      });
      
      await appointment.save();
      
      return res.status(201).json({ 
        message: "Appointment created successfully", 
        appointment 
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  getAppointments: async (req, res) => {
    try {
      const citizenId = req.user.id;
      const appointments = await Appointment.find({ citizen: citizenId })
                                           .populate('center')
                                           .sort({ date: 1 });
      
      return res.status(200).json(appointments);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  deleteAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const citizenId = req.user.id;
      
      const appointment = await Appointment.findOneAndDelete({
        _id: id,
        citizen: citizenId
      });
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      return res.status(200).json({ 
        message: "Appointment deleted successfully" 
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  rescheduleAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.body;
      const citizenId = req.user.id;
      
      const appointment = await Appointment.findOne({
        _id: id,
        citizen: citizenId,
        status: 'rejected'
      });
      
      if (!appointment) {
        return res.status(404).json({ 
          message: "Rejected appointment not found" 
        });
      }
      
      appointment.date = new Date(date);
      appointment.status = 'pending';
      appointment.updatedAt = Date.now();
      
      await appointment.save();
      
      return res.status(200).json({ 
        message: "Appointment rescheduled successfully", 
        appointment 
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};
```

#### 5.2 OfficerAppointmentController
```javascript
const officerAppointmentController = {
  getAllAppointments: async (req, res) => {
    try {
      const { status, date, center } = req.query;
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        query.date = {
          $gte: startDate,
          $lt: endDate
        };
      }
      
      if (center && center !== 'all') {
        query.center = center;
      }
      
      const appointments = await Appointment.find(query)
                                           .populate('citizen')
                                           .populate('center')
                                           .sort({ date: 1 });
      
      return res.status(200).json(appointments);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  validateAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        { 
          status: 'validated', 
          updatedAt: Date.now() 
        },
        { new: true }
      );
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      return res.status(200).json({ 
        message: "Appointment validated successfully", 
        appointment 
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  rejectAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        { 
          status: 'rejected', 
          updatedAt: Date.now() 
        },
        { new: true }
      );
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      return res.status(200).json({ 
        message: "Appointment rejected successfully", 
        appointment 
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};
```

## Alignement avec les diagrammes de séquence

Les interfaces et APIs développées doivent suivre les flux décrits dans les diagrammes de séquence du rapport:

1. **Diagramme "Créer rendez-vous"** (Figure 4.4):
   - Le citoyen sélectionne un centre sur la carte
   - Le citoyen choisit une date dans le calendrier
   - Le système enregistre la demande de rendez-vous

2. **Diagramme "Approuver rendez-vous"** (Figure 4.5):
   - L'officier consulte la liste des rendez-vous
   - L'officier approuve ou rejette un rendez-vous
   - Le système met à jour le statut du rendez-vous

## Conclusion

Ce plan d'implémentation détaille les modifications de code nécessaires pour réaliser le sprint 2 "Gérer Rendez-vous". En suivant ce plan, nous pourrons développer les interfaces et fonctionnalités requises pour permettre aux citoyens de soumettre et gérer leurs rendez-vous, et aux officiers de police de les valider ou rejeter.

Les interfaces développées seront alignées avec les cas d'utilisation et les diagrammes de séquence présentés dans le rapport, assurant ainsi une cohérence entre la documentation et l'implémentation.
