# 📱 Hatchery Scanner — Mobile Web & PWA

Application mobile industrielle de traçabilité et de scanning par QR Code pour le couvoir **SOCOM / Hatchery**.

---

## 🔗 Architecture & Traçabilité Industrielle

Le système suit le cycle complet sans suivi lourd "plateau par plateau", mais selon le flux industriel éprouvé :
```
LOT (OAC) ➔ CHARIOTS (1500 œufs) ➔ INCUBATEURS ➔ MIRAGE ➔ TRANSFERT ➔ ÉCLOSOIRS ➔ ÉCLOSION
```

1. **🥚 Étape 1 : Réception OAC**
   - Création du Lot (Code Rotation, Origine, Souche, Âge reproductrices, Quantité reçue).
   - Génération instantanée du QR Code du Lot (`LOT-2026-XXXX`).

2. **⚖️ Étape 2 : Triage OAC**
   - Scan du QR Code du Lot.
   - Saisie Acceptés / Rejets.
   - **Répartition sur Chariots** (ex: 3 000 œufs répartis sur 2 chariots de 1 500).
   - Génération d'un QR Code indépendant par Chariot (`CH-XXXX`).

3. **🏭 Étape 3 : Incubation**
   - Scan QR Code du Chariot à l'entrée de la salle d'incubation.
   - Affectation de l'Incubateur (ex: Incubateur 05), date et heure.
   - Calcul automatique des dates de transfert (J18) et d'éclosion (J21).

4. **🔎 Étape 4 : Mirage OAC**
   - Scan QR Code du Chariot.
   - Le système affiche directement l'historique du chariot et son incubateur.
   - Saisie rapide des 6 plateaux d'échantillonnage (P3, P9, P14, P19, P25, P30).
   - Calcul instantané de la fertilité % et des clairs %.

5. **🚚 Étape 5 : Transfert vers Éclosoir**
   - Scan QR Code du Chariot au 18ème jour.
   - Sélection de l'Éclosoir de destination (Éclosoir 01 à 06) et heure de transfert.
   - Enregistrement du passage : `Incubateur ➔ Transfert ➔ Éclosoir`.

6. **🐣 Étape 6 : Éclosion & Sortie Poussins**
   - Scan QR Code du Chariot.
   - **Détection multi-lots** : supporte plusieurs lots dans un même chariot (ex: Lot A 750 + Lot B 750).
   - Saisie par lot : Poussins 1er choix, 2ème choix / rebuts, morts en coquille, bêchés.
   - Calcul automatique du taux d'éclosion %.
   - Synchronisation en direct avec la base Supabase Cloud.

---

## 🚀 Technologies

- **Framework** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **PWA & Mobile** : Manifest PWA, affichage plein écran mobile
- **Lecteur Optique** : `html5-qrcode` avec viseur laser, support du flash (lampe torche) et saisie manuelle de secours
- **Audio & Haptique** : API Web Audio (bips sonores 880Hz / 1200Hz et vibration)
- **Base de Données** : Supabase PostgreSQL Cloud partagé avec le Dashboard PC Hatchery

---

## 💻 Démarrage Local

```bash
# 1. Installation des dépendances
bun install # ou npm install

# 2. Configuration des variables d'environnement (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://dnnbswqpobvqxmozznra.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Lancer en mode développement
bun run dev
# Ouvrir http://localhost:3001
```

---

## 🌐 Déploiement

Cette application peut être déployée en 1 clic sur **Vercel** ou connectée directement au dépôt GitHub :
`https://github.com/pitchu213-sys/hatchery-scanner`
