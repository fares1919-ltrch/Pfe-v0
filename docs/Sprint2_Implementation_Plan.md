# Plan d'implémentation du Sprint 2 : Gérer Rendez-vous

## Résumé du Sprint

Le sprint 2 "Gérer Rendez-vous" est centré sur la mise en place d'un système complet de gestion des rendez-vous pour l'obtention du CPF. Ce sprint permet aux citoyens de soumettre des demandes de rendez-vous en sélectionnant un centre et une date, de consulter et gérer leurs rendez-vous existants (y compris la reprogrammation pour certains statuts et la suppression), et aux officiers de police de gérer les rendez-vous liés aux demandes CPF, en validant ou rejetant ces demandes via l'interface des rendez-vous.

**Durée totale du sprint**: 7 jours

**Objectifs principaux**:

- Permettre aux citoyens de soumettre des demandes de rendez-vous
- Permettre aux citoyens de consulter et gérer leurs rendez-vous (view, reschedule, delete)
- Permettre aux officiers de visualiser et gérer les rendez-vous liés aux demandes CPF (view, validate, reject)

## Backlog du Sprint

| ID  | User Story                                                                                                                                                | Tâche                                                                              | Durée |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----- |
| 5.1 | En tant que citoyen, je peux soumettre un rendez-vous en choisissant un centre selon le map et une date selon les créneaux disponibles dans un calendrier | 5.1.1 Créer les interfaces pour la sélection d'un centre et d'un créneau           | 2j    |
|     |                                                                                                                                                           | 5.1.2 Développer les API pour la gestion des rendez-vous                           | 1j    |
|     |                                                                                                                                                           | 5.1.3 Tester les fonctionnalités de soumission de rendez-vous                      | 1j    |
| 5.2 | En tant que citoyen, je peux consulter les détails de mes rendez-vous tels que la date, le statut, le centre, etc.                                        | 5.2.1 Créer les interfaces pour la consultation et la filtration des rendez-vous   | 1j    |
|     |                                                                                                                                                           | 5.2.2 Développer les API pour la consultation et la filtration des rendez-vous     | 1j    |
|     |                                                                                                                                                           | 5.2.3 Tester les fonctionnalités de consultation et de filtration des rendez-vous  | 1j    |
| 5.3 | En tant qu'officier, je peux planifier les rendez-vous en les validant ou les rejetant                                                                    | 5.3.1 Créer les interfaces pour la gestion des rendez-vous (intégrée aux demandes) | 1j    |
|     |                                                                                                                                                           | 5.3.2 Développer les API pour modifier le statut des rendez-vous et demandes liées | 1j    |
|     |                                                                                                                                                           | 5.3.3 Tester les fonctionnalités de gestion des rendez-vous par l'officier         | 1j    |

## Plan de modification du code

### 1. Modèles de données à implémenter

#### 1.1 Modèle Appointment (Rendez-vous)

```javascript
const appointmentSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  officerId: {
    // Added officerId as per implemented model
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cpfRequestId: {
    // Added cpfRequestId as per implemented model
    type: mongoose.Schema.Types.ObjectId,
    ref: "CpfRequest",
    required: true,
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  date: {
    // Renamed from 'date' to 'appointmentDate' as per implemented model
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "missed"], // Updated enum values as per implemented model
    default: "scheduled", // Updated default status as per implemented model
  },
  notes: String, // Added notes field
  location: {
    // Added location field (redundant with center, but present in model)
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    // Added updatedAt field
    type: Date,
    default: Date.now,
  },
  service: {
    // Added service field
    type: String,
    default: "CPF Submission Data",
  },
});
```

#### 1.2 Modèle Center (Centre)

```javascript
const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  address: {
    street: { type: String, required: true }, // Updated address structure
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    lon: { type: Number, required: true },
    lat: { type: Number, required: true },
  },
  region: { type: String, required: true }, // Added region
  capacity: {
    // Added capacity
    daily: { type: Number, required: true },
    hourly: { type: Number, required: true },
  },
  workingHours: {
    /* Heures d'ouverture par jour */
  }, // Added workingHours
  status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" }, // Added status
  availableSlots: [
    {
      // Removed availableSlots as CenterSchedule is used
      date: Date,
      slots: [String],
    },
  ],
});
```

### 2. APIs Backend à développer

#### 2.1 APIs pour les citoyens

