// Domain entity types for Zentracker
// Based on database schema from backend audit

// ===================
// CORE DOMAIN ENTITIES
// ===================

export interface Organization {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: Date
  updated_at: Date

  // Billing info (minimal for MVP)
  subscription_status?: 'active' | 'inactive' | 'trial'
  max_users?: number
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  organization_id: string
  is_active: boolean
  avatar_url?: string
  timezone?: string
  created_at: Date
  updated_at: Date

  // Relations (populated when needed)
  organization?: Organization
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

export interface Client {
  id: string
  name: string
  email?: string
  description?: string
  is_active: boolean
  organization_id: string
  created_at: Date
  updated_at: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string // Hex color code
  status: ProjectStatus
  is_billable: boolean
  is_active: boolean
  hourly_rate?: number // In cents to avoid floating point issues
  organization_id: string
  client_id?: string
  created_at: Date
  updated_at: Date

  // Relations (populated when needed)
  client?: Client
  tasks?: Task[]

  // Computed fields for UI
  total_time?: number // In seconds
  active_tasks_count?: number
}

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  estimated_hours?: number
  project_id: string
  assignee_id?: string
  created_at: Date
  updated_at: Date

  // Relations (populated when needed)
  project?: Project
  assignee?: User

  // Computed fields for UI
  total_time?: number // In seconds
  is_completed?: boolean
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Timer {
  id: string
  start_time: Date
  is_running: boolean
  description?: string
  user_id: string
  project_id?: string
  task_id?: string
  created_at: Date
  updated_at: Date

  // Relations (populated when needed)
  project?: Project
  task?: Task

  // Computed fields for UI
  elapsed_seconds?: number
  display_time?: string // HH:MM:SS format
}

export interface TimeEntry {
  id: string
  start_time: Date
  end_time: Date
  duration: number // In seconds
  description?: string
  is_billable: boolean
  user_id: string
  project_id?: string
  task_id?: string
  created_at: Date
  updated_at: Date

  // Relations (populated when needed)
  project?: Project
  task?: Task
  user?: User

  // Computed fields for UI
  display_duration?: string // "2h 30m" format
  billable_amount?: number // hourly_rate * hours if billable
}

// ===================
// API RESPONSE TYPES
// ===================

export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ApiError {
  message: string
  detail?: string
  field?: string
  code?: string
}

// ===================
// AUTHENTICATION TYPES
// ===================

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number // seconds until expiry
  expires_at: Date
}

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  organization_name?: string // For creating new org
  organization_slug?: string
}

// ===================
// TIMER & TIME TRACKING TYPES
// ===================

export interface StartTimerRequest {
  project_id?: string
  task_id?: string
  description?: string
}

export interface StopTimerRequest {
  description?: string
}

export interface CreateTimeEntryRequest {
  start_time: Date
  end_time: Date
  description?: string
  project_id?: string
  task_id?: string
  is_billable?: boolean
}

export interface UpdateTimeEntryRequest {
  start_time?: Date
  end_time?: Date
  description?: string
  project_id?: string
  task_id?: string
  is_billable?: boolean
}

export interface TimeEntryFilters {
  start_date?: Date
  end_date?: Date
  project_ids?: string[]
  task_ids?: string[]
  user_ids?: string[]
  is_billable?: boolean
  page?: number
  per_page?: number
}

// ===================
// DASHBOARD & REPORTING TYPES
// ===================

export interface DashboardSummary {
  period: {
    start_date: Date
    end_date: Date
    type: 'day' | 'week' | 'month' | 'custom'
  }

  totals: {
    total_time: number // seconds
    billable_time: number // seconds
    non_billable_time: number // seconds
    total_entries: number
    active_days: number
  }

  daily_breakdown: Array<{
    date: Date
    total_time: number
    billable_time: number
    entries_count: number
  }>

  project_breakdown: Array<{
    project: Project
    total_time: number
    billable_time: number
    percentage: number
  }>

  productivity_metrics: {
    average_session_length: number // seconds
    longest_session: number // seconds
    most_productive_hour: number // 0-23
    efficiency_score?: number // 0-100
  }
}

export interface RecentActivity {
  time_entries: TimeEntry[]
  active_timer?: Timer
  last_updated: Date
}

// ===================
// UI COMPONENT TYPES
// ===================

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface Modal {
  id: string
  title: string
  content: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
  description?: string
  color?: string
}

// ===================
// STORE STATE TYPES
// ===================

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingIn: boolean
  isLoggingOut: boolean
  error: string | null
}

export interface TimerState {
  currentTimer: Timer | null
  isRunning: boolean
  elapsedTime: number
  isStarting: boolean
  isStopping: boolean
  selectedProject: Project | null
  selectedTask: Task | null
  description: string
  error: string | null
}

export interface DataState {
  // Time entries
  recentEntries: TimeEntry[]
  isLoadingEntries: boolean

  // Projects and tasks
  projects: Project[]
  isLoadingProjects: boolean

  // Dashboard
  dashboardSummary: DashboardSummary | null
  isLoadingDashboard: boolean
  dashboardPeriod: 'day' | 'week' | 'month'

  // UI state
  toasts: Toast[]
  modals: Modal[]
  sidebarOpen: boolean

  // Error states
  error: string | null
}

export interface AppState extends AuthState, TimerState, DataState {
  // Global app state that combines all stores
  isInitialized: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
}

// ===================
// FORM TYPES
// ===================

export interface FormField<T = any> {
  value: T
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
}

export interface TimerFormState {
  project: FormField<Project | null>
  task: FormField<Task | null>
  description: FormField<string>
}

export interface TimeEntryFormState {
  start_time: FormField<Date>
  end_time: FormField<Date>
  project: FormField<Project | null>
  task: FormField<Task | null>
  description: FormField<string>
  is_billable: FormField<boolean>
}

export interface ProjectFormState {
  name: FormField<string>
  description: FormField<string>
  color: FormField<string>
  client: FormField<Client | null>
  hourly_rate: FormField<number | null>
  is_billable: FormField<boolean>
}

// ===================
// UTILITY TYPES
// ===================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type CreateRequest<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>

export type UpdateRequest<T> = Partial<CreateRequest<T>>

// Export commonly used derived types
export type ProjectWithTime = Project & { total_time: number }
export type TaskWithTime = Task & { total_time: number }
export type UserProfile = Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar_url' | 'timezone'>

// ===================
// CONSTANTS & ENUMS
// ===================

export const USER_ROLES = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] as const
export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

export const DEFAULT_PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
] as const