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
    // ส่ง managerCode ไปให้ Backend ตรวจสอบความปลอดภัย
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
// เพิ่มฟังก์ชันสำหรับส่ง Request Form พร้อมไฟล์แนบ
export const submitProjectRequest = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/forms/submit`, {
    method: 'POST',
    headers: {
      // ห้ามใส่ 'Content-Type': 'application/json' 
      // เพราะเราส่งเป็น FormData ระบบจะจัดการ Boundary ให้เอง
      Authorization: `Bearer ${token}`
    },
    body: formData // ส่ง FormData ที่แพ็กมาจากหน้า RequestForm.js
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Failed to submit request.');
  }

  return response.json();
};
// ==========================================
// ส่วนของ Project API (สำหรับหน้า Project Portfolio)
// ==========================================

export const fetchProjects = async (token) => {
  // 🚨 ถ้าในไฟล์ของคุณไม่มีตัวแปร API_BASE_URL ให้เปลี่ยนเป็น 'http://localhost:4000/api/projects/all' แทนได้เลยครับ
  const response = await fetch(`http://localhost:4000/api/projects/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
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