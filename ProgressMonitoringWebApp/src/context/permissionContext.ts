import { createContext } from 'react';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionContextType {
  permissions: Record<string, Permission> | null;
  can: (module: string, action: keyof Permission) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

