import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import type { PermissionMatrixEntry } from '../types/api';
import { PermissionContext, type Permission, type PermissionContextType } from './permissionContext';

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();

  const { data: matrix = [], isFetching, refetch } = useQuery<PermissionMatrixEntry[]>({
    queryKey: ['my-permissions', user?.role],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await apiClient.get<PermissionMatrixEntry[]>('/Permissions/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const permissions = useMemo<Record<string, Permission> | null>(() => {
    if (!user) return null;

    return matrix.reduce<Record<string, Permission>>((acc, item) => {
      acc[item.module.toLowerCase()] = {
        canView: item.canView,
        canCreate: item.canCreate,
        canEdit: item.canEdit,
        canDelete: item.canDelete,
      };
      return acc;
    }, {});
  }, [matrix, user]);

  const can = useCallback((module: string, action: keyof Permission): boolean => {
    if (user?.role === 'Admin') return true;
    const modulePerms = permissions?.[module.toLowerCase()];
    return modulePerms?.[action] === true;
  }, [permissions, user?.role]);

  const refreshPermissions = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo<PermissionContextType>(() => ({
    permissions,
    can,
    refreshPermissions,
    isLoading: Boolean(user) && isFetching,
  }), [can, isFetching, permissions, refreshPermissions, user]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
