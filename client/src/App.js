import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RequestForm from "./pages/RequestForm";
import ProjectPortfolio from "./pages/ProjectPortfolio";
import ApplicationPortfolio from "./pages/ApplicationPortfolio";
import {
  clearAuthSession,
  getMe,
  loadAuthSession,
  loginWithPassword,
  saveAuthSession,
  fetchProjects,
  fetchPendingRequests
} from "./api/authApi";
import "./index.css";
import ManagerDashboard from "./pages/ManagerDashboard";
import Swal from "sweetalert2";
import RequestChange from "./pages/RequestChange";
import ProjectWorkspace from './pages/ProjectWorkspace';
import EditRole from "./pages/EditRole";

/* 🚀 SVG Icons สวยๆ สำหรับเมนู 🚀 */
const DashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
);
const ManagerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const FormIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
);
const ProjectIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
);
const AppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);
const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);

// 🌟 สร้างฟังก์ชันเช็คสิทธิ์ (Permissions) ไว้ใช้ทั่ว App แทนการเช็ค Role ชื่อตรงๆ 🌟
// 🌟 สร้างฟังก์ชันเช็คสิทธิ์ (Permissions) ไว้ใช้ทั่ว App แทนการเช็ค Role ชื่อตรงๆ 🌟
const checkPerm = (user, moduleName) => {
  let perms = user?.permissions || {};
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms);
    } catch (e) {
      perms = {};
    }
  }
  return perms?.[moduleName]?.includes("read") || false;
};

// 🌟 ตัวป้องกัน Route โดยเช็คจากสิทธิ์ 🌟
const ProtectedRoute = ({ isAllowed, children }) => {
  if (!isAllowed) return <Navigate to="/" replace />;
  return children;
};

