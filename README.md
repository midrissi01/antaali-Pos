# Antaali POS - Point de Vente

Système de point de vente (POS) pour la gestion des parfums avec gestion des achats et du stock.

## Fonctionnalités

- **Point de Vente (POS)** : Interface de caisse avec panier et gestion des paiements
- **Gestion du Stock** : Visualisation en temps réel du stock avec alertes de stock faible
- **Gestion des Achats** : Enregistrement des achats fournisseurs avec mise à jour automatique du stock
- **Rapports** : Statistiques et rapports de vente (à venir)

## Technologies

- React 19 + TypeScript
- Vite (build tool)
- Ant Design (UI components)
- Styled Components (styling)
- Axios (API calls)
- React Router (routing)

## Installation

1. Cloner le repository
2. Copier `.env.example` vers `.env` et configurer l'URL de l'API backend
3. Installer les dépendances :

```bash
npm install
```

## Développement

Lancer le serveur de développement :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Build

Construire pour la production :

```bash
npm run build
```

## Architecture

```
src/
├── components/        # Composants réutilisables
│   └── Layout/       # Layout principal avec navigation
├── pages/            # Pages de l'application
│   ├── POS/          # Point de vente
│   ├── Stock/        # Gestion du stock
│   └── Purchases/    # Gestion des achats
├── services/         # Services API
│   └── api.ts        # Configuration Axios et endpoints
├── types/            # Types TypeScript
└── App.tsx           # Composant racine avec routing

```

## Structure des fichiers

Chaque composant/page suit la structure :
- `Component.tsx` - Composant React
- `Component.styles.ts` - Styles styled-components

## Configuration API

Modifier `.env` pour pointer vers votre backend Django :

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Endpoints API attendus

- `GET /categories/` - Liste des catégories
- `GET /perfumes/` - Liste des parfums
- `GET /variants/` - Liste des variantes de produits
- `POST /sales/` - Créer une vente
- `GET /sales/` - Liste des ventes
- `POST /purchases/` - Créer un achat
- `GET /purchases/` - Liste des achats
