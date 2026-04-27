export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  address: string;
  email?: string;
  phone?: string;
  contactPerson: string;
  projects?: {
    active?: number;
    completed?: number;
  };
  budget?: number;
  completion?: number;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  trend: 'up' | 'down';
  change: string;
  color: string;
}

export interface ProjectHealthDatum {
  name: string;
  value: number;
  color: string;
}

export interface CompletionTrendDatum {
  month: string;
  completed: number;
  planned: number;
}

export interface TaskStatusDatum {
  status: string;
  count: number;
}

export interface RecentProject {
  name: string;
  company: string;
  status: string;
  progress: number;
  team: number;
}

export interface UpcomingMilestone {
  milestone: string;
  project: string;
  date: string;
  status: string;
}

export interface DashboardData {
  metrics?: DashboardMetric[];
  projectHealthData?: ProjectHealthDatum[];
  completionTrendData?: CompletionTrendDatum[];
  taskStatusData?: TaskStatusDatum[];
  recentProjects?: RecentProject[];
  upcomingMilestones?: UpcomingMilestone[];
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  project: string;
  uploadedBy: string;
  uploadedDate: string;
  category: string;
}

export interface Milestone {
  id: string;
  title: string;
  project: string;
  description: string;
  dueDate: string;
  status: string;
  completion: number;
  priority: string;
}

export interface Project {
  id: string;
  name: string;
  company: string;
  status: string;
  health: string;
  progress: number;
  startDate: string;
  endDate: string;
  team: number;
  spent: number;
  budget: number;
  description?: string;
  milestones?: {
    completed?: number;
    total?: number;
  };
  tasks?: {
    total?: number;
    completed?: number;
    inProgress?: number;
    blocked?: number;
  };
}

export interface ProjectCreateInput {
  name?: FormDataEntryValue;
  company?: FormDataEntryValue;
  budget?: number;
  startDate?: FormDataEntryValue;
  endDate?: FormDataEntryValue;
  description?: FormDataEntryValue;
  team: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  project: string;
  status: string;
  priority: string;
  dueDate: string;
  assignees?: string[];
  comments: number;
  attachments: number;
}

export interface TaskBoard {
  todo: TaskItem[];
  'in-progress': TaskItem[];
  blocked: TaskItem[];
  done: TaskItem[];
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string;
  joinedDate: string;
}

export interface TimeLog {
  id: string;
  date: string;
  project: string;
  task: string;
  user: string;
  hours: number;
  status: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface PermissionMatrixEntry {
  id?: string;
  roleName: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionValue {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionMatrixRow {
  module: string;
  moduleLabel: string;
  roles: Record<string, PermissionValue>;
}