const formatNotificationTime = (dateString) => {
  if (!dateString) return "";
  const safeDateString = dateString.endsWith("Z")
    ? dateString
    : `${dateString}Z`;
  const date = new Date(safeDateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "เมื่อสักครู่";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
};

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [session, setSession] = useState(() => loadAuthSession());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ba-system-theme");
    return (saved === "hospital" ? "light" : saved) || "light";
  });
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [isNotifExpanded, setIsNotifExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentUser = session?.user || null;
  const roleLabel = useMemo(
    () =>
      currentUser?.role === "manager"
        ? "🏅 Manager"
        : currentUser?.role === "ceo"
          ? "👑 Executive"
          : "👤 Employee",
    [currentUser],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ba-system-theme", theme);
  }, [theme]);

  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(
      () => setToast({ visible: false, message: "", type: "info" }),
      3000,
    );
  };

  const getBackgroundOverlay = (t) =>
    t === "dark"
      ? "rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.92)"
      : "rgba(241, 245, 249, 0.75), rgba(241, 245, 249, 0.75)";
      
  const backgroundStyle = {
    backgroundImage: `linear-gradient(${getBackgroundOverlay(theme)}), url(${process.env.PUBLIC_URL}/bangkok-hospital-phuket.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!session?.token) {
        setIsAuthenticating(false);
        return;
      }
      try {
        const me = await getMe(session.token);
        const next = { token: session.token, user: me.user };
        saveAuthSession(next);
        setSession(next);
      } catch {
        clearAuthSession();
        setSession(null);
      } finally {
        setIsAuthenticating(false);
      }
    };
    bootstrapSession();
  }, [session?.token]);

  useEffect(() => {
    const loadNotifs = async () => {
      if (!currentUser || !session?.token) return;
      try {
        let newNotifs = [];
        
        // 🌟 เปลี่ยนมาเช็คสิทธิ์แทนการเช็ค string role 🌟
        if (checkPerm(currentUser, "manager_dashboard")) {
          const pending = await fetchPendingRequests(session.token);
          if (pending?.length > 0) {
            pending.forEach((req) =>
              newNotifs.push({
                id: `pending-${req.id}`,
                title: "🔔 รอการอนุมัติ",
                text: `โปรเจกต์ ${req.name} (${req.id}) รอให้คุณตรวจสอบ`,
                time: formatNotificationTime(req.created_at),
                rawDate: new Date(req.created_at.endsWith("Z") ? req.created_at : `${req.created_at}Z`),
                read: false,
                linkPath: "/manager-dashboard",
              }),
            );
          }
        }
        
        const allProjects = await fetchProjects(session.token);
        if (allProjects?.length > 0) {
          allProjects
            .filter((p) => p.updated_at && p.status !== "Pending Approval")
            .forEach((p) => {
              // 🌟 เปลี่ยนมาเช็คสิทธิ์ 🌟
              if (
                checkPerm(currentUser, "manager_dashboard") ||
                p.form_data?.assigned_to === currentUser.username ||
                p.requester_name === currentUser.username
              ) {
                const progress = p.form_data?.tracking?.completionPercent || 0;
                newNotifs.push({
                  id: `update-${p.id}-${p.updated_at}`,
                  title: "📝 มีการอัปเดต",
                  text: `[${p.id}] ความคืบหน้า ${progress}%`,
                  time: formatNotificationTime(p.updated_at),
                  rawDate: new Date(p.updated_at.endsWith("Z") ? p.updated_at : `${p.updated_at}Z`),
                  read: false,
                  linkPath: "/projects",
                });
              }
            });
        }

        newNotifs.sort((a, b) => b.rawDate - a.rawDate);
        newNotifs = newNotifs.slice(0, 15);

        const readIds = JSON.parse(localStorage.getItem(`readNotifs_${currentUser.username}`)) || [];
        
        setNotifications(
          newNotifs.map((n) => ({ ...n, read: readIds.includes(n.id) })),
        );
      } catch (e) {
        console.error(e);
      }
    };
    loadNotifs();
    const id = setInterval(loadNotifs, 60000);
    return () => clearInterval(id);
  }, [currentUser, session?.token]);

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(
      `readNotifs_${currentUser.username}`,
      JSON.stringify(updated.map((n) => n.id)),
    );
    showToast("อ่านการแจ้งเตือนทั้งหมดแล้ว", "success");
  };

  const handleNotificationClick = (notif) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, read: true } : n,
    );
    setNotifications(updated);
    const readIds = updated.filter((n) => n.read).map((n) => n.id);
    localStorage.setItem(
      `readNotifs_${currentUser.username}`,
      JSON.stringify(readIds),
    );
    setIsNotifExpanded(false);
    setIsMobileMenuOpen(false);
  };

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    try {
      const data = await loginWithPassword(username.trim(), password);
      saveAuthSession(data);
      setSession(data);
      Swal.fire({
        title: "เข้าสู่ระบบสำเร็จ",
        text: `ยินดีต้อนรับคุณ ${data.user.username}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setAuthError(err.message || "รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setIsMobileMenuOpen(false);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  if (!currentUser)
    return (
      <main className="login-page" style={{ ...backgroundStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form 
          className="login-card" 
          onSubmit={handleAuthenticate}
          style={{
            maxWidth: "320px",
            width: "100%",
            padding: "28px 24px",
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            margin: "0px"
          }}
        >
         <div className="login-header" style={{ marginBottom: "0px" }}>
            <img
              src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`}
              alt="Logo"
              style={{
                height: "36px",
                objectFit: "contain",
                margin: "0 auto 4px auto",
                display: "block",
              }}
            />
            <h1 style={{ 
              textAlign: "center", 
              fontSize: "1.2rem", 
              margin: "0", 
              fontWeight: "700", 
              color: "var(--text-color)",
              lineHeight: "1" 
            }}>
              BA System
            </h1>
            <p style={{ 
              textAlign: "center", 
              margin: "-2px 0 0 0", 
              fontSize: "0.7rem", 
              color: "var(--text-muted)", 
              opacity: 0.8,
              lineHeight: "1" 
            }}>
              Internal Use Only
            </p>
          </div>
          <div className="login-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                style={{ 
                  width: "100%", padding: "10px 12px", borderRadius: "8px", 
                  border: "1px solid var(--border-color)", fontSize: "0.85rem",
                  background: "var(--bg-color)"
                }}
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                style={{ 
                  width: "100%", padding: "10px 32px 10px 12px", borderRadius: "8px", 
                  border: "1px solid var(--border-color)", fontSize: "0.85rem",
                  background: "var(--bg-color)"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{
                  position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                  padding: 0, display: "flex", alignItems: "center"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                  )}
                </svg>
              </button>
            </div>

            {authError && <div style={{ color: "#ef4444", fontSize: "0.75rem", textAlign: "center", margin: 0 }}>{authError}</div>}

            <button
              type="submit"
              disabled={isAuthenticating}
              style={{ 
                width: "100%", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600",
                background: "var(--blue, #0284c7)", color: "#fff", border: "none", cursor: "pointer",
                marginTop: "4px"
              }}
            >
              {isAuthenticating ? "⏳" : "Login"}
            </button>
          </div>
        </form>
        
        <div className={`toast-notification ${toast.visible ? "show" : ""} ${toast.type}`}>
          {toast.message}
        </div>
      </main>
    );

  return (
    <Router>
      <div
        className="app-container"
        style={backgroundStyle}
        onClick={() => setIsNotifExpanded(false)}
      >
        <header className="topbar print-hidden">
          <div className="topbar-left">
            <div className="brand-container">
              <img
                src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`}
                alt="Logo"
                className="hospital-logo"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="vertical-divider" />
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

          <div className="topbar-right">
            <div className="topbar-actions">
              <div style={{ position: "relative" }}>
                <button
                  className="action-icon-btn"
                  style={{ flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotifExpanded(!isNotifExpanded);
                  }}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount}</span>
                  )}
                </button>
                {/* แจ้งเตือน Dropdown */}
                {isNotifExpanded && (
                  <div
                    className="notif-popup-dropdown"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 14px)",
                      right: "0",
                      width: "320px",
                      zIndex: 9999,
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      boxShadow: "var(--shadow-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--table-header-bg)",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: "var(--text-color)",
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--blue)",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <NavLink
                            to={n.linkPath || "/"}
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid var(--border-color)",
                              display: "flex",
                              gap: "12px",
                              textDecoration: "none",
                              transition: "background 0.2s",
                              background: n.read
                                ? "transparent"
                                : "var(--blue-light)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--table-row-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = n.read
                                ? "transparent"
                                : "var(--blue-light)")
                            }
                          >
                            <div
                              style={{
                                opacity: n.read ? 0 : 1,
                                width: "8px",
                                height: "8px",
                                background: "var(--blue)",
                                borderRadius: "50%",
                                marginTop: "6px",
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  color: "var(--text-color)",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {n.title}
                              </div>
                              <div
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                  marginTop: "4px",
                                  lineHeight: "1.4",
                                }}
                              >
                                {n.text}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                  marginTop: "8px",
                                  fontWeight: 600,
                                }}
                              >
                                {n.time}
                              </div>
                            </div>
                          </NavLink>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                          }}
                        >
                          You have no new notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                className="action-icon-btn"
                style={{ flexShrink: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(true);
                }}
              >
                <SettingsIcon />
              </button>
            </div>

            <div
              className="topbar-user"
              onClick={() => {
                setIsSettingsOpen(true);
              }}
            >
              <div className="user-details">
                <span className="username">
                  {currentUser?.username || "Unknown User"}
                </span>
                <span className="user-role">
                  {currentUser?.role === "manager" ? "Manager" : currentUser?.role === "ceo" ? "Executive" : "Employee"}
                </span>
              </div>
              <div className="user-avatar" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))" }}>
                {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
              </div>
            </div>

            <button
              className="hamburger-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div
          className={`topbar-sidebar ${isMobileMenuOpen ? "open" : ""}`}
          style={{ zIndex: 1001 }}
        >
          <nav className="sidebar-nav">
            {/* 🌟 1. ดึงสิทธิ์มาเช็คเพื่อซ่อน/แสดงเมนูด้านซ้าย 🌟 */}
            {checkPerm(currentUser, "dashboard") && (
              <NavLink
                to="/"
                className="nav-item"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                title="Dashboard"
              >
                <DashIcon />
              </NavLink>
            )}

            {checkPerm(currentUser, "manager_dashboard") && (
              <NavLink
                to="/manager-dashboard"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Manager Dashboard"
              >
                <ManagerIcon />
              </NavLink>
            )}

            {checkPerm(currentUser, "request_form") && (
              <NavLink
                to="/request"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Request Form"
              >
                <FormIcon />
              </NavLink>
            )}

            {checkPerm(currentUser, "project_portfolio") && (
              <NavLink
                to="/projects"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Project Portfolio"
              >
                <ProjectIcon />
              </NavLink>
            )}

            {checkPerm(currentUser, "app_portfolio") && (
              <NavLink
                to="/applications"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="App Portfolio"
              >
                <AppIcon />
              </NavLink>
            )}
          </nav>

          <button
            className="logout-btn"
            title="Logout"
            onClick={() => {
              Swal.fire({
                title: "ออกจากระบบ?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "var(--text-muted)",
                confirmButtonText: "ยืนยัน",
                cancelButtonText: "ยกเลิก",
              }).then((result) => {
                if (result.isConfirmed) handleLogout();
              });
            }}
          >
            <LogoutIcon />
          </button>
        </div>

        <main className="app-main">
          <Routes>
            {/* 🌟 2. ล็อกหน้าจอ URL ไม่ให้เข้าถึงถ้าไม่มีสิทธิ์ 🌟 */}
            <Route path="/" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "dashboard")}><Dashboard currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/request" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "request_form")}><RequestForm currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/project-workspace" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "project_portfolio")}><ProjectWorkspace currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/request-change" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "project_portfolio")}><RequestChange currentUser={currentUser} /></ProtectedRoute>} /> 
            <Route path="/projects" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "project_portfolio")}><ProjectPortfolio currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "app_portfolio")}><ApplicationPortfolio currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/manager-dashboard" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "manager_dashboard")}><ManagerDashboard currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/edit-role" element={<ProtectedRoute isAllowed={checkPerm(currentUser, "role_settings")}><EditRole currentUser={currentUser} /></ProtectedRoute>} />
          </Routes>
        </main>

        {isSettingsOpen && (
          <div className="pdf-preview-overlay" onClick={closeSettings}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                background: "var(--card-bg)",
                borderRadius: "24px",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px 32px",
                  flexShrink: 0,
                  background: "var(--table-header-bg)",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      color: "var(--text-color)",
                    }}
                  >
                    Settings
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    Profile · Security · Preferences
                  </div>
                  
                </div>
                <button
                  onClick={closeSettings}
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--table-row-hover)";
                    e.currentTarget.style.color = "var(--text-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--card-bg)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  padding: "24px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  background: "var(--bg-color)",
                }}
              >
                <div
                  style={{
                    background: "var(--card-bg)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>👤</span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "var(--text-color)",
                      }}
                    >
                      Profile Information
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      padding: "20px",
                      borderRadius: "16px",
                      background: "var(--table-header-bg)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "linear-gradient(135deg, var(--blue), var(--blue-dark))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        color: "#fff",
                        boxShadow: "var(--shadow-sm)",
                        border: "2px solid var(--card-bg)",
                      }}
                    >
                      {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          color: "var(--text-color)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {currentUser?.username}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          background: "var(--blue-light)",
                          color: "var(--blue)",
                          border: "1px solid rgba(2, 132, 199, 0.2)"
                        }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--card-bg)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>🔒</span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "var(--text-color)",
                      }}
                    >
                      Security & Authentication
                    </span>
                  </div>
                  
                  <div style={{ background: "rgba(2, 132, 199, 0.05)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: "12px", padding: "20px" }}>
                     <h4 style={{ margin: "0 0 8px 0", color: "var(--blue-dark)", fontSize: "0.95rem" }}>บัญชีถูกจัดการโดยส่วนกลาง</h4>
                     <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                       ข้อมูลโปรไฟล์และรหัสผ่านของคุณถูกเชื่อมโยงกับระบบสารสนเทศส่วนกลางของโรงพยาบาล เพื่อความปลอดภัย คุณไม่สามารถแก้ไขได้จากหน้านี้<br/><br/>
                       หากต้องการรีเซ็ตรหัสผ่าน หรือแก้ไขข้อมูลส่วนตัว กรุณาติดต่อ <strong>IT Support (โทร. 1234)</strong>
                     </p>
                  </div>
                </div>

                {/* 🌟 3. ซ่อนเมนูจัดการ Role ถ้ายูสเซอร์คนนั้นไม่มีสิทธิ์ 🌟 */}
                {checkPerm(currentUser, "role_settings") && (
                  <div
                    style={{
                      background: "var(--card-bg)",
                      borderRadius: "16px",
                      padding: "24px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "1.1rem" }}>👥</span>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-color)" }}>
                        Administration
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--bg-color)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "var(--text-color)", fontSize: "0.95rem" }}>User Role Management</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>จัดการสิทธิ์การเข้าถึงเมนูต่างๆ ของพนักงานในระบบ</div>
                      </div>
                      <NavLink 
                        to="/edit-role" 
                        onClick={closeSettings} 
                        style={{ textDecoration: "none", background: "var(--blue)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.85rem", transition: "all 0.2s" }}
                      >
                        จัดการ Role
                      </NavLink>
                    </div>
                  </div>
                )}
                <div
                  style={{
                    background: "var(--card-bg)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>🎨</span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "var(--text-color)",
                      }}
                    >
                      Preferences
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    {[
                      {
                        id: "light",
                        icon: "☀️",
                        label: "Light",
                        desc: "Clean & Bright",
                      },
                      {
                        id: "dark",
                        icon: "🌙",
                        label: "Dark",
                        desc: "Easy on eyes",
                      },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          showToast(`Theme changed to ${t.label}`, "info");
                        }}
                        style={{
                          padding: "20px 16px",
                          borderRadius: "14px",
                          cursor: "pointer",
                          textAlign: "center",
                          position: "relative",
                          border: `2px solid ${theme === t.id ? "var(--blue)" : "var(--border-color)"}`,
                          background:
                            theme === t.id
                              ? "var(--blue-light)"
                              : "var(--bg-color)",
                          transition: "all 0.2s",
                        }}
                      >
                        {theme === t.id && (
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: "var(--blue)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              color: "#fff",
                              fontWeight: 800,
                            }}
                          >
                            ✓
                          </div>
                        )}
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                          {t.icon}
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "1rem",
                            color:
                              theme === t.id
                                ? "var(--blue)"
                                : "var(--text-color)",
                            marginBottom: "4px",
                          }}
                        >
                          {t.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`toast-notification ${toast.visible ? "show" : ""} ${toast.type}`}
        >
          {toast.message}
        </div>
      </div>
    </Router>
  );
}
export default App;