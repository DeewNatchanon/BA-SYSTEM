const SESSION_KEY = 'ba-system.auth-session';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

export const loginWithPassword = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Login failed.');
  }

  return response.json();
};

export const registerWithPassword = async (username, password, role, managerCode) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role, managerCode }) 
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Registration failed.');
  }

  return response.json();
};

export const getMe = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Session expired.');
  }

  return response.json();
};

export const saveAuthSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadAuthSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const submitProjectRequest = async (formDataToSend, token) => {
  const response = await fetch('http://localhost:4000/api/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formDataToSend
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit project request');
  }

  return response.json();
};

export const fetchProjects = async (token) => {
  const response = await fetch('http://localhost:4000/api/projects/all', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  const result = await response.json();
  return result.data || []; 
};

export const updateProjectInDb = async (projectId, projectData, token) => {
  const response = await fetch(`http://localhost:4000/api/projects/update/${projectId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(projectData)
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
};

const BASE_URL = 'http://localhost:4000/api'; 

export const submitNewRequest = async (requestData, token) => {
  const response = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error('ไม่สามารถส่งคำขอได้');
  return response.json();
};

export const fetchPendingRequests = async (token) => {
  const response = await fetch(`${BASE_URL}/projects/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('ดึงข้อมูลผิดพลาด');
  const result = await response.json();
  return result.data; 
};

// 🚀 แก้ไข: ปรับให้รับ approvalPayload แบบเต็มรูปแบบ เพื่อให้ข้อมูลทั้งหมดส่งไปถึงฐานข้อมูล
export const approveProjectRequest = async (projectId, approvalPayload, token) => {
  const response = await fetch(`${BASE_URL}/projects/${projectId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(approvalPayload),
  });
  if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการอนุมัติ');
  return response.json();
};

export const changePassword = async (oldPassword, newPassword, token) => {
  const response = await fetch('http://localhost:4000/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
  }

  return await response.json();
};

export const updateUserProfile = async (userId, newUsername, token) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ username: newUsername })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้');
  }

  return await response.json();
};