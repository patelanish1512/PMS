import React from 'react';
import { Dropdown, Button, Spinner, Badge } from 'react-bootstrap';
import { Bell, AlertCircle, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import type { NotificationItem } from '../types/api';

const NotificationsDropdown: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get<NotificationItem[]>('/Notifications');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/Notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/Notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n: NotificationItem) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 size={16} className="text-primary" />;
      case 'milestone': return <AlertCircle size={16} className="text-warning" />;
      case 'project': return <FolderKanban size={16} className="text-info" />;
      case 'time': return <Clock size={16} className="text-success" />;
      default: return <Bell size={16} className="text-secondary" />;
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" className="p-2 text-secondary position-relative border-0 shadow-none">
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge bg="danger" pill className="position-absolute top-0 start-50 translate-middle" style={{ fontSize: '10px' }}>
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow-lg border-0 mt-2 rounded-4" style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="mb-0 fw-bold">Notifications</h6>
          <Badge bg="light" className="text-dark border">{unreadCount} New</Badge>
        </div>
        
        {isLoading ? (
          <div className="text-center p-4"><Spinner size="sm" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-5 text-muted small">No new notifications</div>
        ) : (
          notifications.map((n: NotificationItem) => (
            <Dropdown.Item key={n.id} className={`p-3 border-bottom ${!n.read ? 'bg-light' : ''}`} onClick={() => !n.read && markReadMutation.mutate(n.id)}>
              <div className="d-flex gap-3">
                <div className="bg-white p-2 rounded-3 shadow-sm h-fit">
                  {getIcon(n.type)}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="small fw-bold text-dark text-truncate">{n.title}</div>
                    {!n.read && <div className="bg-primary rounded-circle" style={{ width: '6px', height: '6px' }} />}
                  </div>
                  <p className="small text-muted mb-1 text-wrap" style={{ fontSize: '12px' }}>{n.message}</p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted" style={{ fontSize: '10px' }}>{n.time}</span>
                    {!n.read && <span className="text-primary fw-bold" style={{ fontSize: '10px' }}>Mark as read</span>}
                  </div>
                </div>
              </div>
            </Dropdown.Item>
          ))
        )}
        
        <div className="p-2 text-center">
          <Button
            variant="link"
            className="text-decoration-none small fw-bold p-0"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Mark All As Read
          </Button>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationsDropdown;
