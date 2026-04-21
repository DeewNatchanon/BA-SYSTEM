import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import RequestForm from './pages/RequestForm';
import ProjectPortfolio from './pages/ProjectPortfolio';
import ApplicationPortfolio from './pages/ApplicationPortfolio';
import {
  clearAuthSession,
  getMe,
  loadAuthSession,
  loginWithPassword,
  registerWithPassword,
  saveAuthSession
} from './api/authApi';
import './index.css';

// ==========================================
// ส่วนของไอคอน UI (ตา / Logout)
// ==========================================
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

// ==========================================
// Component หลัก (รักษา Logic เดิมของคุณ 100%)
// ==========================================
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

  // 🚀 ดีไซน์รูปภาพพื้นหลัง
  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(234, 242, 251, 0.6), rgba(234, 242, 251, 0.6)), url(${process.env.PUBLIC_URL}/bangkok-hospital-phuket.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh'
  };

  const currentUser = session?.user || null;

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!session?.token) {
        setIsAuthenticating(false);
        return;
      }
      try {
        const me = await getMe(session.token);
        const nextSession = { token: session.token, user: me.user };
        saveAuthSession(nextSession);
        setSession(nextSession);
      } catch (error) {
        clearAuthSession();
        setSession(null);
      } finally {
        setIsAuthenticating(false);
      }
    };
    bootstrapSession();
  }, [session?.token]);

  const roleLabel = useMemo(() => (currentUser?.role === 'manager' ? 'Manager' : 'Employee'), [currentUser]);

  const handleAuthenticate = async (event) => {
    event.preventDefault();
    setAuthError('');
    const normalizedUsername = username.trim();

    if (normalizedUsername.length < 3) return setAuthError('Username must be at least 3 characters.');
    if (authMode === 'login' && password.length < 6) return setAuthError('Password too short.');
    if (authMode === 'register') {
      if (password.length < 8) return setAuthError('Password must be at least 8 characters.');
      if (password !== confirmPassword) return setAuthError('Passwords do not match.');
      if (registerRole === 'manager' && !managerCode.trim()) {
        return setAuthError('กรุณาระบุ Manager Secret Code');
      }
    }

    setIsAuthenticating(true);
    try {
      const data = authMode === 'register'
        ? await registerWithPassword(normalizedUsername, password, registerRole, managerCode)
        : await loginWithPassword(normalizedUsername, password);
      saveAuthSession(data);
      setSession(data);
      setPassword(''); setConfirmPassword(''); setManagerCode('');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setIsMobileMenuOpen(false);
  };

  if (isAuthenticating) {
    return (
      <main className="login-page" style={backgroundStyle}>
        <div className="login-card"><h1>BA System</h1><p>Loading...</p></div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="login-page" style={backgroundStyle}>
        <form className="login-card" onSubmit={handleAuthenticate}>
          <div className="login-header">
            <img src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} alt="Logo" className="login-logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '10px' }} />
            <h1 className="login-title">BA System</h1>
            <p className="login-desc" style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </p>
          </div>
          
          <div className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter username" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1" 
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      placeholder="Confirm password"
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn" 
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select className="modern-select" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)}>
                    <option value="employee">Employee (General User)</option>
                    <option value="manager">Manager (Approver)</option>
                  </select>
                </div>

                {registerRole === 'manager' && (
                  <div className="manager-auth-box" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '15px', borderRadius: '10px' }}>
                    <label style={{ color: '#b45309', marginBottom: '8px' }}>Manager Secret Code</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter Authorization Code"
                        value={managerCode} 
                        onChange={(e) => setManagerCode(e.target.value)} 
                        required 
                        style={{ borderColor: '#fcd34d', background: '#fff' }}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {authError && <div className="auth-error">{authError}</div>}

            <button type="submit" className="btn btn-login-submit" disabled={isAuthenticating}>
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>

          <div className="login-footer">
            <button 
              type="button"
              className="btn-link"
              onClick={(e) => { 
                e.preventDefault(); 
                setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                setAuthError(''); 
                setShowPassword(false); 
              }}
            >
              {authMode === 'login' ? "Don't have an account? Register here" : "Already have an account? Login here"}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <Router>
      <div className="app-container" style={backgroundStyle}>
        <header className="topbar print-hidden">
          <div className="topbar-left">
            <div className="brand-container">
              <img 
                src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`} 
                alt="Bangkok Hospital Phuket" 
                className="hospital-logo" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
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
          
          {/* ปุ่มแฮมเบอร์เกอร์ */}
          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          
          {/* 🚀 Sidebar ที่รวมทุกอย่างไว้ด้านใน */}
          <div className={`topbar-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            
            {/* 1. โปรไฟล์ผู้ใช้อยู่บนสุด */}
            <div className="sidebar-profile">
              <div className="user-avatar">
                {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="username">{currentUser?.username || 'Employee'}</span>
                <span className="user-role">{roleLabel}</span>
              </div>
            </div>

            {/* 2. ลิงก์เมนูต่างๆ อยู่ตรงกลาง */}
            <nav className="sidebar-nav">
              <NavLink to="/" className="nav-item" end onClick={() => setIsMobileMenuOpen(false)}>Request Form</NavLink>
              <NavLink to="/projects" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>Project Portfolio</NavLink>
              <NavLink to="/applications" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>App Portfolio</NavLink>
            </nav>

            {/* 3. ปุ่ม Logout โดนดันไปอยู่ล่างสุด */}
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </button>
            
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<RequestForm currentUser={currentUser} />} />
            <Route path="/projects" element={<ProjectPortfolio currentUser={currentUser} />} />
            <Route path="/applications" element={<ApplicationPortfolio currentUser={currentUser} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;