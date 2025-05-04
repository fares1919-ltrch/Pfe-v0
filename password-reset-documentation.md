# Documentation du système de réinitialisation de mot de passe

## Vue d'ensemble

Le système de réinitialisation de mot de passe permet aux utilisateurs de récupérer l'accès à leur compte lorsqu'ils ont oublié leur mot de passe. Il offre deux méthodes de vérification :

1. **Lien de réinitialisation** : Un lien unique envoyé par email qui redirige l'utilisateur vers la page de création d'un nouveau mot de passe.
2. **Code de vérification** : Un code numérique à 6 chiffres que l'utilisateur peut saisir manuellement.

Ces deux méthodes sont liées au même token de réinitialisation et ont la même durée de validité (1 heure).

## Architecture du système

### Composants backend

1. **Contrôleur de mot de passe** (`password.controller.js`)
   - Gère les demandes de réinitialisation de mot de passe
   - Génère les tokens et codes de vérification
   - Vérifie les codes et tokens
   - Met à jour les mots de passe

2. **Routes de mot de passe** (`password.routes.js`)
   - Définit les endpoints API pour la réinitialisation de mot de passe
   - Applique des limiteurs de taux pour prévenir les abus

3. **Modèle utilisateur** (`user.model.js`)
   - Stocke les tokens de réinitialisation et leur date d'expiration

### Composants frontend

1. **Service d'authentification** (`auth.service.ts`)
   - Communique avec les API de réinitialisation de mot de passe

2. **Composant "Mot de passe oublié"** (`forgot-password.component.ts`)
   - Interface pour demander une réinitialisation de mot de passe

3. **Composant de réinitialisation de mot de passe** (`reset-password.component.ts`)
   - Interface pour saisir le code de vérification

4. **Composant de nouveau mot de passe** (`new-password.component.ts`)
   - Interface pour définir un nouveau mot de passe

## Flux de réinitialisation de mot de passe

### 1. Demande de réinitialisation

1. L'utilisateur accède à la page "Mot de passe oublié" et saisit son adresse email.
2. Le frontend envoie une requête à l'API `/api/password/forgot`.
3. Le backend :
   - Vérifie si l'email existe dans la base de données
   - Génère un token de réinitialisation aléatoire
   - Hache le token et le stocke dans la base de données avec une date d'expiration
   - Génère un code de vérification à 6 chiffres basé sur l'email et le token haché
   - Envoie un email contenant le lien de réinitialisation et le code de vérification
4. L'utilisateur est redirigé vers la page de saisie du code de vérification.

### 2. Vérification du code

1. L'utilisateur saisit le code de vérification à 6 chiffres reçu par email.
2. Le frontend envoie une requête à l'API `/api/password/verify-code` avec l'email et le code.
3. Le backend :
   - Récupère l'utilisateur par email
   - Vérifie que le token de réinitialisation n'a pas expiré
   - Régénère le code de vérification en utilisant la même méthode qu'à l'étape 1
   - Compare le code généré avec celui fourni par l'utilisateur
   - Si les codes correspondent, renvoie le token haché au frontend
4. L'utilisateur est redirigé vers la page de création d'un nouveau mot de passe.

### 3. Réinitialisation du mot de passe

1. L'utilisateur saisit et confirme son nouveau mot de passe.
2. Le frontend envoie une requête à l'API `/api/password/reset` avec le token et le nouveau mot de passe.
3. Le backend :
   - Vérifie que le token est valide et n'a pas expiré
   - Hache le nouveau mot de passe
   - Met à jour le mot de passe de l'utilisateur
   - Efface le token de réinitialisation et sa date d'expiration
4. L'utilisateur est redirigé vers la page de connexion avec un message de succès.

## Détails techniques

### Génération du token de réinitialisation

```javascript
// Génération d'un token aléatoire
const resetToken = crypto.randomBytes(32).toString("hex");

// Hachage du token pour le stockage
user.resetPasswordToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

// Définition de la date d'expiration (1 heure)
user.resetPasswordExpires = Date.now() + 3600000;
```

### Génération du code de vérification

```javascript
// Création d'une graine déterministe basée sur l'email et une partie du token haché
const seed = user.email + user.resetPasswordToken.substring(0, 16);
const seedHash = crypto.createHash("sha256").update(seed).digest("hex");

// Génération d'un code à 6 chiffres à partir du hash
const verificationCode = parseInt(seedHash.substring(0, 8), 16) % 1000000;
const formattedVerificationCode = verificationCode.toString().padStart(6, "0");
```

### Vérification du code