- `POST /api/appointments/createScheduleAppointment/:requestId` - Créer un nouveau rendez-vous (Linked to CPF Request)
- `GET /api/appointments` - Récupérer les rendez-vous du citoyen connecté
- `DELETE /api/appointments/:id` - Supprimer un rendez-vous (Note: Current backend implementation performs a hard delete and resets CPF request status to pending)
- `PUT /api/appointments/reschedule/:requestId` - Modifier la date d'un rendez-vous (Linked to CPF Request ID, currently used for rescheduling cancelled appointments in frontend)
- `PUT /api/appointments/cancel/:appointmentId` - Annuler un rendez-vous (Sets appointment status to 'cancelled')
- `PUT /api/appointments/complete/:appointmentId` - Marquer un rendez-vous comme terminé (Sets appointment status to 'completed' and linked CPF Request status to 'completed')
- `PUT /api/appointments/missed/:appointmentId` - Marquer un rendez-vous comme manqué (Sets appointment status to 'missed')
- `GET /api/appointments/by-request/:cpfRequestId` - Get appointment by CPF request ID
- `GET /api/appointments/today` - Get today's appointments (Used by officer dashboard 'Appointments' component)
- `GET /api/appointments/upcoming` - Get upcoming appointments (Used by officer dashboard 'Appointments' component)
- `GET /api/centers` - Récupérer la liste des centres
- `GET /api/centers/:centerId/availability` - Récupérer les disponibilités d'un centre

#### 2.2 APIs pour les officiers

- `GET /api/officer/appointments` - Récupérer tous les rendez-vous avec filtres (Used in officer dashboard 'Requests' component)
- `PUT /api/officer/appointments/:id/validate` - Valider un rendez-vous (Sets appointment status to 'scheduled' and linked CPF Request status to 'approved')
- `PUT /api/officer/appointments/:id/reject` - Rejeter un rendez-vous (Sets appointment status to 'cancelled' and linked CPF Request status to 'rejected')

### 3. Interfaces Frontend à développer/modifier

#### 3.1 Interface "Soumettre rendez-vous" (Citoyen)

**Fichiers à créer/modifier**:

- `src/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.ts`
- `src/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.html`
- `src/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.scss`

**Fonctionnalités**:

- Interface pour soumettre une demande de CPF, including selecting a center via map and choosing a date/time for the appointment.

**Maquette simplifiée**:

```html
<!-- Existing maquette seems generally aligned with the concept -->
```

#### 3.2 Interface "Consulter rendez-vous" (Citoyen)

**Fichiers à créer/modifier**:

- `src/app/features/citizen-dashboard/components/appointements/appointements.component.ts`
- `src/app/features/citizen-dashboard/components/appointements/appointements.component.html`
- `src/app/features/citizen-dashboard/components/appointements/appointements.component.scss`

**Fonctionnalités**:

- Affichage des rendez-vous du citoyen with details (date, status, center, service).
- Functionality to view details, delete an appointment, and reschedule a cancelled appointment.

**Maquette simplifiée**:

```html
<!-- Existing maquette needs status display update, reschedule button condition -->
```

#### 3.3 Interface "Gestion des rendez-vous" (Officier - Integrated into Requests)

**Fichiers à modifier**:

- `src/app/features/officer-dashboard/components/requests/requests.component.ts`
- `src/app/features/officer-dashboard/components/requests/requests.component.html`
- `src/app/features/officer-dashboard/components/requests/requests.component.scss`

**Fonctionnalités**:

- Liste de tous les rendez-vous with filtering options (status, date, center).
- Display of citizen name, date, status, and center.
- Buttons to validate or reject appointments **when the linked CPF Request is pending**.

**Maquette simplifiée**:

