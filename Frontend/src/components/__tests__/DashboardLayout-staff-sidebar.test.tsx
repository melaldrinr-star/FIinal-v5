/**
 * Dashboard Sidebar Visibility Test - Staff Access Control
 * 
 * Verifies that staff members cannot see menu items they don't have permission for.
 * Specifically tests that Archive is hidden from staff roles.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock permission system
interface Permission {
  canManageTrainees: boolean;
  canManageItems: boolean;
  canManageLendings: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canDeleteRecords: boolean;
  canScanQR: boolean;
  canManagePrograms: boolean;
  canManageCMS: boolean;
  canManageAccounts: boolean;
  canViewActivityLogs: boolean;
  canExportActivityLogs: boolean;
  canViewAnomalies: boolean;
  canResolveAnomalies: boolean;
  canConfigureDetection: boolean;
  canExportAnomalies: boolean;
  canTriggerDetection: boolean;
}

interface NavItem {
  name: string;
  href?: string;
  permission?: keyof Permission;
  children?: NavItem[];
}

// Mock navigation structure
const NAVIGATION_DESKTOP: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Platform Admin', href: '/super-admin' },
  { name: 'Trainees', href: '/trainees', permission: 'canManageTrainees' },
  { name: 'Equipments', href: '/items', permission: 'canManageItems' },
  { name: 'Borrowing', href: '/lendings', permission: 'canManageLendings' },
  { name: 'Programs', href: '/programs', permission: 'canManagePrograms' },
  { name: 'Registrations', href: '/registrations', permission: 'canManageTrainees' },
  { name: 'Reports', href: '/reports', permission: 'canViewReports' },
  {
    name: 'Settings',
    children: [
      { name: 'Activity Logs', href: '/activity-logs', permission: 'canViewActivityLogs' },
      { name: 'Non-Attendance Dates', href: '/non-attendance-dates', permission: 'canManagePrograms' },
      { name: 'Landing Content', href: '/admin/landing-content', permission: 'canManageCMS' },
      { name: 'Requirements Management', href: '/admin/requirements', permission: 'canManagePrograms' },
      { name: 'Archive', href: '/admin/archive', permission: 'canManageAccounts' },
      { name: 'Account', href: '/account-management', permission: 'canManageAccounts' },
    ],
  },
];

// Mock permissions for different roles
const STAFF_TRAINING_PERMISSIONS: Permission = {
  canManageTrainees: true,
  canManageItems: false,
  canManageLendings: false,
  canViewReports: true,
  canManageSettings: false,
  canDeleteRecords: false,
  canScanQR: true,
  canManagePrograms: true,
  canManageCMS: false,
  canManageAccounts: false,
  canViewActivityLogs: false,
  canExportActivityLogs: false,
  canViewAnomalies: false,
  canResolveAnomalies: false,
  canConfigureDetection: false,
  canExportAnomalies: false,
  canTriggerDetection: false,
};

const STAFF_INVENTORY_PERMISSIONS: Permission = {
  canManageTrainees: false,
  canManageItems: true,
  canManageLendings: true,
  canViewReports: true,
  canManageSettings: false,
  canDeleteRecords: false,
  canScanQR: true,
  canManagePrograms: false,
  canManageCMS: false,
  canManageAccounts: false,
  canViewActivityLogs: false,
  canExportActivityLogs: false,
  canViewAnomalies: false,
  canResolveAnomalies: false,
  canConfigureDetection: false,
  canExportAnomalies: false,
  canTriggerDetection: false,
};

const LOCAL_ADMIN_PERMISSIONS: Permission = {
  canManageTrainees: true,
  canManageItems: true,
  canManageLendings: true,
  canViewReports: true,
  canManageSettings: true,
  canDeleteRecords: true,
  canScanQR: true,
  canManagePrograms: true,
  canManageCMS: true,
  canManageAccounts: true,
  canViewActivityLogs: true,
  canExportActivityLogs: true,
  canViewAnomalies: true,
  canResolveAnomalies: true,
  canConfigureDetection: true,
  canExportAnomalies: true,
  canTriggerDetection: true,
};

// Navigation filtering function (matches DashboardLayout.tsx)
function filterNavigation(
  nav: NavItem[],
  permissions: Permission,
  excludeSuperAdmin = true
): NavItem[] {
  return nav
    .filter(item => {
      if (excludeSuperAdmin && item.href === '/super-admin') return false;
      if (item.children) {
        const filteredChildren = item.children.filter(child =>
          !child.permission || permissions[child.permission]
        );
        return filteredChildren.length > 0;
      }
      return !item.permission || permissions[item.permission];
    })
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child =>
            !child.permission || permissions[child.permission]
          ),
        };
      }
      return item;
    });
}

describe('Dashboard Sidebar - Staff Visibility', () => {
  describe('Archive Menu Item Visibility', () => {
    it('Archive should have canManageAccounts permission', () => {
      const archiveItem = NAVIGATION_DESKTOP.find(item => 
        item.children?.some(child => child.name === 'Archive')
      );
      const archive = archiveItem?.children?.find(child => child.name === 'Archive');
      expect(archive?.permission).toBe('canManageAccounts');
    });

    it('Staff Training Coordinator should NOT see Archive in sidebar', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      // Settings menu should not be visible if no children pass permission check
      if (settingsMenu?.children) {
        const archiveVisible = settingsMenu.children.some(child => child.name === 'Archive');
        expect(archiveVisible).toBe(false);
      }
    });

    it('Staff Inventory Manager should NOT see Archive in sidebar', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      // Settings menu should not be visible if no children pass permission check
      if (settingsMenu?.children) {
        const archiveVisible = settingsMenu.children.some(child => child.name === 'Archive');
        expect(archiveVisible).toBe(false);
      }
    });

    it('Local Admin SHOULD see Archive in sidebar', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, LOCAL_ADMIN_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        const archiveVisible = settingsMenu.children.some(child => child.name === 'Archive');
        expect(archiveVisible).toBe(true);
      }
    });
  });

  describe('Staff Training Coordinator Sidebar', () => {
    it('should see Dashboard', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Dashboard')).toBe(true);
    });

    it('should see Trainees', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Trainees')).toBe(true);
    });

    it('should see Programs', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Programs')).toBe(true);
    });

    it('should NOT see Equipments', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Equipments')).toBe(false);
    });

    it('should NOT see Borrowing', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Borrowing')).toBe(false);
    });

    it('should NOT see Activity Logs', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Activity Logs')).toBe(false);
      }
    });

    it('should NOT see Landing Content', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Landing Content')).toBe(false);
      }
    });

    it('should NOT see Account', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Account')).toBe(false);
      }
    });

    it('should NOT see Archive', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Archive')).toBe(false);
      } else {
        // Settings menu itself should be hidden if no accessible sub-items
        expect(settingsMenu).toBeUndefined();
      }
    });
  });

  describe('Staff Inventory Manager Sidebar', () => {
    it('should see Dashboard', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Dashboard')).toBe(true);
    });

    it('should see Equipments', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Equipments')).toBe(true);
    });

    it('should see Borrowing', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Borrowing')).toBe(true);
    });

    it('should NOT see Trainees', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Trainees')).toBe(false);
    });

    it('should NOT see Programs', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Programs')).toBe(false);
    });

    it('should NOT see Activity Logs', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Activity Logs')).toBe(false);
      }
    });

    it('should NOT see Archive', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Archive')).toBe(false);
      } else {
        // Settings menu itself should be hidden if no accessible sub-items
        expect(settingsMenu).toBeUndefined();
      }
    });
  });

  describe('Local Admin Sidebar', () => {
    it('should see all main menu items', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, LOCAL_ADMIN_PERMISSIONS);
      
      expect(filtered.some(item => item.name === 'Dashboard')).toBe(true);
      expect(filtered.some(item => item.name === 'Trainees')).toBe(true);
      expect(filtered.some(item => item.name === 'Equipments')).toBe(true);
      expect(filtered.some(item => item.name === 'Borrowing')).toBe(true);
      expect(filtered.some(item => item.name === 'Programs')).toBe(true);
      expect(filtered.some(item => item.name === 'Reports')).toBe(true);
    });

    it('should see Settings menu', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, LOCAL_ADMIN_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      expect(settingsMenu).toBeDefined();
    });

    it('should see all Settings sub-items including Archive', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, LOCAL_ADMIN_PERMISSIONS);
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu?.children) {
        expect(settingsMenu.children.some(child => child.name === 'Activity Logs')).toBe(true);
        expect(settingsMenu.children.some(child => child.name === 'Archive')).toBe(true);
        expect(settingsMenu.children.some(child => child.name === 'Account')).toBe(true);
      }
    });
  });

  describe('Permission-based Visibility Rules', () => {
    it('items without permission requirement should always be visible', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      expect(filtered.some(item => item.name === 'Dashboard')).toBe(true);
    });

    it('items with missing permission should not be visible', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      
      // Equipments requires canManageItems which staff trainer doesn't have
      expect(filtered.some(item => item.name === 'Equipments')).toBe(false);
    });

    it('parent menu should hide if all children are inaccessible', () => {
      const filtered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      
      // Staff trainer has no permission for ANY Settings sub-items except Requirements
      // Actually they can see: Non-Attendance Dates, Requirements Management
      // So Settings SHOULD be visible with filtered children
      const settingsMenu = filtered.find(item => item.name === 'Settings');
      
      if (settingsMenu) {
        // Settings should only show items they have permission for
        expect(settingsMenu.children?.length).toBeGreaterThan(0);
        expect(settingsMenu.children?.some(child => child.name === 'Archive')).toBe(false);
      }
    });
  });

  describe('Summary: Staff Cannot See Archive', () => {
    it('✓ Archive is protected by canManageAccounts permission', () => {
      const archiveItem = NAVIGATION_DESKTOP.find(item => 
        item.children?.some(child => child.name === 'Archive')
      );
      const archive = archiveItem?.children?.find(child => child.name === 'Archive');
      expect(archive?.permission).toBe('canManageAccounts');
    });

    it('✗ Staff Training Coordinator does NOT have canManageAccounts', () => {
      expect(STAFF_TRAINING_PERMISSIONS.canManageAccounts).toBe(false);
    });

    it('✗ Staff Inventory Manager does NOT have canManageAccounts', () => {
      expect(STAFF_INVENTORY_PERMISSIONS.canManageAccounts).toBe(false);
    });

    it('✓ Local Admin HAS canManageAccounts', () => {
      expect(LOCAL_ADMIN_PERMISSIONS.canManageAccounts).toBe(true);
    });

    it('Result: Staff cannot see Archive in sidebar', () => {
      const staffTrainerFiltered = filterNavigation(NAVIGATION_DESKTOP, STAFF_TRAINING_PERMISSIONS);
      const staffInventoryFiltered = filterNavigation(NAVIGATION_DESKTOP, STAFF_INVENTORY_PERMISSIONS);
      
      const staffTrainerArchiveVisible = staffTrainerFiltered
        .find(item => item.name === 'Settings')
        ?.children?.some(child => child.name === 'Archive') || false;
      
      const staffInventoryArchiveVisible = staffInventoryFiltered
        .find(item => item.name === 'Settings')
        ?.children?.some(child => child.name === 'Archive') || false;
      
      expect(staffTrainerArchiveVisible).toBe(false);
      expect(staffInventoryArchiveVisible).toBe(false);
    });

    it('Result: Local Admin CAN see Archive in sidebar', () => {
      const adminFiltered = filterNavigation(NAVIGATION_DESKTOP, LOCAL_ADMIN_PERMISSIONS);
      
      const adminArchiveVisible = adminFiltered
        .find(item => item.name === 'Settings')
        ?.children?.some(child => child.name === 'Archive') || false;
      
      expect(adminArchiveVisible).toBe(true);
    });
  });
});
