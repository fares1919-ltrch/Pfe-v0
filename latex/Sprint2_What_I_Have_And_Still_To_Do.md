# Sprint 2 "Gérer Rendez-vous" - État d'avancement

Ce document résume ce qui est déjà implémenté pour le sprint 2 "Gérer Rendez-vous", aligné avec la logique actuelle du code.

## Ce qui est déjà implémenté

### Backend

#### Modèles

1.  **Modèle Appointment** (`backend/app/models/appointment.model.js`)

    - Status enum: `["scheduled", "completed", "cancelled", "missed"]` (default "scheduled").
    - Includes `userId`, `officerId`, `cpfRequestId`, `appointmentDate`, `notes`, `location`, `createdAt`, `updatedAt`, `service`.

2.  **Modèle Center** (`backend/app/models/center.model.js`)

    - Includes `name`, `address` (structured), `region`, `capacity`, `workingHours`, `status`.

3.  **Modèle CenterSchedule** (`backend/app/models/centerSchedule.model.js`)
    - Manages center availability and reserved slots by month and day.

#### Contrôleurs (`backend/app/controllers/appointment.controller.js`)

- Implemented functions:
  - `createAppointement`: Schedules an appointment for a CPF request, sets appointment status to `scheduled`, updates center schedule, and sets linked CPF request status to `approved`.
  - `getAppointmentsByUser`: Retrieves appointments for the logged-in citizen.
  - `rescheduleAppointment`: Reschedules an appointment (used for `cancelled` status in frontend), sets new date, updates appointment status to `scheduled`, updates center schedule, updates linked CPF request date and status (to `approved` if completed).
  - `deleteAppointment`: Deletes an appointment (hard delete), sets linked CPF request status to `pending`.
  - `validateAppointment`: Officer action. Sets appointment status to `scheduled` and linked CPF Request status to `approved`.
  - `rejectAppointment`: Officer action. Sets appointment status to `cancelled` and linked CPF Request status to `rejected`.
  - `getAllAppointmentsOfficer`: Retrieves appointments for officers with filters (status, date, center) and pagination.
  - `getTodayAppointments`: Retrieves appointments for the current day.
  - `getUpcomingAppointments`: Retrieves upcoming appointments.
  - `cancelAppointment`: Sets appointment status to `cancelled`.
  - `completeAppointment`: Sets appointment status to `completed` and linked CPF Request status to `completed`.
  - `missAppointment`: Sets appointment status to `missed`.
  - `getAppointmentByRequestId`: Retrieves an appointment by CPF request ID.

#### Routes (`backend/app/routes/appointment.routes.js`)

- Implemented routes:
  - Citizen: `GET /api/appointments/user`, `DELETE /api/appointments/:id`, `PUT /api/appointments/reschedule/:requestId`, `PUT /api/appointments/cancel/:appointmentId`, `PUT /api/appointments/complete/:appointmentId`, `PUT /api/appointments/missed/:appointmentId`, `GET /api/appointments/by-request/:cpfRequestId`, `GET /api/appointments/today`, `GET /api/appointments/upcoming`.
  - Officer: `GET /api/officer/appointments`, `PUT /api/officer/appointments/:id/validate`, `PUT /api/officer/appointments/:id/reject`, `POST /api/appointments/createScheduleAppointment/:requestId` (also used by officer/system).

### Frontend

#### Services (`src/app/core/services/appointment.service.ts`)

- `AppointmentService` includes methods corresponding to implemented backend routes (e.g., `getUserAppointments`, `deleteAppointment`, `rescheduleRejectedAppointment`, `validateAppointment`, `rejectAppointment`, `getAllAppointmentsOfficer`, etc.).
- The `Appointment` interface reflects the `scheduled`, `completed`, `cancelled`, `missed` statuses and includes `cpfRequestId` which can be a populated object.

#### Services (`src/app/core/services/center.service.ts`)

- `CenterService` includes methods to get centers and availability.

#### Components

1.  **Citizen - Appointments Component** (`src/app/features/citizen-dashboard/components/appointements/appointements.component.ts` and `.html`)

    - Displays citizen's appointments fetched via `getAppointments`. Includes search and refresh.
    - Provides view details, delete, and reschedule buttons (reschedule enabled for `cancelled` status).

2.  **Citizen - CPF Request Component** (`src/app/features/citizen-dashboard/components/cpf-request/cpf-request.component.ts` and `.html`)

    - Handles CPF request submission including center and date selection for appointment.

3.  **Officer - Requests Component** (`src/app/features/officer-dashboard/components/requests/requests.component.ts` and `.html`)

    - **Integrated appointment management for officers.** Displays a list of appointments using `getAllAppointmentsOfficer` with filters.
    - Provides Validate/Reject buttons for appointments where the linked CPF Request is in `pending` status.

4.  **Officer - Appointments Component** (`src/app/features/officer-dashboard/components/appointments/appointments.component.ts` and `.html`)
    - Displays Today's and Upcoming appointments (using `getTodayAppointements` and `getUpcomingAppointements`). Provides cancel/complete/missed actions.

## Ce qu'il reste à faire (Potential Areas for Review/Refinement)

Based on the current code and comparing it to the initial plan and LaTeX, these points could be considered:

1.  **Citizen Delete Action:** The current implementation performs a hard delete of the appointment and sets the linked CPF request to `pending`. Review if a status change (e.g., to `cancelled`) would be a more appropriate behavior from a user perspective and system consistency, especially since 'cancelled' status exists and is used elsewhere.
2.  **Citizen Reschedule Trigger Status:** The frontend currently allows rescheduling for `cancelled` appointments, while the initial LaTeX mentioned `rejected`. Confirm the intended status that permits citizen rescheduling.
3.  **Full Pagination/Filtering in Officer Requests:** While filtering is started and basic pagination logic is present in the component, ensure the backend `getAllAppointmentsOfficer` fully supports pagination and all necessary filters (date, center) as needed for a comprehensive officer view.
4.  **Backend Data Population:** Verify that necessary data (like `user`, `locationDetails`, `cpfRequestId` with status) is consistently populated in backend responses used by frontend components.
5.  **Frontend UI/UX:** Refine the frontend interfaces based on the implemented logic and requirements (e.g., clearer status displays, date/time pickers for rescheduling, full filter forms in officer view).

## Alignement avec la documentation existante

Le code actuel est principalement aligné avec les diagrammes de séquence révisés concernant la mise à jour des statuts des demandes CPF par les officiers via les rendez-vous. Les principales différences se situent par rapport au plan d'implémentation initial (changement des valeurs de statut de rendez-vous, emplacement de la gestion des rendez-vous par l'officier) et potentiellement sur le comportement de suppression/annulation côté citoyen et le statut déclencheur de la reprogrammation.

## Priorités (pour la documentation ou le développement futur)

1.  Assurer que la documentation (LaTeX, Markdown) reflète précisément la logique implémentée (statuts, flux, responsabilités des contrôleurs, structure des composants).
2.  Décider si les points restants à faire (notamment le comportement de suppression/annulation citoyen et le statut de reprogrammation) nécessitent des ajustements dans le code ou simplement une clarification dans la documentation.
3.  Finaliser les interfaces utilisateur et les fonctionnalités de filtrage/pagination si elles ne sont pas complètes.