```html
<!-- Maquette should reflect a table view of appointments with filters and action buttons for pending CPF requests -->
<div class="appointments-management">
  <h2>Appointments Management</h2>

  <!-- Filters -->
  <div class="filters">
    <select [(ngModel)]="appointmentFilters.status" (change)="applyAppointmentFilters()">
      <option value="">All</option>
      <option value="scheduled">Scheduled</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
      <option value="missed">Missed</option>
    </select>
    <!-- Add date and center filters -->
  </div>

  <!-- List of appointments -->
  <table class="appointments-table">
    <thead>
      <tr>
        <th>Citizen</th>
        <th>Date</th>
        <th>Status</th>
        <th>Center</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let appointment of appointments">
        <td>{{ appointment.user?.firstName }} {{ appointment.user?.lastName }}</td>
        <td>{{ formatDate(appointment.appointmentDate) }}</td>
        <td>{{ appointment.status | uppercase }}</td>
        <td>{{ appointment.locationDetails?.name }}</td>
        <td>
          <!-- Show buttons only if linked CPF Request is pending -->
          <button *ngIf="isPendingCpfRequest(appointment)" (click)="validateAppointment(appointment._id)">Validate</button>
          <button *ngIf="isPendingCpfRequest(appointment)" (click)="rejectAppointment(appointment._id)">Reject</button>
        </td>
      </tr>
      <tr *ngIf="appointments.length === 0">
        <td class="no-data" [attr.colspan]="5">No appointments found matching filters.</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4. Services à développer/modifier

#### 4.1 AppointmentService

```typescript
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private http: HttpClient) {}

  // Méthodes pour les citoyens
  createAppointment(data: any): Observable<any> { // createAppointment method used for scheduling via CPF request
    return this.http.post('/api/appointments/createScheduleAppointment/:requestId', data); // Updated endpoint example
  }

  getAppointments(): Observable<any> { // getAppointments for citizen's own appointments
    return this.http.get('/api/appointments/user'); // Updated endpoint as per implemented code
  }

  deleteAppointment(id: string): Observable<any> { // Citizen's delete action
    return this.http.delete(`/api/appointments/${id}`); // Endpoint for hard delete
  }

  rescheduleRejectedAppointment(id: string, data: any): Observable<any> { // Reschedule action (used for 'cancelled' appointments in frontend)
    return this.http.put(`/api/appointments/reschedule/${id}`, data); // Endpoint uses requestId
  }

  // Added methods for other appointment status updates used in officer appointments component
  cancelAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`/api/appointments/cancel/${appointmentId}`, {});
  }

  markAppointmentAsMissed(appointmentId: string): Observable<any> {
    return this.http.put(`/api/appointments/missed/${appointmentId}`, {});
  }

  // Get appointment by CPF request ID
  getAppointmentByRequestId(requestId: string): Observable<any> {
    return this.http.get(`/api/appointments/by-request/${requestId}`);
  }


  // Méthodes pour les officiers
  getAllAppointmentsOfficer(filters?: any): Observable<any> { // Officer method to get all appointments with filters
    return this.http.get('/api/officer/appointments', { params: filters });
  }

  validateAppointment: async (req, res) => { // Officer validate action
    // Logic to find appointment by id, populate cpfRequestId, set appointment status to 'scheduled', if linked cpfRequest exists and is pending, update cpfRequest status to 'approved'
  },

  rejectAppointment: async (req, res) => { // Officer reject action
    // Logic to find appointment by id, populate cpfRequestId, set appointment status to 'cancelled', if linked cpfRequest exists and is pending, update cpfRequest status to 'rejected'
  },

  // Added methods for officer appointments component (formerly in separate appointments component)
   getTodayAppointements(): Observable<any> {
    return this.http.get('/api/appointments/today');
  },

  getUpcomingAppointements(): Observable<any> {
    return this.http.get('/api/appointments/upcoming');
  }
}
```

#### 5.1 AppointmentController (Citizen related actions)

```javascript
const appointmentController = {
  // ... (other citizen-related appointment methods like getAppointmentsByUser, rescheduleAppointment, deleteAppointment) ...
  createAppointement: async (req, res) => {
    // Renamed from createAppointment to createAppointement as per code
    try {
      const { requestId } = req.params; // Uses requestId param
      const { date } = req.body;
      // Logic to find CPF request, center schedule, find/generate slot, create appointment with status 'scheduled', update center schedule, update CPF request status to 'approved'
    } catch (error) {
      // Error handling
    }
  },

  getAppointmentsByUser: async (req, res) => {
    // Method to get citizen's own appointments
    // Logic to find appointments by userId, populate location, sort by date
  },

  rescheduleAppointment: async (req, res) => {
    // Method to reschedule (used for cancelled appointments in frontend)
    // Logic to find appointment by requestId, validate new date, update appointment date to new scheduled slot, set appointment status to 'scheduled', update center schedule, update linked CPF request date and status (to 'approved' if completed)
  },

  deleteAppointment: async (req, res) => {
    // Citizen delete appointment (hard delete)
    // Logic to find appointment by id, check officer role (in code, but might be removed for citizen action?), update linked CPF request status to 'pending' and remove appointmentDate, then delete appointment
  },

  cancelAppointment: async (req, res) => {
    // Method to cancel (sets status to 'cancelled')
    // Logic to find appointment by id, set status to 'cancelled'
  },

  completeAppointment: async (req, res) => {
    // Method to complete (sets status to 'completed', updates CPF request status to 'completed')
    // Logic to find appointment by id, set status to 'completed', update linked CPF request status to 'completed' if not already
  },

  missAppointment: async (req, res) => {
    // Method to mark as missed (sets status to 'missed')
    // Logic to find appointment by id, set status to 'missed'
  },

  getTodayAppointments: async (req, res) => {
    // Method for today's appointments
    // Logic to find appointments for today, populate user, location, cpfRequestId, format response
  },

  getUpcomingAppointments: async (req, res) => {
    // Method for upcoming appointments
    // Logic to find appointments from tomorrow onwards, populate user, location, cpfRequestId, sort, format response
  },
};
```

#### 5.2 OfficerAppointmentController (Officer related actions - consolidated in AppointmentController in code)

```javascript
// Note: Officer-related appointment controller methods are integrated into the main AppointmentController in the current code.

