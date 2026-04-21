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
// ส่วนของไอคอนสำหรับ UI
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

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const session = loadAuthSession();
      if (session?.token) {
        try {
          const user = await getMe(session.token);
          setCurrentUser(user);
        } catch (err) {
          clearAuthSession();
        }
      }
      setIsInitialized(true);
    };
    initAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { token, user } = await loginWithPassword(username, password);
      saveAuthSession(token);
      setCurrentUser(user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { token, user } = await registerWithPassword(username, password);
      saveAuthSession(token);
      setCurrentUser(user);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  const roleLabel = useMemo(() => {
    if (!currentUser) return '';
    return currentUser.role === 'manager' ? 'Manager' : 'Employee';
  }, [currentUser]);

  if (!isInitialized) return null;

  if (!currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo.png" alt="Logo" className="login-logo" />
            <h1>BA System</h1>
            <p>{isLoginView ? 'Sign in to your account' : 'Create new account'}</p>
          </div>

          <form className="login-form" onSubmit={isLoginView ? handleLogin : handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter your username" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {errorMsg && <div className="auth-error">{errorMsg}</div>}

            <button type="submit" className="btn btn-primary btn-block">
              {isLoginView ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="login-footer">
            <button className="btn-link" onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(''); }}>
              {isLoginView ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {/* 🚀 TOPBAR ปรับปรุงใหม่ 🚀 */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="brand-container">
              {/* 🏥 โลโก้โรงพยาบาล */}
              <img 
                src={`${process.env.PUBLIC_URL}/bangkok-hospital-phuket.png`} 
                alt="Bangkok Hospital Phuket" 
                className="hospital-logo" 
                onError={(e) => { e.target.style.display = 'none'; }} /* ซ่อนถ้าหาไฟล์ไม่เจอ จะได้ไม่ดูแปลกๆ */
              />
              
              <div className="vertical-divider"></div>

              {/* 🟢 โลโก้ Greenline และชื่อระบบ */}
              <div className="system-identity">
                <img 
                  src={`${process.env.PUBLIC_URL}/logo.png`} 
                  alt="Greenline Synergy" 
                  className="greenline-logo" 
                />
                <div className="system-text">
                  <span className="system-name">BA System</span>
                  <span className="location-tag">Phuket</span>
                </div>
              </div>
            </div>
          </div>
          
          <nav className="topbar-nav">
            <NavLink to="/" className="nav-item" end>Request Form</NavLink>
            <NavLink to="/projects" className="nav-item">Project Portfolio</NavLink>
            <NavLink to="/applications" className="nav-item">App Portfolio</NavLink>
          </nav>

          <div className="topbar-right">
            <div className="user-profile">
            <div className="user-avatar">
            {/* 🚀 เพิ่ม ? และใส่ค่า default เป็น 'U' ป้องกันระบบพัง */}
            {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            {/* 🚀 ป้องกันกรณีที่ username เป็นค่าว่าง */}
            <span className="username">{currentUser?.username || 'Employee'}</span>
              <span className="user-role">{roleLabel}</span>
                </div>
                  </div>
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