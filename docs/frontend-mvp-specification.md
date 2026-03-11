# Frontend MVP Specification - Zentracker

## Vue d'ensemble du flux utilisateur

Le MVP Zentracker implémente un flux simple et efficace :
**Login → Tracking → Dashboard** avec navigation persistante.

## 1. Architecture des routes (Next.js App Router)

### Structure de navigation
```
/                    # Redirect to /login if not authenticated, /app/tracking if authenticated
/login               # Authentication page
/register           # User registration (optional for MVP)
/app                # Protected layout with navigation
  /tracking         # Main timer interface (default authenticated page)
  /dashboard        # Time summaries and reports
  /profile          # User settings (minimal for MVP)
```

### Protection des routes
- **Routes publiques**: `/`, `/login`, `/register`
- **Routes protégées**: Toutes les routes sous `/app/*`
- **Redirection automatique**:
  - Utilisateur non authentifié → `/login`
  - Utilisateur authentifié → `/app/tracking`

## 2. États nécessaires dans le store global

### 2.1 État d'authentification (`authStore`)
```typescript
interface AuthState {
  // User data
  user: User | null
  isAuthenticated: boolean

  // Token management
  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: Date | null

  // Loading states
  isLoading: boolean
  isLoggingIn: boolean
  isLoggingOut: boolean

  // Error handling
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<void>
  clearError: () => void
}
```

### 2.2 État du timer (`timerStore`)
```typescript
interface TimerState {
  // Current timer
  currentTimer: Timer | null
  isRunning: boolean
  elapsedTime: number // seconds since start

  // Timer management
  isStarting: boolean
  isStopping: boolean

  // Project/task context
  selectedProject: Project | null
  selectedTask: Task | null
  description: string

  // Error handling
  error: string | null

  // Actions
  startTimer: (projectId?: string, taskId?: string, description?: string) => Promise<void>
  stopTimer: () => Promise<void>
  updateDescription: (description: string) => void
  updateElapsedTime: () => void
  clearError: () => void
}
```

### 2.3 État des données (`dataStore`)
```typescript
interface DataState {
  // Time entries
  recentEntries: TimeEntry[]
  totalEntriesToday: number
  isLoadingEntries: boolean

  // Projects
  projects: Project[]
  isLoadingProjects: boolean

  // Dashboard data
  dashboardSummary: DashboardSummary | null
  isLoadingDashboard: boolean

  // Actions
  fetchRecentEntries: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchDashboardSummary: (period?: 'day' | 'week' | 'month') => Promise<void>
  refreshData: () => Promise<void>
}
```

## 3. Interactions essentielles

### 3.1 Flux d'authentification
1. **Login**:
   - Form validation en temps réel
   - Loading state avec bouton désactivé
   - Gestion d'erreurs avec messages clairs
   - Auto-redirection vers `/app/tracking` après succès

2. **Logout**:
   - Confirmation modal (optionnel pour MVP)
   - Nettoyage du store et localStorage
   - Redirection vers `/login`

3. **Gestion des erreurs**:
   - Token expiré → refresh automatique ou logout
   - Erreurs réseau → retry avec backoff
   - Erreurs serveur → messages utilisateur appropriés

### 3.2 Gestion du timer
1. **Démarrage du timer**:
   - Vérification qu'aucun timer n'est actif
   - Sélection optionnelle de projet/tâche
   - Feedback immédiat avec UI mise à jour
   - Gestion d'erreur si démarrage échoue

2. **Timer en cours**:
   - Mise à jour temps réel (toutes les secondes)
   - Affichage persistant du temps écoulé
   - Possibilité de modifier la description
   - Indicateur visuel que le timer est actif

3. **Arrêt du timer**:
   - Confirmation pour éviter les arrêts accidentels
   - Création automatique d'une time entry
   - Mise à jour des données récentes
   - Feedback de succès

