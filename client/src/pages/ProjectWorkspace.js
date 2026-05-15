import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';
import { updateProjectInDb } from '../api/authApi';
import { usePermissions } from '../hooks/usePermissions';

// --- 🚀 Professional Icons ---
const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const ArrowLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const AlertCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconUpload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconChart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
const IconSettings = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconMonitor = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
// DatePicker Custom Input
const CustomDateInput = React.forwardRef(({ value, onClick, placeholder, disabled }, ref) => (
  <button type="button" onClick={disabled ? undefined : onClick} ref={ref} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: disabled ? "1px dashed var(--border-color)" : "1px solid var(--blue)", background: disabled ? "var(--bg-color)" : "#fff", color: disabled ? "var(--text-muted)" : "var(--text-color)", textAlign: "left", fontSize: "0.75rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, transition: 'all 0.2s' }}>
    <span>{value || <span style={{ color: "#94a3b8" }}>{placeholder}</span>}</span>
    <span style={{ color: "var(--text-muted)", opacity: disabled ? 0.3 : 1 }}><IconCalendar /></span>
  </button>
));

function ProjectWorkspace({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialProject = location.state?.project || null;

  const { canRead, canUpdate } = usePermissions(currentUser, "project_portfolio");

  const [activeTab, setActiveTab] = useState("phases");
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progressFile, setProgressFile] = useState(null);
  
  const [newPdpaText, setNewPdpaText] = useState("");
  const [newImpactTeamText, setNewImpactTeamText] = useState("");

  const impactTeamsList = [ "iMed", "HMS", "Other Unit", "EPMS", "SAP SuccessFactor", "SAP P2P", "SAP R2C", "SAP Non Hos-MFG", "SAP Non Hos-Nhealth", "Doctor Fee", "E-Form", "Infra", "SOG" ];
  const fullPdpaItems = [
    { key: "health", label: "ข้อมูลสุขภาพ" }, { key: "idCard", label: "บัตรประชาชน" }, { key: "passport", label: "Passport" }, { key: "hn", label: "HN" },
    { key: "name", label: "ชื่อ-นามสกุล" }, { key: "address", label: "ที่อยู่" }, { key: "dob", label: "วัน/เดือน/ปีเกิด" }, { key: "phone", label: "เบอร์โทร" },
    { key: "email", label: "Email" }, { key: "financial", label: "ข้อมูลการเงิน" }, { key: "criminal", label: "ประวัติอาชญากรรม" }, { key: "photo", label: "รูปถ่ายใบหน้า" },
  ];

  const phases = [
    { key: "Requirement", label: "1. Requirement (รับความต้องการ)", color: "#3b82f6" },
    { key: "Preparation", label: "2. Preparation (เตรียมความพร้อม)", color: "#8b5cf6" },
    { key: "Development", label: "3. Development (การพัฒนา)", color: "#f59e0b" },
    { key: "UAT", label: "4. UAT (ทดสอบระบบ)", color: "#10b981" },
    { key: "Golive", label: "5. Go-Live (ขึ้นระบบจริง)", color: "#ef4444" },
  ];

  useEffect(() => {
    if (!initialProject) {
      navigate('/projects');
      return;
    }
    const parsedData = { ...initialProject };
    if (typeof parsedData.form_data === 'string') {
      try { parsedData.form_data = JSON.parse(parsedData.form_data); } catch (e) { parsedData.form_data = {}; }
    }
    parsedData.form_data = parsedData.form_data || {};
    parsedData.form_data.tracking = parsedData.form_data.tracking || {};
    parsedData.form_data.app_info = parsedData.form_data.app_info || {};
    parsedData.form_data.tech = parsedData.form_data.tech || {};
    parsedData.form_data.interface = parsedData.form_data.interface || {};
    parsedData.form_data.support = parsedData.form_data.support || {};
    parsedData.form_data.security_cia = parsedData.form_data.security_cia || {};
    parsedData.form_data.compliance = parsedData.form_data.compliance || { pdpa: {}, ropa: {}, customPdpaList: [] };
    if (!parsedData.timeline) parsedData.timeline = {};
    
    setEditFormData(parsedData);
  }, [initialProject, navigate]);

  const toDate = (s) => (s ? new Date(s) : null);
  const toIso = (d) => {
    if (!d) return "";
    const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const formatDateTH = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatDayMonth = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };
  const getProgressColor = (percent) => {
    if (percent < 30) return "#dc3545"; if (percent < 75) return "#f59e0b"; return "#10b981";
  };

  const handleTimelineChange = (phaseKey, field, value) => {
    setEditFormData((prev) => {
      const currentPhaseData = (prev.timeline && prev.timeline[phaseKey]) ? prev.timeline[phaseKey] : {};
      return { ...prev, timeline: { ...prev.timeline, [phaseKey]: { ...currentPhaseData, [field]: value } } };
    });
  };

  const handlePhaseAction = (phaseKey, action) => {
    setEditFormData((prev) => {
      const newTimeline = JSON.parse(JSON.stringify(prev.timeline || {}));
      if (!newTimeline[phaseKey]) newTimeline[phaseKey] = {};
      const todayIso = toIso(new Date());

      if (action === 'start') {
        newTimeline[phaseKey].status = 'In Progress';
        if (!newTimeline[phaseKey].actualStart) newTimeline[phaseKey].actualStart = todayIso;
      } else if (action === 'complete') {
        newTimeline[phaseKey].status = 'Completed';
        if (!newTimeline[phaseKey].actualEnd) newTimeline[phaseKey].actualEnd = todayIso;
      }

      // 🌟 คำนวณ Global Phase อัตโนมัติ เพื่อให้หน้า Portfolio อัปเดตทันที
      let globalPhase = prev.phase || "Requirement";
      let globalStatus = prev.status || "Initiate";
      if (globalStatus === "Initiate" && action === 'start') globalStatus = "Active";

      if (newTimeline["Golive"]?.status === "Completed") { globalPhase = "Go-Live"; globalStatus = "Go-live"; }
      else if (newTimeline["Golive"]?.status === "In Progress") { globalPhase = "Go-Live"; }
      else if (newTimeline["UAT"]?.status === "Completed" || newTimeline["UAT"]?.status === "In Progress") { globalPhase = "UAT"; }
      else if (newTimeline["Development"]?.status === "Completed" || newTimeline["Development"]?.status === "In Progress") { globalPhase = "Development"; }
      else if (newTimeline["Preparation"]?.status === "Completed" || newTimeline["Preparation"]?.status === "In Progress") { globalPhase = "Preparation"; }
      else if (newTimeline["Requirement"]?.status === "Completed" || newTimeline["Requirement"]?.status === "In Progress") { globalPhase = "Requirement"; }

      return { ...prev, timeline: newTimeline, phase: globalPhase, status: globalStatus };
    });
  };

  const handleGlobalStatusChange = (e) => { setEditFormData(prev => ({ ...prev, status: e.target.value })); };
  const handleTrackingChange = (field, value) => { setEditFormData((prev) => ({ ...prev, form_data: { ...prev.form_data, tracking: { ...prev.form_data.tracking, [field]: value } } })); };
  const handleNestedChange = (section, field, value) => { setEditFormData((prev) => ({ ...prev, form_data: { ...prev.form_data, [section]: { ...(prev.form_data[section] || {}), [field]: value } } })); };
  const handleTechChange = (field, value) => handleNestedChange("tech", field, value);

  const handleImpactTeamToggle = (teamLabel) => {
    setEditFormData((prev) => {
      const currentTeams = prev.form_data.tracking?.impactTeams || [];
      const updatedTeams = currentTeams.includes(teamLabel) ? currentTeams.filter((t) => t !== teamLabel) : [...currentTeams, teamLabel];
      return { ...prev, form_data: { ...prev.form_data, tracking: { ...prev.form_data.tracking, impactTeams: updatedTeams } } };
    });
  };
  const handleAddCustomImpactTeam = () => {
    if (!newImpactTeamText.trim()) return;
    const key = "custom_team_" + Date.now(); const label = newImpactTeamText.trim();
    setEditFormData(prev => ({ ...prev, form_data: { ...prev.form_data, tracking: { ...prev.form_data.tracking, customImpactTeamsList: [...(prev.form_data.tracking.customImpactTeamsList || []), { key, label }], impactTeams: [...(prev.form_data.tracking.impactTeams || []), label] } } }));
    setNewImpactTeamText("");
  };
  const handleDeleteCustomImpactTeam = (keyToDelete, labelToDelete) => {
    setEditFormData((prev) => {
      const newCustomList = (prev.form_data.tracking?.customImpactTeamsList || []).filter(item => item.key !== keyToDelete);
      const newImpactTeams = (prev.form_data.tracking?.impactTeams || []).filter(t => t !== labelToDelete);
      return { ...prev, form_data: { ...prev.form_data, tracking: { ...prev.form_data.tracking, customImpactTeamsList: newCustomList, impactTeams: newImpactTeams } } };
    });
  };

  const handleAddCustomPdpa = () => {
    if (!newPdpaText.trim()) return;
    const key = "custom_" + Date.now();
    setEditFormData(prev => ({ ...prev, form_data: { ...prev.form_data, compliance: { ...prev.form_data.compliance, customPdpaList: [...(prev.form_data.compliance.customPdpaList || []), { key, label: newPdpaText.trim() }], pdpa: { ...(prev.form_data.compliance.pdpa || {}), [key]: true } } } }));
    setNewPdpaText("");
  };
  const handleDeleteCustomPdpa = (keyToDelete) => {
    setEditFormData((prev) => {
      const newCustomList = (prev.form_data.compliance?.customPdpaList || []).filter(item => item.key !== keyToDelete);
      const newPdpa = { ...(prev.form_data.compliance?.pdpa || {}) }; delete newPdpa[keyToDelete];
      return { ...prev, form_data: { ...prev.form_data, compliance: { ...prev.form_data.compliance, customPdpaList: newCustomList, pdpa: newPdpa } } };
    });
  };
  const handlePdpaChange = (key, checked) => { setEditFormData((prev) => ({ ...prev, form_data: { ...prev.form_data, compliance: { ...prev.form_data.compliance, pdpa: { ...(prev.form_data.compliance?.pdpa || {}), [key]: checked } } } })); };
  const handleRopaChange = (field, value) => { setEditFormData((prev) => ({ ...prev, form_data: { ...prev.form_data, compliance: { ...prev.form_data.compliance, ropa: { ...(prev.form_data.compliance?.ropa || {}), [field]: value } } } })); };

  // 🌟 คำนวณความคืบหน้า (Progress %) อัตโนมัติ
  const calculateOverallProgress = () => {
    const pKeys = phases.map(p => p.key);
    let completedCount = 0;
    let inProgressCount = 0;
    pKeys.forEach(p => { 
      if (editFormData.timeline?.[p]?.status === "Completed") completedCount++; 
      else if (editFormData.timeline?.[p]?.status === "In Progress") inProgressCount++;
    });
    const score = completedCount + (inProgressCount * 0.5); // กำลังทำได้ 50% ของเฟสนั้นๆ
    return Math.round((score / pKeys.length) * 100);
  };

  const handleSaveWorkspace = async () => {
    setIsSaving(true);
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      
      const currentProgress = calculateOverallProgress();
      
      // 🌟 จัดโครงสร้างให้ตรงตามที่ DB ต้องการ
      const updateData = {
        ...editFormData,
        form_data: {
          ...editFormData.form_data,
          tracking: { 
            ...editFormData.form_data?.tracking, 
            completionPercent: currentProgress // เซฟเปอร์เซ็นต์เข้า DB
          }
        }
      };

      // 🌟 ส่งค่าไปแบบ Object (JSON) 🌟 แก้ไขบั๊กที่ข้อมูลหายตอนเซฟ
      await updateProjectInDb(editFormData.id, updateData, progressFile, token);

      Swal.fire('สำเร็จ!', 'อัปเดตข้อมูลโครงการเรียบร้อยแล้ว', 'success').then(() => { navigate('/projects'); });
    } catch (error) {
      console.error(error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
    let pStartStr = editFormData.form_data?.compliance?.baStartDate;
    let pEndStr = editFormData.form_data?.compliance?.baEndDate;
    if (!pStartStr || !pEndStr) {
      let earliest = new Date();
      let latest = new Date(); latest.setMonth(latest.getMonth() + 3);
      if (editFormData.timeline && Object.keys(editFormData.timeline).length > 0) {
         const starts = Object.values(editFormData.timeline).map(p => p.startDate).filter(Boolean).map(d => new Date(d));
         const ends = Object.values(editFormData.timeline).map(p => p.endDate).filter(Boolean).map(d => new Date(d));
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

           {phases.map((p, i) => {
             const data = editFormData.timeline?.[p.key];
             let planBar = null; let actualBar = null;

             if (data?.startDate && data?.endDate) {
               const pStart = new Date(data.startDate); const pEnd = new Date(data.endDate);
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
               
               if (isDone && data.endDate) {
                   const planEnd = new Date(data.endDate).setHours(0,0,0,0); const actualEnd = new Date(data.actualEnd).setHours(0,0,0,0);
                   if (actualEnd > planEnd) { barColor = "#ef4444"; labelSuffix = " (ล่าช้า)"; } else { barColor = "#10b981"; }
               } else if (isActive) { barColor = "#3b82f6"; }

               actualBar = (
                 <div style={{ position: "absolute", left: pos.left, width: pos.width, top: "28px", height: "16px", background: barColor, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.65rem", fontWeight: "bold", overflow: "hidden", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", minWidth: "4px" }} title={`จริง: ${formatDateTH(aStart)} - ${data.actualEnd ? formatDateTH(aEnd) : 'ปัจจุบัน'}${labelSuffix}`}>
                   {parseFloat(pos.width) > 8 ? `จริง: ${formatDayMonth(aStart)} - ${data.actualEnd ? formatDayMonth(aEnd) : 'ปัจจุบัน'}${labelSuffix}` : ""}
                 </div>
               );
             }

             return (
               <div key={p.key} style={{ display: "flex", borderBottom: i === phases.length - 1 ? "none" : "1px solid var(--border-color)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--bg-color)", position: "relative", zIndex: 5 }}>
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

  if (!canRead) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#ef4444", minHeight: "100vh", background: "var(--bg-color)" }}>
        <h2><IconLock /> Access Denied</h2>
        <p>คุณไม่มีสิทธิ์เข้าถึงพื้นที่จัดการโครงการ (Project Workspace)</p>
      </div>
    );
  }

  if (!editFormData) return <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูลโปรเจกต์...</div>;

  const isAllPlansSet = phases.every(p => editFormData.timeline?.[p.key]?.startDate && editFormData.timeline?.[p.key]?.endDate);

  return (
    <div className="page-wrap" style={{ maxWidth: '1400px', margin: '0 auto', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
        <div>
          <button onClick={() => navigate('/projects')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '12px', fontWeight: 600, padding: 0 }}>
            <ArrowLeftIcon /> ย้อนกลับไป Portfolio
          </button>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--blue-dark)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconSettings /> พื้นที่จัดการโครงการ (Project Workspace)
          </h1>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {editFormData.form_data?.requestId || editFormData.id} : <strong style={{ color: 'var(--text-color)' }}>{editFormData.name}</strong>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ padding: "10px 16px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "10px", fontWeight: "bold" }}>สถานะ: {editFormData.status}</div>
          
          {canUpdate && (
            <button className="btn btn-primary" onClick={handleSaveWorkspace} disabled={isSaving} style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.25)' }}>
              <SaveIcon /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล (Save)'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Tab Navigation */}
        <div style={{ display: "flex", background: "var(--card-bg)", padding: "8px", borderRadius: "12px", border: "1px solid var(--border-color)", overflowX: "auto" }}>
          {[
            { id: "phases", label: "แผนงาน (Project Board)", icon: <IconCalendar /> },
            { id: "progress", label: "สถานะภาพรวม (Overview)", icon: <IconChart /> },
            { id: "technical", label: "ข้อมูลเตรียมระบบ (Technical)", icon: <IconSettings /> },
            { id: "compliance", label: "กฎระเบียบ (PDPA/ROPA)", icon: <IconShield /> }
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, minWidth: "180px", padding: "12px", border: "none", borderRadius: "8px", background: activeTab === tab.id ? "var(--blue)" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--text-muted)", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          
          {/* =========================================
              TAB 1: แผนงาน (Phases / Gantt Chart)
             ========================================= */}
          {activeTab === "phases" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {renderGanttChart()}

              {/* 🌟 Section 1: กำหนดแผนงาน (Planning) 🌟 */}
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', marginBottom: '16px', fontSize: '1.1rem' }}>
                    <IconCalendar /> 1. กำหนดแผนงานโครงการ (Project Planning)
                </h4>
                {/* 🌟 ปรับขนาดตารางให้ขยายเต็มหน้าจอ และช่อง Input กว้างกำลังดี 🌟 */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "visible", overflowX: "auto", width: "100%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 250px 250px", gap: "20px", padding: "14px 20px", background: "var(--input-bg)", borderBottom: "1px solid var(--border-color)", fontWeight: "bold", fontSize: "0.85rem", color: "var(--text-muted)", minWidth: "700px" }}>
                    <div>ขั้นตอน (Phase)</div>
                    <div>วันที่เริ่มต้น (Plan Start)</div>
                    <div>วันที่สิ้นสุด (Plan End)</div>
                  </div>
                  {phases.map((phase, index) => {
                    const phaseData = editFormData.timeline?.[phase.key] || {};
                    return (
                      <div key={phase.key} style={{ display: "grid", gridTemplateColumns: "1fr 250px 250px", gap: "20px", alignItems: "center", padding: "16px 20px", background: "var(--card-bg)", borderBottom: index < phases.length - 1 ? "1px solid var(--border-color)" : "none", minWidth: "700px" }}>
                        <div style={{ fontWeight: "bold", color: "var(--text-color)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: phase.color, display: "inline-block" }}></span> {phase.label}
                        </div>
                        <div style={{ width: "100%", display: "block" }}>
                          <DatePicker dateFormat="dd/MM/yyyy" selected={toDate(phaseData.startDate)} onChange={(d) => handleTimelineChange(phase.key, "startDate", toIso(d))} customInput={<CustomDateInput placeholder="กำหนดวันเริ่ม" disabled={!canUpdate || (phaseData.status && phaseData.status !== "Pending")} />} />
                        </div>
                        <div style={{ width: "100%", display: "block" }}>
                          <DatePicker dateFormat="dd/MM/yyyy" selected={toDate(phaseData.endDate)} onChange={(d) => handleTimelineChange(phase.key, "endDate", toIso(d))} minDate={toDate(phaseData.startDate)} customInput={<CustomDateInput placeholder="กำหนดวันเสร็จ" disabled={!canUpdate || (phaseData.status && phaseData.status !== "Pending")} />} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isAllPlansSet && (
                <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#d97706", fontSize: "0.9rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertCircleIcon /> กรุณากำหนดวันที่แผนงาน (Plan Start - End) ให้ครบทุกขั้นตอนด้านบน เพื่อปลดล็อกการเริ่มปฏิบัติงานด้านล่าง
                </div>
              )}

              {/* 🌟 Section 2: ดำเนินการและบันทึกเวลาจริง (Execution) 🌟 */}
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', marginBottom: "16px", fontSize: '1.1rem' }}>
                    <IconPlay /> 2. บันทึกเวลาปฏิบัติงาน (Execution & Actual Log)
                </h4>
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden", overflowX: "auto", width: "100%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 2fr 110px 120px 140px", gap: "10px", padding: "14px 16px", background: "var(--input-bg)", borderBottom: "1px solid var(--border-color)", fontWeight: "bold", fontSize: "0.85rem", color: "var(--text-muted)", minWidth: "950px" }}>
                    <div>ขั้นตอน (Phase)</div> 
                    <div style={{ textAlign: "center" }}>สถานะ</div> 
                    <div>ระบบบันทึกเวลาจริง (Actual Log)</div> 
                    <div style={{ textAlign: "center" }}>ประเมินผล</div>
                    <div style={{ textAlign: "center" }}>Action</div>
                    <div style={{ textAlign: "center" }}>หลักฐาน (Evidence)</div>
                  </div>
                  
                  {phases.map((phase, index) => {
                    const phaseData = editFormData.timeline?.[phase.key] || {};
                    const prevPhase = index > 0 ? editFormData.timeline?.[phases[index-1].key] : null;
                    const isLocked = index > 0 && prevPhase?.status !== "Completed";

                    let statusBadge = { bg: "rgba(100, 116, 139, 0.1)", text: "#64748b", label: "รอดำเนินการ" };
                    if (phaseData.status === 'In Progress') statusBadge = { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", label: "กำลังทำงาน" };
                    if (phaseData.status === 'Completed') statusBadge = { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", label: "เสร็จสิ้น" };

                    return (
                      <div key={phase.key} style={{ display: "grid", gridTemplateColumns: "1fr 100px 2fr 110px 120px 140px", gap: "10px", alignItems: "center", padding: "16px", background: "var(--card-bg)", borderBottom: index < phases.length - 1 ? "1px solid var(--border-color)" : "none", opacity: isLocked && (!phaseData.status || phaseData.status === 'Pending') ? 0.6 : 1, transition: "opacity 0.2s", minWidth: "950px" }}>
                        
                        <div style={{ fontWeight: "bold", color: "var(--text-color)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: phase.color, display: "inline-block" }}></span> 
                          {phase.label}
                        </div>
                        
                        <div style={{ textAlign: "center" }}>
                          <span style={{ padding: "6px 10px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "bold", background: statusBadge.bg, color: statusBadge.text, whiteSpace: "nowrap" }}>{statusBadge.label}</span>
                        </div>
                        
                        {/* 🌟 ทำจริง (Actual Log แบบ Read-only ล้วนๆ ถอด DatePicker ออกตามคำขอ) 🌟 */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 1, padding: "8px 10px", background: "var(--bg-color)", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.75rem", color: phaseData.actualStart ? "var(--text-color)" : "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{phaseData.actualStart ? formatDateTH(phaseData.actualStart) : "รอกดเริ่มงาน"}</span>
                            <IconLock />
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", background: "var(--bg-color)", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.75rem", color: phaseData.actualEnd ? "var(--text-color)" : "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{phaseData.actualEnd ? formatDateTH(phaseData.actualEnd) : "รอกดเสร็จสิ้น"}</span>
                            <IconLock />
                          </div>
                        </div>

                        {/* ประเมินผล */}
                        <div style={{ textAlign: "center" }}>
                          {phaseData.status === 'Completed' && phaseData.endDate && phaseData.actualEnd ? (
                            (() => {
                              const p = new Date(phaseData.endDate).setHours(0,0,0,0); const a = new Date(phaseData.actualEnd).setHours(0,0,0,0);
                              const diffDays = Math.ceil((a - p) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0) return <div style={{ display: "inline-block", padding: "4px 8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold" }}>ล่าช้า {diffDays} วัน</div>;
                              else return <div style={{ display: "inline-block", padding: "4px 8px", background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold" }}>ตามกำหนด</div>;
                            })()
                          ) : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>-</span>}
                        </div>
                        
                        {/* 🌟 Action Buttons 🌟 */}
                        <div style={{ textAlign: "center" }}>
                          {!isLocked ? (
                            canUpdate ? (
                              <>
                                {(!phaseData.status || phaseData.status === 'Pending') && (
                                  <button type="button" disabled={!isAllPlansSet} onClick={() => handlePhaseAction(phase.key, 'start')} style={{ width: "100%", padding: "8px", borderRadius: "6px", fontSize: "0.8rem", background: isAllPlansSet ? "var(--blue)" : "#cbd5e1", color: "#fff", border: "none", fontWeight: "bold", cursor: isAllPlansSet ? "pointer" : "not-allowed", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><IconPlay /> เริ่มงาน</button>
                                )}
                                {phaseData.status === 'In Progress' && (
                                  <button type="button" onClick={() => handlePhaseAction(phase.key, 'complete')} style={{ width: "100%", padding: "8px", borderRadius: "6px", fontSize: "0.8rem", background: "#10b981", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><IconCheck /> เสร็จสิ้น</button>
                                )}
                                {phaseData.status === 'Completed' && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "bold" }}>-</span>}
                              </>
                            ) : (
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>อ่านได้อย่างเดียว</span>
                            )
                          ) : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>รอถึงคิว</span>}
                        </div>

                        {/* 🌟 อัปโหลดหลักฐาน 🌟 */}
                        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                          {!isLocked ? (
                            canUpdate ? (
                              <>
                                <input type="file" id={`file-${phase.key}`} style={{ display: "none" }} accept="image/*,application/pdf" onChange={(e) => { const file = e.target.files[0]; if (file) { setProgressFile(file); handleTimelineChange(phase.key, "evidenceName", file.name); } }} />
                                <label htmlFor={`file-${phase.key}`} style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", background: phaseData.evidenceName ? "rgba(16, 185, 129, 0.1)" : "var(--bg-color)", border: phaseData.evidenceName ? "1px solid #10b981" : "1px dashed var(--border-color)", color: phaseData.evidenceName ? "#10b981" : "var(--blue)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "center", fontWeight: "bold", transition: "all 0.2s" }}>
                                  <IconUpload /> {phaseData.evidenceName ? "เปลี่ยนไฟล์" : "อัปโหลด"}
                                </label>
                                {phaseData.evidenceName && (
                                  <span style={{ fontSize: "0.65rem", color: "var(--text-color)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={phaseData.evidenceName}>{phaseData.evidenceName}</span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>-</span>
                            )
                          ) : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>-</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================
              TAB 2: สถานะภาพรวม (Progress & Overview)
             ========================================= */}
          {activeTab === "progress" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", gap: "20px", background: "var(--bg-color)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "250px" }}>
                   <label style={{ color: "var(--text-muted)", fontWeight: "bold", display: "block", marginBottom: "8px" }}>สถานะหลักโครงการ (Global Status)</label>
                   <select name="status" value={editFormData.status} onChange={handleGlobalStatusChange} disabled={!canUpdate} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", outline: "none", cursor: !canUpdate ? "not-allowed" : "pointer" }}>
                     <option value="Initiate">Initiate</option><option value="Active">Active</option><option value="Hold">Hold (ระงับชั่วคราว)</option><option value="Go-live">Go-live</option>
                   </select>
                </div>
                <div style={{ flex: 1, minWidth: "250px", borderLeft: "1px solid var(--border-color)", paddingLeft: "20px" }}>
                   <label style={{ color: "var(--text-muted)", fontWeight: "bold", display: "block", marginBottom: "8px" }}>ความคืบหน้าภาพรวม</label>
                   <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{ flex: 1, height: "12px", background: "var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "100%", background: getProgressColor(editFormData.form_data?.tracking?.completionPercent || 0), transform: `scaleX(${(editFormData.form_data?.tracking?.completionPercent || 0) / 100})`, transformOrigin: "left", transition: "transform 0.4s ease" }} />
                      </div>
                      <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: getProgressColor(editFormData.form_data?.tracking?.completionPercent || 0) }}>{editFormData.form_data?.tracking?.completionPercent || 0}%</span>
                   </div>
                </div>
              </div>
              
              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)" }}>ข้อมูลระบบและผู้รับผิดชอบ</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ผู้รับผิดชอบ (GLS PM)</label><input value={editFormData.form_data?.tracking?.glsManager || ""} onChange={(e) => handleTrackingChange("glsManager", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>เจ้าของระบบ (GLS Owner)</label><input value={editFormData.form_data?.tracking?.glsOwner || ""} onChange={(e) => handleTrackingChange("glsOwner", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ชื่อแอปพลิเคชัน</label><input value={editFormData.form_data?.tracking?.appName || ""} onChange={(e) => handleTrackingChange("appName", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>รหัสระบบ (App ID)</label><input value={editFormData.form_data?.tracking?.appId || ""} onChange={(e) => handleTrackingChange("appId", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ไซต์ (Deploy Site)</label><input value={editFormData.form_data?.tracking?.deployIn || ""} onChange={(e) => handleTrackingChange("deployIn", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                </div>
              </div>

              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)" }}>ข้อมูลเพิ่มเติมและงบประมาณ</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>กลุ่มลูกค้า (Customer Group)</label><input value={editFormData.form_data?.tracking?.customerGroup || ""} onChange={(e) => handleTrackingChange("customerGroup", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ประเภทโปรเจกต์</label><input value={editFormData.form_data?.tracking?.projectType || ""} onChange={(e) => handleTrackingChange("projectType", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ประเภทงบประมาณ</label><input value={editFormData.form_data?.tracking?.budgetType || ""} onChange={(e) => handleTrackingChange("budgetType", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>งบอนุมัติ (บาท)</label><input type="number" value={editFormData.form_data?.tracking?.approvedBudget || ""} onChange={(e) => handleTrackingChange("approvedBudget", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ค่าใช้จ่ายจริง (บาท)</label><input type="number" value={editFormData.form_data?.tracking?.actualCost || ""} onChange={(e) => handleTrackingChange("actualCost", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", width: "100%" }} /></div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>หมายเหตุ (Remark)</label><textarea value={editFormData.form_data?.tracking?.remark || ""} onChange={(e) => handleTrackingChange("remark", e.target.value)} disabled={!canUpdate} rows="2" style={{ background: "var(--card-bg)", color: "var(--text-color)", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", outline: "none" }} /></div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB 3: ข้อมูลเตรียมระบบ (Technical)
             ========================================= */}
          {activeTab === "technical" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)" }}>1. ข้อมูลพื้นฐานแอปพลิเคชัน (App Info)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ชื่อย่อระบบ</label><input type="text" value={editFormData.form_data?.app_info?.abbreviation || ""} onChange={(e) => handleNestedChange("app_info", "abbreviation", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>โมดูล</label><input type="text" value={editFormData.form_data?.app_info?.module || ""} onChange={(e) => handleNestedChange("app_info", "module", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ระดับองค์กร</label><input type="text" value={editFormData.form_data?.app_info?.enterprise || ""} onChange={(e) => handleNestedChange("app_info", "enterprise", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>หมวดหมู่ (Catalog)</label><input type="text" value={editFormData.form_data?.app_info?.catalog || ""} onChange={(e) => handleNestedChange("app_info", "catalog", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ประเภท</label><select value={editFormData.form_data?.app_info?.type || ""} onChange={(e) => handleNestedChange("app_info", "type", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%", outline: "none" }}><option value="">เลือกประเภท</option><option value="Inhouse">Inhouse</option><option value="Package">Package</option></select></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>เวลาใช้งาน</label><input type="text" value={editFormData.form_data?.app_info?.usageHour || ""} onChange={(e) => handleNestedChange("app_info", "usageHour", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  
                  <div onClick={() => canUpdate && handleNestedChange("app_info", "hasSourceCode", editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "No" : "Yes")} style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "rgba(16, 185, 129, 0.05)" : "var(--card-bg)", borderRadius: "12px", border: editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "1px solid #10b981" : "1px solid var(--border-color)", cursor: canUpdate ? "pointer" : "not-allowed", transition: "all 0.2s ease" }}>
                    <div>
                      <div style={{ color: editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "#10b981" : "var(--text-color)", fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}><IconMonitor /> มี Source Code (Source Code Availability)</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>คลิกเพื่อระบุว่าระบบนี้มีซอร์สโค้ดจัดเก็บไว้ที่โรงพยาบาลหรือไม่</div>
                    </div>
                    <div style={{ width: "48px", height: "26px", background: editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "#10b981" : "#cbd5e1", borderRadius: "13px", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
                      <div style={{ width: "22px", height: "22px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: editFormData.form_data?.app_info?.hasSourceCode === "Yes" ? "24px" : "2px", transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#8b5cf6", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>2</span>
                  โครงสร้าง Server และเทคโนโลยี (Tech Stack)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>ภาษาที่ใช้ (Language)</label><input value={editFormData.form_data?.tech?.language || ""} onChange={(e) => handleTechChange("language", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Tools</label><input value={editFormData.form_data?.tech?.tools || ""} onChange={(e) => handleTechChange("tools", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>แพลตฟอร์ม (Platform)</label><select value={editFormData.form_data?.tech?.platform || ""} onChange={(e) => handleTechChange("platform", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%", outline: "none" }}><option value="Web Base">Web Base</option><option value="Mobile App">Mobile App</option><option value="Desktop App">Desktop App</option></select></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Type of Backup</label><input value={editFormData.form_data?.tech?.backupType || ""} onChange={(e) => handleTechChange("backupType", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  
                  <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", background: "rgba(139, 92, 246, 0.05)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Web Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.form_data?.tech?.webServerIp || ""} onChange={(e) => handleTechChange("webServerIp", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /><input placeholder="Name" value={editFormData.form_data?.tech?.webServerName || ""} onChange={(e) => handleTechChange("webServerName", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div></div>
                    <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>App Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.form_data?.tech?.appServerIp || ""} onChange={(e) => handleTechChange("appServerIp", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /><input placeholder="Name" value={editFormData.form_data?.tech?.appServerName || ""} onChange={(e) => handleTechChange("appServerName", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div></div>
                    <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>DB Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.form_data?.tech?.dbServerIp || ""} onChange={(e) => handleTechChange("dbServerIp", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /><input placeholder="Name" value={editFormData.form_data?.tech?.dbServerName || ""} onChange={(e) => handleTechChange("dbServerName", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div></div>
                    <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>HIS Server (Connection)</label><input value={editFormData.form_data?.tech?.hisServer || ""} onChange={(e) => handleTechChange("hisServer", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#0ea5e9", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>3</span>
                  การเชื่อมต่อข้อมูล (Application Interface)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Interface Inbound Data</label><input type="text" value={editFormData.form_data?.interface?.inbound || ""} onChange={(e) => handleNestedChange("interface", "inbound", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Interface Outbound Data</label><input type="text" value={editFormData.form_data?.interface?.outbound || ""} onChange={(e) => handleNestedChange("interface", "outbound", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Processing System</label>
                    <select value={editFormData.form_data?.interface?.processing || ""} onChange={(e) => handleNestedChange("interface", "processing", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%", outline: "none" }}>
                      <option value="">เลือกประเภท</option><option value="Online">Online</option><option value="Batch">Batch</option><option value="Batch&Online">Batch & Online</option>
                    </select>
                  </div>
                  <div className="form-group"><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Public Interface</label><input type="text" value={editFormData.form_data?.interface?.public || ""} onChange={(e) => handleNestedChange("interface", "public", e.target.value)} disabled={!canUpdate} style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                </div>
              </div>

              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#10b981", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>4</span>
                  ระดับการสนับสนุนและสัญญา (Support & SLA)
                </h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Tier 1 (L1 Support) / Helpdesk</label><input type="text" value={editFormData.form_data?.support?.l1Contact || ""} onChange={(e) => handleNestedChange("support", "l1Contact", e.target.value)} disabled={!canUpdate} placeholder="e.g. Centralized IT Helpdesk" style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Tier 2 (L2 Support) / Site IT</label><input type="text" value={editFormData.form_data?.support?.l2Contact || ""} onChange={(e) => handleNestedChange("support", "l2Contact", e.target.value)} disabled={!canUpdate} placeholder="e.g. BPK IT Support on site" style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "bold" }}>Tier 3 (L3 Support) / App Owner</label><input type="text" value={editFormData.form_data?.support?.l3Contact || ""} onChange={(e) => handleNestedChange("support", "l3Contact", e.target.value)} disabled={!canUpdate} placeholder="e.g. GLS-G6-Developer-Group" style={{ background: "var(--card-bg)", color: "var(--text-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }} /></div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB 4: กฎระเบียบ (Compliance / PDPA / ROPA)
             ========================================= */}
          {activeTab === "compliance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>1</span>
                  ระบบที่ได้รับผลกระทบ (Impact Teams)
                </h4>
                
                <div 
                  onClick={() => {
                    if(!canUpdate) return;
                    const isCurrentlyYes = editFormData.form_data?.app_info?.impactBusiness === "Yes";
                    setEditFormData((prev) => ({
                      ...prev,
                      form_data: {
                        ...prev.form_data,
                        app_info: { ...(prev.form_data.app_info || {}), impactBusiness: isCurrentlyYes ? "No" : "Yes" },
                        tracking: { ...(prev.form_data.tracking || {}), impactTeams: isCurrentlyYes ? [] : prev.form_data.tracking.impactTeams } 
                      }
                    }));
                  }}
                  style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", marginBottom: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "15px" : "0",
                    background: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "rgba(239, 68, 68, 0.05)" : "var(--card-bg)", 
                    borderRadius: "12px", border: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "1px solid #fca5a5" : "1px solid var(--border-color)", 
                    cursor: canUpdate ? "pointer" : "not-allowed", transition: "all 0.2s ease"
                  }}
                >
                  <div>
                    <div style={{ color: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "#ef4444" : "var(--text-color)", fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircleIcon /> มีผลกระทบกับระบบอื่นหรือธุรกิจ (Impact to Business)
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      คลิกเพื่อเปิด/ปิด หากการขึ้นระบบนี้ส่งผลกระทบให้ต้องแก้ไขหรือระวังระบบอื่นๆ ด้วย
                    </div>
                  </div>
                  <div style={{ width: "48px", height: "26px", background: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "#ef4444" : "#cbd5e1", borderRadius: "13px", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
                    <div style={{ width: "22px", height: "22px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: editFormData.form_data?.app_info?.impactBusiness === "Yes" ? "24px" : "2px", transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                  </div>
                </div>

                {editFormData.form_data?.app_info?.impactBusiness === "Yes" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", padding: "15px", background: "var(--card-bg)", borderRadius: "8px", border: "1px dashed #fca5a5" }}>
                      {/* 🌟 รายการทีมแบบคงที่ 🌟 */}
                      {impactTeamsList.map((team) => {
                        const isChecked = editFormData.form_data?.tracking?.impactTeams?.includes(team) || false;
                        return (
                          <label key={team} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: canUpdate ? "pointer" : "default", background: isChecked ? "var(--bg-color)" : "var(--input-bg)", padding: "10px", borderRadius: "6px", border: isChecked ? "2px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s", boxShadow: isChecked ? "0 2px 4px rgba(239, 68, 68, 0.1)" : "none" }}>
                            <input type="checkbox" disabled={!canUpdate} checked={isChecked} onChange={() => handleImpactTeamToggle(team)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                            <span style={{ fontSize: "0.85rem", color: isChecked ? "#ef4444" : "var(--text-color)", fontWeight: isChecked ? "600" : "normal" }}>{team}</span>
                          </label>
                        )
                      })}
                      {/* 🌟 รายการทีมที่ถูกเพิ่มเข้ามาใหม่ (ลบได้) 🌟 */}
                      {(editFormData.form_data?.tracking?.customImpactTeamsList || []).map((item) => {
                        const isChecked = editFormData.form_data?.tracking?.impactTeams?.includes(item.label) || false;
                        return (
                          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isChecked ? "var(--bg-color)" : "var(--input-bg)", padding: "10px", borderRadius: "6px", border: isChecked ? "2px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s", boxShadow: isChecked ? "0 2px 4px rgba(239, 68, 68, 0.1)" : "none" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: canUpdate ? "pointer" : "default", flex: 1 }}>
                              <input type="checkbox" disabled={!canUpdate} checked={isChecked} onChange={() => handleImpactTeamToggle(item.label)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                              <span style={{ fontSize: "0.85rem", color: isChecked ? "#ef4444" : "var(--text-color)", fontWeight: isChecked ? "600" : "normal" }}>{item.label}</span>
                            </label>
                            {canUpdate && <button type="button" onClick={() => handleDeleteCustomImpactTeam(item.key, item.label)} style={{ background: "transparent", border: "none", color: "#ef4444", fontWeight: "bold", cursor: "pointer", padding: "0 5px", fontSize: "1rem" }} title="ลบทีมนี้"><IconX /></button>}
                          </div>
                        )
                      })}
                    </div>
                    {/* 🌟 ช่องสำหรับพิมพ์เพิ่มทีม Impact ใหม่ 🌟 */}
                    {canUpdate && (
                      <div style={{ marginTop: "15px", display: "flex", gap: "10px", alignItems: "center", background: "var(--input-bg)", padding: "10px", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                        <input 
                          type="text" 
                          value={newImpactTeamText} 
                          onChange={e => setNewImpactTeamText(e.target.value)} 
                          placeholder="ระบุระบบหรือทีมที่ได้รับผลกระทบอื่นๆ..." 
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.85rem" }}
                        />
                        <button type="button" onClick={handleAddCustomImpactTeam} style={{ padding: "8px 16px", background: "var(--card-bg)", color: "var(--blue)", border: "1px solid var(--blue)", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>+ เพิ่มทีม</button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>2</span>
                  ข้อมูลส่วนบุคคล (PDPA)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                  {/* รายการ PDPA มาตรฐาน */}
                  {fullPdpaItems.map((item) => {
                    const isChecked = editFormData.form_data?.compliance?.pdpa?.[item.key] || false;
                    return (
                      <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: canUpdate ? "pointer" : "default", background: isChecked ? "var(--card-bg)" : "var(--input-bg)", padding: "10px", borderRadius: "6px", border: isChecked ? "1px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s" }}>
                        <input type="checkbox" disabled={!canUpdate} checked={isChecked} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                        <span style={{ fontSize: "0.85rem", color: isChecked ? "#ef4444" : "var(--text-color)", fontWeight: isChecked ? "600" : "normal" }}>{item.label}</span>
                      </label>
                    )
                  })}
                  {/* 🌟 รายการ PDPA ที่เพิ่มเข้ามาเอง (Custom) พร้อมปุ่มลบ 🌟 */}
                  {(editFormData.form_data?.compliance?.customPdpaList || []).map((item) => {
                    const isChecked = editFormData.form_data?.compliance?.pdpa?.[item.key] || false;
                    return (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isChecked ? "var(--card-bg)" : "var(--input-bg)", padding: "10px", borderRadius: "6px", border: isChecked ? "1px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: canUpdate ? "pointer" : "default", flex: 1 }}>
                          <input type="checkbox" disabled={!canUpdate} checked={isChecked} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                          <span style={{ fontSize: "0.85rem", color: isChecked ? "#ef4444" : "var(--text-color)", fontWeight: isChecked ? "600" : "normal" }}>{item.label}</span>
                        </label>
                        {canUpdate && <button type="button" onClick={() => handleDeleteCustomPdpa(item.key)} style={{ background: "transparent", border: "none", color: "#ef4444", fontWeight: "bold", cursor: "pointer", padding: "0 5px", fontSize: "1rem" }} title="ลบรายการนี้"><IconX /></button>}
                      </div>
                    )
                  })}
                </div>
                
                {canUpdate && (
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px", alignItems: "center", background: "var(--input-bg)", padding: "10px", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                    <input 
                      type="text" value={newPdpaText} onChange={e => setNewPdpaText(e.target.value)} 
                      placeholder="ระบุข้อมูลส่วนบุคคลอื่นๆ (ถ้ามี)..." 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.85rem" }}
                    />
                    <button type="button" onClick={handleAddCustomPdpa} style={{ padding: "8px 16px", background: "var(--card-bg)", color: "var(--blue)", border: "1px solid var(--blue)", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>+ เพิ่มรายการ</button>
                  </div>
                )}
              </div>

              <div style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>3</span>
                  บันทึกกิจกรรมการประมวลผลข้อมูล (ROPA)
                </h4>
                <div style={{ display: "grid", gap: "15px" }}>
                  {[
                    { letter: "C", key: "collect", title: "Collect (แหล่งที่เก็บรวบรวม)", placeholder: "ระบุแหล่งที่มา..." },
                    { letter: "S", key: "store", title: "Store (สถานที่/ระยะเวลาจัดเก็บ)", placeholder: "ระบุสถานที่เก็บ/ระยะเวลา..." },
                    { letter: "U", key: "use", title: "Use (วัตถุประสงค์ในการใช้)", placeholder: "ระบุวัตถุประสงค์..." },
                    { letter: "D", key: "disclose", title: "Disclose (การเปิดเผยให้บุคคลที่ 3)", placeholder: "ระบุบุคคลภายนอกที่ส่งต่อให้..." },
                  ].map((ropa) => (
                    <div key={ropa.key} style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                      <div style={{ width: "35px", height: "35px", background: "var(--blue)", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>{ropa.letter}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>{ropa.title}</div>
                        <input type="text" value={editFormData.form_data?.compliance?.ropa?.[ropa.key] || ""} onChange={(e) => handleRopaChange(ropa.key, e.target.value)} disabled={!canUpdate} placeholder={ropa.placeholder} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ProjectWorkspace;