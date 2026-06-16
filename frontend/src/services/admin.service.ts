const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7287/api';

export interface ReportItem {
  id: number;
  reporterId: number;
  reporterUsername: string;
  postId: number;
  postImageUrl: string;
  postCaption: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface ResolveReportPayload {
  action: 'DELETE_POST' | 'BAN_USER' | 'DISMISS';
  remarks?: string;
}

export async function getPendingReports(page: number = 1, pageSize: number = 10): Promise<ReportItem[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${API_URL}/admin/reports?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Access denied. Admin or moderator role required.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to retrieve reports.');
  }

  return response.json();
}

export async function resolveReport(reportId: number, payload: ResolveReportPayload): Promise<{ message: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Access denied. Unauthorized to perform this action.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to resolve report.');
  }

  return response.json();
}
