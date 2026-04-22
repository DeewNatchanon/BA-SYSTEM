import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import RequestForm from './pages/RequestForm';
import ProjectPortfolio from './pages/ProjectPortfolio';
import ApplicationPortfolio from './pages/ApplicationPortfolio';
import {clearAuthSession,getMe,loadAuthSession,loginWithPassword,registerWithPassword,saveAuthSession} from './api/authApi';
import './index.css';
import ManagerDashboard from './pages/ManagerDashboard';

// ไอคอนต่างๆ
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;

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

  // States สำหรับ Settings, Theme และ Notifications
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ba-system-theme') || 'light');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [isNotifExpanded, setIsNotifExpanded] = useState(false); 
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');

  // ข้อมูลแจ้งเตือนจำลอง
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'อนุมัติแล้ว', text: 'REQ-798318 ได้รับการอนุมัติโดยหัวหน้างาน', time: '10 นาทีที่แล้ว', read: false },
    { id: 2, title: 'งานใหม่', text: 'คุณได้รับมอบหมายให้ดูแล HIS System', time: '1 ชม. ที่แล้ว', read: false }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ba-system-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(234, 242, 251, 0.6), rgba(234, 242, 251, 0.6)), url(${process.env.PUBLIC_URL}/bangkok-hospital-phuket.jpg)`,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh'
  };

  const currentUser = session?.user || null;
  const roleLabel = useMemo(() => (currentUser?.role === 'manager' ? 'Manager' : 'Employee'), [currentUser]);

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!session?.token) { setIsAuthenticating(false); return; }
      try {
        const me = await getMe(session.token);
        const nextSession = { token: session.token, user: me.user };
        saveAuthSession(nextSession);
        setSession(nextSession);
      } catch (error) { clearAuthSession(); setSession(null); } 
      finally { setIsAuthenticating(false); }
    };
    bootstrapSession();
  }, [session?.token]);

  const handleAuthenticate = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const data = authMode === 'register'
        ? await registerWithPassword(username.trim(), password, registerRole, managerCode)
        : await loginWithPassword(username.trim(), password);
      saveAuthSession(data);
      setSession(data);
      showToast(`ยินดีต้อนรับ, ${data.user.username}`, 'success');
    } catch (error) { setAuthError(error.message); } 
    finally { setIsAuthenticating(false); }
  };

  const handleLogout = () => {
    clearAuthSession(); setSession(null); setIsMobileMenuOpen(false);
    showToast('ออกจากระบบแล้ว', 'info');
  };

  // --- Settings Modal ---
  const SettingsModal = () => (
    <div className={`settings-overlay ${isSettingsOpen ? 'active' : ''}`} onClick={() => setIsSettingsOpen(false)}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Account Settings</h2>
          <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>✕</button>
        </div>
        <div className="settings-body">
          <div className="setting-section">
            <label className="section-label">ข้อมูลโปรไฟล์</label>
            <div className="profile-preview">
              <div className="avatar-large">{currentUser?.username?.charAt(0)?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                {isEditingProfile ? (
                  <div className="edit-profile-form">
                    <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="edit-input" />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-small-primary" onClick={() => {
                        const updated = { ...session, user: { ...session.user, username: editUsername } };
                        setSession(updated); saveAuthSession(updated); setIsEditingProfile(false); showToast('อัปเดตชื่อแล้ว', 'success');
                      }}>บันทึก</button>
                      <button className="btn-small-secondary" onClick={() => setIsEditingProfile(false)}>ยกเลิก</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><p className="p-username">{currentUser?.username}</p><p className="p-role">{roleLabel}</p></div>
                    <button className="btn-text" onClick={() => { setIsEditingProfile(true); setEditUsername(currentUser?.username); }}>แก้ไข</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="setting-section">
            <label className="section-label">ธีม (Appearance)</label>
            <div className="theme-grid">
              <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>☀️ Light</button>
              <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>🌙 Dark</button>
              <button className={`theme-option ${theme === 'hospital' ? 'active' : ''}`} onClick={() => setTheme('hospital')}>🏥 Hospital</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- หน้า Login ---
  if (!currentUser) {
    return (
      <main className="login-page" style={backgroundStyle}>
        <form className="login-card" onSubmit={handleAuthenticate}>
          <div className="login-header">
            <img src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} alt="Logo" className="login-logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '10px' }} />
            <h1 className="login-title">BA System</h1>
            <p className="login-desc">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</p>
          </div>
          <div className="login-form">
            <div className="form-group"><label>Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter username" /></div>
            <div className="form-group"><label>Password</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
              </div>
            </div>
            
            {authMode === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group"><label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm password" />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                </div>
                <div className="form-group"><label>Role</label>
                  <select className="modern-select" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                
                {registerRole === 'manager' && (
                  <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <label style={{ color: '#0072bb' }}>Manager Secret Code</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={managerCode} 
                        onChange={(e) => setManagerCode(e.target.value)} 
                        required 
                        placeholder="Enter Authorization Code" 
                        style={{ borderColor: '#0072bb', backgroundColor: 'rgba(234, 242, 251, 0.8)' }}
                      />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit" className="btn btn-login-submit">{authMode === 'login' ? 'Login' : 'Create Account'}</button>
          </div>
          <div className="login-footer">
            <button type="button" className="btn-link" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>
        <div className={`toast-notification ${toast.visible ? 'show' : ''} ${toast.type}`}>{toast.message}</div>
      </main>
    );
  }

  // --- หน้าใช้งานหลัก ---
  return (
    <Router>
      <div className="app-container" style={backgroundStyle}>
        <header className="topbar print-hidden">
          
          <div className="topbar-left">
            <div className="brand-container">
              <img src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} alt="Bangkok Hospital" className="hospital-logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="vertical-divider"></div>
              <div className="system-identity">
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Greenline Synergy" className="greenline-logo" />
                <div className="system-text">
                  <span className="system-name">BA System</span>
                  <span className="location-tag">Phuket</span>
                </div>
              </div>
            </div>
          </div>
          
          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          
          <div className={`topbar-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            
            {/* 🚀 1. กล่องโปรไฟล์แบบใหม่ (มีปุ่มคู่กัน ไม่เบี้ยว ไม่ทับกากบาท) */}
            <div className="sidebar-profile">
              <div className="user-avatar">{currentUser?.username?.charAt(0)?.toUpperCase()}</div>
              
              <div className="user-details" onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} style={{ cursor: 'pointer', flex: 1 }}>
                <span className="username">{currentUser?.username}</span>
                <span className="user-role">{roleLabel}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                
                {/* 🔔 ปุ่มแจ้งเตือน */}
                <div style={{ position: 'relative' }}>
                  <button 
                    className="action-icon-btn" 
                    onClick={(e) => { e.stopPropagation(); setIsNotifExpanded(!isNotifExpanded); }}
                    title="Notifications"
                  >
                    <BellIcon />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                  </button>

                  {/* 💬 Popup แจ้งเตือน */}
                  {isNotifExpanded && (
                    <div className="notif-popup-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="notif-header">
                        <h4>การแจ้งเตือน</h4>
                        {unreadCount > 0 && (
                          <button className="mark-read-btn" onClick={() => {
                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                            showToast('อ่านการแจ้งเตือนทั้งหมดแล้ว', 'success');
                          }}>อ่านทั้งหมด</button>
                        )}
                      </div>
                      <div className="sidebar-notif-list">
                        {notifications.length > 0 ? notifications.map(n => (
                          <div key={n.id} className={`sidebar-notif-item ${n.read ? '' : 'unread'}`}>
                            <div className="notif-dot-small" style={{ opacity: n.read ? 0 : 1 }}></div>
                            <div className="notif-info">
                              <div className="notif-title-small">{n.title}</div>
                              <div className="notif-text-small">{n.text}</div>
                              <div className="notif-time" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>{n.time}</div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>ไม่มีการแจ้งเตือน</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ⚙️ ปุ่มตั้งค่า */}
                <button 
                  className="action-icon-btn" 
                  onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                  title="Settings"
                >
                  <SettingsIcon />
                </button>
              </div>
            </div>

            {/* 2. ลิงก์เมนู */}
            <nav className="sidebar-nav">
              {/* ซ่อนเมนูนี้ถ้าเป็นแค่ Employee */}
              {currentUser?.role === 'manager' && (
                <NavLink to="/manager-dashboard" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  Manager Dashboard
                </NavLink>
              )}

              <NavLink to="/" className="nav-item" end onClick={() => setIsMobileMenuOpen(false)}>Request Form</NavLink>
              <NavLink to="/projects" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>Project Portfolio</NavLink>
              <NavLink to="/applications" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>App Portfolio</NavLink>
            </nav>
            
            <button className="logout-btn" onClick={handleLogout}><LogoutIcon /> Logout</button>
          </div>
        </header>

        <main className="app-main" onClick={() => setIsNotifExpanded(false)}>
          <Routes>
            {/* หน้า Dashboard สำหรับ Manager */}
            <Route path="/manager-dashboard" element={<ManagerDashboard currentUser={currentUser} />} />
            
            {/* หน้าเดิมของคุณ */}
            <Route path="/" element={<RequestForm currentUser={currentUser} />} />
            <Route path="/projects" element={<ProjectPortfolio currentUser={currentUser} />} />
            <Route path="/applications" element={<ApplicationPortfolio currentUser={currentUser} />} />
          </Routes>
        </main>
        
        <SettingsModal />
        <div className={`toast-notification ${toast.visible ? 'show' : ''} ${toast.type}`}>{toast.message}</div>
      </div>
    </Router>
  );
}

export default App;