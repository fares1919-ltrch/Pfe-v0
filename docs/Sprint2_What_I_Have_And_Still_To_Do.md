# Sprint 2 "Gérer Rendez-vous" - État d'avancement

Ce document résume ce qui est déjà implémenté et ce qu'il reste à faire pour compléter le sprint 2 "Gérer Rendez-vous" conformément au rapport.

## Ce qui est déjà implémenté

### Backend

#### Modèles
1. **Modèle Appointment** (`back/models/appointment.model.js`)
   ```javascript
   const Appointment = mongoose.model(
     "Appointment",
     new mongoose.Schema({
       userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
       officerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
       cpfRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "CpfRequest", required: true },
       appointmentDate: { type: Date, required: true },
       status: {
         type: String,
         enum: ["scheduled", "completed", "cancelled", "missed"],
         default: "scheduled"
       },
       notes: String,
       location: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
       createdAt: { type: Date, default: Date.now }
     })
   );
   ```

2. **Modèle Center** (`back/models/center.model.js`)
   ```javascript
   const Center = mongoose.model(
     "Center",
     new mongoose.Schema({
       name: { type: String, required: true },
       address: {
         street: { type: String, required: true },
         city: { type: String, required: true },
         state: { type: String, required: true },
         postalCode: { type: String, required: true },
         lon: { type: Number, required: true },
         lat: { type: Number, required: true }
       },
       region: { type: String, required: true },
       capacity: {
         daily: { type: Number, required: true },
         hourly: { type: Number, required: true }
       },
       workingHours: { /* Heures d'ouverture par jour */ },
       status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" }
     })
   );
   ```

3. **Modèle CenterSchedule** (`back/models/centerSchedule.model.js`)
   - Gère les disponibilités des centres par mois et par jour
   - Stocke les créneaux réservés

#### Contrôleurs
1. **AppointmentController** (`back/controllers/appointment.controller.js`)
   - Fonctions implémentées:
     - `getAppointmentByRequestId`: Récupérer un rendez-vous par ID de demande CPF
     - `rescheduleAppointment`: Reprogrammer un rendez-vous
     - `deleteAppointment`: Supprimer un rendez-vous
     - `createAppointement`: Créer un rendez-vous
     - `getTodayAppointments`: Obtenir les rendez-vous du jour
     - `getUpcomingAppointments`: Obtenir les rendez-vous à venir
     - `cancelAppointment`: Annuler un rendez-vous
     - `completeAppointment`: Marquer un rendez-vous comme terminé

#### Routes
1. **Appointment Routes** (`back/routes/appointment.routes.js`)
   - Routes pour les citoyens:
     - `GET /api/appointments/by-request/:cpfRequestId`: Récupérer un rendez-vous par ID de demande
   - Routes pour les officiers:
     - `DELETE /api/appointments/:id`: Supprimer un rendez-vous
     - `POST /api/appointments/createScheduleAppointment/:requestId`: Créer un rendez-vous
     - `PUT /api/appointments/reschedule/:requestId`: Reprogrammer un rendez-vous
     - `GET /api/appointments/today`: Obtenir les rendez-vous du jour
     - `GET /api/appointments/upcoming`: Obtenir les rendez-vous à venir
     - `PUT /api/appointments/cancel/:appointmentId`: Annuler un rendez-vous
     - `PUT /api/appointments/complete/:appointmentId`: Marquer un rendez-vous comme terminé

### Frontend

#### Services
1. **AppointmentService** (`Front/app/core/services/appointment.service.ts`)
   - Interface Appointment définie avec les champs nécessaires
   - Méthodes pour interagir avec l'API des rendez-vous

2. **CenterService** (`Front/app/core/services/center.service.ts`)
   - Interface Center définie avec les champs nécessaires
   - Méthodes pour récupérer les centres et leurs disponibilités

#### Composants
1. **Citizen - Appointments Component** (`Front/app/features/citizen-dashboard/components/appointements/appointements.component.ts` et `.html`)
   - Interface pour afficher les rendez-vous du citoyen
   - Fonctionnalités de recherche et de rafraîchissement

2. **Citizen - CPF Request Component** (`Front/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.ts` et `.html`)
   - Interface pour soumettre une demande de CPF avec sélection de centre et de date
   - Intégration de carte pour sélectionner un centre
   - Calendrier pour choisir une date de rendez-vous

3. **Officer - Appointments Component** (`Front/app/features/officer-dashboard/components/appointments/appointments.component.ts` et `.html`)
   - Interface pour afficher les rendez-vous du jour et à venir
   - Fonctionnalités pour annuler ou compléter un rendez-vous

