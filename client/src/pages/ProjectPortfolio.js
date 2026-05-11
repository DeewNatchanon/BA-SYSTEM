import React, { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SortUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const SortDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);
const SortDefaultIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
  </svg>
);

const impactTeamsList = [
  "iMed", "HMS", "Other Unit", "EPMS", "SAP SuccessFactor", "SAP P2P", "SAP R2C", 
  "SAP Non Hos-MFG", "SAP Non Hos-Nhealth", "Doctor Fee", "E-Form", "Infra", "SOG",
];
const fullPdpaItems = [
  { key: "health", label: "ข้อมูลสุขภาพ" }, { key: "idCard", label: "บัตรประชาชน" },
  { key: "passport", label: "Passport" }, { key: "hn", label: "HN" },
  { key: "name", label: "ชื่อ-นามสกุล" }, { key: "address", label: "ที่อยู่" },
  { key: "dob", label: "วัน/เดือน/ปีเกิด" }, { key: "phone", label: "เบอร์โทร" },
  { key: "email", label: "Email" }, { key: "financial", label: "ข้อมูลการเงิน" },
  { key: "criminal", label: "ประวัติอาชญากรรม" }, { key: "photo", label: "รูปถ่ายใบหน้า" },
];

function ProjectPortfolio({ currentUser }) {
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editActiveTab, setEditActiveTab] = useState("progress");
  const [activeTab, setActiveTab] = useState("overview"); 
  
  const [editFormData, setEditFormData] = useState(null);
  const [progressFile, setProgressFile] = useState(null);

  const isManager = currentUser?.role === "manager";
  const isCEO = currentUser?.role === "ceo";

  useEffect(() => {
    loadData();
  }, [currentUser]);

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
            if (typeof parsedForm === "string") {
              try { parsedForm = JSON.parse(parsedForm); } catch (e) { parsedForm = {}; }
            }
            return { ...p, form_data: parsedForm || {} };
          });
        setProjects(safeData);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลโครงการได้", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ข้อมูลโครงการนี้จะถูกลบออกจากระบบและไม่สามารถกู้คืนได้!",
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
        if (!res.ok) throw new Error("ไม่สามารถลบโครงการได้");
        setProjects((prev) => prev.filter((p) => p.id !== id));
        Swal.fire("ลบสำเร็จ", "โครงการถูกลบออกจากระบบแล้ว", "success");
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      }
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setActiveTab("overview");
    setIsViewModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    const existingTracking = project.form_data?.tracking || {};
    const currentStatus = project.status || "Initiate";
    const currentPhase = project.phase || "Requirement";
    let autoPercent = existingTracking.completionPercent || 0;
    if (currentStatus === "Go-live" || currentPhase === "Go-live") autoPercent = 100;
    else if (currentPhase === "Requirement") autoPercent = 25;
    else if (currentPhase === "Preparation") autoPercent = 50;
    else if (currentPhase === "Development/Implement") autoPercent = 75;
    else if (currentPhase === "UAT") autoPercent = 90;

    const smartTracking = {
      completionPercent: autoPercent,
      actualStart: existingTracking.actualStart || project.form_data?.compliance?.baStartDate || "",
      actualGoLive: existingTracking.actualGoLive || project.form_data?.compliance?.baEndDate || "",
      appName: existingTracking.appName || project.form_data?.appName || project.name || "",
      appId: existingTracking.appId || project.form_data?.appId || "",
      deployIn: existingTracking.deployIn || project.form_data?.site || project.site || "",
      glsOwner: existingTracking.glsOwner || project.form_data?.glsOwner || "",
      glsManager: existingTracking.glsManager || project.form_data?.assigned_to || "",
      impactTeams: existingTracking.impactTeams || [],
      customerGroup: existingTracking.customerGroup || project.form_data?.customerGroup || "",
      projectType: existingTracking.projectType || project.form_data?.projectType || "",
      budgetType: existingTracking.budgetType || project.form_data?.budgetType || "",
      approvedBudget: existingTracking.approvedBudget || project.form_data?.approvedBudget || "",
      actualCost: existingTracking.actualCost || project.form_data?.actualCost || "",
      remark: existingTracking.remark || project.form_data?.remark || "",
      isPendingApproval: existingTracking.isPendingApproval || false,
      pendingStatus: existingTracking.pendingStatus || null,
      pendingPhase: existingTracking.pendingPhase || null,
      progressFile: existingTracking.progressFile || null,
    };

    setEditFormData({
      ...project,
      status: currentStatus,
      phase: currentPhase,
      tracking: smartTracking,
      app_info: project.form_data?.app_info || {}, 
      interface: project.form_data?.interface || {}, 
      security_cia: project.form_data?.security_cia || {}, 
      support: project.form_data?.support || {}, 
      tech: {
        language: "", platform: "Web Base", server: "", webServer: "",
        ...(project.form_data?.tech || {}),
      },
      compliance: {
        pdpa: {}, ropa: {},
        ...(project.form_data?.compliance || {}),
      },
    });
    setProgressFile(null);
    setEditActiveTab("progress");
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedProject(null);
    setEditFormData(null);
    setProgressFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "phase" || name === "status") {
        const currentPhase = name === "phase" ? value : prev.phase;
        const currentStatus = name === "status" ? value : prev.status;
        let autoPercent = prev.tracking?.completionPercent || 0;
        if (currentStatus === "Go-live" || currentPhase === "Go-live") autoPercent = 100;
        else if (currentPhase === "Requirement") autoPercent = 25;
        else if (currentPhase === "Preparation") autoPercent = 50;
        else if (currentPhase === "Development/Implement") autoPercent = 75;
        else if (currentPhase === "UAT") autoPercent = 90;
        return { ...newData, tracking: { ...(newData.tracking || {}), completionPercent: autoPercent } };
      }
      return newData;
    });
  };

  const handleTrackingChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, tracking: { ...prev.tracking, [field]: value } }));
  };

  const handleNestedChange = (section, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };
  const handleTechChange = (field, value) => handleNestedChange("tech", field, value);

  const handlePdpaChange = (key, checked) => {
    setEditFormData((prev) => ({
      ...prev,
      compliance: { ...prev.compliance, pdpa: { ...(prev.compliance?.pdpa || {}), [key]: checked } },
    }));
  };
  const handleRopaChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      compliance: { ...prev.compliance, ropa: { ...(prev.compliance?.ropa || {}), [field]: value } },
    }));
  };
  const handleImpactTeamToggle = (team) => {
    setEditFormData((prev) => {
      const currentTeams = prev.tracking?.impactTeams || [];
      const updatedTeams = currentTeams.includes(team) ? currentTeams.filter((t) => t !== team) : [...currentTeams, team];
      return { ...prev, tracking: { ...prev.tracking, impactTeams: updatedTeams } };
    });
  };

  const handleManagerDecision = async (decision) => {
    const isApprove = decision === "approve";
    Swal.fire({
      title: isApprove ? "ยืนยันอนุมัติ?" : "ปฏิเสธคำขอ?",
      text: isApprove ? "ข้อมูลจะถูกอัปเดตเข้าระบบทันที" : "สถานะจะกลับไปเป็นค่าเดิม",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#10b981" : "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const sessionRaw = localStorage.getItem("ba-system.auth-session");
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
          const newStatus = isApprove ? editFormData.tracking.pendingStatus : selectedProject.status;
          const newPhase = isApprove ? editFormData.tracking.pendingPhase : selectedProject.phase;
          let autoPercent = editFormData.tracking.completionPercent || 0;
          if (isApprove) {
            if (newStatus === "Go-live" || newPhase === "Go-live") autoPercent = 100;
            else if (newPhase === "Requirement") autoPercent = 25;
            else if (newPhase === "Preparation") autoPercent = 50;
            else if (newPhase === "Development/Implement") autoPercent = 75;
            else if (newPhase === "UAT") autoPercent = 90;
          } else {
            if (selectedProject.status === "Go-live" || selectedProject.phase === "Go-live") autoPercent = 100;
            else if (selectedProject.phase === "Requirement") autoPercent = 25;
            else if (selectedProject.phase === "Preparation") autoPercent = 50;
            else if (selectedProject.phase === "Development/Implement" || selectedProject.phase === "Development") autoPercent = 75;
            else if (selectedProject.phase === "UAT") autoPercent = 90;
            else autoPercent = selectedProject.form_data?.tracking?.completionPercent || 0;
          }
          const finalData = {
            ...editFormData,
            status: newStatus,
            phase: newPhase,
            form_data: {
              ...editFormData.form_data,
              app_info: editFormData.app_info,
              interface: editFormData.interface,
              security_cia: editFormData.security_cia,
              support: editFormData.support,
              tech: editFormData.tech,
              compliance: editFormData.compliance,
              tracking: {
                ...editFormData.tracking,
                completionPercent: autoPercent,
                isPendingApproval: false,
                pendingStatus: null,
                pendingPhase: null,
              },
            },
          };
          const updated = await updateProjectInDb(editFormData.id, finalData, null, token);
          const parsedUpdated = {
            ...updated.data,
            updated_at: new Date().toISOString(),
            form_data: typeof updated.data.form_data === "string" ? JSON.parse(updated.data.form_data) : updated.data.form_data,
          };
          setProjects((prev) => prev.map((p) => (p.id === parsedUpdated.id ? parsedUpdated : p)));
          Swal.fire("สำเร็จ", isApprove ? "✅ อนุมัติการเปลี่ยนสถานะเรียบร้อยแล้ว!" : "❌ ปฏิเสธคำขอและคงสถานะเดิมเรียบร้อย!", "success");
          setIsEditModalOpen(false);
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
        }
      }
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    const isStatusChanged = selectedProject.status !== editFormData.status || selectedProject.phase !== editFormData.phase;
    let fileToUpload = progressFile;
    let payloadStatus = editFormData.status;
    let payloadPhase = editFormData.phase;
    let payloadTracking = { ...editFormData.tracking };

    if (isStatusChanged) {
      if (!isManager) {
        const { value: uploadedFile, isConfirmed } = await Swal.fire({
          title: "แนบไฟล์หลักฐาน (ไม่บังคับ)",
          text: `คุณกำลังส่งคำขอเปลี่ยนสถานะเป็น "${editFormData.status}"`,
          input: "file",
          inputAttributes: { accept: "image/*,application/pdf" },
          showCancelButton: true,
          confirmButtonColor: "#0072bb",
          cancelButtonColor: "#64748b",
          confirmButtonText: "📤 ส่งคำขอ",
          cancelButtonText: "ยกเลิก",
        });
        if (!isConfirmed) return;
        if (uploadedFile) fileToUpload = uploadedFile;
        payloadStatus = selectedProject.status;
        payloadPhase = selectedProject.phase;
        payloadTracking.isPendingApproval = true;
        payloadTracking.pendingStatus = editFormData.status;
        payloadTracking.pendingPhase = editFormData.phase;
        payloadTracking.completionPercent = selectedProject.form_data?.tracking?.completionPercent || 0;
      } else {
        const result = await Swal.fire({
          title: "ยืนยันเปลี่ยนสถานะ",
          text: `คุณเป็น Manager: ยืนยันการเปลี่ยนสถานะเป็น "${editFormData.status}" ใช่หรือไม่?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0072bb",
          cancelButtonColor: "#64748b",
          confirmButtonText: "✅ ยืนยัน",
          cancelButtonText: "ยกเลิก",
        });
        if (!result.isConfirmed) return;
        payloadTracking.isPendingApproval = false;
        payloadTracking.pendingStatus = null;
        payloadTracking.pendingPhase = null;
      }
    } else {
      const result = await Swal.fire({
        title: "ยืนยันการอัปเดตข้อมูล",
        text: "คุณต้องการบันทึกข้อมูลความคืบหน้าใช่หรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0072bb",
        cancelButtonColor: "#64748b",
        confirmButtonText: "💾 ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;
    }

    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      
      const finalData = {
        ...editFormData,
        status: payloadStatus,
        phase: payloadPhase,
        form_data: {
          ...editFormData.form_data,
          tracking: payloadTracking,
          app_info: editFormData.app_info,
          interface: editFormData.interface,
          security_cia: editFormData.security_cia,
          support: editFormData.support,
          tech: editFormData.tech,
          compliance: editFormData.compliance,
        },
      };
      
      const updated = await updateProjectInDb(editFormData.id, finalData, fileToUpload, token);
      const parsedUpdated = {
        ...updated.data,
        updated_at: new Date().toISOString(),
        form_data: typeof updated.data.form_data === "string" ? JSON.parse(updated.data.form_data) : updated.data.form_data,
      };
      setProjects((prev) => prev.map((p) => (p.id === parsedUpdated.id ? parsedUpdated : p)));
      setIsEditModalOpen(false);
      setTimeout(() => {
        if (isStatusChanged && !isManager) Swal.fire("สำเร็จ", "ส่งคำขอเปลี่ยนสถานะไปให้ Manager ตรวจสอบเรียบร้อยแล้วครับ!", "success");
        else Swal.fire("สำเร็จ", "อัปเดตข้อมูลสำเร็จเรียบร้อย!", "success");
      }, 150);
    } catch (error) {
      setIsEditModalOpen(false);
      setTimeout(() => Swal.fire("ล้มเหลว", error.message, "error"), 150);
    }
  };

  const toDate = (s) => (s ? new Date(s) : null);
  const toIso = (d) => {
    if (!d) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateTH = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-";
  
  const getProgressColor = (percent) => {
    if (percent < 30) return "#dc3545";
    if (percent < 75) return "#f59e0b";
    return "#10b981";
  };

  const isStatusChangedUI = selectedProject && editFormData && (selectedProject.status !== editFormData.status || selectedProject.phase !== editFormData.phase);
  const isPendingUpdate = editFormData?.tracking?.isPendingApproval;

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
      searchableFields: ["id", "form_data.requestId", "name", "form_data.tracking.glsManager", "form_data.assigned_to", "assignee"],
    });

    const applySort = (data) => {
      if (!sortBy) return data;
      return [...data].sort((a, b) => {
        let aVal = ""; let bVal = "";
        switch (sortBy) {
          case "id": aVal = a.form_data?.requestId || a.id || ""; bVal = b.form_data?.requestId || b.id || ""; break;
          case "name": aVal = a.name || ""; bVal = b.name || ""; break;
          case "assignee": aVal = a.form_data?.tracking?.glsManager || a.form_data?.assigned_to || a.assignee || ""; bVal = b.form_data?.tracking?.glsManager || b.form_data?.assigned_to || b.assignee || ""; break;
          case "status": aVal = a.status || ""; bVal = b.status || ""; break;
          case "phase": aVal = a.phase || ""; bVal = b.phase || ""; break;
          case "progress": aVal = a.form_data?.tracking?.completionPercent || 0; bVal = b.form_data?.tracking?.completionPercent || 0; return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
          case "updated_at": aVal = new Date(a.updated_at || a.created_at || 0).getTime(); bVal = new Date(b.updated_at || b.created_at || 0).getTime(); return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
          default: break;
        }
        if (typeof aVal === "string" && typeof bVal === "string") {
          const cmp = aVal.localeCompare(bVal, ["th", "en"]); return sortOrder === "asc" ? cmp : -cmp;
        }
        return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
      });
    };
    return applySort(filtered);
  }, [projects, searchQuery, filterStatus, filterPhase, sortBy, sortOrder]);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "Active" || p.status === "Initiate").length,
    hold: projects.filter((p) => p.status === "Hold").length,
    goLive: projects.filter((p) => p.status === "Go-live" || p.phase === "Go-live").length,
  };

  const hasActiveFilter = filterStatus !== "All" || filterPhase !== "All";

  const SortableHeader = ({ label, columnKey, align = "left" }) => {
    const isActive = sortBy === columnKey;
    return (
      <th onClick={() => handleSort(columnKey)} style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: isActive ? "var(--blue)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", textAlign: align, background: isActive ? "rgba(2, 132, 199, 0.05)" : "transparent", cursor: "pointer", userSelect: "none", transition: "all 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: align === "center" ? "center" : "flex-start", gap: "6px" }}>
          {label}
          <span style={{ display: "flex", alignItems: "center", color: isActive ? "var(--blue)" : "#cbd5e1", opacity: isActive ? 1 : 0.6, transition: "all 0.2s ease" }}>
            {isActive ? (sortOrder === "asc" ? <SortUpIcon /> : <SortDownIcon />) : <SortDefaultIcon />}
          </span>
        </div>
      </th>
    );
  };

  if (isLoading) return <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="page-wrap page-project" style={{ gap: "16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Project Portfolio</h1>
      </div>

      {(isCEO || isManager) && (
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
      )}

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
              {!isCEO && (
                <th style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center", background: "transparent" }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedProjects.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s ease", cursor: "default" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--table-row-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <td style={{ padding: "16px 14px", fontWeight: 700, background: "transparent", fontSize: "0.85rem" }}>{p.form_data?.requestId || p.id}</td>
                <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                  <span onClick={() => handleViewProject(p)} style={{ color: "var(--blue)", cursor: "pointer", fontWeight: "700" }}>{p.name}</span>
                </td>
                <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                  <span style={{ color: "#d32f2f", fontWeight: "700" }}>{p.form_data?.tracking?.glsManager || p.form_data?.assigned_to || p.assignee || "-"}</span>
                </td>
                <td style={{ padding: "16px 14px", background: "transparent", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                    <span className={`status-badge ${p.status?.toLowerCase()}`}>{p.status}</span>
                    {p.form_data?.tracking?.isPendingApproval && ( <div style={{ fontSize: "0.75rem", color: "#b45309", background: "#fef3c7", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", border: "1px solid #fde68a", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>⏳ รอ Manager ยืนยัน</div> )}
                  </div>
                </td>
                <td style={{ padding: "16px 14px", color: "var(--text-muted)", background: "transparent", fontSize: "0.85rem" }}>{p.phase || "-"}</td>
                <td style={{ padding: "16px 14px", textAlign: "center", background: "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                    <div style={{ width: "80px", height: "10px", background: "var(--border-color)", borderRadius: "5px", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)" }}>
                      <div style={{ height: "100%", width: "100%", background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), transform: `scaleX(${(p.form_data?.tracking?.completionPercent || 0) / 100})`, transformOrigin: "left", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-color)", width: "35px", textAlign: "right" }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                  </div>
                </td>
                {!isCEO && (
                  <td style={{ padding: "16px 14px", textAlign: "center", background: "transparent" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                      <button className="btn btn-secondary" onClick={() => handleEditProject(p)} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}><EditIcon /> อัปเดต</button>
                      {isManager && ( <button onClick={() => handleDeleteProject(p.id)} title="ลบโครงการ" style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.9rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "bold" }}>🗑️</button> )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🌟🌟 VIEW MODAL 🌟🌟 */}
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
            
            {/* 🌟 แท็บในหน้า View 🌟 */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)", flexShrink: 0 }}>
              <div style={{ display: "flex", width: "100%", gap: "8px" }}>
                {[ { id: "overview", label: "📌 ภาพรวม" }, { id: "requirement", label: "📝 ความต้องการ" }, { id: "system", label: "💻 ระบบ & ทีม" }, { id: "timeline", label: "⏱️ กำหนดการ" }, ].map((t) => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id)} 
                    style={{ 
                      flex: 1, 
                      minWidth: 0,
                      padding: "8px 16px", 
                      border: "none", 
                      borderRadius: "8px",
                      background: activeTab === t.id ? "var(--blue)" : "var(--bg-color)", 
                      color: activeTab === t.id ? "#fff" : "var(--text-muted)", 
                      fontWeight: activeTab === t.id ? "700" : "600", 
                      fontSize: "0.86rem", 
                      cursor: "pointer",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                      overflow: "hidden", 
                      textOverflow: "ellipsis"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="project-modal-body" style={{ padding: "18px 18px 20px", overflowY: "auto", flex: 1, lineHeight: "1.6", background: "var(--bg-color)" }}>
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
              {activeTab === "timeline" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ color: "#d97706", margin: "0 0 10px 0", fontSize: "0.98rem" }}>📋 แผนงานอนุมัติ</h4>
                    <p style={{ margin: "0 0 8px 0" }}><strong>ผู้รับผิดชอบ (IT Assignee):</strong> <span style={{ color: "#d32f2f", fontWeight: "bold" }}>{selectedProject.form_data?.tracking?.glsManager || selectedProject.form_data?.assigned_to || selectedProject.assignee || "-"}</span></p>
                    <p style={{ margin: 0 }}><strong>วันที่คาดว่าจะเริ่ม:</strong> {formatDateTH(selectedProject.form_data?.compliance?.baStartDate)}</p>
                  </div>
                  <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ color: "var(--blue)", margin: "0 0 10px 0", fontSize: "0.98rem" }}>⚡ ความคืบหน้าจริง</h4>
                    <p style={{ margin: "0 0 10px 0" }}><strong>ความคืบหน้า:</strong> <span style={{ fontWeight: "bold", color: getProgressColor(selectedProject.form_data?.tracking?.completionPercent || 0), fontSize: "1.15rem" }}>{selectedProject.form_data?.tracking?.completionPercent || 0}%</span></p>
                    {selectedProject.form_data?.tracking?.progressFile && (
                      <div style={{ marginTop: "8px", padding: "10px 12px", background: "var(--input-bg)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                        📄 <a href={`http://localhost:4000/${selectedProject.form_data.tracking.progressFile.replace(/\\/g, "/")}`} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: 600 }}>ดูไฟล์แนบหลักฐาน</a>
                      </div>
                    )}
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

      {/* 🌟🌟 EDIT MODAL (แบบใหม่ แยกแท็บ) 🌟🌟 */}
      {isEditModalOpen && editFormData && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <form
            className="pdf-preview-card"
            onSubmit={handleSaveEdit}
            style={{ width: "95%", maxWidth: "1000px", padding: 0, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "16px", overflow: "hidden", background: "var(--card-bg)" }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", background: "var(--card-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", color: "var(--text-color)", fontSize: "1.3rem" }}>📝 อัปเดตข้อมูลโครงการ</h3>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{editFormData.form_data?.requestId || editFormData.id} - {editFormData.name}</span>
              </div>
              <button type="button" onClick={handleCloseModals} style={{ background: "transparent", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: "var(--text-color)" }}>✕</button>
            </div>

            {/* 🌟 แท็บเมนู Edit Modal 🌟 */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)", flexShrink: 0 }}>
              <div style={{
                  display: "flex",
                  width: "100%",
                  background: "var(--bg-color)", 
                  padding: "6px",
                  borderRadius: "12px",
                  gap: "4px"
              }}>
                {[
                  { id: "progress", label: "📊 สถานะและความคืบหน้า" },
                  { id: "technical", label: "⚙️ ข้อมูลเตรียมระบบ (Tech)" },
                  { id: "compliance", label: "🛡️ กฎระเบียบ (Compliance)" }
                ].map(tab => {
                  const isActive = editActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditActiveTab(tab.id)}
                      style={{
                        flex: 1, 
                        minWidth: 0, /* 🌟 จุดสำคัญ! บังคับให้ปุ่มหดตัวได้ ไม่ดันจนล้นกล่อง */
                        padding: "10px 4px",
                        border: "none",
                        borderRadius: "8px",
                        background: isActive ? "var(--card-bg)" : "transparent",
                        color: isActive ? "var(--blue)" : "var(--text-muted)",
                        fontSize: "0.85rem",
                        fontWeight: isActive ? "700" : "600",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        overflow: "hidden", 
                        textOverflow: "ellipsis"
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body (แสดงเนื้อหาตามแท็บที่เลือก) เนื้อหาตรงนี้เท่านั้นที่จะ Scroll ได้ */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px", background: "var(--bg-color)" }}>
              
              {editFormData.form_data?.approval_remark && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                  <h4 style={{ color: "#92400e", margin: "0 0 8px 0", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>💬 ข้อสั่งการ / หมายเหตุจาก Manager</h4>
                  <p style={{ color: "#78350f", margin: 0, fontSize: "0.95rem" }}>{editFormData.form_data.approval_remark}</p>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 1: สถานะและความคืบหน้า (Progress) */}
              {/* ---------------------------------------------------- */}
              {editActiveTab === "progress" && (
                <>
                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "var(--blue)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>1</span>
                      สถานะโครงการ (Project Status)
                    </h4>
                    {isPendingUpdate && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ color: "#d97706", margin: "0 0 8px 0" }}>⏳ รอยืนยันการเปลี่ยนสถานะ</h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#92400e" }}>พนักงานขอเปลี่ยนสถานะเป็น: <strong>{editFormData.tracking.pendingStatus}</strong> (Phase: {editFormData.tracking.pendingPhase})</p>
                        {editFormData.tracking.progressFile && ( <p style={{ margin: 0, fontSize: "0.85rem" }}>📄 <a href={`http://localhost:4000/${editFormData.tracking.progressFile.replace(/\\/g, "/")}`} target="_blank" rel="noreferrer" style={{ color: "#0072bb", fontWeight: "bold" }}>ตรวจสอบไฟล์หลักฐานแนบ</a></p> )}
                        {isManager ? (
                          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                            <button type="button" onClick={() => handleManagerDecision("approve")} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", background: "#16a34a", border: "none", borderRadius: "6px" }}>✅ อนุมัติให้เปลี่ยนสถานะ</button>
                            <button type="button" onClick={() => handleManagerDecision("reject")} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", color: "#ef4444", borderColor: "#fca5a5", background: "#fef2f2", borderRadius: "6px" }}>❌ ปฏิเสธคำขอ</button>
                          </div>
                        ) : ( <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#d97706", fontStyle: "italic" }}>(รอ Manager ตรวจสอบและอนุมัติ)</div> )}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div className="form-group" style={{ gridColumn: "1 / -1", background: "var(--bg-color)", padding: "15px", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                          <label style={{ margin: 0, fontWeight: "bold", color: "var(--text-color)" }}>ความคืบหน้าปัจจุบัน (Progress)</label>
                          <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: getProgressColor(editFormData.tracking.completionPercent) }}>{editFormData.tracking.completionPercent}%</span>
                        </div>
                        <div style={{ width: "100%", height: "12px", background: "var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "100%", background: getProgressColor(editFormData.tracking.completionPercent), transform: `scaleX(${editFormData.tracking.completionPercent / 100})`, transformOrigin: "left", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>สถานะ (Status)</label>
                        <select name="status" value={editFormData.status} onChange={handleEditChange} disabled={isPendingUpdate && !isManager} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="Initiate">Initiate</option><option value="Active">Active</option><option value="Hold">Hold</option><option value="Go-live">Go-live</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ขั้นตอนปัจจุบัน (Phase)</label>
                        <select name="phase" value={editFormData.phase} onChange={handleEditChange} disabled={isPendingUpdate && !isManager} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="Requirement">Requirement</option><option value="Preparation">Preparation</option><option value="Development/Implement">Development</option><option value="UAT">UAT</option><option value="Go-live">Go-live</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#10b981", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>2</span>
                      กำหนดการทำงานจริง (Actual Timeline)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ color: "var(--text-muted)" }}>วันที่เริ่มงานจริง (Actual Start)</label>
                        <DatePicker selected={toDate(editFormData.tracking.actualStart)} onChange={(date) => handleTrackingChange("actualStart", toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                        <div style={{ fontSize: "0.8rem", color: "var(--blue)", marginTop: "6px" }}>📌 แผนที่วางไว้: {formatDateTH(editFormData.form_data?.compliance?.baStartDate)}</div>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ color: "var(--text-muted)" }}>วันที่เสร็จจริง (Actual Go-live)</label>
                        <DatePicker selected={toDate(editFormData.tracking.actualGoLive)} onChange={(date) => handleTrackingChange("actualGoLive", toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                        <div style={{ fontSize: "0.8rem", color: "var(--blue)", marginTop: "6px" }}>📌 แผนที่วางไว้: {formatDateTH(editFormData.form_data?.compliance?.baEndDate)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#f59e0b", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>3</span>
                      ข้อมูลระบบและผู้รับผิดชอบ
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ชื่อผู้รับผิดชอบงาน (GLS PM)</label>
                        <input value={editFormData.tracking.glsManager} onChange={(e) => handleTrackingChange("glsManager", e.target.value)} placeholder="เช่น Chatchai" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>เจ้าของระบบ (GLS Owner)</label>
                        <input value={editFormData.tracking.glsOwner} onChange={(e) => handleTrackingChange("glsOwner", e.target.value)} placeholder="เช่น SOG 6" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ชื่อแอปพลิเคชัน (App Name)</label>
                        <input value={editFormData.tracking.appName} onChange={(e) => handleTrackingChange("appName", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>รหัสระบบ (App ID)</label>
                        <input value={editFormData.tracking.appId} onChange={(e) => handleTrackingChange("appId", e.target.value)} placeholder="เช่น APP-001" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ไซต์ที่ติดตั้ง (Deploy Site)</label>
                        <input value={editFormData.tracking.deployIn} onChange={(e) => handleTrackingChange("deployIn", e.target.value)} placeholder="เช่น BSR" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#059669", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>4</span>
                      ข้อมูลเพิ่มเติมและงบประมาณ (Details & Budget)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>กลุ่มลูกค้า (Customer Group)</label>
                        <input value={editFormData.tracking.customerGroup || ""} onChange={(e) => handleTrackingChange("customerGroup", e.target.value)} placeholder="เช่น SOG6" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ประเภทโปรเจกต์ (Project Type)</label>
                        <input value={editFormData.tracking.projectType || ""} onChange={(e) => handleTrackingChange("projectType", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ประเภทงบประมาณ (Budget Type)</label>
                        <input value={editFormData.tracking.budgetType || ""} onChange={(e) => handleTrackingChange("budgetType", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>งบประมาณที่อนุมัติ (Approved Budget)</label>
                        <input type="number" value={editFormData.tracking.approvedBudget || ""} onChange={(e) => handleTrackingChange("approvedBudget", e.target.value)} placeholder="ระบุตัวเลข (บาท)" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ค่าใช้จ่ายจริง (Actual Cost)</label>
                        <input type="number" value={editFormData.tracking.actualCost || ""} onChange={(e) => handleTrackingChange("actualCost", e.target.value)} placeholder="ระบุตัวเลข (บาท)" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label style={{ color: "var(--text-muted)" }}>หมายเหตุ (Remark)</label>
                        <textarea value={editFormData.tracking.remark || ""} onChange={(e) => handleTrackingChange("remark", e.target.value)} rows="2" style={{ background: "var(--input-bg)", color: "var(--text-color)", width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 2: ข้อมูลทางเทคนิค (Technical Setup) */}
              {/* ---------------------------------------------------- */}
              {editActiveTab === "technical" && (
                <>
                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#8b5cf6", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>1</span>
                      ข้อมูลพื้นฐานแอปพลิเคชัน (App Info)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ชื่อย่อระบบ (Abbreviation)</label>
                        <input type="text" value={editFormData.app_info?.abbreviation || ""} onChange={(e) => handleNestedChange("app_info", "abbreviation", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>โมดูล (Module)</label>
                        <input type="text" value={editFormData.app_info?.module || ""} onChange={(e) => handleNestedChange("app_info", "module", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ระดับองค์กร (Enterprise)</label>
                        <input type="text" value={editFormData.app_info?.enterprise || ""} onChange={(e) => handleNestedChange("app_info", "enterprise", e.target.value)} placeholder="e.g. Business Management" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>หมวดหมู่ (Catalog)</label>
                        <input type="text" value={editFormData.app_info?.catalog || ""} onChange={(e) => handleNestedChange("app_info", "catalog", e.target.value)} placeholder="e.g. Support Application" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>ประเภท (Type)</label>
                        <select value={editFormData.app_info?.type || ""} onChange={(e) => handleNestedChange("app_info", "type", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="">เลือกประเภท</option><option value="Inhouse">Inhouse</option><option value="Package">Package</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>เวลาใช้งาน (Usage Hour)</label>
                        <input type="text" value={editFormData.app_info?.usageHour || ""} onChange={(e) => handleNestedChange("app_info", "usageHour", e.target.value)} placeholder="e.g. 24*7 หรือ 8*5" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} />
                      </div>

                      {/* 🌟🌟 Toggle Switch สำหรับ Source Code ย้ายมาเต็มกล่อง และเปลี่ยนเป็นสวิตช์สวยๆ 🌟🌟 */}
                      <div 
                        onClick={() => handleNestedChange("app_info", "hasSourceCode", editFormData.app_info?.hasSourceCode === "Yes" ? "No" : "Yes")}
                        style={{ 
                          gridColumn: "1 / -1", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between",
                          padding: "16px 20px", 
                          background: editFormData.app_info?.hasSourceCode === "Yes" ? "rgba(16, 185, 129, 0.05)" : "var(--card-bg)", 
                          borderRadius: "12px", 
                          border: editFormData.app_info?.hasSourceCode === "Yes" ? "1px solid #10b981" : "1px solid var(--border-color)", 
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div>
                          <div style={{ color: editFormData.app_info?.hasSourceCode === "Yes" ? "#10b981" : "var(--text-color)", fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px" }}>
                            💻 มี Source Code (Source Code Availability)
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            คลิกเพื่อระบุว่าระบบนี้มีซอร์สโค้ดจัดเก็บไว้ที่โรงพยาบาลหรือไม่
                          </div>
                        </div>
                        <div style={{
                          width: "48px", height: "26px",
                          background: editFormData.app_info?.hasSourceCode === "Yes" ? "#10b981" : "#cbd5e1",
                          borderRadius: "13px", position: "relative", transition: "background 0.3s", flexShrink: 0
                        }}>
                          <div style={{
                            width: "22px", height: "22px", background: "#fff", borderRadius: "50%", position: "absolute",
                            top: "2px", left: editFormData.app_info?.hasSourceCode === "Yes" ? "24px" : "2px",
                            transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#8b5cf6", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>2</span>
                      โครงสร้าง Server และเทคโนโลยี (Tech Stack)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>ภาษาที่ใช้ (Language)</label><input value={editFormData.tech.language} onChange={(e) => handleTechChange("language", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Tools</label><input value={editFormData.tech.tools || ""} onChange={(e) => handleTechChange("tools", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>แพลตฟอร์ม (Platform)</label><select value={editFormData.tech.platform} onChange={(e) => handleTechChange("platform", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}><option value="Web Base">Web Base</option><option value="Mobile App">Mobile App</option><option value="Desktop App">Desktop App</option></select></div>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Type of Backup</label><input value={editFormData.tech.backupType || ""} onChange={(e) => handleTechChange("backupType", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      
                      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", background: "rgba(139, 92, 246, 0.05)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                        <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>Web Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.tech.webServerIp || ""} onChange={(e) => handleTechChange("webServerIp", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /><input placeholder="Name" value={editFormData.tech.webServerName || ""} onChange={(e) => handleTechChange("webServerName", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div></div>
                        <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>App Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.tech.appServerIp || ""} onChange={(e) => handleTechChange("appServerIp", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /><input placeholder="Name" value={editFormData.tech.appServerName || ""} onChange={(e) => handleTechChange("appServerName", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div></div>
                        <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>DB Server (IP / Name)</label><div style={{ display: "flex", gap: "10px" }}><input placeholder="IP" value={editFormData.tech.dbServerIp || ""} onChange={(e) => handleTechChange("dbServerIp", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /><input placeholder="Name" value={editFormData.tech.dbServerName || ""} onChange={(e) => handleTechChange("dbServerName", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div></div>
                        <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>HIS Server (Connection)</label><input value={editFormData.tech.hisServer || ""} onChange={(e) => handleTechChange("hisServer", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#8b5cf6", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>3</span>
                      การเชื่อมต่อข้อมูล (Application Interface)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Interface Inbound Data</label><input type="text" value={editFormData.interface?.inbound || ""} onChange={(e) => handleNestedChange("interface", "inbound", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Interface Outbound Data</label><input type="text" value={editFormData.interface?.outbound || ""} onChange={(e) => handleNestedChange("interface", "outbound", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>Processing System</label>
                        <select value={editFormData.interface?.processing || ""} onChange={(e) => handleNestedChange("interface", "processing", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="">เลือกประเภท</option><option value="Online">Online</option><option value="Batch">Batch</option><option value="Batch&Online">Batch & Online</option>
                        </select>
                      </div>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Public Interface</label><input type="text" value={editFormData.interface?.public || ""} onChange={(e) => handleNestedChange("interface", "public", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#10b981", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>4</span>
                      ระดับการสนับสนุนและสัญญา (Support & SLA)
                    </h4>
                    <div style={{ display: "grid", gap: "15px" }}>
                      <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>Tier 1 (L1 Support) / Helpdesk</label><input type="text" value={editFormData.support?.l1Contact || ""} onChange={(e) => handleNestedChange("support", "l1Contact", e.target.value)} placeholder="e.g. Centralized IT Helpdesk" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>Tier 2 (L2 Support) / Site IT</label><input type="text" value={editFormData.support?.l2Contact || ""} onChange={(e) => handleNestedChange("support", "l2Contact", e.target.value)} placeholder="e.g. BPK IT Support on site" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label style={{ color: "var(--text-muted)" }}>Tier 3 (L3 Support) / App Owner</label><input type="text" value={editFormData.support?.l3Contact || ""} onChange={(e) => handleNestedChange("support", "l3Contact", e.target.value)} placeholder="e.g. GLS-G6-Developer-Group" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>5</span>
                      ความมั่นคงปลอดภัย (Security CIA)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div className="form-group"><label style={{ color: "var(--text-muted)" }}>Contract Type</label><input type="text" value={editFormData.security_cia?.contractType || ""} onChange={(e) => handleNestedChange("security_cia", "contractType", e.target.value)} placeholder="e.g. Obligation" style={{ background: "var(--input-bg)", color: "var(--text-color)" }} /></div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>Confidentiality (ความลับ)</label>
                        <select value={editFormData.security_cia?.confidentiality || ""} onChange={(e) => handleNestedChange("security_cia", "confidentiality", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="">เลือกระดับ</option><option value="Internal Use">Internal Use</option><option value="Confidential">Confidential</option><option value="Public">Public</option><option value="Classify">Classify</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>Integrity (ความถูกต้อง)</label>
                        <select value={editFormData.security_cia?.integrity || ""} onChange={(e) => handleNestedChange("security_cia", "integrity", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="">เลือกระดับ</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: "var(--text-muted)" }}>Availability (ความพร้อมใช้)</label>
                        <select value={editFormData.security_cia?.availability || ""} onChange={(e) => handleNestedChange("security_cia", "availability", e.target.value)} style={{ background: "var(--input-bg)", color: "var(--text-color)" }}>
                          <option value="">เลือกระดับ</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 3: กฎระเบียบ (Compliance) */}
              {/* ---------------------------------------------------- */}
              {editActiveTab === "compliance" && (
                <>
                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>1</span>
                      ระบบที่ได้รับผลกระทบ (Impact Teams)
                    </h4>
                    
                    {/* 🌟🌟 Toggle Switch สำหรับเปิด/ปิด Impact Teams 🌟🌟 */}
                    <div 
                      onClick={() => {
                        const isCurrentlyYes = editFormData.app_info?.impactBusiness === "Yes";
                        setEditFormData((prev) => ({
                          ...prev,
                          app_info: { ...(prev.app_info || {}), impactBusiness: isCurrentlyYes ? "No" : "Yes" },
                          tracking: { ...(prev.tracking || {}), impactTeams: isCurrentlyYes ? [] : prev.tracking.impactTeams } // ล้างค่าถ้าปิดสวิตช์
                        }));
                      }}
                      style={{ 
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px", marginBottom: editFormData.app_info?.impactBusiness === "Yes" ? "15px" : "0",
                        background: editFormData.app_info?.impactBusiness === "Yes" ? "rgba(239, 68, 68, 0.05)" : "var(--input-bg)", 
                        borderRadius: "12px", border: editFormData.app_info?.impactBusiness === "Yes" ? "1px solid #fca5a5" : "1px solid var(--border-color)", 
                        cursor: "pointer", transition: "all 0.2s ease"
                      }}
                    >
                      <div>
                        <div style={{ color: editFormData.app_info?.impactBusiness === "Yes" ? "#ef4444" : "var(--text-color)", fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px" }}>
                          🚨 มีผลกระทบกับระบบอื่นหรือธุรกิจ (Impact to Business)
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          คลิกเพื่อเปิด/ปิด หากการขึ้นระบบนี้ส่งผลกระทบให้ต้องแก้ไขหรือระวังระบบอื่นๆ ด้วย
                        </div>
                      </div>
                      <div style={{ width: "48px", height: "26px", background: editFormData.app_info?.impactBusiness === "Yes" ? "#ef4444" : "#cbd5e1", borderRadius: "13px", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
                        <div style={{ width: "22px", height: "22px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: editFormData.app_info?.impactBusiness === "Yes" ? "24px" : "2px", transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                      </div>
                    </div>

                    {/* 🌟 แสดงให้เลือกเฉพาะเมื่อเปิดสวิตช์ด้านบนเท่านั้น 🌟 */}
                    {editFormData.app_info?.impactBusiness === "Yes" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", padding: "15px", background: "var(--bg-color)", borderRadius: "8px", border: "1px dashed #fca5a5" }}>
                        {impactTeamsList.map((team) => (
                          <label key={team} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: editFormData.tracking.impactTeams.includes(team) ? "var(--card-bg)" : "var(--card-bg)", padding: "10px", borderRadius: "6px", border: editFormData.tracking.impactTeams.includes(team) ? "2px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s", boxShadow: editFormData.tracking.impactTeams.includes(team) ? "0 2px 4px rgba(239, 68, 68, 0.1)" : "none" }}>
                            <input type="checkbox" checked={editFormData.tracking.impactTeams.includes(team)} onChange={() => handleImpactTeamToggle(team)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                            <span style={{ fontSize: "0.85rem", color: editFormData.tracking.impactTeams.includes(team) ? "#ef4444" : "var(--text-color)", fontWeight: editFormData.tracking.impactTeams.includes(team) ? "600" : "normal" }}>{team}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#ef4444", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>2</span>
                      ข้อมูลส่วนบุคคล (PDPA)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                      {fullPdpaItems.map((item) => (
                        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: editFormData.compliance.pdpa?.[item.key] ? "var(--input-bg)" : "var(--bg-color)", padding: "10px", borderRadius: "6px", border: editFormData.compliance.pdpa?.[item.key] ? "1px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s" }}>
                          <input type="checkbox" checked={editFormData.compliance.pdpa?.[item.key] || false} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#ef4444" }} />
                          <span style={{ fontSize: "0.85rem", color: editFormData.compliance.pdpa?.[item.key] ? "#ef4444" : "var(--text-color)", fontWeight: editFormData.compliance.pdpa?.[item.key] ? "600" : "normal" }}>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
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
                          <div style={{ width: "35px", height: "35px", background: "var(--blue)", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{ropa.letter}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>{ropa.title}</div>
                            <input type="text" value={editFormData.compliance?.ropa?.[ropa.key] || ""} onChange={(e) => handleRopaChange(ropa.key, e.target.value)} placeholder={ropa.placeholder} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer ของ Modal (แสดงเสมอ ไม่ว่าจะอยู่แท็บไหน) */}
            <div style={{ padding: "20px 24px", background: "var(--card-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModals}>ยกเลิก (Cancel)</button>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px 30px" }} disabled={isPendingUpdate && !isManager}>
                {isStatusChangedUI && !isManager ? "📤 ส่งคำขออนุมัติสถานะ" : "💾 บันทึกข้อมูลและอัปเดตงาน"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectPortfolio;