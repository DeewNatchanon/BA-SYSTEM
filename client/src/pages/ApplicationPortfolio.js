import React, { useState, useEffect, useMemo } from "react";
import { fetchProjects, updateProjectInDb } from "../api/authApi";
import Swal from "sweetalert2";

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

// 🚀 ชุดไอคอน SVG แบบมืออาชีพ เรียบหรู
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

function ApplicationPortfolio({ currentUser }) {
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
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  const isManager = currentUser?.role === "manager";
  const isCEO = currentUser?.role === "ceo";

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
              try {
                parsedForm = JSON.parse(parsedForm);
              } catch (e) {
                parsedForm = {};
              }
            }
            parsedForm = parsedForm || {};
            return {
              ...item,
              form_data: parsedForm,
              tech: parsedForm.tech || {},
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
            };
          });
        setAllData(appsOnly);
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "ข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูล Application Portfolio ได้",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApp = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ข้อมูลแอปพลิเคชันนี้จะถูกลบออกจากระบบและไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "🗑️ ยืนยันลบ",
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
        Swal.fire("ลบสำเร็จ", "ข้อมูลถูกลบออกจากระบบแล้ว", "success");
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
      tech: selectedApp.tech || {},
      support: selectedApp.support || {},
      interface: selectedApp.interface || {},
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
            form_data: {
              ...editFormData.form_data,
              tech: editFormData.tech,
              compliance: editFormData.compliance,
              support: editFormData.support,
              users: editFormData.users,
              comments: editFormData.comments,
            },
          };
          await updateProjectInDb(
            editFormData.id,
            finalDataToSave,
            null,
            token,
          );
          setAllData((prev) =>
            prev.map((item) =>
              item.id === editFormData.id ? finalDataToSave : item,
            ),
          );
          setSelectedApp(finalDataToSave);
          setIsEditing(false);
          Swal.fire("สำเร็จ!", "บันทึกข้อมูลการแก้ไขเรียบร้อยแล้ว", "success");
        } catch (error) {
          console.error(error);
          Swal.fire(
            "เกิดข้อผิดพลาด",
            "ไม่สามารถบันทึกข้อมูลได้: " + error.message,
            "error",
          );
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const getAppIdDisplay = (app) => {
    return app.form_data?.tracking?.appId || app.form_data?.appId || app.id;
  };

  const uniqueCategories = useMemo(
    () => [
      ...new Set(allData.map((item) => item.category || "Support Application")),
    ],
    [allData],
  );

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(allData.map(a => a.status).filter(Boolean))];
    return statuses.sort((a,b) => a.localeCompare(b, 'th'));
  }, [allData]);

  const sortData = (data) => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (sortBy === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, ['th', 'en']);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
    });
  };

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
        "form_data.tracking.glsManager",
        "form_data.assigned_to",
        "site",
      ],
    });
    return sortData(filtered);
  }, [allData, searchTerm, filters, sortBy, sortOrder]);

  const hasActiveFilter = filters.status !== 'All' || filters.category !== 'All';

  if (isLoading)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        กำลังดึงข้อมูล Application Portfolio...
      </div>
    );

  return (
    <div className="page-wrap page-app" style={{ gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h1 className="page-heading" style={{ margin: 0 }}>
          Application Portfolio
        </h1>
      </div>
      
      {/* Minimal Top-Right Toolbar (Search + Filters Popover) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', fontSize: '0.95rem', color: '#94a3b8', zIndex: 2, pointerEvents: 'none' }}>🔍</span>
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="ค้นหา..." 
              style={{ 
                borderRadius:'20px', 
                border:'1px solid var(--border-color)', 
                background:'var(--card-bg)', 
                color:'var(--text-color)', 
                fontSize:'0.85rem', 
                width:'130px', 
                outline:'none', 
                transition:'all 0.3s ease', 
                margin: 0,
                textIndent: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }} 
              onFocus={(e) => { e.target.style.width = '200px'; e.target.style.borderColor = 'var(--blue)'; e.target.style.background = 'var(--input-bg)'; }} 
              onBlur={(e) => { e.target.style.width = '130px'; e.target.style.borderColor = 'var(--border-color)'; e.target.style.background = 'var(--card-bg)'; }} 
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ padding:'6px 14px', borderRadius:'20px', border: showFilters || hasActiveFilter ? '1px solid var(--blue)' : '1px solid var(--border-color)', background: showFilters || hasActiveFilter ? 'rgba(2, 132, 199, 0.05)' : 'var(--card-bg)', color: showFilters || hasActiveFilter ? 'var(--blue)' : 'var(--text-muted)', fontSize:'0.85rem', fontWeight: 600, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filter
            {hasActiveFilter && <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>}
          </button>
        </div>

        {showFilters && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', width: '280px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 100 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-color)' }}>ตั้งค่าตัวกรอง</span>
                {hasActiveFilter && (
                  <span onClick={()=>{setFilters({ status: "All", category: "All" });}} style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', fontWeight: 700, background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>ล้างทั้งหมด</span>
                )}
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>จัดเรียงข้อมูล (Sort)</label>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ flex: 1, padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', fontSize:'0.85rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none', boxShadow: 'none' }}>
                   <option value="name">ชื่อ (Name)</option>
                   <option value="id">รหัส (ID)</option>
                   <option value="status">สถานะ (Status)</option>
                   <option value="category">ประเภท (Category)</option>
                 </select>
                 <button onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')} style={{ padding:'8px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--input-bg)', cursor:'pointer', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', color: 'var(--text-color)' }}>
                   {sortOrder==='asc'?'⬆️':'⬇️'}
                 </button>
               </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>สถานะ (Status)</label>
               <select value={filters.status} onChange={e=>setFilters({ ...filters, status: e.target.value })} style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', fontSize:'0.85rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none', boxShadow: 'none' }}>
                 <option value="All">ทั้งหมด</option>
                 {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
               </select>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ประเภท (Category)</label>
               <select value={filters.category} onChange={e=>setFilters({ ...filters, category: e.target.value })} style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', fontSize:'0.85rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none', boxShadow: 'none' }}>
                 <option value="All">ทั้งหมด</option>
                 {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>
          </div>
        )}
      </div>

      <div className="table-wrap" style={{ width: '100%', overflowX: 'auto', position: 'relative', zIndex: 1, border: 'none', background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>
                รหัสระบบ (App ID)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>
                ชื่อระบบ / ไซต์ (Name / Site)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>
                ประเภท (Category)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>
                สถานะ (Status)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>
                เทคโนโลยี (Tech Summary)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', background: 'transparent' }}>
                ความปลอดภัย (Security)
              </th>
              <th style={{ padding: '20px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', background: 'transparent' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedApps.length > 0 ? (
              displayedApps.map((app) => {
                const hasPdpa =
                  app.compliance?.pdpa &&
                  Object.values(app.compliance.pdpa).some(
                    (val) => val === true,
                  );
                const hasRopa =
                  app.compliance?.ropa &&
                  Object.values(app.compliance.ropa).some(
                    (val) => typeof val === "string" && val.trim() !== "",
                  );
                const isNewSystem =
                  app.project_type === "New System" ||
                  app.project_type === "New";
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ color: "var(--blue)", fontWeight: 700, padding: '16px 24px', background: 'transparent', fontSize: '0.85rem' }}>
                      {getAppIdDisplay(app)}
                    </td>
                    <td style={{ padding: '16px 24px', background: 'transparent', fontSize: '0.85rem' }}>
                      <span
                        onClick={() => handleViewDetails(app)}
                        style={{
                          color: "var(--text-color)",
                          cursor: "pointer",
                          fontWeight: "700",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.color = "var(--blue)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.color = "var(--text-color)")
                        }
                      >
                        {app.name}
                      </span>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                          fontWeight: 600,
                        }}
                      >
                        SITE:{" "}
                        <span style={{ color: "var(--blue)" }}>
                          {app.site || "-"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', background: 'transparent', fontSize: '0.85rem' }}>
                      <div
                        style={{
                          color: "var(--text-color)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {app.category || "Support Application"}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                        }}
                      >
                        {isNewSystem ? "Inhouse (New)" : "Inhouse (Enhance)"}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', background: 'transparent' }}>
                      <span
                        style={{
                          padding: "6px 14px",
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {app.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', background: 'transparent' }}>
                      <div
                        style={{
                          color: "var(--text-color)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {app.tech?.language || "-"}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                        }}
                      >
                        {app.tech?.platform || "Web Base"}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: '16px 24px', background: 'transparent' }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {hasPdpa && (
                          <div
                            title="มีการจัดเก็บข้อมูล PDPA"
                            style={{
                              padding: "4px 10px",
                              background: "rgba(245, 158, 11, 0.1)",
                              color: "#f59e0b",
                              borderRadius: "8px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              border: "1px solid rgba(245, 158, 11, 0.2)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🔒 PDPA
                          </div>
                        )}
                        {hasRopa && (
                          <div
                            title="มีการบันทึก ROPA"
                            style={{
                              padding: "4px 10px",
                              background: "rgba(14, 165, 233, 0.1)",
                              color: "#0ea5e9",
                              borderRadius: "8px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              border: "1px solid rgba(14, 165, 233, 0.2)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🛡️ ROPA
                          </div>
                        )}
                        {!hasPdpa && !hasRopa && (
                          <span style={{ color: "var(--text-muted)" }}>
                            -
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: '16px 24px', background: 'transparent' }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="btn btn-primary"
                          style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            boxShadow: "0 2px 4px rgba(14,165,233,0.2)", 
                            transition: "transform 0.1s"
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} 
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          🔍 View Details
                        </button>
                        {isManager && (
                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            title="ลบข้อมูลแอปพลิเคชัน"
                            style={{
                              padding: "8px 12px",
                              borderRadius: "10px",
                              fontSize: "0.8rem",
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              cursor: "pointer",
                              fontWeight: "bold",
                              transition: "transform 0.1s"
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} 
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "var(--text-muted)",
                  }}
                >
                  ไม่พบข้อมูลแอปพลิเคชันที่ตรงกับเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                overflowY: "hidden", /* 🚀 ซ่อน Scrollbar แนวตั้งที่โผล่มาเกิน 🚀 */
                scrollbarWidth: "none", /* 🚀 ซ่อน Scrollbar แนวนอนใน Firefox 🚀 */
                alignItems: "flex-end",
                background: "var(--card-bg)",
              }}
            >
              {[
                {
                  id: "general",
                  label: "General & Business",
                  icon: <GenIcon />,
                  color: "#0072bb",
                },
                {
                  id: "tech",
                  label: "Tech & Interface",
                  icon: <TechIcon />,
                  color: "#8b5cf6",
                },
                {
                  id: "support",
                  label: "Support & SLA",
                  icon: <SupportIcon />,
                  color: "#10b981",
                },
                {
                  id: "security",
                  label: "Security & PDPA",
                  icon: <SecurityIcon />,
                  color: "#ef4444",
                },
                {
                  id: "history",
                  label: "History",
                  icon: <HistoryIcon />,
                  color: "#f59e0b",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 2px",
                    border: "none",
                    background: "transparent",
                    color:
                      activeTab === tab.id ? tab.color : "var(--text-muted)",
                    fontWeight: activeTab === tab.id ? "700" : "600",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    position: "relative",
                    marginBottom:
                      "-1px"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: tab.color,
                      }}
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "1.1rem",
                      color: "var(--text-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: "#0072bb",
                        color: "#fff",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      1
                    </span>
                    ข้อมูลทั่วไปและธุรกิจ (General & Business)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        gridColumn: "1 / -1",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Description (รายละเอียด)
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editFormData.description || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              description: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "80px",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div style={{ color: "var(--text-color)" }}>
                          {selectedApp.description || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        ผู้จัดการระบบ (Manager)
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.manager || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              manager: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.manager || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        หน่วยงานเจ้าของ (Owner)
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.owner || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              owner: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.owner || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        จำนวนผู้ใช้ (No. of Users)
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.users || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              users: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.users || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        สถานะ (Status)
                      </div>
                      {isEditing ? (
                        <select
                          value={editFormData.status || "Active"}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              status: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Hold">Hold</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.status || "Active"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "tech" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "1.1rem",
                      color: "var(--text-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: "#8b5cf6",
                        color: "#fff",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      2
                    </span>
                    โครงสร้างเทคโนโลยี (Server & Tech Stack)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Programming Language
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.tech?.language || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "tech",
                              "language",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.tech?.language || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Platform
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.tech?.platform || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "tech",
                              "platform",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.tech?.platform || "Web Base"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Database Server IP
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.tech?.server || ""}
                          onChange={(e) =>
                            handleNestedChange("tech", "server", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.tech?.server || "-"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        Web Server IP
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.tech?.webServer || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "tech",
                              "webServer",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.tech?.webServer || "-"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "support" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "1.1rem",
                      color: "var(--text-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      3
                    </span>
                    ระดับการสนับสนุนและสัญญา (Support & Contract)
                  </h4>
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--blue)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          marginBottom: "8px",
                        }}
                      >
                        Tier 2 (L2 Support) / Site IT
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.support?.l2Contact || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "support",
                              "l2Contact",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.support?.l2Contact ||
                            "BPK IT Support on site"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--blue)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          marginBottom: "8px",
                        }}
                      >
                        Tier 3 (L3 Support) / App Owner
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.support?.l3Contact || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "support",
                              "l3Contact",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "var(--text-color)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedApp.support?.l3Contact ||
                            "GLS-G6-Developer-Group"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "security" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "1.1rem",
                        color: "var(--text-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        4
                      </span>
                      PDPA: ข้อมูลส่วนบุคคลที่ระบบจัดเก็บ
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {fullPdpaItems.map((item) => {
                        const isChecked = isEditing
                          ? editFormData.compliance?.pdpa?.[item.key] || false
                          : selectedApp.compliance?.pdpa?.[item.key] || false;
                        return (
                          <label
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: isChecked
                                ? "rgba(34, 197, 94, 0.1)"
                                : "var(--card-bg)",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              border: isChecked
                                ? "1px solid #22c55e"
                                : "1px solid var(--border-color)",
                              cursor: isEditing ? "pointer" : "default",
                              transition: "all 0.2s",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  handlePdpaChange(item.key, e.target.checked)
                                }
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  accentColor: "#22c55e",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: "1.1rem" }}>
                                {isChecked ? "✅" : "⚪"}
                              </span>
                            )}
                            <span
                              style={{
                                fontWeight: isChecked ? "600" : "normal",
                                color: isChecked
                                  ? "#22c55e"
                                  : "var(--text-color)",
                              }}
                            >
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <h4
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "1.1rem",
                        color: "var(--text-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        5
                      </span>
                      ROPA: บันทึกกิจกรรมการประมวลผลข้อมูล
                    </h4>
                    <div style={{ display: "grid", gap: "16px" }}>
                      {[
                        {
                          letter: "C",
                          key: "collect",
                          title: "Collect (แหล่งที่เก็บรวบรวมข้อมูล)",
                          placeholder: "ระบุแหล่งที่มา...",
                        },
                        {
                          letter: "S",
                          key: "store",
                          title: "Store (สถานที่และระยะเวลาจัดเก็บ)",
                          placeholder: "ระบุสถานที่เก็บ/ระยะเวลา...",
                        },
                        {
                          letter: "U",
                          key: "use",
                          title: "Use (วัตถุประสงค์ในการใช้)",
                          placeholder: "ระบุวัตถุประสงค์...",
                        },
                        {
                          letter: "D",
                          key: "disclose",
                          title: "Disclose (การเปิดเผยให้บุคคลที่ 3)",
                          placeholder: "ระบุบุคคลภายนอกที่ส่งต่อให้...",
                        },
                      ].map((ropa) => (
                        <div
                          key={ropa.key}
                          style={{
                            display: "flex",
                            gap: "20px",
                            background: "var(--card-bg)",
                            padding: "20px",
                            borderRadius: "16px",
                            border: "1px solid var(--border-color)",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              background: "var(--blue)",
                              color: "#fff",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "1.2rem",
                              flexShrink: 0,
                            }}
                          >
                            {ropa.letter}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                color: "var(--text-color)",
                                fontWeight: 700,
                                marginBottom: "8px",
                                fontSize: "0.95rem",
                              }}
                            >
                              {ropa.title}
                            </div>
                            {isEditing ? (
                              <textarea
                                placeholder={ropa.placeholder}
                                value={
                                  editFormData.compliance?.ropa?.[ropa.key] ||
                                  ""
                                }
                                onChange={(e) =>
                                  handleRopaChange(ropa.key, e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  minHeight: "60px",
                                  padding: "12px",
                                  borderRadius: "8px",
                                  background: "var(--input-bg)",
                                  border: "1px solid var(--border-color)",
                                  color: "var(--text-color)",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.95rem",
                                }}
                              >
                                {selectedApp.compliance?.ropa?.[ropa.key] ||
                                  "-"}
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0",
                      fontSize: "1.1rem",
                      color: "var(--text-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: "#f59e0b",
                        color: "#fff",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      6
                    </span>
                    ประวัติและการเปลี่ยนแปลง (History)
                  </h4>
                  <div
                    style={{
                      background: "var(--card-bg)",
                      padding: "20px",
                      borderRadius: "16px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      Comments / บันทึกย่อล่าสุด
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editFormData.comments || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            comments: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          minHeight: "80px",
                          padding: "12px",
                          borderRadius: "8px",
                          background: "var(--input-bg)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-color)",
                        }}
                      />
                    ) : (
                      <div style={{ color: "var(--text-color)" }}>
                        {selectedApp.comments || "-"}
                      </div>
                    )}
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
                {!isEditing && !isCEO && (
                  <button
                    onClick={handleStartEdit}
                    className="btn btn-primary"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
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
                      style={{
                        padding: "10px 24px",
                        border: "none",
                        background: "var(--bg-color)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                    >
                      ยกเลิก (Cancel)
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      style={{
                        background: "#166534",
                        color: "#fff",
                        border: "none",
                        padding: "10px 30px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: isSaving ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSaving
                        ? "กำลังบันทึก..."
                        : '💾 บันทึกการเปลี่ยนเเปลง (Save)'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    style={{
                      background: "var(--card-bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                      padding: "10px 30px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
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