### 3.3 Visualisation des données
1. **Dashboard résumé**:
   - Cartes de résumé (temps aujourd'hui, cette semaine)
   - Liste des entrées récentes
   - Graphique simple de répartition par projet
   - Filtres par période (jour/semaine/mois)

2. **Navigation**:
   - Header avec navigation principale
   - Indicateur de page active
   - Profile dropdown avec logout
   - Breadcrumbs pour l'orientation

## 4. Composants UI nécessaires

### 4.1 Composants d'authentification
- `LoginForm` : Formulaire de connexion avec validation
- `ProtectedRoute` : HOC pour la protection des routes
- `AuthLayout` : Layout pour les pages d'auth

### 4.2 Composants de layout
- `AppLayout` : Layout principal avec navigation
- `Header` : Navigation avec user dropdown
- `Sidebar` : Navigation secondaire (optionnel MVP)
- `PageHeader` : Header de page avec titre et actions

### 4.3 Composants de timer
- `TimerDisplay` : Affichage principal du timer
- `TimerControls` : Boutons start/stop/pause
- `ProjectSelector` : Dropdown de sélection de projet
- `TimerForm` : Formulaire de description et contexte

### 4.4 Composants de dashboard
- `SummaryCards` : Cartes de statistiques
- `RecentEntries` : Liste des entrées récentes
- `TimeChart` : Graphique simple de répartition
- `PeriodSelector` : Sélecteur de période

### 4.5 Composants utilitaires
- `LoadingSpinner` : Indicateur de chargement
- `ErrorBoundary` : Gestion d'erreurs React
- `Toast` : Notifications système
- `Modal` : Dialogs de confirmation
- `Button` : Bouton réutilisable avec variants
- `Input` : Champs de saisie avec validation

## 5. Spécifications d'écrans détaillées

### 5.1 Page de Login (`/login`)
**Objectif**: Authentifier l'utilisateur et rediriger vers l'application

**Éléments UI**:
- Logo et nom de l'application
- Formulaire avec email/password
- Bouton de connexion avec état loading
- Lien vers inscription (optionnel)
- Messages d'erreur contextuels
- Option "Se souvenir de moi"

**Comportement**:
- Validation en temps réel des champs
- Soumission avec Enter
- Loading state pendant l'authentification
- Gestion d'erreurs avec messages clairs
- Auto-redirection après succès

### 5.2 Page Tracking (`/app/tracking`)
**Objectif**: Interface principale pour démarrer/arrêter le tracking temps

**Éléments UI**:
- **Header**: Navigation avec user profile dropdown
- **Timer principal**:
  - Display temps format HH:MM:SS
  - Bouton Start/Stop prominent
  - Indicateur visuel si timer actif
- **Contexte du timer**:
  - Sélecteur de projet (dropdown avec search)
  - Champ description de la tâche
  - Tags optionnels
- **Historique récent**:
  - Liste des 5 dernières entrées
  - Actions rapides (edit, delete)
- **Statistiques du jour**:
  - Temps total aujourd'hui
  - Nombre d'entrées
  - Projet principal

**États**:
- Timer arrêté : Bouton "Start Timer" vert
- Timer en cours : Display temps + bouton "Stop" rouge
- Loading : Indicateurs sur boutons d'action
- Erreur : Messages d'erreur avec actions correctives

### 5.3 Page Dashboard (`/app/dashboard`)
**Objectif**: Vue d'ensemble des temps trackés et statistiques

**Éléments UI**:
- **Filtres de période**:
  - Boutons Aujourd'hui/Cette semaine/Ce mois
  - Date picker pour périodes personnalisées
- **Cartes de résumé** (grid 2x2):
  - Temps total période sélectionnée
  - Temps moyen par jour
  - Nombre d'entrées
  - Temps billable vs non-billable
- **Graphique de répartition**:
  - Pie chart simple par projet
  - Couleurs distinctes par projet
- **Liste des entrées récentes**:
  - Tableau avec date, projet, durée, description
  - Pagination simple
  - Actions edit/delete en hover

**Responsive**:
- Mobile : Stack vertical des sections
- Desktop : Grid layout avec sidebar

### 5.4 Navigation Header (persistant)
**Éléments**:
- Logo Zentracker (lien vers /app/tracking)
- Navigation principale : Tracking | Dashboard
- Indicateur timer actif (si running)
- User dropdown : Profile | Settings | Logout

## 6. Gestion d'erreurs et états de loading

### 6.1 Stratégie d'erreurs
- **Erreurs réseau** : Retry automatique avec backoff
- **Erreurs d'authentification** : Redirection login
- **Erreurs de validation** : Messages inline sur formulaires
- **Erreurs serveur** : Toast notifications avec actions

### 6.2 États de loading
- **Loading global** : Skeleton components
- **Loading actions** : Boutons avec spinners
- **Loading data** : Shimmer effects
- **Empty states** : Messages encourageants avec actions

## 7. Responsive et accessibilité

### 7.1 Breakpoints
- Mobile : < 768px (stack vertical, navigation collapsed)
- Tablet : 768px - 1024px (layout adapté)
- Desktop : > 1024px (layout complet)

### 7.2 Accessibilité MVP
- Navigation au clavier (Tab/Shift+Tab)
- Aria labels sur éléments interactifs
- Contraste suffisant (WCAG AA)
- Screen reader friendly (semantic HTML)

## 8. Intégration API

### 8.1 Endpoints utilisés
- `POST /api/v1/auth/login` - Authentification
- `GET /api/v1/auth/me` - Profil utilisateur
- `POST /api/v1/timers/start` - Démarrer timer
- `POST /api/v1/timers/stop` - Arrêter timer
- `GET /api/v1/timers/current` - Timer actuel
- `GET /api/v1/time-entries` - Liste des entrées
- `GET /api/v1/dashboard/summary` - Données dashboard
- `GET /api/v1/projects` - Liste des projets

### 8.2 Gestion cache et synchronisation
- Cache des projets (refresh toutes les 5min)
- Optimistic updates pour timer start/stop
- Polling timer actuel toutes les 30s
- Refresh dashboard data après stop timer

## 9. Performance et UX

### 9.1 Performance
- Bundle splitting par route
- Lazy loading des composants dashboard
- Image optimization pour logos/avatars
- Service worker pour cache API (future)

### 9.2 UX critiques
- Timer start immédiat (< 200ms)
- Feedback visuel constant état timer
- Auto-save descriptions timer
- Prévention perte données (beforeunload)
- Raccourcis clavier (Espace = start/stop)

Cette spécification définit un MVP complet et utilisable, centré sur l'essentiel : tracker efficacement son temps avec une interface intuitive.