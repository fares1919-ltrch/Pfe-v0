# Manage Appointments Feature

This document outlines the flow for managing appointments within the system for both Citizen and Officer roles.

## 1. Citizen Flow

Citizens can view, reschedule, and cancel their appointments related to CPF requests.

### 1.1. Viewing Appointments

- **Initiation:** Citizen accesses the "My Appointments" section in their dashboard.
- **Process:** The frontend (`AppointementsComponent`) calls `AppointmentService.getAppointments()`.
- **Backend:** The backend (`appointment.controller.js`, `appointment.routes.js`) fetches appointments associated with the logged-in user (`getAppointmentsByUser`), populating relevant details like `location`.
- **Display:** Appointments with statuses (`scheduled`, `completed`, `cancelled`, `missed`) are displayed. Details like date, time, service, and location are shown.
- **Related Features:** [User Profile](#), [CPF Request](#).

### 1.2. Rescheduling Appointments

- **Initiation:** Citizen selects a "Reschedule" option for an appointment (currently implemented for `cancelled` status).
- **Process:** Citizen provides a new date/time (frontend UI allows picking date). The frontend calls `AppointmentService.rescheduleRejectedAppointment()` (note: the service method name is slightly mismatched with current logic, but handles the request).
- **Backend:** The backend (`appointment.controller.js`, `appointment.routes.js`) method (`rescheduleAppointment`) receives the new date.
  - It finds the appointment and its linked CPF request.
  - Validates the new date against the associated `Center`'s working hours and checks for available slots using `CenterSchedule`.
  - If valid, it updates the `appointmentDate`, sets the `status` back to `scheduled`, and updates the `CenterSchedule` (removing the old slot, adding the new one).
  - The linked `CpfRequest`'s `appointmentDate` is also updated, and its `status` is potentially reset from `completed` to `approved`.
- **Related Features:** [Center Management](#), [Center Schedule Management](#), [CPF Request](#).

### 1.3. Cancelling Appointments

- **Initiation:** Citizen selects a "Delete" option for an appointment (frontend currently labels it as delete but backend marks as cancelled, matching the status enum).
- **Process:** The frontend (`AppointementsComponent`) calls `AppointmentService.deleteAppointment()`.
- **Backend:** The backend (`appointment.controller.js`, `appointment.routes.js`) method (`deleteAppointment`) finds the appointment.
  - (Note: The current backend implementation of `deleteAppointment` actually _deletes_ the appointment and sets CPF request status to `pending`. This deviates from the agreed plan to _cancel_ it and set status to `cancelled`/`rejected` depending on officer action. The `cancelAppointment` method exists but isn't directly linked to citizen delete. A correction might be needed here if "cancel" means just changing status). Assuming "delete" from citizen view should _cancel_ the appointment:
  - It should ideally call the `cancelAppointment` logic.
  - The `cancelAppointment` method sets the `appointment.status` to `cancelled`.
  - It does NOT currently modify the linked CPF request status. This is an inconsistency with the officer flow where rejection (similar outcome) sets CPF status to `rejected`. This should be reviewed.
- **Related Features:** [CPF Request](#).

## 2. Officer Flow

Officers manage appointments primarily through the "Requests" section, validating or rejecting appointments linked to pending CPF requests, and viewing appointments with various statuses.

### 2.1. Viewing Appointments (Officer View)

- **Initiation:** Officer accesses the "Requests" section in their dashboard (`OfficerRequestsComponent`).
- **Process:** The frontend calls `AppointmentService.getAllAppointmentsOfficer()` with filters (status, date, center) and pagination.
- **Backend:** The backend (`appointment.controller.js`, `appointment.routes.js`) route for `/officer/appointments` is used. The associated controller method fetches appointments, allowing filtering by `status`, date, and `location` (center). It populates `userId` (citizen) and `cpfRequestId`.
- **Display:** Appointments are listed in a table. Details include Citizen name, Date, Status (`scheduled`, `completed`, `cancelled`, `missed`), and Center name. Filtering options are available.
- **Related Features:** [User Management](#), [Center Management](#).

### 2.2. Validating Appointments

- **Initiation:** Officer views an appointment linked to a `pending` CPF Request and clicks "Validate".
- **Process:** The frontend (`OfficerRequestsComponent`) checks if the linked `cpfRequestId` is populated and its status is `pending` using the `isPendingCpfRequest` helper. If true, the button is shown. Clicking it calls `AppointmentService.validateAppointment()`.
- **Backend:** The backend method (`validateAppointment`) finds the appointment by ID, populating its `cpfRequestId`.
  - It sets the `appointment.status` to `scheduled`.
  - If the linked `cpfRequestId` exists and its `status` is `pending`, it updates the `cpfRequestId.status` to `approved`.
- **Related Features:** [CPF Request](#).

### 2.3. Rejecting Appointments

- **Initiation:** Officer views an appointment linked to a `pending` CPF Request and clicks "Reject".
- **Process:** Similar to validation, the frontend checks `isPendingCpfRequest`. Clicking calls `AppointmentService.rejectAppointment()`.
- **Backend:** The backend method (`rejectAppointment`) finds the appointment by ID, populating its `cpfRequestId`.
  - It sets the `appointment.status` to `cancelled`.
  - If the linked `cpfRequestId` exists and its `status` is `pending`, it updates the `cpfRequestId.status` to `rejected`.
- **Related Features:** [CPF Request](#).

---

**Note on Statuses:**

- **Appointment Statuses:** `scheduled`, `completed`, `cancelled`, `missed` (defined in `backend/app/models/appointment.model.js` and `src/app/core/services/appointment.service.ts` interface).
- **CPF Request Statuses:** `pending`, `approved`, `rejected`, `completed` (defined in `backend/app/models/cpfRequest.model.js`).

The flow demonstrates how officer actions on appointments (`validate`/`reject`) directly influence the linked CPF Request status.

---

_To be improved: Link placeholders need to be updated with actual paths/references if a documentation site is built._
