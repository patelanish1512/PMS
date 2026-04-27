import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap';
import { Check, Lock, RotateCcw, Save, Search, Shield, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';
import type { PermissionMatrixEntry, PermissionMatrixRow, PermissionValue } from '../../types/api';

const roles = ['Admin', 'ProjectManager', 'Member', 'Client'] as const;
const permissionActions = ['canView', 'canCreate', 'canEdit', 'canDelete'] as const;
type RoleName = typeof roles[number];
type PermissionAction = typeof permissionActions[number];

const actionLabels: Record<PermissionAction, string> = {
  canView: 'View',
  canCreate: 'Create',
  canEdit: 'Edit',
  canDelete: 'Delete',
};

const emptyPermission: PermissionValue = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

const adminPermission: PermissionValue = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

const RoleManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [localMatrix, setLocalMatrix] = useState<PermissionMatrixRow[]>([]);

  const { isLoading, isError } = useQuery<PermissionMatrixRow[]>({
    queryKey: ['permission-matrix'],
    queryFn: async () => {
      const response = await apiClient.get<PermissionMatrixRow[]>('/Permissions');
      setLocalMatrix(response.data);
      return response.data;
    },
  });

  const flattenedUpdates = useMemo<PermissionMatrixEntry[]>(() => (
    localMatrix.flatMap(row => roles.map(role => ({
      roleName: role,
      module: row.module,
      ...(role === 'Admin' ? adminPermission : (row.roles[role] ?? emptyPermission)),
    })))
  ), [localMatrix]);

  const updateMutation = useMutation({
    mutationFn: (updates: PermissionMatrixEntry[]) => apiClient.put('/Permissions', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      toast.success('Role permissions saved');
    },
    onError: () => toast.error('Failed to save permissions'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ roleName, module }: { roleName: RoleName; module: string }) => (
      apiClient.delete(`/Permissions/${roleName}/${module}`)
    ),
    onSuccess: (_, variables) => {
      setLocalMatrix(prev => prev.map(row => (
        row.module === variables.module
          ? { ...row, roles: { ...row.roles, [variables.roleName]: emptyPermission } }
          : row
      )));
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      toast.success('Permission entry cleared');
    },
    onError: () => toast.error('Failed to clear permission entry'),
  });

  const visibleRows = localMatrix.filter(row => (
    row.module.toLowerCase().includes(searchQuery.toLowerCase())
    || row.moduleLabel.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const togglePermission = (module: string, roleName: RoleName, action: PermissionAction) => {
    if (roleName === 'Admin') return;

    setLocalMatrix(prev => prev.map(row => {
      if (row.module !== module) return row;

      const current = row.roles[roleName] ?? emptyPermission;
      return {
        ...row,
        roles: {
          ...row.roles,
          [roleName]: {
            ...current,
            [action]: !current[action],
          },
        },
      };
    }));
  };

  const resetRole = (roleName: RoleName) => {
    if (roleName === 'Admin') return;

    setLocalMatrix(prev => prev.map(row => ({
      ...row,
      roles: {
        ...row.roles,
        [roleName]: emptyPermission,
      },
    })));
  };

  const clearPermission = (roleName: RoleName, module: string) => {
    if (roleName === 'Admin') return;
    deleteMutation.mutate({ roleName, module });
  };

  const handleSave = () => {
    updateMutation.mutate(flattenedUpdates);
  };

  if (isLoading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" className="border-0 rounded-3">
        Role permissions could not be loaded. Confirm the signed-in account is an Admin.
      </Alert>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4 bg-light p-4 rounded-4 border border-white">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Shield className="text-primary" /> Roles & Permissions
          </h4>
          <p className="text-muted small mb-0">Admin has full app access. Other roles can be granted or cleared per module.</p>
        </div>
        <Button variant="primary" className="fw-bold px-4 d-inline-flex align-items-center gap-2" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Spinner size="sm" /> : <Save size={18} />} Save Changes
        </Button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {roles.map(role => (
          <Badge key={role} bg={role === 'Admin' ? 'primary-subtle' : 'light'} className={`border px-3 py-2 ${role === 'Admin' ? 'text-primary border-primary-subtle' : 'text-secondary'}`}>
            {role}: {role === 'Admin' ? 'Full CRUD access' : 'Editable permissions'}
          </Badge>
        ))}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="position-relative flex-grow-1">
          <Search className="position-absolute translate-middle-y top-50 ms-3 text-muted" size={16} />
          <Form.Control
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search modules"
            className="ps-5 bg-light border-0 py-2 rounded-3"
          />
        </div>
        {roles.filter(role => role !== 'Admin').map(role => (
          <Button key={role} variant="outline-secondary" size="sm" className="d-inline-flex align-items-center gap-1" onClick={() => resetRole(role)}>
            <RotateCcw size={14} /> Clear {role}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
        <Table responsive hover className="mb-0 align-middle permission-table">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 border-0 permission-module-col">Module</th>
              {roles.map(role => (
                <th key={role} className="text-center border-0 px-3 py-3">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.module}>
                <td className="px-4 py-3 permission-module-col">
                  <div className="fw-bold">{row.moduleLabel}</div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>MODULE_ID: {row.module.toUpperCase()}</div>
                </td>
                {roles.map(role => {
                  const permission = role === 'Admin' ? adminPermission : (row.roles[role] ?? emptyPermission);
                  return (
                    <td key={role} className="text-center p-3">
                      <div className="d-flex flex-column gap-2 align-items-center">
                        <div className="d-flex flex-wrap gap-1 justify-content-center permission-action-grid">
                          {permissionActions.map(action => (
                            <PermissionBadge
                              key={action}
                              label={actionLabels[action]}
                              active={permission[action]}
                              locked={role === 'Admin'}
                              onToggle={() => togglePermission(row.module, role, action)}
                            />
                          ))}
                        </div>
                        {role === 'Admin' ? (
                          <span className="text-primary d-inline-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                            <Lock size={11} /> Locked
                          </span>
                        ) : (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0 d-inline-flex align-items-center gap-1"
                            onClick={() => clearPermission(role, row.module)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={12} /> Clear
                          </Button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

interface PermissionBadgeProps {
  label: string;
  active: boolean;
  locked: boolean;
  onToggle: () => void;
}

const PermissionBadge = ({ label, active, locked, onToggle }: PermissionBadgeProps) => (
  <button
    type="button"
    className={`permission-badge ${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}
    onClick={onToggle}
    disabled={locked}
    aria-pressed={active}
  >
    {active ? <Check size={10} /> : <X size={10} />} {label}
  </button>
);

export default RoleManager;

