# 📱 Hatchery Scanner — Application Mobile de Traçabilité & Mirage

Application mobile professionnelle conçue pour les opérateurs et techniciens de couvoir. Elle permet de scanner les codes-barres métalliques des chariots d'incubation, d'assurer une traçabilité complète de l'œuf au poussin, et d'enregistrer le mirage directement au pied du chariot.

---

## 🚀 Fonctionnalités Clés

### 1. 🔍 Mode Identification & Traçabilité Rapide
* Pointez la caméra vers la plaque métallique ou le code-barres d'un chariot.
* Signal sonore (**BEEP**) et retour haptique (**Vibration**) instantanés.
* Affichage immédiat de la fiche technique :
  * **Numéro du chariot** (ex: `0130000917` ou `Chariot #1`)
  * **Statut en temps réel** : *En Incubation*, *À Mirer*, *Miré & Transféré*, ou *Chariot Libre*
  * **Lot & Souche** (ex: `Lot A4`, `Arbor Acres`, `Bâtiment avia 4`)
  * **Dates clés** : Date d'incubation, date de transfert/mirage, date d'éclosion
  * **Quantité OAC** (ex: `4 800 œufs`)

### 2. 🥚 Mode Incubation (Mise en Chariots Continue)
* Sélection de la session d'incubation en cours.
* Numérisation continue des chariots qui entrent dans les incubateurs.
* Compteur dynamique en temps réel (`1/8 chariots`, `2/8 chariots`...).
* Détection automatique et blocage des doublons (impossible de scanner deux fois le même chariot).

### 3. 🔦 Mode Mirage & Transfert (Saisie Mobile au Pied du Chariot)
* Scannez le chariot à mirer le jour du transfert.
* Saisie rapide des œufs clairs sur les **6 plateaux verticaux** (`P3`, `P9`, `P14`, `P19`, `P25`, `P30`) via des boutons `+` / `-` tactiles.
* Calculs en direct :
  * Nombre total d'œufs clairs extrapolés (`somme * 16 / 3`)
  * Taux de clairs & **% Fertilité globale**
  * **Nombre de poussins prévus**
* Enregistrement en 1 clic synchronisé avec le tableau de bord central (`mirage_lignes`).

### 4. 📶 Mode Hors-Ligne (Offline-First) & Synchronisation
* Fonctionnement continu même dans les salles isolées ou sans signal Wi-Fi.
* Sauvegarde locale automatique dans la mémoire du téléphone (`AsyncStorage`).
* Écran de synchronisation dédié : envoi groupé vers **Supabase** dès la reconnexion au réseau.

---

## 🛠️ Démarrage Rapide

### Prérequis :
1. Téléchargez l'application gratuite **Expo Go** sur votre smartphone :
   * [Expo Go sur Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   * [Expo Go sur l'App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)

### Lancement du projet :
```bash
# Dans le dossier hatchery-scanner :
bun start
# ou
npm start
```

2. Scannez le **QR Code** qui apparaît dans votre terminal avec l'application **Expo Go** (ou avec l'appareil photo sur iPhone).
3. L'application se charge immédiatement sur votre téléphone !