4. **Officer - Requests Component** (`Front/app/features/officer-dashboard/components/requests/requests.component.ts` et `.html`)
   - Interface pour gérer les demandes de CPF et les rendez-vous associés

## Ce qu'il reste à faire

### Backend

#### Modèles à modifier
1. **Appointment Model** (`back/models/appointment.model.js`)
   - Modifier le champ `status` pour inclure les valeurs "pending", "validated", "rejected" conformément au rapport
   ```javascript
   status: {
     type: String,
     enum: ["pending", "validated", "rejected"],
     default: "pending"
   }
   ```

#### Contrôleurs à ajouter/modifier
1. **AppointmentController** (`back/controllers/appointment.controller.js`)
   - Ajouter une fonction `validateAppointment` pour valider un rendez-vous
   - Ajouter une fonction `rejectAppointment` pour rejeter un rendez-vous
   - Modifier `createAppointement` pour utiliser le statut "pending" par défaut
   - Ajouter une fonction `getAppointmentsByUser` pour récupérer les rendez-vous d'un citoyen

#### Routes à ajouter
1. **Appointment Routes** (`back/routes/appointment.routes.js`)
   - Ajouter une route `GET /api/appointments` pour les citoyens
   - Ajouter une route `PUT /api/appointments/:id` pour permettre aux citoyens de modifier leurs rendez-vous rejetés
   - Ajouter une route `PUT /api/officer/appointments/:id/validate` pour valider un rendez-vous
   - Ajouter une route `PUT /api/officer/appointments/:id/reject` pour rejeter un rendez-vous
   - Ajouter une route `GET /api/officer/appointments` avec des options de filtrage

### Frontend

#### Services à modifier
1. **AppointmentService** (`Front/app/core/services/appointment.service.ts`)
   - Ajouter des méthodes pour les nouvelles routes:
     ```typescript
     validateAppointment(id: string): Observable<any> {
       return this.http.put(`/api/officer/appointments/${id}/validate`, {});
     }
     
     rejectAppointment(id: string): Observable<any> {
       return this.http.put(`/api/officer/appointments/${id}/reject`, {});
     }
     
     getUserAppointments(): Observable<any> {
       return this.http.get('/api/appointments');
     }
     
     rescheduleRejectedAppointment(id: string, data: any): Observable<any> {
       return this.http.put(`/api/appointments/${id}`, data);
     }
     ```

#### Composants à modifier/ajouter

1. **Citizen - Appointments Component** (`Front/app/features/citizen-dashboard/components/appointements/appointements.component.ts` et `.html`)
   - Ajouter la fonctionnalité de suppression de rendez-vous
   - Ajouter la fonctionnalité de modification de date pour les rendez-vous rejetés
   - Améliorer l'affichage des statuts des rendez-vous

2. **Citizen - CPF Request Component** (`Front/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.ts` et `.html`)
   - Améliorer l'interface de sélection de centre sur la carte
   - Améliorer l'interface de sélection de date et de créneau horaire

3. **Officer - Appointments Management Component** (à créer)
   - Créer un nouveau composant `Front/app/features/officer-dashboard/components/manage-appointments/manage-appointments.component.ts` et `.html`
   - Implémenter l'interface de gestion des rendez-vous avec filtres
   - Ajouter des boutons explicites pour valider ou rejeter les rendez-vous

## Alignement avec le rapport

Pour aligner complètement le code avec le rapport du chapitre 3, il faut:

1. **Terminologie**:
   - Utiliser les statuts "pending", "validated", "rejected" au lieu de "scheduled", "completed", "cancelled", "missed"
   - Renommer les fonctions et variables pour correspondre à la terminologie du rapport

2. **Flux de travail**:
   - S'assurer que le flux de soumission de rendez-vous suit le diagramme de séquence "Créer rendez-vous"
   - S'assurer que le flux de validation/rejet suit le diagramme de séquence "Approuver rendez-vous"

3. **Interfaces utilisateur**:
   - Adapter les interfaces pour correspondre aux descriptions des cas d'utilisation du rapport
   - Implémenter tous les scénarios décrits dans le rapport (soumettre, consulter, supprimer, changer date, planifier, valider, rejeter, filtrer)

## Priorités d'implémentation

1. Modifier le modèle Appointment pour utiliser les bons statuts
2. Ajouter les routes et contrôleurs manquants
3. Modifier les composants existants pour les aligner avec le rapport
4. Créer les nouveaux composants nécessaires
5. Tester l'ensemble du flux de travail pour s'assurer qu'il correspond aux diagrammes de séquence
