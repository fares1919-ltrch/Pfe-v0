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