```javascript
// Récupération de l'utilisateur par email
const user = await User.findOne({
  email,
  resetPasswordExpires: { $gt: Date.now() },
});

// Régénération du code de vérification
const seed = user.email + user.resetPasswordToken.substring(0, 16);
const seedHash = crypto.createHash("sha256").update(seed).digest("hex");
const expectedCode = parseInt(seedHash.substring(0, 8), 16) % 1000000;
const formattedExpectedCode = expectedCode.toString().padStart(6, "0");

// Comparaison avec le code fourni
if (code !== formattedExpectedCode) {
  return res.status(400).json({ message: "Invalid verification code!" });
}
```

### Réinitialisation du mot de passe

```javascript
// Vérification du token
const resetPasswordToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const user = await User.findOne({
  resetPasswordToken,
  resetPasswordExpires: { $gt: Date.now() },
});

// Mise à jour du mot de passe
user.password = bcrypt.hashSync(password, 8);
user.resetPasswordToken = undefined;
user.resetPasswordExpires = undefined;

await user.save();
```

## Mesures de sécurité

1. **Limitation de taux** : Les demandes de réinitialisation sont limitées à 3 par heure par adresse IP pour prévenir les attaques par force brute.

```javascript
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // limite chaque IP à 3 requêtes par fenêtre
  message: {
    message: "Trop de demandes de réinitialisation de mot de passe depuis cette IP, veuillez réessayer après une heure",
  },
});
```

2. **Expiration des tokens** : Les tokens et codes de vérification expirent après 1 heure.

3. **Hachage des tokens** : Les tokens de réinitialisation sont hachés avant d'être stockés dans la base de données.

4. **Vérification en deux étapes** : L'utilisateur doit avoir accès à son email et connaître le code de vérification.

5. **Journalisation des erreurs** : Les erreurs sont enregistrées pour faciliter la détection des tentatives d'abus.

## API Endpoints

### 1. Demande de réinitialisation de mot de passe

**Endpoint** : `POST /api/password/forgot`

**Corps de la requête** :
```json
{
  "email": "utilisateur@exemple.com"
}
```

**Réponse réussie** :
```json
{
  "message": "Password reset email sent!"
}
```

### 2. Vérification du code

**Endpoint** : `POST /api/password/verify-code`

**Corps de la requête** :
```json
{
  "email": "utilisateur@exemple.com",
  "code": "123456"
}
```

**Réponse réussie** :
```json
{
  "message": "Verification successful!",
  "token": "hashed_token_value"
}
```

### 3. Réinitialisation du mot de passe

**Endpoint** : `POST /api/password/reset`

**Corps de la requête** :
```json
{
  "token": "token_value",
  "password": "nouveau_mot_de_passe"
}
```

**Réponse réussie** :
```json
{
  "message": "Password has been reset!"
}
```

## Interface utilisateur

### Page "Mot de passe oublié"

- Champ pour saisir l'adresse email
- Bouton "Envoyer les instructions de réinitialisation"
- Lien pour revenir à la page de connexion

### Page de vérification du code

- Champ pour saisir le code de vérification à 6 chiffres
- Bouton "Vérifier le code"
- Option "Renvoyer le code" (avec délai de 30 secondes entre les envois)
- Affichage des messages d'erreur
- Lien pour revenir à la page "Mot de passe oublié"

### Page de nouveau mot de passe

- Champ pour saisir le nouveau mot de passe
- Champ pour confirmer le nouveau mot de passe
- Bouton "Réinitialiser le mot de passe"
- Affichage des messages d'erreur

## Bonnes pratiques et recommandations

1. **Ne pas révéler d'informations sensibles** : En cas d'email inexistant, afficher le même message que pour un email valide pour éviter la divulgation d'informations.

2. **Utiliser HTTPS** : Toutes les communications doivent être sécurisées par HTTPS.

3. **Valider les entrées** : Valider toutes les entrées utilisateur côté client et serveur.

4. **Journaliser les activités** : Enregistrer toutes les tentatives de réinitialisation de mot de passe pour détecter les abus.

5. **Notifier l'utilisateur** : Envoyer une notification à l'utilisateur lorsque son mot de passe a été modifié.

6. **Exiger des mots de passe forts** : Imposer des exigences de complexité pour les nouveaux mots de passe.

7. **Déconnecter les autres sessions** : Envisager de déconnecter toutes les sessions actives après une réinitialisation de mot de passe.

## Conclusion

Le système de réinitialisation de mot de passe offre une expérience utilisateur flexible et sécurisée. En proposant à la fois un lien de réinitialisation et un code de vérification, il s'adapte aux préférences des utilisateurs tout en maintenant un niveau de sécurité élevé. Les mesures de sécurité mises en place, comme la limitation de taux et l'expiration des tokens, protègent contre les attaques courantes.