const appointmentController = {
  // ... (citizen-related methods) ...

  validateAppointment: async (req, res) => {
    // Officer validate action
    // Logic to find appointment by id, populate cpfRequestId, set appointment status to 'scheduled', if linked cpfRequest exists and is pending, update cpfRequest status to 'approved'
  },

  rejectAppointment: async (req, res) => {
    // Officer reject action
    // Logic to find appointment by id, populate cpfRequestId, set appointment status to 'cancelled', if linked cpfRequest exists and is pending, update cpfRequest status to 'rejected'
  },

  getAllAppointmentsOfficer: async (req, res) => {
    // Officer method to get all appointments with filters
    // Logic to find appointments based on status, date, center filters, populate userId and cpfRequestId, handle pagination (partially implemented)
  },

  // Note: getTodayAppointments and getUpcomingAppointments are also used by officers and are in the main controller
};
```

## Alignement avec les diagrammes de séquence et code final

Pour aligner complètement ce plan avec le code final et les diagrammes de séquence révisés, il faut:

1.  **Terminologie et Modèles**: Acknowledge the actual Appointment statuses used in the code (`scheduled`, `completed`, `cancelled`, `missed`) and how officer actions on Appointments affect the **linked CPF Request status** (`approved`, `rejected`) in addition to the Appointment status.
2.  **Flux de travail**: Ensure descriptions accurately reflect the flow, particularly how officer validation/rejection of appointments is tied to CPF Request status updates, and the current implementation of citizen delete (hard delete vs. status change).
3.  **Interfaces utilisateur**: Reflect that officer appointment management is now handled within the `OfficerRequestsComponent`. Update descriptions for citizen appointment view/management to reflect current functionalities (reschedule for 'cancelled', delete performs hard delete).
4.  **APIs, Services, Controllers**: Update endpoint paths, method names, and logic descriptions to accurately match the implemented code.

## Priorités d'implémentation (Reflects current state, not future work)

1.  **Backend**:

    - Appointment Model: Status enum is `["scheduled", "completed", "cancelled", "missed"]`.
    - Controllers: `createAppointement` sets status to `scheduled`. `validateAppointment` sets appointment to `scheduled` and CPF Request to `approved`. `rejectAppointment` sets appointment to `cancelled` and CPF Request to `rejected`. `deleteAppointment` (citizen) performs hard delete and sets CPF Request to `pending`. `cancelAppointment`, `completeAppointment`, `missAppointment` set appointment status accordingly.
    - Routes: Routes are implemented as per the code (`/api/appointments/user`, `/api/appointments/:id` for delete, `/api/appointments/reschedule/:requestId`, `/api/officer/appointments/:id/validate`, `/api/officer/appointments/:id/reject`, `/api/officer/appointments` with filters, etc.)

2.  **Frontend**:
    - AppointmentService: Methods align with backend routes (`getUserAppointments`, `deleteAppointment`, `rescheduleRejectedAppointment`, `getAllAppointmentsOfficer`, `validateAppointment`, `rejectAppointment`, etc.). Appointment interface uses the `scheduled`, `completed`, `cancelled`, `missed` statuses. `cpfRequestId` can be populated.
    - Citizen Appointments Component (`appointements.component.ts/html`): Fetches appointments using `getAppointments`. Displays statuses. Provides delete and reschedule buttons (reschedule enabled for 'cancelled').
    - Officer Requests Component (`requests.component.ts/html`): Handles appointment listing for officers using `getAllAppointmentsOfficer` with filters. Displays appointments and provides Validate/Reject buttons for appointments linked to **pending CPF requests**.
    - Officer Appointments Management Component (`manage-appointments`) has been removed.

This updated plan reflects the current state of the code and aligns it with the documented diagrams. Further work would involve addressing the remaining inconsistencies (citizen delete, reschedule trigger status) if desired.
