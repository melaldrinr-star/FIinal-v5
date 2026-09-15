export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes: Record<string, unknown>;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AuditLogFilters {
  action?: string;
  adminId?: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
}
