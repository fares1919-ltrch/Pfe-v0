# Guide des interfaces d'aperçu citoyen

Ce document décrit les différentes interfaces du composant d'aperçu citoyen (Citizen Overview) et le document d'exportation CPF pour le système Identity Secure.

## Table des matières

1. [Composant d'aperçu citoyen](#1-composant-daperçu-citoyen)
   - [Cas 1: CPF généré](#cas-1-cpf-généré)
   - [Cas 2: CPF non généré](#cas-2-cpf-non-généré)
   - [Cas 3: Fraude détectée](#cas-3-fraude-détectée)
2. [Document d'exportation CPF](#2-document-dexportation-cpf)
3. [Implémentation technique](#3-implémentation-technique)

## 1. Composant d'aperçu citoyen

Le composant d'aperçu citoyen est une interface clé qui affiche les informations essentielles d'un citoyen. Il existe trois variantes principales de cette interface selon le statut du CPF.

### Cas 1: CPF généré

Cette interface s'affiche lorsque le citoyen a un CPF valide généré dans le système.

#### Contenu de l'interface

```typescript
// citizen-overview.component.ts
export interface CitizenWithCPF {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Informations CPF
  cpf: {
    number: string;
    issueDate: Date;
    expiryDate: Date;
    status: "active" | "suspended" | "expired";
  };

  // Informations de déduplication
  deduplicationStatus: "verified";
  deduplicationDate: Date;

  // Informations du rendez-vous
  appointment: {
    date: Date;
    location: string;
    officerName: string;
  };
}
```

#### Maquette de l'interface

```
+-------------------------------------------------------+
|                 APERÇU DU CITOYEN                     |
+-------------------------------------------------------+
|                                                       |
| [Photo]  Nom complet: João Silva                      |
|          N° d'identité: 123456789                     |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| INFORMATIONS CPF                                      |
| ----------------                                      |
| Numéro CPF: 123.456.789-00                           |
| Date d'émission: 15/05/2023                          |
| Date d'expiration: 15/05/2033                        |
| Statut: ACTIF                                         |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| VÉRIFICATION BIOMÉTRIQUE                              |
| ----------------------                                |
| Statut: VÉRIFIÉ                                       |
| Date de vérification: 10/05/2023                     |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| RENDEZ-VOUS                                           |
| -----------                                           |
| Date: 05/05/2023                                      |
| Lieu: Centre Rio de Janeiro                           |
| Officier: Maria Oliveira                              |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| [Exporter CPF] [Signaler un problème]                 |
|                                                       |
+-------------------------------------------------------+
```

### Cas 2: CPF non généré

Cette interface s'affiche lorsque le citoyen n'a pas encore de CPF généré dans le système.

#### Contenu de l'interface

```typescript
// citizen-overview.component.ts
export interface CitizenWithoutCPF {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Statut de la demande CPF
  cpfRequest: {
    status: "pending" | "approved" | "scheduled";
    requestDate: Date;
  };

  // Informations du rendez-vous (si programmé)
  appointment?: {
    date: Date;
    location: string;
    status: "scheduled" | "completed" | "missed";
  };
}
```

#### Maquette de l'interface

```
+-------------------------------------------------------+
|                 APERÇU DU CITOYEN                     |
+-------------------------------------------------------+
|                                                       |
| [Photo]  Nom complet: João Silva                      |
|          N° d'identité: 123456789                     |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| STATUT DE LA DEMANDE CPF                              |
| ----------------------                                |
| Statut: EN ATTENTE                                    |
| Date de demande: 01/05/2023                          |
|                                                       |
| [!] Le CPF n'a pas encore été généré                  |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| RENDEZ-VOUS                                           |
| -----------                                           |
| Date: 15/05/2023                                      |
| Lieu: Centre Rio de Janeiro                           |
| Statut: PROGRAMMÉ                                     |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| PROCHAINES ÉTAPES                                     |
| ---------------                                       |
| 1. Se présenter au rendez-vous avec les documents     |
| 2. Collecte des données biométriques                  |
| 3. Vérification et génération du CPF                  |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| [Modifier rendez-vous] [Annuler demande]              |
|                                                       |
+-------------------------------------------------------+
```

### Cas 3: Fraude détectée

Cette interface s'affiche lorsqu'une fraude potentielle a été détectée lors du processus de déduplication.

#### Contenu de l'interface

```typescript
// citizen-overview.component.ts
export interface CitizenWithFraud {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;

  // Informations de fraude
  fraudDetails: {
    detectionDate: Date;
    status: "under_investigation" | "confirmed" | "appealed";
    type: "identity_theft" | "duplicate_registration" | "document_forgery";
    caseNumber: string;
    matchedWith?: {
      userId: string;
      similarityScore: number;
    };
  };

  // Informations du rendez-vous
  appointment: {
    date: Date;
    location: string;
    officerName: string;
  };
}
```

#### Maquette de l'interface

```
+-------------------------------------------------------+
|                 APERÇU DU CITOYEN                     |
|                [ALERTE DE FRAUDE]                     |
+-------------------------------------------------------+
|                                                       |
| [Photo]  Nom complet: João Silva                      |
|          N° d'identité: 123456789                     |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| DÉTAILS DE LA FRAUDE                                  |
| ------------------                                    |
| Type: DOUBLE ENREGISTREMENT                           |
| Date de détection: 10/05/2023                        |
| Statut: SOUS INVESTIGATION                            |
| N° de dossier: FR-2023-12345                         |
|                                                       |
| [!] La génération de CPF est suspendue                |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| CORRESPONDANCE DÉTECTÉE                               |
| ----------------------                                |
| Score de similarité: 92%                              |
| Biométrie: Empreintes digitales, Visage               |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| RENDEZ-VOUS INITIAL                                   |
| -----------------                                     |
| Date: 05/05/2023                                      |
| Lieu: Centre Rio de Janeiro                           |
| Officier: Maria Oliveira                              |
|                                                       |
+-------------------------------------------------------+
|                                                       |
| [Contester] [Voir détails complets]                   |
|                                                       |
+-------------------------------------------------------+
```

## 2. Document d'exportation CPF

Le document d'exportation CPF est un document officiel qui contient toutes les informations relatives au CPF d'un citoyen.

### Structure du document

```typescript
// cpf-document.model.ts
export interface CPFDocument {
  // En-tête
  header: {
    logo: string;
    documentTitle: string;
    documentId: string;
    generationDate: Date;
  };

  // Informations personnelles
  personalInfo: {
    fullName: string;
    photo: string;
    identityNumber: string;
    birthDate: Date;
    nationality: string;
  };

  // Informations CPF
  cpfInfo: {
    number: string;
    issueDate: Date;
    expiryDate: Date;
    status: string;
    qrCode: string; // Pour vérification
  };

  // Informations de collecte
  collectionInfo: {
    appointmentDate: Date;
    appointmentLocation: string;
    officerName: string;
    officerBadge: string;
  };

  // Informations biométriques
  biometricInfo: {
    collectionDate: Date;
    verificationDate: Date;
    collectedTypes: string[]; // ex: ['fingerprints', 'face', 'iris']
  };

  // Pied de page
  footer: {
    legalText: string;
    verificationUrl: string;
    contactInfo: string;
  };
}
```

### Maquette du document

```
+-------------------------------------------------------+
|                                                       |
|  [Logo]        RÉPUBLIQUE FÉDÉRATIVE DU BRÉSIL        |
|                                                       |
|           CERTIFICAT DE PERSONNE PHYSIQUE             |
|                      (CPF)                            |
|                                                       |
|  Document #: DOC-2023-123456         Date: 15/05/2023 |
+-------------------------------------------------------+
|                                                       |
|  [Photo]    NOM: JOÃO SILVA                           |
|             IDENTITÉ: 123456789                       |
|             DATE DE NAISSANCE: 10/01/1985             |
|             NATIONALITÉ: BRÉSILIENNE                  |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  NUMÉRO CPF: 123.456.789-00                          |
|  DATE D'ÉMISSION: 15/05/2023                         |
|  DATE D'EXPIRATION: 15/05/2033                       |
|  STATUT: ACTIF                                        |
|                                                       |
|  [QR Code]                                            |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  INFORMATIONS DE COLLECTE                             |
|  ------------------------                             |
|  DATE DU RENDEZ-VOUS: 05/05/2023                     |
|  LIEU: CENTRE RIO DE JANEIRO                          |
|  OFFICIER: MARIA OLIVEIRA (BADGE: OFF-12345)          |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  INFORMATIONS BIOMÉTRIQUES                            |
|  ------------------------                             |
|  DATE DE COLLECTE: 05/05/2023                        |
|  DATE DE VÉRIFICATION: 10/05/2023                    |
|  TYPES COLLECTÉS: EMPREINTES, VISAGE, IRIS            |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|  Ce document est officiel. La falsification est un    |
|  crime selon la loi brésilienne.                      |
|                                                       |
|  Vérifiez l'authenticité: https://cpf.gov.br/verify   |
|  Contact: support@cpf.gov.br | Tel: +55 0800 123 456  |
|                                                       |
+-------------------------------------------------------+
```

## 3. Implémentation technique

### Composants Angular

```typescript
// citizen-overview.component.ts
@Component({
  selector: "app-citizen-overview",
  templateUrl: "./citizen-overview.component.html",
  styleUrls: ["./citizen-overview.component.scss"],
})
export class CitizenOverviewComponent implements OnInit {
  @Input() citizenId: string;

  citizen: CitizenWithCPF | CitizenWithoutCPF | CitizenWithFraud;
  viewMode: "cpf_generated" | "cpf_pending" | "fraud_detected";

  constructor(
    private citizenService: CitizenService,
    private cpfService: CPFService,
    private exportService: ExportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadCitizenData();
  }

  loadCitizenData() {
    this.citizenService.getCitizenById(this.citizenId).subscribe(
      (data) => {
        this.citizen = data;
        this.determineViewMode();
      },
      (error) => {
        this.notificationService.showError(
          "Erreur lors du chargement des données du citoyen"
        );
      }
    );
  }

  determineViewMode() {
    if ("fraudDetails" in this.citizen) {
      this.viewMode = "fraud_detected";
    } else if ("cpf" in this.citizen && this.citizen.cpf.number) {
      this.viewMode = "cpf_generated";
    } else {
      this.viewMode = "cpf_pending";
    }
  }

  exportCPFDocument() {
    if (this.viewMode !== "cpf_generated") {
      this.notificationService.showWarning("Le CPF n'est pas encore généré");
      return;
    }

    this.exportService.generateCPFDocument(this.citizenId).subscribe(
      (documentUrl) => {
        window.open(documentUrl, "_blank");
      },
      (error) => {
        this.notificationService.showError(
          "Erreur lors de l'exportation du document CPF"
        );
      }
    );
  }

  contestFraud() {
    if (this.viewMode !== "fraud_detected") {
      return;
    }

    // Rediriger vers le formulaire de contestation
    this.router.navigate(["/fraud-contest", this.citizenId]);
  }

  rescheduleAppointment() {
    if (this.viewMode !== "cpf_pending") {
      return;
    }

    // Ouvrir le modal de reprogrammation
    this.modalService.open("appointment-reschedule-modal", {
      data: { citizenId: this.citizenId },
    });
  }

  cancelRequest() {
    if (this.viewMode !== "cpf_pending") {
      return;
    }

    this.confirmationService.confirm({
      message: "Êtes-vous sûr de vouloir annuler cette demande de CPF?",
      accept: () => {
        this.cpfService.cancelRequest(this.citizenId).subscribe(
          () => {
            this.notificationService.showSuccess("Demande annulée avec succès");
            this.router.navigate(["/dashboard"]);
          },
          (error) => {
            this.notificationService.showError(
              "Erreur lors de l'annulation de la demande"
            );
          }
        );
      },
    });
  }
}
```

### Service d'exportation

```typescript
// export.service.ts
@Injectable({
  providedIn: "root",
})
export class ExportService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  generateCPFDocument(citizenId: string): Observable<string> {
    return this.http
      .post<{ documentUrl: string }>(
        `/api/citizens/${citizenId}/export-cpf`,
        {}
      )
      .pipe(map((response) => response.documentUrl));
  }

  downloadDocument(documentUrl: string): Observable<Blob> {
    return this.http.get(documentUrl, {
      responseType: "blob",
    });
  }
}
```

## 4. Conseils d'implémentation

### Gestion des différents états

Pour gérer efficacement les trois états différents du composant d'aperçu citoyen:

1. **Utilisez des templates conditionnels** dans Angular:

   ```html
   <div *ngIf="viewMode === 'cpf_generated'">
     <!-- Template pour CPF généré -->
   </div>

   <div *ngIf="viewMode === 'cpf_pending'">
     <!-- Template pour CPF en attente -->
   </div>

   <div *ngIf="viewMode === 'fraud_detected'">
     <!-- Template pour fraude détectée -->
   </div>
   ```

2. **Appliquez des styles différents** selon l'état:

   ```scss
   .citizen-card {
     &.generated {
       border-left: 4px solid green;
     }

     &.pending {
       border-left: 4px solid orange;
     }

     &.fraud {
       border-left: 4px solid red;
     }
   }
   ```

3. **Utilisez des guards de route** pour contrôler l'accès aux différentes vues selon le rôle de l'utilisateur.

### Sécurité du document d'exportation

Pour sécuriser le document CPF exporté:

1. **Ajoutez un filigrane** avec la date et l'heure d'exportation
2. **Incluez un QR code** pour la vérification en ligne
3. **Limitez le nombre d'exportations** par période
4. **Journalisez toutes les exportations** pour audit
