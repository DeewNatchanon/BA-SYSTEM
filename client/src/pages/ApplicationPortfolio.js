import React, { useState, useEffect, useMemo } from "react";
import { fetchProjects, updateProjectInDb } from "../api/authApi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions"; 

// inline filter helper
function getNested(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function filterRows(
  data,
  { searchQuery = "", filters = {}, searchableFields = [] } = {},
) {
  if (!Array.isArray(data)) return [];
  const q = String(searchQuery || "")
    .trim()
    .toLowerCase();

  return data.filter((row) => {
    if (q) {
      let hay = "";
      if (Array.isArray(searchableFields) && searchableFields.length) {
        hay = searchableFields
          .map((f) => String(getNested(row, f) ?? ""))
          .join(" ");
      } else {
        try {
          hay = JSON.stringify(row);
        } catch (e) {
          hay = "";
        }
      }
      if (!String(hay).toLowerCase().includes(q)) return false;
    }

    for (const [key, value] of Object.entries(filters || {})) {
      if (value == null) continue;
      const raw = getNested(row, key);
      const rawStr = raw == null ? "" : String(raw);
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        const rawLower = rawStr.toLowerCase();
        const allowed = value.map((v) => String(v).toLowerCase());
        if (!allowed.some((a) => rawLower.includes(a))) return false;
      } else {
        const v = String(value);
        if (v === "All" || v === "") continue;
        const vLower = v.toLowerCase();
        if (!rawStr.toLowerCase().includes(vLower)) return false;
      }
    }

    return true;
  });
}

// ชุดไอคอน SVG แบบมืออาชีพ เรียบหรู
const GenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
);
const TechIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);
const SupportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const SecurityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const AppCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);

