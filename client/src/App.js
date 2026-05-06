import React, { useEffect, useMemo, useState, useRef } from "react";
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
  fetchPendingRequests,
  changePassword,
  updateUserProfile,
} from "./api/authApi";
import "./index.css";
import ManagerDashboard from "./pages/ManagerDashboard";
import Swal from "sweetalert2";

/* 🚀 SVG Icons สวยๆ สำหรับเมนู 🚀 */
const DashIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ManagerIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const FormIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);
const ProjectIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const AppIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const CameraIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ProtectedManagerRoute = ({ role, children }) => {
  if (role !== "manager" && role !== "ceo") return <Navigate to="/" replace />;
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // 🚀 จัดการเรื่องรูป Avatar
  const [tempAvatar, setTempAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const settingsFileInputRef = useRef(null);

  const currentUser = session?.user || null;
  const roleLabel = useMemo(
    () =>
      currentUser?.role === "manager"
        ? "Manager"
        : currentUser?.role === "ceo"
          ? "CEO"
          : "Employee",
    [currentUser],
  );

  // 🚀 ดึงรูปมาจาก Database (จาก session) ถ้าไม่มีถึงจะใช้ temp
  const displayAvatar = tempAvatar || currentUser?.avatar || null;

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
      ? "rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)"
      : "rgba(241, 245, 249, 0.7), rgba(241, 245, 249, 0.7)";
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
        if (currentUser.role === "manager" || currentUser.role === "ceo") {
          const pending = await fetchPendingRequests(session.token);
          if (pending?.length > 0) {
            pending.forEach((req) =>
              newNotifs.push({
                id: `pending-${req.id}`,
                title: "🔔 รอการอนุมัติ",
                text: `โปรเจกต์ ${req.name} (${req.id}) รอให้คุณตรวจสอบ`,
                time: formatNotificationTime(req.created_at),
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
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5)
            .forEach((p) => {
              if (
                currentUser.role === "manager" ||
                currentUser.role === "ceo" ||
                p.form_data?.assigned_to === currentUser.username ||
                p.requester_name === currentUser.username
              ) {
                const progress = p.form_data?.tracking?.completionPercent || 0;
                newNotifs.push({
                  id: `update-${p.id}-${p.updated_at}`,
                  title: "📝 มีการอัปเดต",
                  text: `[${p.id}] ความคืบหน้า ${progress}%`,
                  time: formatNotificationTime(p.updated_at),
                  read: false,
                  linkPath: "/projects",
                });
              }
            });
        }
        const readIds =
          JSON.parse(
            localStorage.getItem(`readNotifs_${currentUser.username}`),
          ) || [];
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
  const handleChangePassword = async () => {
    setPwdError("");
    setPwdSuccess("");
    if (!currentPwd || !newPwd || !confirmNewPwd)
      return setPwdError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    if (newPwd.length < 6)
      return setPwdError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
    if (newPwd !== confirmNewPwd)
      return setPwdError("รหัสผ่านใหม่และยืนยันไม่ตรงกัน");
    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd, session.token);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmNewPwd("");
      Swal.fire("สำเร็จ", "เปลี่ยนรหัสผ่านสำเร็จแล้ว", "success");
      closeSettings();
    } catch (err) {
      setPwdError(err.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง");
    } finally {
      setPwdLoading(false);
    }
  };
  const closeSettings = () => {
    setIsSettingsOpen(false);
    setIsEditingProfile(false);
    setPwdError("");
    setPwdSuccess("");
  };

  // 🚀 ฟังก์ชันแปลงรูปภาพเป็น Base64 และบันทึกทันที (ถ้าอยู่ในหน้า Settings)
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Img = event.target.result;
        setTempAvatar(base64Img);

        // ถ้าเป็นการแก้ผ่านหน้า Settings ให้อัปเดต Database ทันที
        if (isSettingsOpen) {
          try {
            await updateUserProfile(
              currentUser.id,
              currentUser.username,
              base64Img,
              session.token,
            );

            // อัปเดตข้อมูล Session แบบไม่ต้องล็อกเอาต์
            const updatedUser = { ...currentUser, avatar: base64Img };
            const nextSession = { token: session.token, user: updatedUser };
            saveAuthSession(nextSession);
            setSession(nextSession);

            showToast("อัปเดตรูปลงฐานข้อมูลเรียบร้อยแล้ว", "success");
          } catch (err) {
            Swal.fire("ผิดพลาด", "อัปเดตไม่สำเร็จ โปรดลองอีกครั้ง", "error");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 🚀 บันทึกชื่อผู้ใช้ (เฉพาะเปลี่ยนชื่อ)
  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Swal.fire("ผิดพลาด", "ชื่อผู้ใช้ไม่ถูกต้อง", "error");
      return;
    }
    try {
      await updateUserProfile(
        currentUser.id,
        editUsername.trim(),
        displayAvatar,
        session.token,
      );
      setIsEditingProfile(false);
      Swal.fire({
        title: "สำเร็จ!",
        text: "เปลี่ยนชื่อผู้ใช้สำเร็จ! เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        icon: "success",
        confirmButtonColor: "#0284c7",
      }).then(() => {
        handleLogout();
      });
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", error.message, "error");
    }
  };

  const s = {
    label: {
      display: "block",
      fontSize: "0.85rem",
      fontWeight: 700,
      color: "var(--text-muted)",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1.5px solid var(--border-color)",
      borderRadius: "10px",
      fontSize: "0.95rem",
      background: "var(--input-bg)",
      color: "var(--text-color)",
      outline: "none",
      transition: "all 0.2s",
    },
    inputRow: {
      display: "flex",
      alignItems: "center",
      border: "1.5px solid var(--border-color)",
      borderRadius: "10px",
      overflow: "hidden",
      background: "var(--input-bg)",
    },
    eyeBtn: {
      background: "none",
      border: "none",
      padding: "0 14px",
      cursor: "pointer",
      color: "var(--text-muted)",
      display: "flex",
      alignItems: "center",
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      background: "var(--blue)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "1rem",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "var(--shadow-sm)",
    },
    errorBox: {
      padding: "12px",
      borderRadius: "10px",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      color: "#ef4444",
      fontSize: "0.9rem",
      fontWeight: 600,
    },
  };

  if (!currentUser)
    return (
      <main className="login-page" style={backgroundStyle}>
        <form className="login-card" onSubmit={handleAuthenticate}>
          <div className="login-header">
            <img
              src={`${process.env.PUBLIC_URL}/LOGO-BPK.png`}
              alt="Logo"
              className="login-logo"
              style={{
                height: "56px",
                objectFit: "contain",
                margin: "0 auto 12px auto",
                display: "block",
              }}
            />
            <h1 className="login-title" style={{ textAlign: "center" }}>
              BA System
            </h1>
            <p
              className="login-desc"
              style={{ textAlign: "center", marginBottom: "16px" }}
            >
              Sign In (Internal Use Only)
            </p>
          </div>
          <div className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
              />
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
            {authError && <div className="auth-error">{authError}</div>}
            <button
              type="submit"
              className="btn btn-login-submit"
              disabled={isAuthenticating}
              style={{ marginTop: "10px" }}
            >
              {isAuthenticating ? "⏳ Authenticating..." : "Secure Login"}
            </button>
          </div>
          <div className="login-footer" style={{ marginTop: "20px" }}>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              🔒 Unauthorized access is strictly prohibited.
              <br />
              Contact IT Support for account registration.
            </p>
          </div>
        </form>
        <div
          className={`toast-notification ${toast.visible ? "show" : ""} ${toast.type}`}
        >
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
                <span className="user-role">{roleLabel}</span>
              </div>
              {/* 🚀 รูปโปรไฟล์ตรงมุมขวาบน (ดึงจากฐานข้อมูล) 🚀 */}
              <div
                className="user-avatar"
                style={{
                  background: displayAvatar
                    ? `url(${displayAvatar}) center/cover`
                    : "var(--blue)",
                }}
              >
                {!displayAvatar &&
                  (currentUser?.username
                    ? currentUser.username.charAt(0).toUpperCase()
                    : "U")}
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
            <NavLink
              to="/"
              className="nav-item"
              end
              onClick={() => setIsMobileMenuOpen(false)}
              title="Dashboard"
            >
              <DashIcon />
            </NavLink>

            {(currentUser?.role === "manager" ||
              currentUser?.role === "ceo") && (
              <NavLink
                to="/manager-dashboard"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Manager Dashboard"
              >
                <ManagerIcon />
              </NavLink>
            )}

            {currentUser?.role !== "ceo" && (
              <NavLink
                to="/request"
                className="nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Request Form"
              >
                <FormIcon />
              </NavLink>
            )}

            <NavLink
              to="/projects"
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
              title="Project Portfolio"
            >
              <ProjectIcon />
            </NavLink>

            <NavLink
              to="/applications"
              className="nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
              title="App Portfolio"
            >
              <AppIcon />
            </NavLink>
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
            <Route path="/" element={<Dashboard currentUser={currentUser} />} />
            <Route
              path="/request"
              element={<RequestForm currentUser={currentUser} />}
            />
            <Route
              path="/projects"
              element={<ProjectPortfolio currentUser={currentUser} />}
            />
            <Route
              path="/applications"
              element={<ApplicationPortfolio currentUser={currentUser} />}
            />
            <Route
              path="/manager-dashboard"
              element={
                <ProtectedManagerRoute role={currentUser?.role}>
                  <ManagerDashboard currentUser={currentUser} />
                </ProtectedManagerRoute>
              }
            />
          </Routes>
        </main>

        {/* 🚀 หน้าต่างการตั้งค่า (Settings Modal) ปรับ UI ใหม่ 🚀 */}
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
                      marginBottom: "20px",
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
                      Profile
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "var(--border-color)",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      padding: "16px",
                      borderRadius: "16px",
                      background: "var(--table-header-bg)",
                      border: "1px solid var(--border-color)",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      onClick={() => settingsFileInputRef.current.click()}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: displayAvatar
                          ? `url(${displayAvatar}) center/cover`
                          : "var(--blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        color: "#fff",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "var(--shadow-sm)",
                        border: "2px solid var(--card-bg)",
                      }}
                      title="Click to update avatar"
                    >
                      {!displayAvatar &&
                        currentUser?.username?.charAt(0)?.toUpperCase()}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "rgba(2, 132, 199, 0.8)",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CameraIcon />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={settingsFileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "1.1rem",
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
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: "var(--blue-light)",
                          color: "var(--blue)",
                        }}
                      >
                        {currentUser?.role === "manager"
                          ? "🏅 Manager"
                          : currentUser?.role === "ceo"
                            ? "👑 Executive"
                            : "👤 Employee"}
                      </span>
                    </div>
                  </div>

                  <label style={s.label}>Username</label>
                  {isEditingProfile ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <input
                        style={s.input}
                        value={editUsername}
                        autoFocus
                        onChange={(e) => setEditUsername(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveProfile()
                        }
                        placeholder="New username"
                      />
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          style={{
                            flex: 1,
                            padding: "12px",
                            border: "1.5px solid var(--border-color)",
                            borderRadius: "10px",
                            background: "var(--card-bg)",
                            cursor: "pointer",
                            color: "var(--text-color)",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          style={{
                            ...s.primaryBtn,
                            width: "auto",
                            flex: 1,
                            marginTop: 0,
                            padding: "12px",
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        style={{
                          ...s.input,
                          background: "var(--bg-color)",
                          color: "var(--text-muted)",
                          cursor: "not-allowed",
                        }}
                        value={currentUser?.username}
                        readOnly
                      />
                      <button
                        onClick={() => {
                          setIsEditingProfile(true);
                          setEditUsername(currentUser?.username);
                        }}
                        style={{
                          flexShrink: 0,
                          padding: "12px 20px",
                          border: "1.5px solid var(--border-color)",
                          borderRadius: "10px",
                          background: "var(--card-bg)",
                          color: "var(--text-color)",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--blue)";
                          e.currentTarget.style.color = "var(--blue)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--border-color)";
                          e.currentTarget.style.color = "var(--text-color)";
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
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
                      marginBottom: "20px",
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
                      Security
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "var(--border-color)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label style={s.label}>Current Password</label>
                      <div style={s.inputRow}>
                        <input
                          type={showCurrentPwd ? "text" : "password"}
                          value={currentPwd}
                          onChange={(e) => setCurrentPwd(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            padding: "12px 14px",
                            fontSize: "0.95rem",
                            background: "transparent",
                            color: "var(--text-color)",
                          }}
                        />
                        <button
                          type="button"
                          style={s.eyeBtn}
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        >
                          {showCurrentPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={s.label}>New Password</label>
                      <div style={s.inputRow}>
                        <input
                          type={showNewPwd ? "text" : "password"}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            padding: "12px 14px",
                            fontSize: "0.95rem",
                            background: "transparent",
                            color: "var(--text-color)",
                          }}
                        />
                        <button
                          type="button"
                          style={s.eyeBtn}
                          onClick={() => setShowNewPwd(!showNewPwd)}
                        >
                          {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {newPwd.length > 0 && (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: "6px",
                                borderRadius: "6px",
                                transition: "background 0.3s",
                                background:
                                  newPwd.length >= i * 4
                                    ? i === 1
                                      ? "#ef4444"
                                      : i === 2
                                        ? "#f59e0b"
                                        : "#10b981"
                                    : "var(--border-color)",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={s.label}>Confirm New Password</label>
                      <div
                        style={{
                          ...s.inputRow,
                          borderColor:
                            confirmNewPwd && newPwd !== confirmNewPwd
                              ? "#ef4444"
                              : "var(--border-color)",
                        }}
                      >
                        <input
                          type={showConfirmPwd ? "text" : "password"}
                          value={confirmNewPwd}
                          onChange={(e) => setConfirmNewPwd(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            padding: "12px 14px",
                            fontSize: "0.95rem",
                            background: "transparent",
                            color: "var(--text-color)",
                          }}
                        />
                        <button
                          type="button"
                          style={s.eyeBtn}
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        >
                          {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {confirmNewPwd && newPwd !== confirmNewPwd && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#ef4444",
                            margin: "6px 0 0",
                            fontWeight: 600,
                          }}
                        >
                          ⚠️ Passwords do not match
                        </p>
                      )}
                      {confirmNewPwd && newPwd === confirmNewPwd && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#10b981",
                            margin: "6px 0 0",
                            fontWeight: 600,
                          }}
                        >
                          ✅ Passwords match
                        </p>
                      )}
                    </div>
                  </div>
                  {pwdError && (
                    <div style={{ ...s.errorBox, marginTop: "16px" }}>
                      {pwdError}
                    </div>
                  )}
                  {pwdSuccess && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#10b981",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginTop: "16px",
                      }}
                    >
                      {pwdSuccess}
                    </div>
                  )}
                  <button
                    style={{ ...s.primaryBtn, marginTop: "20px" }}
                    onClick={handleChangePassword}
                    disabled={pwdLoading}
                  >
                    {pwdLoading ? "⏳ Updating..." : "Update Password"}
                  </button>
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
                      marginBottom: "20px",
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
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "var(--border-color)",
                      }}
                    />
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
