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
export const submitProjectRequest = async (formDataToSend, token) => {
  const response = await fetch('http://localhost:4000/api/projects', {
    method: 'POST',
    headers: {
      // 🚀 สำคัญมาก: ห้ามใส่ 'Content-Type': 'application/json' ตรงนี้เด็ดขาด!
      // เพราะเรากำลังส่งไฟล์แบบ FormData ให้ปล่อยว่างไว้เลย
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
// ==========================================
// ส่วนของ Project API (สำหรับหน้า Project Portfolio)
// ==========================================

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
  
  // 🚀 จุดสำคัญ: ดึงเอาเฉพาะ Array ที่อยู่ใน result.data ส่งกลับไปให้หน้าเว็บ
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
// ==========================================
// API สำหรับระบบ Request & Manager Approval
// ==========================================
const BASE_URL = 'http://localhost:4000/api'; // ปรับให้ตรงกับ Port ของ Backend คุณ

// 1. ส่งฟอร์ม Request ใหม่
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

// 2. ดึงรายการที่รออนุมัติ (สำหรับ Manager)
export const fetchPendingRequests = async (token) => {
  const response = await fetch(`${BASE_URL}/projects/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('ดึงข้อมูลผิดพลาด');
  const result = await response.json();
  return result.data; 
};

// 3. Manager กดอนุมัติ
export const approveProjectRequest = async (projectId, managerId, token) => {
  const response = await fetch(`${BASE_URL}/projects/${projectId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ manager_id: managerId }),
  });
  if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการอนุมัติ');
  return response.json();
};