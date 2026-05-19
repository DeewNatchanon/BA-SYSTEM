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

function filterRows(data, { searchQuery = "", filters = {}, searchableFields = [] } = {}) {
  if (!Array.isArray(data)) return [];
  const q = String(searchQuery || "").trim().toLowerCase();

  return data.filter((row) => {
    if (q) {
      let hay = "";
      if (Array.isArray(searchableFields) && searchableFields.length) {
        hay = searchableFields.map((f) => String(getNested(row, f) ?? "")).join(" ");
      } else {
        try { hay = JSON.stringify(row); } catch (e) { hay = ""; }
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

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SortUpIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>);
const SortDownIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>);
const SortDefaultIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" /></svg>);

// 🌟 อัปเดตรายชื่อ Phase ให้ตรงกับ ProjectWorkspace.js
const phaseList = [
  { key: "Requirement", label: "1. Requirement (รับความต้องการ)", color: "#3b82f6" },
  { key: "Preparation", label: "2. Preparation (เตรียมความพร้อม)", color: "#8b5cf6" },
  { key: "Development", label: "3. Development (การพัฒนา)", color: "#f59e0b" },
  { key: "UAT", label: "4. UAT (ทดสอบระบบ)", color: "#10b981" },
  { key: "Golive", label: "5. Go-Live (ขึ้นระบบจริง)", color: "#ef4444" },
];

function ProjectPortfolio({ currentUser }) {
  const navigate = useNavigate();
  const { canRead, canUpdate, canDelete } = usePermissions(currentUser, "project_portfolio");

  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPhase, setFilterPhase] = useState("All");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 

  useEffect(() => { loadData(); }, [currentUser]);

  const loadData = async () => {
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      if (token) {
        const data = await fetchProjects(token);
        const safeData = data
          .filter((p) => String(p.status).trim().toLowerCase() !== "pending approval")
          .map((p) => {
            let parsedForm = p.form_data;
            if (typeof parsedForm === "string") { try { parsedForm = JSON.parse(parsedForm); } catch (e) { parsedForm = {}; } }
            
            // 🌟 เตรียมข้อมูล Timeline ให้พร้อมใช้งาน
            let parsedTimeline = p.timeline;
            if (typeof parsedTimeline === "string") { try { parsedTimeline = JSON.parse(parsedTimeline); } catch (e) { parsedTimeline = {}; } }

            return { ...p, form_data: parsedForm || {}, timeline: parsedTimeline || {} };
          });
        setProjects(safeData);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลโครงการได้", "error");
    } finally { setIsLoading(false); }
  };

  const handleCancelProject = async (project) => {
    const result = await Swal.fire({
      title: "ยกเลิกโครงการ?",
      text: `คุณต้องการยกเลิกโครงการ ${project.name} ใช่หรือไม่?\n(ข้อมูลจะถูกย้ายไปล่างสุดและสามารถลบถาวรได้ในภายหลัง)`,
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
        
        const updatedProject = {
          ...project,
          status: "Cancelled",
          form_data: {
            ...project.form_data,
            status: "Cancelled"
          }
        };
        
        await updateProjectInDb(project.id, updatedProject, null, token);
        setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
        Swal.fire("สำเร็จ", "ยกเลิกโครงการเรียบร้อยแล้ว", "success");
      } catch(err) {
        Swal.fire("ผิดพลาด", err.message, "error");
      }
    }
  };

  const handleDeleteProject = async (id) => {
    const result = await Swal.fire({ 
      title: "ลบข้อมูลถาวร?", 
      text: "คุณกำลังลบข้อมูลที่ยกเลิกแล้วออกจากฐานข้อมูล การกระทำนี้ไม่สามารถกู้คืนได้!", 
      icon: "error", 
      showCancelButton: true, 
      confirmButtonColor: "#ef4444", 
      cancelButtonColor: "#64748b", 
      confirmButtonText: "🗑️ ยืนยันลบถาวร", 
      cancelButtonText: "ยกเลิก" 
    });
    if (result.isConfirmed) {
      try {
        const sessionRaw = localStorage.getItem("ba-system.auth-session");
        const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
        const res = await fetch(`http://localhost:4000/api/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("ไม่สามารถลบโครงการได้");
        setProjects((prev) => prev.filter((p) => p.id !== id));
        Swal.fire("ลบสำเร็จ", "โครงการถูกลบถาวรออกจากระบบแล้ว", "success");
      } catch (err) { Swal.fire("เกิดข้อผิดพลาด", err.message, "error"); }
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setActiveTab("overview");
    setIsViewModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setSelectedProject(null);
  };

  const formatDateTH = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 🌟 ฟังก์ชัน Format วันที่สำหรับ Gantt Chart
  const formatDayMonth = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };
  
  const getProgressColor = (percent) => {
    if (percent < 30) return "#dc3545";
    if (percent < 75) return "#f59e0b";
    return "#10b981";
  };

  const uniqueStatuses = useMemo(() => [...new Set(projects.map((p) => p.status).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th")), [projects]);
  const uniquePhases = useMemo(() => [...new Set(projects.map((p) => p.phase).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th")), [projects]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(columnKey); setSortOrder("asc"); }
  };

  const displayedProjects = useMemo(() => {
    let filtered = filterRows(projects, { 
      searchQuery: searchQuery, 
      filters: { status: filterStatus !== "All" ? filterStatus : null, phase: filterPhase !== "All" ? filterPhase : null }, 
      searchableFields: ["id", "form_data.requestId", "name", "form_data.assignees"] 
    });
    
    const applySort = (data) => {
      if (!sortBy) return data;
      return [...data].sort((a, b) => {
        const aIsCancelled = a.status === 'Cancelled' || a.status === 'Retired';
        const bIsCancelled = b.status === 'Cancelled' || b.status === 'Retired';
        if (aIsCancelled && !bIsCancelled) return 1;
        if (!aIsCancelled && bIsCancelled) return -1;

        let aVal = ""; let bVal = "";
        switch (sortBy) {
          case "id": aVal = a.form_data?.requestId || a.id || ""; bVal = b.form_data?.requestId || b.id || ""; break;
          case "name": aVal = a.name || ""; bVal = b.name || ""; break;
          case "assignee": 
            aVal = Array.isArray(a.form_data?.assignees) ? a.form_data.assignees.join(", ") : (a.form_data?.assignees || ""); 
            bVal = Array.isArray(b.form_data?.assignees) ? b.form_data.assignees.join(", ") : (b.form_data?.assignees || ""); 
            break;
          case "status": aVal = a.status || ""; bVal = b.status || ""; break;
          case "phase": aVal = a.phase || ""; bVal = b.phase || ""; break;
          case "progress": aVal = a.form_data?.tracking?.completionPercent || 0; bVal = b.form_data?.tracking?.completionPercent || 0; return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
          case "updated_at": aVal = new Date(a.updated_at || a.created_at || 0).getTime(); bVal = new Date(b.updated_at || b.created_at || 0).getTime(); return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
          default: break;
        }
        if (typeof aVal === "string" && typeof bVal === "string") { const cmp = aVal.localeCompare(bVal, ["th", "en"]); return sortOrder === "asc" ? cmp : -cmp; }
        return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
      });
    };
    return applySort(filtered);
  }, [projects, searchQuery, filterStatus, filterPhase, sortBy, sortOrder]);

  const stats = {
    total: projects.length, active: projects.filter((p) => p.status === "Active" || p.status === "Initiate").length,
    hold: projects.filter((p) => p.status === "Hold").length, goLive: projects.filter((p) => p.status === "Go-live" || p.phase === "Go-live").length,
  };
  const hasActiveFilter = filterStatus !== "All" || filterPhase !== "All";

  const SortableHeader = ({ label, columnKey, align = "left" }) => {
    const isActive = sortBy === columnKey;
    return (
      <th onClick={() => handleSort(columnKey)} style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: isActive ? "var(--blue)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", textAlign: align, background: isActive ? "rgba(2, 132, 199, 0.05)" : "transparent", cursor: "pointer", userSelect: "none", transition: "all 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: align === "center" ? "center" : "flex-start", gap: "6px" }}>
          {label} <span style={{ display: "flex", alignItems: "center", color: isActive ? "var(--blue)" : "#cbd5e1", opacity: isActive ? 1 : 0.6, transition: "all 0.2s ease" }}>{isActive ? (sortOrder === "asc" ? <SortUpIcon /> : <SortDownIcon />) : <SortDefaultIcon />}</span>
        </div>
      </th>
    );
  };

  // 🌟 ฟังก์ชันคำนวณตำแหน่งและวาด Gantt Chart ในหน้า Modal
  const calculateGanttPosition = (start, end, projectStart, projectEnd) => {
    if (!start || !end || !projectStart || !projectEnd) return { left: '0%', width: '0%' };
    const tStart = new Date(projectStart).getTime(); const tEnd = new Date(projectEnd).getTime();
    const pStart = new Date(start).getTime(); const pEnd = new Date(end).getTime();
    const totalDuration = tEnd - tStart;
    if (totalDuration <= 0) return { left: '0%', width: '100%' };
    let leftPercent = ((pStart - tStart) / totalDuration) * 100;
    let widthPercent = ((pEnd - pStart) / totalDuration) * 100;
    if (leftPercent < 0) leftPercent = 0; if (leftPercent > 100) leftPercent = 100;
    if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getTimelineMarkers = (start, end) => {
    const markers = [];
    if (!start || !end) return markers;
    const totalMs = end.getTime() - start.getTime();
    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    let step = 1;
    if (totalDays > 120) step = 15;
    else if (totalDays > 60) step = 7;
    else if (totalDays > 30) step = 5;
    else if (totalDays > 14) step = 3;
    let curr = new Date(start);
    while (curr <= end) {
      const left = ((curr.getTime() - start.getTime()) / totalMs) * 100;
      markers.push({ label: `${curr.getDate()} ${curr.toLocaleDateString('th-TH', { month: 'short' })}`, left: `${left}%` });
      curr.setDate(curr.getDate() + step);
    }
    return markers;
  };

  const renderGanttChart = () => {
    if (!selectedProject) return null;
    
    let pStartStr = selectedProject.form_data?.compliance?.baStartDate;
    let pEndStr = selectedProject.form_data?.compliance?.baEndDate;
    
    if (!pStartStr || !pEndStr) {
      let earliest = new Date();
      let latest = new Date(); latest.setMonth(latest.getMonth() + 3);
      if (selectedProject.timeline && Object.keys(selectedProject.timeline).length > 0) {
         const starts = Object.values(selectedProject.timeline).map(p => p.startDate || p.planStart).filter(Boolean).map(d => new Date(d));
         const ends = Object.values(selectedProject.timeline).map(p => p.endDate || p.planEnd).filter(Boolean).map(d => new Date(d));
         if (starts.length > 0) earliest = new Date(Math.min(...starts));
         if (ends.length > 0) latest = new Date(Math.max(...ends));
      }
      pStartStr = earliest.toISOString().split('T')[0];
      pEndStr = latest.toISOString().split('T')[0];
    }
    
    const gStart = new Date(pStartStr);
    const gEnd = new Date(pEndStr);
    const durationDays = (gEnd.getTime() - gStart.getTime()) / (1000 * 60 * 60 * 24);
    const bufferDays = Math.max(14, Math.floor(durationDays * 0.15));
    const chartStart = new Date(gStart); chartStart.setDate(chartStart.getDate() - 2);
    const chartEnd = new Date(gEnd); chartEnd.setDate(chartEnd.getDate() + bufferDays);

    const totalMs = chartEnd.getTime() - chartStart.getTime() || 1;
    const today = new Date();
    let todayLeft = ((today.getTime() - chartStart.getTime()) / totalMs) * 100;
    const showToday = todayLeft >= 0 && todayLeft <= 100;
    const timeMarkers = getTimelineMarkers(chartStart, chartEnd);

    return (
      <div style={{ background: "var(--card-bg)", borderRadius: "10px", border: "1px solid var(--border-color)", overflow: "hidden", marginBottom: "24px", fontFamily: "sans-serif", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", background: "#3b82f6", color: "#fff", alignItems: "center" }}>
          <div style={{ width: "240px", padding: "16px 20px", fontWeight: "800", borderRight: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", fontSize: "1.05rem", letterSpacing: "1px" }}>
            AGILE PROJECT PLAN
          </div>
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", padding: "0 20px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", width: "100%", color: "rgba(255,255,255,0.9)", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase" }}>
               <span>เริ่มโครงการ: {formatDateTH(gStart)}</span>
               <span>Timeline Overview</span>
               <span>กำหนดเสร็จ: {formatDateTH(gEnd)}</span>
             </div>
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)", position: "relative", height: "32px", overflow: "hidden" }}>
           <div style={{ width: "240px", borderRight: "1px solid var(--border-color)", flexShrink: 0 }}></div>
           <div style={{ flex: 1, position: "relative" }}>
             {timeMarkers.map((m, i) => (
                <div key={i} style={{ position: "absolute", left: m.left, top: 0, bottom: 0, borderLeft: "1px solid rgba(0,0,0,0.1)", paddingLeft: "4px", display: "flex", alignItems: "center", fontSize: "0.7rem", fontWeight: "bold", color: "var(--text-muted)" }}>
                  {m.label}
                </div>
             ))}
           </div>
        </div>
        <div style={{ position: "relative", minHeight: "150px" }}>
           <div style={{ position: "absolute", top: 0, bottom: 0, left: "240px", width: "calc(100% - 240px)", pointerEvents: "none" }}>
              {timeMarkers.map((m, i) => (
                 <div key={i} style={{ position: "absolute", left: m.left, top: 0, bottom: 0, borderLeft: "1px dashed rgba(0,0,0,0.08)" }} />
              ))}
              {showToday && (
                <div style={{ position: "absolute", left: `${todayLeft}%`, top: 0, bottom: 0, borderLeft: "2px solid #0ea5e9", zIndex: 10 }}>
                   <div style={{ position: "absolute", top: "0", left: "-24px", background: "#0ea5e9", color: "#fff", fontSize: "0.6rem", padding: "3px 6px", borderRadius: "0 0 4px 4px", fontWeight: "bold", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>TODAY</div>
                </div>
              )}
           </div>

           {phaseList.map((p, i) => {
             const data = selectedProject.timeline?.[p.key] || selectedProject.form_data?.timeline?.[p.key] || selectedProject.form_data?.tracking?.phases?.[p.key.toLowerCase()];
             let planBar = null; let actualBar = null;

             if (data?.startDate || data?.planStart) {
               const pStart = new Date(data.startDate || data.planStart); const pEnd = new Date(data.endDate || data.planEnd || data.startDate || data.planStart);
               const pos = calculateGanttPosition(pStart, pEnd, chartStart, chartEnd);
               planBar = (
                 <div style={{ position: "absolute", left: pos.left, width: pos.width, top: "8px", height: "16px", background: "#e2e8f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.65rem", fontWeight: "bold", overflow: "hidden", whiteSpace: "nowrap", boxShadow: "inset 0 0 0 1px #cbd5e1" }} title={`แผน: ${formatDateTH(pStart)} - ${formatDateTH(pEnd)}`}>
                   {parseFloat(pos.width) > 8 ? `แผน: ${formatDayMonth(pStart)} - ${formatDayMonth(pEnd)}` : ""}
                 </div>
               );
             }

             if (data?.actualStart) {
               const aStart = new Date(data.actualStart);
               const aEnd = data.actualEnd ? new Date(data.actualEnd) : new Date(); 
               const pos = calculateGanttPosition(aStart, aEnd, chartStart, chartEnd);
               const isDone = data.status === 'Completed'; const isActive = data.status === 'In Progress';
               let barColor = p.color; let labelSuffix = "";
               
               if (isDone && (data.endDate || data.planEnd)) {
                   const planEnd = new Date(data.endDate || data.planEnd).setHours(0,0,0,0); const actualEnd = new Date(data.actualEnd).setHours(0,0,0,0);
                   if (actualEnd > planEnd) { barColor = "#ef4444"; labelSuffix = " (ล่าช้า)"; } else { barColor = "#10b981"; }
               } else if (isActive) { barColor = "#3b82f6"; }

               actualBar = (
                 <div style={{ position: "absolute", left: pos.left, width: pos.width, top: "28px", height: "16px", background: barColor, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.65rem", fontWeight: "bold", overflow: "hidden", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", minWidth: "4px" }} title={`จริง: ${formatDateTH(aStart)} - ${data.actualEnd ? formatDateTH(aEnd) : 'ปัจจุบัน'}${labelSuffix}`}>
                   {parseFloat(pos.width) > 8 ? `จริง: ${formatDayMonth(aStart)} - ${data.actualEnd ? formatDayMonth(aEnd) : 'ปัจจุบัน'}${labelSuffix}` : ""}
                 </div>
               );
             }

             return (
               <div key={p.key} style={{ display: "flex", borderBottom: i === phaseList.length - 1 ? "none" : "1px solid var(--border-color)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--bg-color)", position: "relative", zIndex: 5 }}>
                 <div style={{ width: "240px", padding: "16px 20px", fontSize: "0.85rem", fontWeight: "700", color: "var(--text-color)", borderRight: "1px solid var(--border-color)", display: "flex", alignItems: "center" }}>{p.label.replace(/^\d+\.\s*/, '')}</div>
                 <div style={{ flex: 1, position: "relative", padding: "0" }}>
                   <div style={{ position: "relative", height: "52px" }}>{planBar} {actualBar}</div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  if (isLoading) return <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</div>;

  if (!canRead) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#ef4444", background: "var(--bg-color)", minHeight: "80vh" }}>
        <h2>⛔ Access Denied</h2>
        <p>คุณไม่มีสิทธิ์เข้าถึงพอร์ตโครงการ (Project Portfolio)</p>
      </div>
    );
  }

  return (
    <div className="page-wrap page-project" style={{ gap: "16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Project Portfolio</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "8px" }}>
        <div style={{ background: "linear-gradient(135deg, var(--blue-dark), var(--blue))", padding: "20px", borderRadius: "16px", color: "#fff", boxShadow: "0 10px 20px rgba(2, 132, 199, 0.15)" }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Projects</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>{stats.total}</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>🚀 In Progress</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--blue)", lineHeight: 1 }}>{stats.active}</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "16px", border: "1px solid #fde68a", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.85rem", color: "#b45309", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠️ Hold / At Risk</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#d97706", lineHeight: 1 }}>{stats.hold}</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "16px", border: "1px solid #bbf7d0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>✅ Go-Live</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{stats.goLive}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "8px", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "12px", fontSize: "0.95rem", color: "#94a3b8", zIndex: 2, pointerEvents: "none" }}>🔍</span>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหา..." style={{ borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-color)", fontSize: "0.85rem", width: "130px", outline: "none", transition: "all 0.3s ease", margin: 0, textIndent: "24px" }} onFocus={(e) => { e.target.style.width = "200px"; e.target.style.borderColor = "var(--blue)"; }} onBlur={(e) => { e.target.style.width = "130px"; e.target.style.borderColor = "var(--border-color)"; }} />
          </div>

          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "6px 14px", borderRadius: "20px", border: showFilters || hasActiveFilter ? "1px solid var(--blue)" : "1px solid var(--border-color)", background: showFilters || hasActiveFilter ? "rgba(2, 132, 199, 0.05)" : "var(--card-bg)", color: showFilters || hasActiveFilter ? "var(--blue)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", height: "100%" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filter
            {hasActiveFilter && <span style={{ width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>}
          </button>
        </div>

        {showFilters && (
          <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", width: "260px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "12px", zIndex: 100 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-color)" }}>ตั้งค่าตัวกรอง</span>
              {hasActiveFilter && ( <span onClick={() => { setFilterStatus("All"); setFilterPhase("All"); }} style={{ fontSize: "0.75rem", color: "#ef4444", cursor: "pointer", fontWeight: 600, background: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>ล้างทั้งหมด</span> )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>สถานะ (Status)</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.8rem", background: "var(--input-bg)", color: "var(--text-color)", margin: 0, outline: "none" }}>
                <option value="All">ทั้งหมด</option>
                {uniqueStatuses.map((status) => ( <option key={status} value={status}>{status}</option> ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>ขั้นตอน (Phase)</label>
              <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.8rem", background: "var(--input-bg)", color: "var(--text-color)", margin: 0, outline: "none" }}>
                <option value="All">ทั้งหมด</option>
                {uniquePhases.map((phase) => ( <option key={phase} value={phase}>{phase}</option> ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="table-wrap" style={{ width: "100%", overflowX: "auto", position: "relative", zIndex: 1, border: "none", background: "var(--card-bg)", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <SortableHeader label="รหัสโครงการ (ID)" columnKey="id" />
              <SortableHeader label="ชื่อโครงการ" columnKey="name" />
              <SortableHeader label="ผู้รับผิดชอบ" columnKey="assignee" />
              <SortableHeader label="สถานะ (Status)" columnKey="status" />
              <SortableHeader label="ขั้นตอน (Phase)" columnKey="phase" />
              <SortableHeader label="ความคืบหน้า (%)" columnKey="progress" align="center" />
              
              {(canUpdate || canDelete) && (
                <th style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center", background: "transparent" }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedProjects.map((p) => {
              const isCancelled = p.status === 'Cancelled' || p.status === 'Retired';
              
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s ease", cursor: "default", opacity: isCancelled ? 0.75 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--table-row-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td style={{ padding: "16px 14px", fontWeight: 700, background: "transparent", fontSize: "0.85rem" }}>{p.form_data?.requestId || p.id}</td>
                  <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                    <span onClick={() => handleViewProject(p)} style={{ color: isCancelled ? "var(--text-muted)" : "var(--blue)", cursor: "pointer", fontWeight: "700" }}>{p.name}</span>
                  </td>
                  <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                    <span style={{ color: isCancelled ? "var(--text-muted)" : "#d32f2f", fontWeight: "700" }}>
                      {Array.isArray(p.form_data?.assignees) && p.form_data.assignees.length > 0 
                        ? p.form_data.assignees.join(", ") 
                        : p.form_data?.assignees || "-"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                      <span 
                        className={`status-badge ${p.status?.toLowerCase()}`}
                        style={isCancelled ? { background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' } : {}}
                      >
                        {isCancelled ? 'Cancelled (ยกเลิกแล้ว)' : p.status}
                      </span>
                      {p.form_data?.tracking?.isPendingApproval && !isCancelled && ( <div style={{ fontSize: "0.75rem", color: "#b45309", background: "#fef3c7", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", border: "1px solid #fde68a", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>⏳ รอ Manager ยืนยัน</div> )}
                    </div>
                  </td>
                  <td style={{ padding: "16px 14px", color: "var(--text-muted)", background: "transparent", fontSize: "0.85rem" }}>{p.phase || "-"}</td>
                  <td style={{ padding: "16px 14px", textAlign: "center", background: "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", opacity: isCancelled ? 0.5 : 1 }}>
                      <div style={{ width: "80px", height: "10px", background: "var(--border-color)", borderRadius: "5px", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)" }}>
                        <div style={{ height: "100%", width: "100%", background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), transform: `scaleX(${(p.form_data?.tracking?.completionPercent || 0) / 100})`, transformOrigin: "left", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                      </div>
                      <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-color)", width: "35px", textAlign: "right" }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                    </div>
                  </td>
                  
                  {(canUpdate || canDelete) && (
                    <td style={{ padding: "16px 14px", textAlign: "center", background: "transparent" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                        {canUpdate && !isCancelled && (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate('/project-workspace', { state: { project: p } })} 
                            style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <EditIcon /> อัปเดตแผนงาน
                          </button>
                        )}
                        
                        {canDelete && !isCancelled && ( 
                          <button 
                            onClick={() => handleCancelProject(p)} 
                            title="ยกเลิกโครงการ" 
                            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", cursor: "pointer", fontWeight: "bold" }}
                          >
                            🛑 ยกเลิก
                          </button> 
                        )}

                        {canDelete && isCancelled && ( 
                          <button 
                            onClick={() => handleDeleteProject(p.id)} 
                            title="ลบข้อมูลออกจากฐานข้อมูลถาวร" 
                            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "bold" }}
                          >
                            🗑️ ลบถาวร
                          </button> 
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL - ข้อมูลดูอย่างเดียว */}
      {isViewModalOpen && selectedProject && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <div className="pdf-preview-card project-modal-card" style={{ width: "95%", maxWidth: "1040px", height: "90vh", display: "flex", flexDirection: "column", background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden" }}>
            <div className="project-modal-header" style={{ padding: "18px 22px 14px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", background: "linear-gradient(135deg, var(--blue-dark), var(--blue))", color: "#fff" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: "0 0 6px 0", color: "#fff", fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.2 }}>{selectedProject.name}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.84rem", opacity: 0.95 }}>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.14)" }}>รหัสโครงการ: {selectedProject.form_data?.requestId || selectedProject.id}</span>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.14)" }}>สถานะ: {selectedProject.status || "-"}</span>
                  <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.14)" }}>Phase: {selectedProject.phase || "-"}</span>
                </div>
              </div>
              <button onClick={handleCloseModals} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: "1.1rem", width: "36px", height: "36px", borderRadius: "10px", cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)", flexShrink: 0 }}>
              <div style={{ display: "flex", width: "100%", gap: "8px" }}>
                {[ { id: "timeline", label: "⏱️ ไทม์ไลน์ (Phases)" }, { id: "overview", label: "📌 ภาพรวม" }, { id: "requirement", label: "📝 ความต้องการ" }, { id: "system", label: "💻 ระบบ & ทีม" } ].map((t) => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id)} 
                    style={{ 
                      flex: 1, minWidth: 0, padding: "8px 16px", border: "none", borderRadius: "8px",
                      background: activeTab === t.id ? "var(--blue)" : "var(--bg-color)", color: activeTab === t.id ? "#fff" : "var(--text-muted)", 
                      fontWeight: activeTab === t.id ? "700" : "600", fontSize: "0.86rem", cursor: "pointer", transition: "all 0.2s",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="project-modal-body" style={{ padding: "18px 24px 20px", overflowY: "auto", flex: 1, lineHeight: "1.6", background: "var(--bg-color)" }}>
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {selectedProject.form_data?.approval_remark && (
                    <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "12px", border: "1px solid #fde68a" }}>
                      <h4 style={{ color: "#92400e", margin: "0 0 8px 0", fontSize: "1rem" }}>💬 ข้อความสั่งการจากผู้จัดการ</h4>
                      <p style={{ color: "#78350f", margin: 0, fontWeight: 500, fontSize: "0.92rem" }}>{selectedProject.form_data.approval_remark}</p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                    <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "0.98rem" }}>ข้อมูลผู้ร้องขอ (Requester Info)</h4>
                      <p style={{ margin: "0 0 8px 0" }}><strong>ชื่อผู้ติดต่อ:</strong> {selectedProject.form_data?.requesterName || selectedProject.requester_name || "-"}</p>
                      <p style={{ margin: 0 }}><strong>แผนก:</strong> {selectedProject.form_data?.requesterDept || "-"}</p>
                    </div>
                    <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "0.98rem" }}>เป้าหมายโปรเจกต์</h4>
                      <p style={{ margin: "0 0 8px 0" }}><strong>วัตถุประสงค์:</strong> {selectedProject.description}</p>
                      <p style={{ margin: 0 }}><strong>ผลที่คาดหวัง:</strong> {selectedProject.form_data?.expectedOutcome || "-"}</p>
                    </div>

                    <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                      <div>
                        <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "0.98rem" }}>ประเภทและกลุ่มลูกค้า</h4>
                        <p style={{ margin: "0 0 8px 0" }}><strong>Customer Group:</strong> {selectedProject.form_data?.tracking?.customerGroup || selectedProject.form_data?.customerGroup || "-"}</p>
                        <p style={{ margin: 0 }}><strong>Project Type:</strong> {selectedProject.form_data?.tracking?.projectType || selectedProject.form_data?.projectType || "-"}</p>
                      </div>
                      <div>
                        <h4 style={{ color: "#059669", margin: "0 0 10px 0", fontSize: "0.98rem" }}>ข้อมูลงบประมาณ (Budget)</h4>
                        <p style={{ margin: "0 0 8px 0" }}><strong>Budget Type:</strong> {selectedProject.form_data?.tracking?.budgetType || selectedProject.form_data?.budgetType || "-"}</p>
                        <p style={{ margin: "0 0 8px 0" }}><strong>Approved Budget:</strong> {selectedProject.form_data?.tracking?.approvedBudget || selectedProject.form_data?.approvedBudget ? `${selectedProject.form_data?.tracking?.approvedBudget || selectedProject.form_data?.approvedBudget} บาท` : "-"}</p>
                        <p style={{ margin: 0 }}><strong>Actual Cost:</strong> {selectedProject.form_data?.tracking?.actualCost || selectedProject.form_data?.actualCost ? `${selectedProject.form_data?.tracking?.actualCost || selectedProject.form_data?.actualCost} บาท` : "-"}</p>
                      </div>
                    </div>

                    {(selectedProject.form_data?.tracking?.remark || selectedProject.form_data?.remark) && (
                      <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "12px 16px", borderLeft: "4px solid #94a3b8", borderRadius: "0 8px 8px 0" }}>
                        <strong>Remark:</strong> {selectedProject.form_data?.tracking?.remark || selectedProject.form_data?.remark}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "requirement" && (
                <div style={{ background: "var(--card-bg)", padding: "18px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.18)", boxShadow: "inset 4px 0 0 0 rgba(14,165,233,0.2)", whiteSpace: "pre-wrap", color: "var(--text-color)" }}>
                  <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "1rem" }}>รายละเอียดเชิงลึก</h4>
                  {selectedProject.form_data?.requirementDetail || "ไม่มีข้อมูลระบุไว้"}
                </div>
              )}
              
              {/* 🌟 แสดง Timeline ดึงข้อมูลมาจาก ManagerDashboard และ ProjectWorkspace */}
              {activeTab === "timeline" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  
                  {/* 🌟 แสดง Gantt Chart ของหน้า Workspace ในหน้านี้ */}
                  {renderGanttChart()}

                  <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h4 style={{ margin: 0, color: "var(--blue)" }}>กรอบเวลาตามที่ผู้จัดการอนุมัติ (Manager's Timeline)</h4>
                      <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold" }}>
                        Total Man-Day: {selectedProject.form_data?.compliance?.manDay || 0} วัน
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                       <div><strong>เริ่ม:</strong> {formatDateTH(selectedProject.form_data?.compliance?.baStartDate)}</div>
                       <div><strong>สิ้นสุด:</strong> {formatDateTH(selectedProject.form_data?.compliance?.baEndDate)}</div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", position: "relative", padding: "0 20px" }}>
                       <div style={{ position: "absolute", top: "15px", left: "40px", right: "40px", height: "3px", background: "var(--border-color)", zIndex: 0 }} />
                       {phaseList.map((p, i) => {
                          const pData = selectedProject.timeline?.[p.key] || selectedProject.form_data?.timeline?.[p.key] || selectedProject.form_data?.tracking?.phases?.[p.key.toLowerCase()];
                          const s = pData?.status;
                          
                          const color = s === "Completed" ? "#10b981" : s === "In Progress" ? "#3b82f6" : "#cbd5e1";
                          return (
                            <div key={p.key} style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "80px" }}>
                               <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, border: `4px solid var(--card-bg)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "0.8rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                 {s === "Completed" ? "✓" : i + 1}
                               </div>
                               <span style={{ fontSize: "0.7rem", color: s ? "var(--text-color)" : "var(--text-muted)", fontWeight: "bold", textAlign: "center", whiteSpace: "nowrap" }}>{p.label.split(". ")[1]}</span>
                            </div>
                          )
                       })}
                    </div>

                    <h4 style={{ margin: "0 0 15px 0", color: "#d97706" }}>📋 สถานะแต่ละขั้นตอน (Phase Status)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                       {phaseList.map((phase) => {
                          const pData = selectedProject.timeline?.[phase.key] || selectedProject.form_data?.timeline?.[phase.key] || selectedProject.form_data?.tracking?.phases?.[phase.key.toLowerCase()];
                          if (!pData || (!pData.startDate && !pData.status && !pData.planStart)) return null;

                          return (
                            <div key={phase.key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: "15px", alignItems: "center", padding: "12px", background: "var(--bg-color)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                               <strong style={{ color: pData.status === 'Completed' ? "#10b981" : "var(--text-color)" }}>{phase.label}</strong>
                               <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  แผน (Plan): {formatDateTH(pData.startDate || pData.planStart)} - {formatDateTH(pData.endDate || pData.planEnd)}
                               </div>
                               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.85rem", color: "var(--text-color)" }}>
                                     จริง (Actual): {formatDateTH(pData.actualStart)} - {formatDateTH(pData.actualEnd)}
                                  </span>
                                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", background: pData.status === 'Completed' ? "rgba(16, 185, 129, 0.1)" : pData.status === 'In Progress' ? "rgba(59, 130, 246, 0.1)" : "rgba(100, 116, 139, 0.1)", color: pData.status === 'Completed' ? "#10b981" : pData.status === 'In Progress' ? "#3b82f6" : "#64748b" }}>
                                     {pData.status === 'Completed' ? 'เสร็จสิ้น' : pData.status === 'In Progress' ? 'กำลังทำ' : 'รอดำเนินการ'}
                                  </span>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                    {selectedProject.form_data?.tracking?.progressFile && (
                      <div style={{ marginTop: "15px", padding: "10px 12px", background: "var(--input-bg)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                        📄 <a href={`http://localhost:4000/${selectedProject.form_data.tracking.progressFile.replace(/\\/g, "/")}`} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: 600 }}>ดูไฟล์แนบหลักฐานล่าสุด</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "0.98rem" }}>ข้อมูลระบบ</h4>
                    <p style={{ margin: "0 0 8px 0" }}><strong>Application Name:</strong> {selectedProject.form_data?.tracking?.appName || selectedProject.form_data?.appName || "-"}</p>
                    <p style={{ margin: "0 0 8px 0" }}><strong>Application ID:</strong> {selectedProject.form_data?.tracking?.appId || selectedProject.form_data?.appId || "-"}</p>
                    <p style={{ margin: "0 0 8px 0" }}><strong>Deploy In (Site):</strong> {selectedProject.form_data?.tracking?.deployIn || selectedProject.form_data?.site || "-"}</p>
                    <p style={{ margin: 0 }}><strong>Owner:</strong> {selectedProject.form_data?.tracking?.glsOwner || selectedProject.form_data?.glsOwner || "-"}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="project-modal-footer" style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", background: "var(--card-bg)" }}>
              <button className="btn btn-secondary" onClick={() => { if (selectedProject.document_path) window.open(`http://localhost:4000/${selectedProject.document_path.replace(/\\/g, "/")}`, "_blank"); else Swal.fire("ไม่พบไฟล์", "ไม่พบไฟล์เอกสารอนุมัติเริ่มต้น", "error"); }} style={{ padding: "10px 14px" }}>📂 เปิดเอกสารอนุมัติ</button>
              <button className="btn btn-primary" onClick={handleCloseModals}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProjectPortfolio;