const SESSION_KEY = 'ba-system.auth-session';
const isDockerPort = window.location.port === '3001';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (isDockerPort ? 'http://10.11.11.31:4001' : 'http://localhost:4000');

export const loginWithPassword = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || 'Login failed.');
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
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  
  // 🚀 สกัดเอามาแค่ข้อมูลที่จำเป็นจริงๆ ห้ามเอา avatar ติดมาเด็ดขาด!
  const safeSession = {
    token: session.token,
    user: {
      id: session.user?.id,
      username: session.user?.username,
      role: session.user?.role,
      permissions: session.user?.permissions // 🌟 จำสิทธิ์ได้
    }
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
  } catch (error) {
    console.error("Local Storage Error:", error);
  }
};

export const loadAuthSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const fetchAllRoles = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('ไม่พบเส้นทาง API หรือเซิร์ฟเวอร์มีปัญหา');
  }
  return response.json();
};

export const updateRolePermissions = async (roleId, permissions, token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/roles/${roleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ permissions })
  });
  if (!response.ok) throw new Error('ไม่สามารถบันทึกสิทธิ์ได้');
  return response.json();
};

// 🌟 ฟังก์ชันที่หายไป กลับมาแล้วครับ! 🌟
export const createNewRole = async (name, permissions, token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, permissions })
  });
  if (!response.ok) throw new Error('ไม่สามารถสร้างบทบาทใหม่ได้');
  return response.json();
};

export const clearAuthSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const submitProjectRequest = async (formDataToSend, token) => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
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
  const response = await fetch(`${API_BASE_URL}/api/projects/all`, {
    method: 'GET',
    headers: {'Authorization': `Bearer ${token}`}
  });
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  const result = await response.json();
  // 🌟 ปรับให้รองรับข้อมูลที่เป็น Array ทันที
  return Array.isArray(result) ? result : (result.data || []); 
};

export const updateProjectInDb = async (projectId, projectData, arg3, arg4) => {
  let file = null;
  let token = null;

  if (typeof arg3 === 'string') {
    token = arg3;
  } else {
    file = arg3;
    token = arg4;
  }

  // 🌟 บังคับใช้ FormData เสมอ เพื่อแก้ปัญหา Backend รับค่า JSON ไม่ได้ (สาเหตุของ Error 500)
  const formData = new FormData();
  formData.append('projectData', JSON.stringify(projectData));
  if (file) {
    formData.append('progressFile', file);
  }

  const response = await fetch(`${API_BASE_URL}/api/projects/update/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
      // ❌ ไม่ต้องใส่ Content-Type เพราะ fetch จะจัดการ boundary ให้เองเมื่อใช้ FormData
    },
    body: formData
  });

  if (!response.ok) {
     const err = await response.json().catch(() => ({}));
     throw new Error(err.error || 'Failed to update project');
  }
  return response.json();
};

export const fetchPendingRequests = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('ดึงข้อมูลผิดพลาด');
  
  const result = await response.json();
  // 🌟 ปรับให้รองรับข้อมูลที่เป็น Array ทันที
  return Array.isArray(result) ? result : (result.data || []); 
};

export const approveProjectRequest = async (projectId, approvalPayload, token) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/approve`, {
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
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
  }

  return await response.json();
};

export const updateUserProfile = async (id, username, avatar, token) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ username, avatar }) 
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};
// 🌐 ฟังก์ชันลบ Role
export const deleteRole = async (roleId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/roles/${roleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'ไม่สามารถลบข้อมูลได้');
  }
  return response.json();
};