function ApplicationPortfolio({ currentUser }) {
  const navigate = useNavigate(); 
  
  // 🌟 ดึงสิทธิ์ที่เกี่ยวข้องทั้งหมดมาใช้งาน
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions(currentUser, "app_portfolio");

  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "All", category: "All" });
  
  const [showFilters, setShowFilters] = useState(false);

  const fullPdpaItems = [
    { key: "health", label: "ข้อมูลสุขภาพ" },
    { key: "idCard", label: "บัตรประชาชน" },
    { key: "passport", label: "Passport" },
    { key: "hn", label: "HN" },
    { key: "name", label: "ชื่อ-นามสกุล" },
    { key: "address", label: "ที่อยู่" },
    { key: "dob", label: "วัน/เดือน/ปีเกิด" },
    { key: "phone", label: "เบอร์โทร" },
    { key: "email", label: "Email" },
    { key: "financial", label: "ข้อมูลการเงิน" },
    { key: "criminal", label: "ประวัติอาชญากรรม" },
    { key: "ethnicity", label: "เชื้อชาติ/ศาสนา" },
    { key: "photo", label: "รูปถ่ายใบหน้า" },
  ];

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      if (token) {
        const data = await fetchProjects(token);
        const appsOnly = data
          .filter(
            (item) => item.phase && item.phase.toLowerCase() === "go-live",
          )
          .map((item) => {
            let parsedForm = item.form_data;
            if (typeof parsedForm === "string") {
              try { parsedForm = JSON.parse(parsedForm); } catch (e) { parsedForm = {}; }
            }
            parsedForm = parsedForm || {};
            return {
              ...item,
              form_data: parsedForm,
              app_info: parsedForm.app_info || {},
              tech: parsedForm.tech || {},
              interface: parsedForm.interface || {},
              security_cia: parsedForm.security_cia || {},
              compliance: parsedForm.compliance || { pdpa: {}, ropa: {} },
              support: parsedForm.support || {},
              manager:
                parsedForm.tracking?.glsManager ||
                parsedForm.assigned_to ||
                item.requester_name ||
                "-",
              owner: parsedForm.tracking?.glsOwner || "SOG6",
              users: parsedForm.users || "> 50 Users",
              comments: parsedForm.comments || "",
              category: parsedForm.app_info?.catalog || item.category || "Support Application",
            };
          });
        setAllData(appsOnly);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูล Application Portfolio ได้", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ฟังก์ชัน: เปลี่ยนสถานะเป็น "ยกเลิกการใช้งาน (Retire)" (Step 1)
  const handleRetireApp = async (app) => {
    const result = await Swal.fire({
      title: "ยกเลิกการใช้งาน (Retire)?",
      text: `คุณต้องการยกเลิกการใช้งานแอปพลิเคชัน ${app.name} ใช่หรือไม่?\n(ข้อมูลจะถูกย้ายไปล่างสุดและสามารถลบถาวรได้ในภายหลัง)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      confirmButtonText: "🛑 ยืนยันการยกเลิก",
      cancelButtonText: "กลับ"
    });

    if (result.isConfirmed) {
      try {
        const sessionRaw = localStorage.getItem("ba-system.auth-session");
        const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
        
        const updatedData = {
          ...app,
          status: "Retired",
          form_data: {
            ...app.form_data,
            status: "Retired"
          }
        };
        
        await updateProjectInDb(app.id, updatedData, null, token);
        setAllData(prev => prev.map(p => p.id === app.id ? updatedData : p));
        
        Swal.fire("สำเร็จ", "ยกเลิกการใช้งานระบบแล้ว", "success");
      } catch(err) {
        Swal.fire("ผิดพลาด", err.message, "error");
      }
    }
  };

  // 🌟 ฟังก์ชัน: ลบถาวร (Step 2)
  const handleDeleteApp = async (id) => {
    const result = await Swal.fire({
      title: "ลบข้อมูลถาวร?",
      text: "คุณกำลังลบข้อมูลที่ยกเลิกการใช้งานแล้วออกจากฐานข้อมูล\nการกระทำนี้ไม่สามารถกู้คืนได้!",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "🗑️ ยืนยันลบถาวร",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        const sessionRaw = localStorage.getItem("ba-system.auth-session");
        const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
        const res = await fetch(`http://localhost:4000/api/projects/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("ไม่สามารถลบข้อมูลได้");
        setAllData((prev) => prev.filter((p) => p.id !== id));
        Swal.fire("ลบสำเร็จ", "ข้อมูลถูกลบถาวรออกจากระบบแล้ว", "success");
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      }
    }
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setActiveTab("general");
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  const handleChangeApp = (app) => {
    Swal.fire({
      title: "สร้าง Change Request?",
      text: `คุณต้องการดำเนินการเปลี่ยนแปลงข้อมูลของระบบ ${app.name} ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--blue)",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ไปที่หน้าฟอร์ม",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/RequestChange", { state: { originalAppInfo: app } });
      }
    });
  };

  const handleCloseModal = () => {
    if (isEditing) {
      Swal.fire({
        title: "ยกเลิกการแก้ไข?",
        text: "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างหรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "ยืนยันปิด",
        cancelButtonText: "ทำต่อ",
      }).then((result) => {
        if (result.isConfirmed) {
          setIsViewModalOpen(false);
          setSelectedApp(null);
          setIsEditing(false);
        }
      });
    } else {
      setIsViewModalOpen(false);
      setSelectedApp(null);
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    setEditFormData({
      ...selectedApp,
      app_info: selectedApp.app_info || {},
      tech: selectedApp.tech || {},
      support: selectedApp.support || {},
      interface: selectedApp.interface || {},
      security_cia: selectedApp.security_cia || {},
      compliance: {
        pdpa: selectedApp.compliance?.pdpa || {},
        ropa: selectedApp.compliance?.ropa || {},
      },
    });
    setIsEditing(true);
  };

  const handleNestedChange = (section, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handlePdpaChange = (key, checked) => {
    setEditFormData((prev) => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        pdpa: { ...(prev.compliance?.pdpa || {}), [key]: checked },
      },
    }));
  };

  const handleRopaChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        ropa: { ...(prev.compliance?.ropa || {}), [field]: value },
      },
    }));
  };

  const handleSaveEdit = async () => {
    Swal.fire({
      title: "ยืนยันบันทึก?",
      text: "คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลแอปพลิเคชันใช่หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0072bb",
      cancelButtonColor: "#64748b",
      confirmButtonText: "💾 บันทึก",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsSaving(true);
          const sessionRaw = localStorage.getItem("ba-system.auth-session");
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
          if (!token) throw new Error("No token found");
          
          const finalDataToSave = {
            ...editFormData,
            updated_at: new Date().toISOString(),
            form_data: {
              ...editFormData.form_data,
              app_info: editFormData.app_info, 
              tech: editFormData.tech,
              interface: editFormData.interface, 
              security_cia: editFormData.security_cia, 
              compliance: editFormData.compliance,
              support: editFormData.support,
              users: editFormData.users,
              comments: editFormData.comments,
            },
          };
          await updateProjectInDb(editFormData.id, finalDataToSave, null, token);
          setAllData((prev) => prev.map((item) => item.id === editFormData.id ? finalDataToSave : item));
          setSelectedApp(finalDataToSave);
          setIsEditing(false);
          Swal.fire("สำเร็จ!", "บันทึกข้อมูลการแก้ไขเรียบร้อยแล้ว", "success");
        } catch (error) {
          console.error(error);
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้: " + error.message, "error");
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const getAppIdDisplay = (app) => {
    return app.form_data?.tracking?.appId || app.form_data?.appId || app.id;
  };

  const getColorFromName = (name) => {
    const colors = ["#3b82f6", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const uniqueCategories = useMemo(
    () => [...new Set(allData.map((item) => item.category || "Support Application"))],
    [allData],
  );

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(allData.map(a => a.status).filter(Boolean))];
    return statuses.sort((a,b) => a.localeCompare(b, 'th'));
  }, [allData]);

  const displayedApps = useMemo(() => {
    let filtered = filterRows(allData, {
      searchQuery: searchTerm,
      filters: { 
        status: filters.status !== 'All' ? filters.status : null, 
        category: filters.category !== 'All' ? filters.category : null 
      },
      searchableFields: [
        "id", 
        "name", 
        "form_data.tracking.appId", 
        "form_data.appId", 
        "form_data.app_info.abbreviation",
        "owner",
        "manager"
      ],
    });

    // 🌟 บังคับเรียงลำดับตายตัว: ใหม่ล่าสุดอยู่บนสุดเสมอ (แต่ Retired อยู่ล่างสุด)
    return [...filtered].sort((a, b) => {
      const aIsRetired = a.status === 'Retired' || a.status === 'Cancelled';
      const bIsRetired = b.status === 'Retired' || b.status === 'Cancelled';
      
      if (aIsRetired && !bIsRetired) return 1;
      if (!aIsRetired && bIsRetired) return -1;

      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      
      return bTime - aTime; // Descending (มาใหม่/อัปเดตล่าสุดอยู่บน)
    });

  }, [allData, searchTerm, filters]); // 🌟 ลบ sortBy, sortOrder ออกจาก dependencies

  const hasActiveFilter = filters.status !== 'All' || filters.category !== 'All';

  if (!canRead) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#ef4444", minHeight: "80vh", background: "var(--bg-color)" }}>
        <h2>⛔ Access Denied</h2>
        <p>คุณไม่มีสิทธิ์ในการเข้าถึงพอร์ตโฟลิโอแอปพลิเคชัน (App Portfolio)</p>
      </div>
    );
  }

  if (isLoading)
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>กำลังดึงข้อมูล Application Portfolio...</div>;

  return (
    <div className="page-wrap page-app" style={{ gap: "20px" }}>
      
{/* Header & Minimalist Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
        <h1 className="page-heading" style={{ margin: 0, fontSize: "1.5rem" }}>
          Application Portfolio
        </h1>
        
        {/* 🌟 ชุด Search และ Filter ที่จัดระเบียบใหม่ให้เหมือนหน้า Project Portfolio */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", position: "relative", zIndex: 20 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            
            {/* Search Input */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: "12px", fontSize: "0.95rem", color: "#94a3b8", zIndex: 2, pointerEvents: "none" }}>🔍</span>
              <input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="ค้นหา..." 
                style={{ borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-color)", fontSize: "0.85rem", width: "130px", outline: "none", transition: "all 0.3s ease", margin: 0, textIndent: "24px", padding: "6px 12px" }} 
                onFocus={(e) => { e.target.style.width = "200px"; e.target.style.borderColor = "var(--blue)"; }} 
                onBlur={(e) => { e.target.style.width = "130px"; e.target.style.borderColor = "var(--border-color)"; }} 
              />
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              style={{ padding: "6px 14px", borderRadius: "20px", border: showFilters || hasActiveFilter ? "1px solid var(--blue)" : "1px solid var(--border-color)", background: showFilters || hasActiveFilter ? "rgba(2, 132, 199, 0.05)" : "var(--card-bg)", color: showFilters || hasActiveFilter ? "var(--blue)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filter
              {hasActiveFilter && <span style={{ width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>}
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", width: "260px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "12px", zIndex: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-color)" }}>ตั้งค่าตัวกรอง</span>
                {hasActiveFilter && ( 
                  <span onClick={() => setFilters({ status: "All", category: "All" })} style={{ fontSize: "0.75rem", color: "#ef4444", cursor: "pointer", fontWeight: 600, background: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>ล้างทั้งหมด</span> 
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>สถานะ (Status)</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.8rem", background: "var(--input-bg)", color: "var(--text-color)", margin: 0, outline: "none" }}>
                  <option value="All">ทั้งหมด</option>
                  {uniqueStatuses.map((status) => ( <option key={status} value={status}>{status}</option> ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>ประเภท (Category)</label>
                <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.8rem", background: "var(--input-bg)", color: "var(--text-color)", margin: 0, outline: "none" }}>
                  <option value="All">ทั้งหมด</option>
                  {uniqueCategories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px', 
        alignItems: 'stretch' 
      }}>
        {displayedApps.length > 0 ? (
          displayedApps.map((app) => {
            const appColor = getColorFromName(app.name);
            const isRetired = app.status === "Retired" || app.status === "Cancelled";
            
            // 🌟 ตั้งค่าสีป้ายสถานะสำหรับ Retired โดยเฉพาะ
            const statusColor = isRetired ? "#64748b" : (app.status === "Inactive" || app.status === "Hold" ? "#ef4444" : "#10b981");

            return (
              <div 
                key={app.id} 
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                  opacity: isRetired ? 0.65 : 1 // 🌟 ทำการเฟดสีการ์ดที่โดนยกเลิกแล้ว
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                    background: `${appColor}15`, color: appColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AppCardIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.name}>
                      {app.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ID: <span style={{ color: 'var(--blue)' }}>{getAppIdDisplay(app)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Owner:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-color)', textAlign: 'right' }}>{app.owner || "-"}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ color: statusColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }}></span>
                      {isRetired ? "Retired (ยกเลิกการใช้งาน)" : (app.status || "Active")}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Technology:</span>
                    <span style={{ 
                      background: 'var(--bg-color)', border: '1px solid var(--border-color)', 
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color)' 
                    }}>
                      {app.tech?.language || app.tech?.platform || "N/A"}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleViewDetails(app)}
                    style={{ 
                      flex: 1, padding: '10px', borderRadius: '10px', background: '#10b981', color: '#fff', 
                      border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.2s', minWidth: '80px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    View Details
                  </button>
                  
                  {/* 🌟 ปุ่ม Change App แสดงเฉพาะคนที่มีสิทธิ์ Create */}
                  {canCreate && !isRetired && (
                    <button 
                      onClick={() => handleChangeApp(app)}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--blue)', color: '#fff', 
                        border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.2s', minWidth: '80px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      🔄 Change App
                    </button>
                  )}

                  {/* 🌟 ปุ่ม 2 สเตป (Retire ก่อน แล้วจึงลบถาวรได้) ใช้สิทธิ์ Delete */}
                  {canDelete && !isRetired && (
                    <button
                      onClick={() => handleRetireApp(app)}
                      title="ยกเลิกการใช้งานระบบ"
                      style={{ 
                        padding: '10px 14px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', 
                        border: '1px solid #fde68a', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s', fontWeight: 'bold' 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef3c7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fffbeb'}
                    >
                      🛑 ยกเลิก
                    </button>
                  )}

                  {canDelete && isRetired && (
                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      title="ลบข้อมูลถาวร"
                      style={{ 
                        padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s', fontWeight: 'bold' 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      🗑️ ลบถาวร
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            ไม่พบข้อมูลแอปพลิเคชันที่ตรงกับเงื่อนไข
          </div>
        )}
      </div>

      {/* Modal คงเดิม */}
      {isViewModalOpen && selectedApp && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <div
            className="pdf-preview-card"
            style={{
              width: "95%",
              maxWidth: "1000px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--card-bg)",
              borderRadius: "24px",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="app-modal-header"
              style={{
                padding: "16px 20px 8px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--card-bg)",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 4px 0",
                    color: "var(--text-color)",
                    fontSize: "1.35rem",
                    fontWeight: 800,
                  }}
                >
                  {isEditing ? "✏️ กำลังแก้ไข: " : ""}
                  {selectedApp.name}
                </h2>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                  }}
                >
                  App ID:{" "}
                  <strong style={{ color: "var(--text-color)" }}>
                    {getAppIdDisplay(selectedApp)}
                  </strong>{" "}
                  &nbsp;|&nbsp; Site:{" "}
                  <strong style={{ color: "var(--text-color)" }}>
                    {selectedApp.site}
                  </strong>
                </span>
              </div>
              {!isEditing && (
                <button
                  onClick={handleCloseModal}
                  style={{
                    background: "var(--bg-color)",
                    border: "none",
                    color: "var(--text-muted)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    fontSize: "1.05rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--table-row-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--bg-color)")
                  }
                >
                  ✕
                </button>
              )}
            </div>

            <div
              className="app-modal-tabs"
              style={{
                padding: "0 20px",
                marginTop: "-1px",
                borderBottom: `1px solid var(--border-color)`,
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                alignItems: "flex-end",
                background: "var(--card-bg)",
              }}
            >
              {[
                { id: "general", label: "General & Business", icon: <GenIcon />, color: "#0072bb" },
                { id: "tech", label: "Tech & Interface", icon: <TechIcon />, color: "#8b5cf6" },
                { id: "support", label: "Support & SLA", icon: <SupportIcon />, color: "#10b981" },
                { id: "security", label: "Security & PDPA", icon: <SecurityIcon />, color: "#ef4444" },
                { id: "history", label: "History", icon: <HistoryIcon />, color: "#f59e0b" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 2px",
                    border: "none",
                    background: "transparent",
                    color: activeTab === tab.id ? tab.color : "var(--text-muted)",
                    fontWeight: activeTab === tab.id ? "700" : "600",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    position: "relative",
                    marginBottom: "-1px"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: tab.color }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div
              className="app-modal-body"
              style={{
                padding: "18px 20px 20px 20px",
                overflowY: "auto",
                flex: 1,
                color: "var(--text-color)",
                fontSize: "0.95rem",
                background: "var(--bg-color)", 
              }}
            >
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#0072bb", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>1</span>
                    ข้อมูลทั่วไปและธุรกิจ (General & Business)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", gridColumn: "1 / -1", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Description (รายละเอียด)</div>
                      {isEditing ? (
                        <textarea
                          value={editFormData.description || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value }) }
                          style={{ width: "100%", minHeight: "80px", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)" }}>{selectedApp.description || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>ชื่อย่อระบบ (Abbreviation)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.app_info?.abbreviation || ""} onChange={(e) => handleNestedChange("app_info", "abbreviation", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.abbreviation || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>โมดูลของระบบ (Module)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.app_info?.module || ""} onChange={(e) => handleNestedChange("app_info", "module", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.module || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>ผู้จัดการระบบ (Manager)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.manager || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value }) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.manager || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>หน่วยงานเจ้าของ (Owner)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.owner || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value }) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.owner || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>ระดับองค์กร (Enterprise)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.app_info?.enterprise || ""} onChange={(e) => handleNestedChange("app_info", "enterprise", e.target.value)} placeholder="e.g. Business Management" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.enterprise || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>หมวดหมู่ระบบ (Catalog)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.app_info?.catalog || ""} onChange={(e) => handleNestedChange("app_info", "catalog", e.target.value)} placeholder="e.g. Support Application" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.catalog || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>ประเภทการพัฒนา (Type)</div>
                      {isEditing ? (
                        <select value={editFormData.app_info?.type || ""} onChange={(e) => handleNestedChange("app_info", "type", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
                          <option value="">เลือกประเภท</option>
                          <option value="Inhouse">Inhouse</option>
                          <option value="Package">Package</option>
                        </select>
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.type || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>เวลาใช้งาน (Usage Hour)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.app_info?.usageHour || ""} onChange={(e) => handleNestedChange("app_info", "usageHour", e.target.value)} placeholder="e.g. 24*7 หรือ 8*5" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.app_info?.usageHour || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>ผลกระทบธุรกิจเมื่อระบบล่ม (Impact)</div>
                      </div>
                      {isEditing ? (
                         <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                           <input type="checkbox" checked={editFormData.app_info?.impactBusiness === "Yes"} onChange={(e) => handleNestedChange("app_info", "impactBusiness", e.target.checked ? "Yes" : "No")} style={{ width: "20px", height: "20px", accentColor: "#ef4444" }} />
                           <span style={{ marginLeft: "8px", color: editFormData.app_info?.impactBusiness === "Yes" ? "#ef4444" : "var(--text-muted)", fontWeight: "bold" }}>
                             {editFormData.app_info?.impactBusiness === "Yes" ? "Yes (กระทบ)" : "No"}
                           </span>
                         </label>
                      ) : ( <div style={{ color: selectedApp.app_info?.impactBusiness === "Yes" ? "#ef4444" : "var(--text-muted)", fontWeight: "bold" }}>{selectedApp.app_info?.impactBusiness || "No"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>มี Source Code ไหม? (Source Code Availability)</div>
                      </div>
                      {isEditing ? (
                         <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                           <input type="checkbox" checked={editFormData.app_info?.hasSourceCode === "Yes"} onChange={(e) => handleNestedChange("app_info", "hasSourceCode", e.target.checked ? "Yes" : "No")} style={{ width: "20px", height: "20px", accentColor: "#10b981" }} />
                           <span style={{ marginLeft: "8px", color: editFormData.app_info?.hasSourceCode === "Yes" ? "#10b981" : "var(--text-muted)", fontWeight: "bold" }}>
                             {editFormData.app_info?.hasSourceCode === "Yes" ? "Yes (มี)" : "No"}
                           </span>
                         </label>
                      ) : ( <div style={{ color: selectedApp.app_info?.hasSourceCode === "Yes" ? "#10b981" : "var(--text-muted)", fontWeight: "bold" }}>{selectedApp.app_info?.hasSourceCode || "No"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>จำนวนผู้ใช้ (No. of Users)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.users || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, users: e.target.value }) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.users || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>สถานะ (Status)</div>
                      {isEditing ? (
                        <select
                          value={editFormData.status || "Active"}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value }) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        >
                          <option value="Active">Active</option>
                          <option value="Hold">Hold</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.status || "Active"}</div> )}
                    </div>

                  </div>
                </div>
              )}
              {activeTab === "tech" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h4 style={{ margin: "0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#8b5cf6", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>2</span>
                    โครงสร้างเทคโนโลยีและ Server (Tech & Infra Stack)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Programming Language</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.tech?.language || ""} onChange={(e) => handleNestedChange("tech", "language", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.language || "-"}</div> )}
                    </div>
                    
                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Tools (เครื่องมือพัฒนา)</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.tech?.tools || ""} onChange={(e) => handleNestedChange("tech", "tools", e.target.value)} placeholder="e.g. Visual Studio 2010" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.tools || "-"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Platform</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.tech?.platform || ""} onChange={(e) => handleNestedChange("tech", "platform", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.platform || "Web Base"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Type of Backup Required</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.tech?.backupType || ""} onChange={(e) => handleNestedChange("tech", "backupType", e.target.value)} placeholder="e.g. Full backup_Monthly" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.backupType || "-"}</div> )}
                    </div>

                    <div style={{ gridColumn: "1 / -1", background: "rgba(139, 92, 246, 0.05)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(139, 92, 246, 0.2)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                       <h5 style={{ gridColumn: "1 / -1", margin: "0 0 10px 0", color: "#8b5cf6" }}>🖥️ ข้อมูล Server</h5>
                       
                       <div>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Web Server (IP & Name)</div>
                         {isEditing ? (
                           <div style={{ display: "flex", gap: "10px" }}>
                             <input type="text" placeholder="IP" value={editFormData.tech?.webServerIp || ""} onChange={(e) => handleNestedChange("tech", "webServerIp", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                             <input type="text" placeholder="Name" value={editFormData.tech?.webServerName || ""} onChange={(e) => handleNestedChange("tech", "webServerName", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                           </div>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.webServerIp || "-"} / {selectedApp.tech?.webServerName || "-"}</div> )}
                       </div>

                       <div>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>App Server (IP & Name)</div>
                         {isEditing ? (
                           <div style={{ display: "flex", gap: "10px" }}>
                             <input type="text" placeholder="IP" value={editFormData.tech?.appServerIp || ""} onChange={(e) => handleNestedChange("tech", "appServerIp", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                             <input type="text" placeholder="Name" value={editFormData.tech?.appServerName || ""} onChange={(e) => handleNestedChange("tech", "appServerName", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                           </div>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.appServerIp || "-"} / {selectedApp.tech?.appServerName || "-"}</div> )}
                       </div>

                       <div>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Database Server (IP & Name)</div>
                         {isEditing ? (
                           <div style={{ display: "flex", gap: "10px" }}>
                             <input type="text" placeholder="IP" value={editFormData.tech?.dbServerIp || ""} onChange={(e) => handleNestedChange("tech", "dbServerIp", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                             <input type="text" placeholder="Name" value={editFormData.tech?.dbServerName || ""} onChange={(e) => handleNestedChange("tech", "dbServerName", e.target.value)} style={{ width: "50%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                           </div>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.dbServerIp || "-"} / {selectedApp.tech?.dbServerName || "-"}</div> )}
                       </div>

                       <div>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>HIS Server (Connection)</div>
                         {isEditing ? (
                           <input type="text" value={editFormData.tech?.hisServer || ""} onChange={(e) => handleNestedChange("tech", "hisServer", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.tech?.hisServer || "-"}</div> )}
                       </div>
                    </div>

                  </div>

                  <h4 style={{ margin: "10px 0 0 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#8b5cf6", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>3</span>
                    การเชื่อมต่อข้อมูล (Application Interface)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                     <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Interface Inbound Data</div>
                        {isEditing ? (
                          <input type="text" value={editFormData.interface?.inbound || ""} onChange={(e) => handleNestedChange("interface", "inbound", e.target.value)} placeholder="e.g. HIS Data" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                        ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.interface?.inbound || "-"}</div> )}
                     </div>
                     <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Interface Outbound Data</div>
                        {isEditing ? (
                          <input type="text" value={editFormData.interface?.outbound || ""} onChange={(e) => handleNestedChange("interface", "outbound", e.target.value)} placeholder="e.g. No" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                        ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.interface?.outbound || "-"}</div> )}
                     </div>
                     <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Processing System</div>
                        {isEditing ? (
                           <select value={editFormData.interface?.processing || ""} onChange={(e) => handleNestedChange("interface", "processing", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
                             <option value="">เลือกประเภท</option>
                             <option value="Online">Online</option>
                             <option value="Batch">Batch</option>
                             <option value="Batch&Online">Batch & Online</option>
                           </select>
                        ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.interface?.processing || "-"}</div> )}
                     </div>
                     <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Public Interface</div>
                        {isEditing ? (
                          <input type="text" value={editFormData.interface?.public || ""} onChange={(e) => handleNestedChange("interface", "public", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                        ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.interface?.public || "-"}</div> )}
                     </div>
                  </div>

                </div>
              )}
              {activeTab === "support" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#10b981", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>4</span>
                    ระดับการสนับสนุนและสัญญา (Support & Contact)
                  </h4>
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                      <div style={{ color: "var(--blue)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>Tier 1 (L1 Support) / Helpdesk</div>
                      {isEditing ? (
                        <input type="text" value={editFormData.support?.l1Contact || ""} onChange={(e) => handleNestedChange("support", "l1Contact", e.target.value)} placeholder="e.g. Centralized IT Helpdesk: 02-xxx-xxxx" style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.support?.l1Contact || "Centralized IT Helpdesk"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                      <div style={{ color: "var(--blue)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>Tier 2 (L2 Support) / Site IT</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.support?.l2Contact || ""}
                          onChange={(e) => handleNestedChange("support", "l2Contact", e.target.value) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.support?.l2Contact || "BPK IT Support on site"}</div> )}
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                      <div style={{ color: "var(--blue)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>Tier 3 (L3 Support) / App Owner</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.support?.l3Contact || ""}
                          onChange={(e) => handleNestedChange("support", "l3Contact", e.target.value) }
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                        />
                      ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.support?.l3Contact || "GLS-G6-Developer-Group"}</div> )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>5</span>
                      Security & User Access (CIA Triad)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                      
                      <div style={{ background: "var(--card-bg)", padding: "15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Contract Type</div>
                         {isEditing ? (
                           <input type="text" value={editFormData.security_cia?.contractType || ""} onChange={(e) => handleNestedChange("security_cia", "contractType", e.target.value)} placeholder="e.g. Obligation" style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.security_cia?.contractType || "-"}</div> )}
                      </div>

                      <div style={{ background: "var(--card-bg)", padding: "15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Confidentiality (ความลับ)</div>
                         {isEditing ? (
                           <select value={editFormData.security_cia?.confidentiality || ""} onChange={(e) => handleNestedChange("security_cia", "confidentiality", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
                             <option value="">เลือกระดับ</option>
                             <option value="Internal Use">Internal Use</option>
                             <option value="Confidential">Confidential</option>
                             <option value="Public">Public</option>
                             <option value="Classify">Classify</option>
                           </select>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.security_cia?.confidentiality || "-"}</div> )}
                      </div>

                      <div style={{ background: "var(--card-bg)", padding: "15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Integrity (ความถูกต้อง)</div>
                         {isEditing ? (
                           <select value={editFormData.security_cia?.integrity || ""} onChange={(e) => handleNestedChange("security_cia", "integrity", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
                             <option value="">เลือกระดับ</option>
                             <option value="High">High</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low</option>
                           </select>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.security_cia?.integrity || "-"}</div> )}
                      </div>

                      <div style={{ background: "var(--card-bg)", padding: "15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                         <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Availability (ความพร้อมใช้)</div>
                         {isEditing ? (
                           <select value={editFormData.security_cia?.availability || ""} onChange={(e) => handleNestedChange("security_cia", "availability", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
                             <option value="">เลือกระดับ</option>
                             <option value="High">High</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low</option>
                           </select>
                         ) : ( <div style={{ color: "var(--text-color)", fontWeight: 600 }}>{selectedApp.security_cia?.availability || "-"}</div> )}
                      </div>

                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "10px 0 16px 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>6</span>
                      PDPA / Critical Info: ข้อมูลส่วนบุคคลที่ระบบจัดเก็บ
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                      {fullPdpaItems.map((item) => {
                        const isChecked = isEditing
                          ? editFormData.compliance?.pdpa?.[item.key] || false
                          : selectedApp.compliance?.pdpa?.[item.key] || false;
                        return (
                          <label
                            key={item.key}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "10px",
                              background: isChecked ? "rgba(34, 197, 94, 0.1)" : "var(--card-bg)",
                              border: isChecked ? "1px solid #22c55e" : "1px solid var(--border-color)",
                              cursor: isEditing ? "pointer" : "default", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handlePdpaChange(item.key, e.target.checked) }
                                style={{ width: "18px", height: "18px", accentColor: "#22c55e" }}
                              />
                            ) : (
                              <span style={{ fontSize: "1.1rem" }}>{isChecked ? "✅" : "⚪"}</span>
                            )}
                            <span style={{ fontWeight: isChecked ? "600" : "normal", color: isChecked ? "#22c55e" : "var(--text-color)" }}>
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>7</span>
                      ROPA: บันทึกกิจกรรมการประมวลผลข้อมูล
                    </h4>
                    <div style={{ display: "grid", gap: "16px" }}>
                      {[
                        { letter: "C", key: "collect", title: "Collect (แหล่งที่เก็บรวบรวมข้อมูล)", placeholder: "ระบุแหล่งที่มา..." },
                        { letter: "S", key: "store", title: "Store (สถานที่และระยะเวลาจัดเก็บ)", placeholder: "ระบุสถานที่เก็บ/ระยะเวลา..." },
                        { letter: "U", key: "use", title: "Use (วัตถุประสงค์ในการใช้)", placeholder: "ระบุวัตถุประสงค์..." },
                        { letter: "D", key: "disclose", title: "Disclose (การเปิดเผยให้บุคคลที่ 3)", placeholder: "ระบุบุคคลภายนอกที่ส่งต่อให้..." },
                      ].map((ropa) => (
                        <div
                          key={ropa.key}
                          style={{ display: "flex", gap: "20px", background: "var(--card-bg)", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}
                        >
                          <div style={{ width: "40px", height: "40px", background: "var(--blue)", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", flexShrink: 0 }}>
                            {ropa.letter}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "var(--text-color)", fontWeight: 700, marginBottom: "8px", fontSize: "0.95rem" }}>
                              {ropa.title}
                            </div>
                            {isEditing ? (
                              <textarea
                                placeholder={ropa.placeholder}
                                value={ editFormData.compliance?.ropa?.[ropa.key] || "" }
                                onChange={(e) => handleRopaChange(ropa.key, e.target.value) }
                                style={{ width: "100%", minHeight: "60px", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                              />
                            ) : (
                              <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                                {selectedApp.compliance?.ropa?.[ropa.key] || "-"}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h4 style={{ margin: "0", fontSize: "1.1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#f59e0b", color: "#fff", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>8</span>
                    ประวัติและการเปลี่ยนแปลง (History)
                  </h4>
                  <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Comments / บันทึกย่อล่าสุด</div>
                    {isEditing ? (
                      <textarea
                        value={editFormData.comments || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, comments: e.target.value }) }
                        style={{ width: "100%", minHeight: "80px", padding: "12px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }}
                      />
                    ) : ( <div style={{ color: "var(--text-color)" }}>{selectedApp.comments || "-"}</div> )}
                  </div>
                </div>
              )}
            </div>
            <div
              className="app-modal-footer"
              style={{
                padding: "20px 30px",
                borderTop: "1px solid var(--border-color)",
                background: "var(--card-bg)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {!isEditing && canUpdate && (
                  <button
                    onClick={handleStartEdit}
                    className="btn btn-primary"
                    style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    ✏️ แก้ไขข้อมูล (Edit Mode)
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCloseModal}
                      disabled={isSaving}
                      className="btn btn-tertiary"
                      style={{ padding: "10px 24px", border: "none", background: "var(--bg-color)", borderRadius: "8px", cursor: "pointer", color: "var(--text-muted)" }}
                    >
                      ยกเลิก (Cancel)
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      style={{ background: "#166534", color: "#fff", border: "none", padding: "10px 30px", borderRadius: "8px", fontWeight: "700", cursor: isSaving ? "not-allowed" : "pointer" }}
                    >
                      {isSaving ? "กำลังบันทึก..." : '💾 บันทึกการเปลี่ยนเเปลง (Save)'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    style={{ background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid var(--border-color)", padding: "10px 30px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                  >
                    ปิดหน้าต่าง
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationPortfolio;