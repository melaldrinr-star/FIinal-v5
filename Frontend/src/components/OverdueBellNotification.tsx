import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell } from 'lucide-react';
import notificationService, { type InAppNotification } from '../services/notificationService';
import NotificationsModal from './NotificationsModal';
import logger from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

export default function OverdueBellNotification() {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // The backend applies the same role filter to the notification feed.
  const shouldShow = isAuthenticated && user &&
    ['super_admin', 'local_admin', 'staff_inventory_manager', 'staff_training_coordinator'].includes(user.role);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!shouldShow) {
      return;
    }

    fetchNotifications();
    
    // Check for overdue items every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [shouldShow, isAuthReady]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount ?? response.notifications?.length ?? 0);
    } catch (error) {
      const status = (error as any)?.status ?? (error as any)?.response?.status;
      if (status !== 403 && status !== 404) {
        logger.error('Failed to fetch overdue items for bell notification', { error });
      }
    }
  };

  const handleBellClick = () => {
    setModalOpen(true);
  };

  if (!shouldShow) {
    return null;
  }

  const notificationCount = unreadCount;
  const hasOverdue = notifications.some((notification) => notification.type === 'overdue');

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBellClick}
          aria-label={`${notificationCount} notification${notificationCount !== 1 ? 's' : ''}`}
          className="relative hover:bg-primary/10"
          title={`${notificationCount} notification${notificationCount !== 1 ? 's' : ''}`}
        >
          <Bell className={`size-5 ${notificationCount > 0 || hasOverdue ? 'text-destructive' : ''}`} />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </Badge>
          {hasOverdue && notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive animate-ping opacity-75" />
          )}
        </Button>
      </div>

      <NotificationsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        notifications={notifications}
      />
    </>
  );
}
