import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RequestForm from './pages/RequestForm';
import ProjectPortfolio from './pages/ProjectPortfolio';
import ApplicationPortfolio from './pages/ApplicationPortfolio';
import {
  clearAuthSession, getMe, loadAuthSession, loginWithPassword,
  registerWithPassword, saveAuthSession, fetchProjects,
  fetchPendingRequests, changePassword, updateUserProfile 
} from './api/authApi';
import './index.css';
import ManagerDashboard from './pages/ManagerDashboard';
import Swal from 'sweetalert2';

const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('employee');
  const [managerCode, setManagerCode] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [session, setSession] = useState(() => loadAuthSession());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ba-system-theme');
    return (saved === 'hospital' ? 'light' : saved) || 'light';
  });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [isNotifExpanded, setIsNotifExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const [baSettings, setBaSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ba-system-settings');
      return saved ? JSON.parse(saved) : {
        hospitalBranch: 'Bangkok Hospital Phuket',
        department: '', baTeam: '',
        defaultCategory: 'System Development',
        projectPrefix: 'BA', reportLanguage: 'th',
        emailNotifications: true, autoAssignBA: false,
      };
    } catch {
      return {
        hospitalBranch: 'Bangkok Hospital Phuket', department: '', baTeam: '',
        defaultCategory: 'System Development', projectPrefix: 'BA',
        reportLanguage: 'th', emailNotifications: true, autoAssignBA: false,
      };
    }
  });

  const currentUser = session?.user || null;
  const roleLabel = useMemo(() => currentUser?.role === 'manager' ? 'Manager' : 'Employee', [currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ba-system-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const getBackgroundOverlay = (t) =>
    t === 'dark'
      ? 'rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)'
      : 'rgba(234, 242, 251, 0.6), rgba(234, 242, 251, 0.6)';

  const backgroundStyle = {
    backgroundImage: `linear-gradient(${getBackgroundOverlay(theme)}), url(${process.env.PUBLIC_URL}/bangkok-hospital-phuket.jpg)`,
    backgroundSize: 'cover', backgroundPosition: 'center',
    backgroundAttachment: 'fixed', minHeight: '100vh',
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!session?.token) { setIsAuthenticating(false); return; }
      try {
        const me = await getMe(session.token);
        const next = { token: session.token, user: me.user };
        saveAuthSession(next); setSession(next);
      } catch { clearAuthSession(); setSession(null); }
      finally { setIsAuthenticating(false); }
    };
    bootstrapSession();
  }, [session?.token]);

  useEffect(() => {
    const loadNotifs = async () => {
      if (!currentUser || !session?.token) return;
      try {
        let newNotifs = [];
        if (currentUser.role === 'manager') {
          const pending = await fetchPendingRequests(session.token);
          if (pending?.length > 0) {
            pending.forEach(req => newNotifs.push({
              id: `pending-${req.id}`, title: '🔔 รอการอนุมัติ',
              text: `โปรเจกต์ ${req.name} (${req.id}) รอให้คุณตรวจสอบ`,
              time: new Date(req.created_at).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              read: false, linkPath: '/manager-dashboard',
            }));
          }
        }
        const allProjects = await fetchProjects(session.token);
        if (allProjects?.length > 0) {
          allProjects
            .filter(p => p.updated_at && p.status !== 'Pending Approval')
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5)
            .forEach(p => {
              if (currentUser.role === 'manager' || p.form_data?.assigned_to === currentUser.username || p.requester_name === currentUser.username) {
                const progress = p.form_data?.tracking?.completionPercent || 0;
                newNotifs.push({
                  id: `update-${p.id}-${p.updated_at}`, title: '📝 มีการอัปเดต',
                  text: `[${p.id}] ความคืบหน้า ${progress}%`,
                  time: new Date(p.updated_at).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                  read: false, linkPath: '/projects',
                });
              }
            });
        }
        const readIds = JSON.parse(localStorage.getItem(`readNotifs_${currentUser.username}`)) || [];
        setNotifications(newNotifs.map(n => ({ ...n, read: readIds.includes(n.id) })));
      } catch (e) { console.error(e); }
    };
    loadNotifs();
    const id = setInterval(loadNotifs, 60000);
    return () => clearInterval(id);
  }, [currentUser, session?.token]);

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`readNotifs_${currentUser.username}`, JSON.stringify(updated.map(n => n.id)));
    showToast('อ่านการแจ้งเตือนทั้งหมดแล้ว', 'success');
  };

  const handleAuthenticate = async (e) => {
    e.preventDefault(); setAuthError(''); setIsAuthenticating(true);
    try {
      const data = authMode === 'register'
        ? await registerWithPassword(username.trim(), password, registerRole, managerCode)
        : await loginWithPassword(username.trim(), password);
      saveAuthSession(data); setSession(data);
      // 🚀 SweetAlert2
      Swal.fire({
        title: 'ยินดีต้อนรับ',
        text: `เข้าสู่ระบบสำเร็จ ${data.user.username}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) { setAuthError(err.message); }
    finally { setIsAuthenticating(false); }
  };

  const handleLogout = () => {
    clearAuthSession(); setSession(null); setIsMobileMenuOpen(false);
  };

  const handleChangePassword = async () => {
    setPwdError(''); setPwdSuccess('');
    if (!currentPwd || !newPwd || !confirmNewPwd) return setPwdError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    if (newPwd.length < 6) return setPwdError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
    if (newPwd !== confirmNewPwd) return setPwdError('รหัสผ่านใหม่และยืนยันไม่ตรงกัน');
    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd, session.token);
      setCurrentPwd(''); setNewPwd(''); setConfirmNewPwd('');
      // 🚀 SweetAlert2
      Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านสำเร็จแล้ว', 'success');
      closeSettings();
    } catch (err) { setPwdError(err.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง'); }
    finally { setPwdLoading(false); }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Swal.fire('ผิดพลาด', 'ชื่อผู้ใช้ไม่ถูกต้อง', 'error');
      return;
    }
    
    try {
      await updateUserProfile(currentUser.id, editUsername.trim(), session.token);
      setIsEditingProfile(false);
      // 🚀 SweetAlert2
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'เปลี่ยนชื่อผู้ใช้สำเร็จ! เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        icon: 'success'
      }).then(() => {
        handleLogout();
      });
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
    }
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
    setIsEditingProfile(false);
    setPwdError(''); setPwdSuccess('');
  };

  const s = {
    label: {
      display: 'block', fontSize: '0.78rem', fontWeight: 600,
      color: 'var(--text-muted, #64748b)', marginBottom: '6px', letterSpacing: '0.03em',
    },
    input: {
      width: '100%', boxSizing: 'border-box', padding: '10px 14px',
      border: '1.5px solid var(--border-color, #e2e8f0)',
      borderRadius: '8px', fontSize: '0.9rem',
      background: 'var(--input-bg, #fff)', color: 'var(--text-color, #1e293b)',
      outline: 'none', transition: 'border-color 0.2s',
    },
    inputRow: {
      display: 'flex', alignItems: 'center',
      border: '1.5px solid var(--border-color, #e2e8f0)',
      borderRadius: '8px', overflow: 'hidden',
      background: 'var(--input-bg, #fff)',
    },
    eyeBtn: {
      background: 'none', border: 'none', padding: '0 12px',
      cursor: 'pointer', color: 'var(--text-muted, #94a3b8)',
      display: 'flex', alignItems: 'center',
    },
    primaryBtn: {
      width: '100%', padding: '11px 16px',
      background: 'linear-gradient(135deg, #0072bb, #005a9e)',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
      transition: 'opacity 0.2s', marginTop: '4px',
    },
    errorBox: {
      padding: '10px 14px', borderRadius: '8px',
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', fontSize: '0.85rem',
    },
    successBox: {
      padding: '10px 14px', borderRadius: '8px',
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      color: '#15803d', fontSize: '0.85rem', fontWeight: 500,
    },
  };

  // 🚀 ระบบป้องกันหน้า Manager Dashboard สำหรับพนักงาน
  const ProtectedManagerRoute = ({ children }) => {
    if (currentUser?.role !== 'manager') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (!currentUser) {
    return (
      <main className="login-page" style={backgroundStyle}>
        <form className="login-card" onSubmit={handleAuthenticate}>
          <div className="login-header">
            <img src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} alt="Logo"
              className="login-logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '10px' }} />
            <h1 className="login-title">BA System</h1>
            <p className="login-desc">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</p>
          </div>
          <div className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter username" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm password" />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="modern-select" value={registerRole} onChange={e => setRegisterRole(e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                {registerRole === 'manager' && (
                  <div className="form-group">
                    <label style={{ color: '#0072bb' }}>Manager Secret Code</label>
                    <div className="password-input-wrapper">
                      <input type={showPassword ? 'text' : 'password'} value={managerCode}
                        onChange={e => setManagerCode(e.target.value)} required placeholder="Enter Authorization Code" />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit" className="btn btn-login-submit" disabled={isAuthenticating}>
              {isAuthenticating ? '⏳ กำลังโหลด...' : authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>
          <div className="login-footer">
            <button type="button" className="btn-link"
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </form>
        <div className={`toast-notification ${toast.visible ? 'show' : ''} ${toast.type}`}>{toast.message}</div>
      </main>
    );
  }

  return (
    <Router>
      {/* 🚀 ดักจับการคลิกทุกจุดบนหน้าจอ ถ้าผู้ใช้กดพื้นหลัง กล่องแจ้งเตือนจะหุบเองทันที */}
      <div className="app-container" style={backgroundStyle} onClick={() => setIsNotifExpanded(false)}>

        <header className="topbar print-hidden">
          <div className="topbar-left">
            <div className="brand-container">
              <img src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} alt="Bangkok Hospital"
                className="hospital-logo" onError={e => { e.target.style.display = 'none'; }} />
              <div className="vertical-divider" />
              <div className="system-identity">
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Greenline Synergy" className="greenline-logo" />
                <div className="system-text">
                  <span className="system-name">BA System</span>
                  <span className="location-tag">Phuket</span>
                </div>
              </div>
            </div>
          </div>

          <button className="hamburger-btn" onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }} style={{ position: 'relative' }}>
            {isMobileMenuOpen ? '✕' : '☰'}
            {unreadCount > 0 && !isMobileMenuOpen && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px', backgroundColor: '#ef4444',
                color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '50%',
                minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '0 4px',
              }}>{unreadCount}</span>
            )}
          </button>

          <div className={`topbar-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            
            <div className="sidebar-profile">
              <div className="user-avatar">{currentUser?.username?.charAt(0)?.toUpperCase()}</div>
              
              <div className="user-details" onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                style={{ cursor: 'pointer', flex: 1 }}>
                <span className="username">{currentUser?.username}</span>
                <span className="user-role">{roleLabel}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button className="action-icon-btn"
                    onClick={e => { e.stopPropagation(); setIsNotifExpanded(!isNotifExpanded); }}>
                    <BellIcon />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                  </button>
                  {isNotifExpanded && (
                    <div className="notif-popup-dropdown" onClick={e => e.stopPropagation()} style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: '0',
                      width: '240px',
                      zIndex: 9999,
                      background: 'var(--card-bg, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      overflow: 'hidden'
                    }}>
                      <div className="notif-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-color)', fontSize: '0.9rem' }}>การแจ้งเตือน</h4>
                        {unreadCount > 0 && (
                          <button className="mark-read-btn" onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>อ่านทั้งหมด</button>
                        )}
                      </div>
                      <div className="sidebar-notif-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? notifications.map(n => (
                          <div key={n.id} className={`sidebar-notif-item ${n.read ? '' : 'unread'}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                            <div className="notif-dot-small" style={{ opacity: n.read ? 0 : 1, width: '8px', height: '8px', background: 'var(--blue)', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }} />
                            <div className="notif-info">
                              <div className="notif-title-small" style={{ color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.85rem' }}>{n.title}</div>
                              <div className="notif-text-small" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.4' }}>{n.text}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>{n.time}</div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            ไม่มีการแจ้งเตือนใหม่
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button className="action-icon-btn"
                  onClick={e => { e.stopPropagation(); setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}>
                  <SettingsIcon />
                </button>
              </div>
            </div>

            {/* 🚀 ย้าย Dashboard มาเป็นหน้าแรก และย้าย Request Form ไปที่ /request */}
            <nav className="sidebar-nav">
              <NavLink to="/" className="nav-item" end onClick={() => setIsMobileMenuOpen(false)}>📊 Dashboard</NavLink>
              {currentUser?.role === 'manager' && (
                <NavLink to="/manager-dashboard" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  🛡️ Manager Dashboard
                </NavLink>
              )}
              <NavLink to="/request" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>📝 Request Form</NavLink>
              <NavLink to="/projects" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>📋 Project Portfolio</NavLink>
              <NavLink to="/applications" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>💻 App Portfolio</NavLink>
            </nav>

            <button className="logout-btn" onClick={() => {
              Swal.fire({
                title: 'ออกจากระบบ?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
              }).then((result) => {
                if (result.isConfirmed) handleLogout();
              });
            }}>
              <LogoutIcon /> Logout
            </button>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/request" element={<RequestForm currentUser={currentUser} />} />
            <Route path="/projects" element={<ProjectPortfolio currentUser={currentUser} />} />
            <Route path="/applications" element={<ApplicationPortfolio currentUser={currentUser} />} />
            {/* 🚀 ป้องกันพนักงานเข้า Manager Dashboard */}
            <Route path="/manager-dashboard" element={
              <ProtectedManagerRoute>
                <ManagerDashboard currentUser={currentUser} />
              </ProtectedManagerRoute>
            } />
          </Routes>
        </main>

        {/* ===================== SETTINGS MODAL ===================== */}
        {isSettingsOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}
            onClick={closeSettings}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '460px', maxHeight: '90vh',
                background: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '20px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              {/* ── Header ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 22px', flexShrink: 0,
                background: 'var(--card-bg, #fff)',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)' }}>การตั้งค่า</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    โปรไฟล์ · รหัสผ่าน · ธีม
                  </div>
                </div>
                <button onClick={closeSettings} style={{
                  background: 'var(--bg-secondary, #f1f5f9)', border: 'none',
                  borderRadius: '10px', width: '34px', height: '34px',
                  cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>

              {/* ── Scrollable Body ── */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* ══ SECTION: โปรไฟล์ ══ */}
                <div style={{
                  background: 'var(--card-bg, #fff)', borderRadius: '14px',
                  padding: '18px', border: '1px solid var(--border-color, #e2e8f0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.95rem' }}>👤</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-color)' }}>โปรไฟล์</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                    border: '1px solid #bfdbfe', marginBottom: '14px',
                  }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #0072bb, #005a9e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', fontWeight: 700, color: '#fff',
                    }}>
                      {currentUser?.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser?.username}
                      </div>
                      <span style={{
                        display: 'inline-block', marginTop: '3px', fontSize: '0.72rem',
                        fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                        background: currentUser?.role === 'manager' ? '#fef3c7' : '#dbeafe',
                        color: currentUser?.role === 'manager' ? '#92400e' : '#1d4ed8',
                      }}>
                        {currentUser?.role === 'manager' ? '🏅 Manager' : '👤 Employee'}
                      </span>
                    </div>
                  </div>

                  <label style={s.label}>ชื่อผู้ใช้งาน</label>
                  {isEditingProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        style={s.input} value={editUsername} autoFocus
                        onChange={e => setEditUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                        placeholder="กรอกชื่อผู้ใช้ใหม่"
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSaveProfile}
                          style={{ ...s.primaryBtn, width: 'auto', flex: 1, padding: '9px', marginTop: 0 }}>
                          💾 บันทึก
                        </button>
                        <button onClick={() => setIsEditingProfile(false)}
                          style={{ flex: 1, padding: '9px', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input style={{ ...s.input, background: 'var(--bg-secondary, #f8fafc)', color: 'var(--text-muted)', cursor: 'default' }}
                        value={currentUser?.username} readOnly />
                      <button onClick={() => { setIsEditingProfile(true); setEditUsername(currentUser?.username); }}
                        style={{ flexShrink: 0, padding: '10px 14px', border: '1.5px solid #0072bb', borderRadius: '8px', background: 'transparent', color: '#0072bb', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        ✏️ แก้ไข
                      </button>
                    </div>
                  )}
                </div>

                {/* ══ SECTION: รหัสผ่าน ══ */}
                <div style={{
                  background: 'var(--card-bg, #fff)', borderRadius: '14px',
                  padding: '18px', border: '1px solid var(--border-color, #e2e8f0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.95rem' }}>🔒</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-color)' }}>เปลี่ยนรหัสผ่าน</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e', marginBottom: '14px', display: 'flex', gap: '6px' }}>
                    <span>⚠️</span>
                    <span>รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย <strong>6 ตัวอักษร</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={s.label}>รหัสผ่านปัจจุบัน</label>
                      <div style={s.inputRow}>
                        <input type={showCurrentPwd ? 'text' : 'password'} value={currentPwd}
                          onChange={e => setCurrentPwd(e.target.value)} placeholder="กรอกรหัสผ่านเดิม"
                          style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-color)' }} />
                        <button type="button" style={s.eyeBtn} onClick={() => setShowCurrentPwd(!showCurrentPwd)}>
                          {showCurrentPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={s.label}>รหัสผ่านใหม่</label>
                      <div style={s.inputRow}>
                        <input type={showNewPwd ? 'text' : 'password'} value={newPwd}
                          onChange={e => setNewPwd(e.target.value)} placeholder="รหัสผ่านใหม่"
                          style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-color)' }} />
                        <button type="button" style={s.eyeBtn} onClick={() => setShowNewPwd(!showNewPwd)}>
                          {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {newPwd.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {[1, 2, 3].map(i => (
                            <div key={i} style={{
                              flex: 1, height: '4px', borderRadius: '4px', transition: 'background 0.3s',
                              background: newPwd.length >= i * 4
                                ? (i === 1 ? '#f87171' : i === 2 ? '#fb923c' : '#4ade80')
                                : 'var(--border-color, #e2e8f0)',
                            }} />
                          ))}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                            {newPwd.length < 4 ? 'อ่อน' : newPwd.length < 8 ? 'ปานกลาง' : 'แข็งแกร่ง'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={s.label}>ยืนยันรหัสผ่านใหม่</label>
                      <div style={{ ...s.inputRow, borderColor: confirmNewPwd && newPwd !== confirmNewPwd ? '#fca5a5' : 'var(--border-color, #e2e8f0)' }}>
                        <input type={showConfirmPwd ? 'text' : 'password'} value={confirmNewPwd}
                          onChange={e => setConfirmNewPwd(e.target.value)} placeholder="ยืนยันรหัสผ่านใหม่"
                          style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-color)' }} />
                        <button type="button" style={s.eyeBtn} onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                          {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {confirmNewPwd && newPwd !== confirmNewPwd && (
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '4px 0 0' }}>⚠️ รหัสผ่านไม่ตรงกัน</p>
                      )}
                      {confirmNewPwd && newPwd === confirmNewPwd && (
                        <p style={{ fontSize: '0.75rem', color: '#16a34a', margin: '4px 0 0' }}>✅ ตรงกัน</p>
                      )}
                    </div>
                  </div>

                  {pwdError && <div style={{ ...s.errorBox, marginTop: '12px' }}>⚠️ {pwdError}</div>}
                  {pwdSuccess && <div style={{ ...s.successBox, marginTop: '12px' }}>{pwdSuccess}</div>}

                  <button style={{ ...s.primaryBtn, marginTop: '14px' }} onClick={handleChangePassword} disabled={pwdLoading}>
                    {pwdLoading ? '⏳ กำลังเปลี่ยนรหัสผ่าน...' : '🔒 ยืนยันเปลี่ยนรหัสผ่าน'}
                  </button>
                </div>

                {/* ══ SECTION: ธีม ══ */}
                <div style={{
                  background: 'var(--card-bg, #fff)', borderRadius: '14px',
                  padding: '18px', border: '1px solid var(--border-color, #e2e8f0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.95rem' }}>🎨</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-color)' }}>รูปแบบหน้าจอ</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'light', icon: '☀️', label: 'Light', desc: 'สว่างสบายตา เหมาะกลางวัน' },
                      { id: 'dark',  icon: '🌙', label: 'Dark',  desc: 'ลดแสง เหมาะกลางคืน' },
                    ].map(t => (
                      <button key={t.id}
                        onClick={() => { setTheme(t.id); showToast(`เปลี่ยนเป็นธีม ${t.label}`, 'info'); }}
                        style={{
                          padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                          textAlign: 'center', position: 'relative',
                          border: `2px solid ${theme === t.id ? '#0072bb' : 'var(--border-color, #e2e8f0)'}`,
                          background: theme === t.id ? '#eff6ff' : 'var(--card-bg, #fff)',
                          boxShadow: theme === t.id ? '0 0 0 3px rgba(0,114,187,0.12)' : 'none',
                          transition: 'all 0.2s',
                        }}>
                        {theme === t.id && (
                          <div style={{
                            position: 'absolute', top: '8px', right: '8px',
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: '#0072bb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', color: '#fff', fontWeight: 700,
                          }}>✓</div>
                        )}
                        <div style={{ fontSize: '1.7rem', marginBottom: '6px' }}>{t.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: theme === t.id ? '#0072bb' : 'var(--text-color)', marginBottom: '3px' }}>{t.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: '4px' }} />
              </div>
            </div>
          </div>
        )}

        <div className={`toast-notification ${toast.visible ? 'show' : ''} ${toast.type}`}>{toast.message}</div>
      </div>
    </Router>
  );
}

export default App;