import api from './api';

export interface InAppNotification {
  id: string;
  type: 'activity' | 'overdue';
  title: string;
  description: string;
  createdAt: string;
  href: string;
}

class NotificationService {
  async getNotifications(): Promise<{ notifications: InAppNotification[]; unreadCount: number }> {
    const response = await api.get<{ notifications: InAppNotification[]; unreadCount: number }>('/notifications');
    return response.data;
  }
}

export default new NotificationService();
