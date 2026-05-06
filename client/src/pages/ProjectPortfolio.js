import React, { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchProjects, updateProjectInDb } from "../api/authApi";
import Swal from "sweetalert2";
// inline filter helper (copied per-page to use real data structures)
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
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const impactTeamsList = [
  "iMed",
  "HMS",
  "Other Unit",
  "EPMS",
  "SAP SuccessFactor",
  "SAP P2P",
  "SAP R2C",
  "SAP Non Hos-MFG",
  "SAP Non Hos-Nhealth",
  "Doctor Fee",
  "E-Form",
  "Infra",
  "SOG",
];
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
  { key: "photo", label: "รูปถ่ายใบหน้า" },
];

function ProjectPortfolio({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPhase, setFilterPhase] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
          .filter(
            (p) => String(p.status).trim().toLowerCase() !== "pending approval",
          )
          .map((p) => {
            let parsedForm = p.form_data;
            if (typeof parsedForm === "string") {
              try {
                parsedForm = JSON.parse(parsedForm);
              } catch (e) {
                parsedForm = {};
              }
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
    if (currentStatus === "Go-live" || currentPhase === "Go-live")
      autoPercent = 100;
    else if (currentPhase === "Requirement") autoPercent = 25;
    else if (currentPhase === "Preparation") autoPercent = 50;
    else if (currentPhase === "Development/Implement") autoPercent = 75;
    else if (currentPhase === "UAT") autoPercent = 90;

    const smartTracking = {
      completionPercent: autoPercent,
      actualStart:
        existingTracking.actualStart ||
        project.form_data?.compliance?.baStartDate ||
        "",
      actualGoLive:
        existingTracking.actualGoLive ||
        project.form_data?.compliance?.baEndDate ||
        "",
      appName: existingTracking.appName || project.name || "",
      appId: existingTracking.appId || project.form_data?.appId || "",
      deployIn: existingTracking.deployIn || project.site || "",
      glsOwner: existingTracking.glsOwner || "",
      glsManager:
        existingTracking.glsManager || project.form_data?.assigned_to || "",
      impactTeams: existingTracking.impactTeams || [],
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
      tech: {
        language: "",
        platform: "Web Base",
        server: "",
        webServer: "",
        ...(project.form_data?.tech || {}),
      },
      compliance: {
        pdpa: {},
        ropa: {},
        ...(project.form_data?.compliance || {}),
      },
    });
    setProgressFile(null);
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
        if (currentStatus === "Go-live" || currentPhase === "Go-live")
          autoPercent = 100;
        else if (currentPhase === "Requirement") autoPercent = 25;
        else if (currentPhase === "Preparation") autoPercent = 50;
        else if (currentPhase === "Development/Implement") autoPercent = 75;
        else if (currentPhase === "UAT") autoPercent = 90;
        return {
          ...newData,
          tracking: {
            ...(newData.tracking || {}),
            completionPercent: autoPercent,
          },
        };
      }
      return newData;
    });
  };

  const handleTrackingChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      tracking: { ...prev.tracking, [field]: value },
    }));
  };
  const handleTechChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      tech: { ...prev.tech, [field]: value },
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
  const handleImpactTeamToggle = (team) => {
    setEditFormData((prev) => {
      const currentTeams = prev.tracking?.impactTeams || [];
      const updatedTeams = currentTeams.includes(team)
        ? currentTeams.filter((t) => t !== team)
        : [...currentTeams, team];
      return {
        ...prev,
        tracking: { ...prev.tracking, impactTeams: updatedTeams },
      };
    });
  };

  const handleManagerDecision = async (decision) => {
    const isApprove = decision === "approve";
    Swal.fire({
      title: isApprove ? "ยืนยันอนุมัติ?" : "ปฏิเสธคำขอ?",
      text: isApprove
        ? "ข้อมูลจะถูกอัปเดตเข้าระบบทันที"
        : "สถานะจะกลับไปเป็นค่าเดิม",
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

          const newStatus = isApprove
            ? editFormData.tracking.pendingStatus
            : selectedProject.status;
          const newPhase = isApprove
            ? editFormData.tracking.pendingPhase
            : selectedProject.phase;

          let autoPercent = editFormData.tracking.completionPercent || 0;
          if (isApprove) {
            if (newStatus === "Go-live" || newPhase === "Go-live")
              autoPercent = 100;
            else if (newPhase === "Requirement") autoPercent = 25;
            else if (newPhase === "Preparation") autoPercent = 50;
            else if (newPhase === "Development/Implement") autoPercent = 75;
            else if (newPhase === "UAT") autoPercent = 90;
          } else {
            if (
              selectedProject.status === "Go-live" ||
              selectedProject.phase === "Go-live"
            )
              autoPercent = 100;
            else if (selectedProject.phase === "Requirement") autoPercent = 25;
            else if (selectedProject.phase === "Preparation") autoPercent = 50;
            else if (
              selectedProject.phase === "Development/Implement" ||
              selectedProject.phase === "Development"
            )
              autoPercent = 75;
            else if (selectedProject.phase === "UAT") autoPercent = 90;
            else
              autoPercent =
                selectedProject.form_data?.tracking?.completionPercent || 0;
          }

          const finalData = {
            ...editFormData,
            status: newStatus,
            phase: newPhase,
            form_data: {
              ...editFormData.form_data,
              tracking: {
                ...editFormData.tracking,
                completionPercent: autoPercent,
                isPendingApproval: false,
                pendingStatus: null,
                pendingPhase: null,
              },
              tech: editFormData.tech,
              compliance: editFormData.compliance,
            },
          };
          const updated = await updateProjectInDb(
            editFormData.id,
            finalData,
            null,
            token,
          );
          const parsedUpdated = {
            ...updated.data,
            form_data:
              typeof updated.data.form_data === "string"
                ? JSON.parse(updated.data.form_data)
                : updated.data.form_data,
          };
          setProjects((prev) =>
            prev.map((p) => (p.id === parsedUpdated.id ? parsedUpdated : p)),
          );
          Swal.fire(
            "สำเร็จ",
            isApprove
              ? "✅ อนุมัติการเปลี่ยนสถานะเรียบร้อยแล้ว!"
              : "❌ ปฏิเสธคำขอและคงสถานะเดิมเรียบร้อย!",
            "success",
          );
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
    const isStatusChanged =
      selectedProject.status !== editFormData.status ||
      selectedProject.phase !== editFormData.phase;
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
        payloadTracking.completionPercent =
          selectedProject.form_data?.tracking?.completionPercent || 0;
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
          tech: editFormData.tech,
          compliance: editFormData.compliance,
        },
      };

      const updated = await updateProjectInDb(
        editFormData.id,
        finalData,
        fileToUpload,
        token,
      );
      const parsedUpdated = {
        ...updated.data,
        form_data:
          typeof updated.data.form_data === "string"
            ? JSON.parse(updated.data.form_data)
            : updated.data.form_data,
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === parsedUpdated.id ? parsedUpdated : p)),
      );
      setIsEditModalOpen(false);
      setTimeout(() => {
        if (isStatusChanged && !isManager)
          Swal.fire(
            "สำเร็จ",
            "ส่งคำขอเปลี่ยนสถานะไปให้ Manager ตรวจสอบเรียบร้อยแล้วครับ!",
            "success",
          );
        else Swal.fire("สำเร็จ", "อัปเดตข้อมูลสำเร็จเรียบร้อย!", "success");
      }, 150);
    } catch (error) {
      setIsEditModalOpen(false);
      setTimeout(() => Swal.fire("ล้มเหลว", error.message, "error"), 150);
    }
  };

  const toDate = (s) => (s ? new Date(s) : null);
  const toIso = (d) => (d ? d.toISOString().split("T")[0] : "");
  const formatDateTH = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";
  const getProgressColor = (percent) => {
    if (percent < 30) return "#dc3545";
    if (percent < 75) return "#f59e0b";
    return "#10b981";
  };

  const isStatusChangedUI =
    selectedProject &&
    editFormData &&
    (selectedProject.status !== editFormData.status ||
      selectedProject.phase !== editFormData.phase);
  const isPendingUpdate = editFormData?.tracking?.isPendingApproval;

  /* 🚀 วิเคราะห์สถิติภาพรวมสำหรับแถบ Executive Summary 🚀 */
  const displayedProjects = useMemo(() => {
    return filterRows(projects, {
      searchQuery: searchQuery,
      filters: { status: filterStatus, phase: filterPhase },
      searchableFields: [
        "id",
        "name",
        "form_data.tracking.glsManager",
        "form_data.assigned_to",
      ],
    });
  }, [projects, searchQuery, filterStatus, filterPhase]);

  const stats = {
    total: projects.length,
    active: projects.filter(
      (p) => p.status === "Active" || p.status === "Initiate",
    ).length,
    hold: projects.filter((p) => p.status === "Hold").length,
    goLive: projects.filter(
      (p) => p.status === "Go-live" || p.phase === "Go-live",
    ).length,
  };

  if (isLoading)
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        กำลังโหลดข้อมูล...
      </div>
    );

  return (
    <div className="page-wrap page-project" style={{ gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          className="page-heading"
          style={{ margin: 0, textShadow: "0 2px 10px rgba(255,255,255,0.8)" }}
        >
          Project Portfolio
        </h1>
      </div>

      {/* 🚀 Executive Summary Dashboard (แสดงเฉพาะ CEO และ Manager) 🚀 */}
      {(isCEO || isManager) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, var(--blue-dark), var(--blue))",
              padding: "20px",
              borderRadius: "16px",
              color: "#fff",
              boxShadow: "0 10px 20px rgba(2, 132, 199, 0.15)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                opacity: 0.9,
                fontWeight: 600,
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total Projects
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>
              {stats.total}
            </div>
          </div>
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
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              🚀 In Progress
            </div>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "var(--blue)",
                lineHeight: 1,
              }}
            >
              {stats.active}
            </div>
          </div>
          <div
            style={{
              background: "var(--card-bg)",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #fde68a",
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "#b45309",
                fontWeight: 600,
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ⚠️ Hold / At Risk
            </div>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#d97706",
                lineHeight: 1,
              }}
            >
              {stats.hold}
            </div>
          </div>
          <div
            style={{
              background: "var(--card-bg)",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #bbf7d0",
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "#166534",
                fontWeight: 600,
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ✅ Go-Live
            </div>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#10b981",
                lineHeight: 1,
              }}
            >
              {stats.goLive}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: "1 1 260px",
            display: "flex",
            alignItems: "center",
            background: "var(--card-bg)",
            borderRadius: "8px",
            padding: "0 12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>🔎</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา ID, ชื่อ หรือ ผู้รับผิดชอบ..."
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: "10px",
              outline: "none",
              color: "var(--text-color)",
              fontSize: "0.95rem",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--card-bg)",
              color: "var(--text-color)",
              fontWeight: 700,
            }}
          >
            <option value="All">สถานะ: ทุกค่า</option>
            <option value="Initiate">Initiate</option>
            <option value="Active">Active</option>
            <option value="Hold">Hold</option>
            <option value="Go-live">Go-live</option>
          </select>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--card-bg)",
              color: "var(--text-color)",
              fontWeight: 700,
            }}
          >
            <option value="All">Phase: ทุกค่า</option>
            <option value="Requirement">Requirement</option>
            <option value="Preparation">Preparation</option>
            <option value="Development/Implement">Development</option>
            <option value="UAT">UAT</option>
            <option value="Go-live">Go-live</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("All");
              setFilterPhase("All");
            }}
            className="btn btn-tertiary"
            style={{ padding: "8px 12px" }}
          >
            รีเซ็ต
          </button>
        </div>
        <div
          style={{
            marginLeft: "auto",
            color: "var(--text-muted)",
            fontWeight: 700,
          }}
        >
          {displayedProjects.length} / {projects.length} ผลลัพธ์
        </div>
      </div>

      <div className="table-wrap">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>รหัสโครงการ (ID)</th>
              <th>ชื่อโครงการ (Project Name)</th>
              <th>ผู้รับผิดชอบ (Assignee)</th>
              <th>สถานะ (Status)</th>
              <th>ขั้นตอน (Phase)</th>
              <th style={{ textAlign: "center" }}>ความคืบหน้า (%)</th>
              {!isCEO && <th style={{ textAlign: "center" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {displayedProjects.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700 }}>{p.id}</td>
                <td>
                  <span
                    onClick={() => handleViewProject(p)}
                    style={{
                      color: "var(--bhp-sky)",
                      cursor: "pointer",
                      fontWeight: "700",
                      textDecoration: "underline",
                    }}
                  >
                    {p.name}
                  </span>
                </td>
                <td>
                  <span style={{ color: "#d32f2f", fontWeight: "700" }}>
                    {p.form_data?.tracking?.glsManager ||
                      p.form_data?.assigned_to ||
                      "-"}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span className={`status-badge ${p.status?.toLowerCase()}`}>
                      {p.status}
                    </span>
                    {p.form_data?.tracking?.isPendingApproval && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#b45309",
                          background: "#fef3c7",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontWeight: "bold",
                          border: "1px solid #fde68a",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        ⏳ รอ Manager ยืนยัน
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{p.phase || "-"}</td>
                <td style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "10px",
                        background: "var(--border-color)",
                        borderRadius: "5px",
                        overflow: "hidden",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: "100%",
                          background: getProgressColor(
                            p.form_data?.tracking?.completionPercent || 0,
                          ),
                          transform: `scaleX(${(p.form_data?.tracking?.completionPercent || 0) / 100})`,
                          transformOrigin: "left",
                          transition:
                            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "800",
                        color: "var(--text-color)",
                        width: "35px",
                        textAlign: "right",
                      }}
                    >
                      {p.form_data?.tracking?.completionPercent || 0}%
                    </span>
                  </div>
                </td>
                {!isCEO && (
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEditProject(p)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <EditIcon /> อัปเดต
                      </button>
                      {isManager && (
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          title="ลบโครงการ"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isViewModalOpen && selectedProject && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <div
            className="pdf-preview-card project-modal-card"
            style={{
              width: "95%",
              maxWidth: "1040px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--card-bg)",
            }}
          >
            <div
              className="project-modal-header"
              style={{
                padding: "18px 22px 14px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                background:
                  "linear-gradient(135deg, var(--blue-dark), var(--blue))",
                color: "#fff",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: "0 0 6px 0",
                    color: "#fff",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  {selectedProject.name}
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    fontSize: "0.84rem",
                    opacity: 0.95,
                  }}
                >
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.14)",
                    }}
                  >
                    รหัสโครงการ: {selectedProject.id}
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.14)",
                    }}
                  >
                    สถานะ: {selectedProject.status || "-"}
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.14)",
                    }}
                  >
                    Phase: {selectedProject.phase || "-"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            <div
              className="project-modal-tabs"
              style={{
                display: "flex",
                gap: "8px",
                padding: "0 18px",
                marginTop: "-1px",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--card-bg)",
                overflowX: "auto",
              }}
            >
              {[
                { id: "overview", label: "📌 ภาพรวม" },
                { id: "requirement", label: "📝 ความต้องการ" },
                { id: "system", label: "💻 ระบบ & ทีม" },
                { id: "timeline", label: "⏱️ กำหนดการ" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: "12px 4px 13px",
                    border: "none",
                    background: "transparent",
                    borderBottom:
                      activeTab === t.id
                        ? "3px solid var(--blue)"
                        : "3px solid transparent",
                    cursor: "pointer",
                    fontWeight: activeTab === t.id ? "700" : "600",
                    color:
                      activeTab === t.id ? "var(--blue)" : "var(--text-muted)",
                    fontSize: "0.86rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div
              className="project-modal-body"
              style={{
                padding: "18px 18px 20px",
                overflowY: "auto",
                flex: 1,
                lineHeight: "1.6",
                background:
                  "linear-gradient(180deg, var(--bg-color), var(--bg-secondary, #f8fafc))",
              }}
            >
              {activeTab === "overview" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {selectedProject.form_data?.approval_remark && (
                    <div
                      style={{
                        background: "#fffbeb",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <h4
                        style={{
                          color: "#92400e",
                          margin: "0 0 8px 0",
                          fontSize: "1rem",
                        }}
                      >
                        💬 ข้อความสั่งการจากผู้จัดการ
                      </h4>
                      <p
                        style={{
                          color: "#78350f",
                          margin: 0,
                          fontWeight: 500,
                          fontSize: "0.92rem",
                        }}
                      >
                        {selectedProject.form_data.approval_remark}
                      </p>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--blue)",
                          margin: "0 0 10px 0",
                          fontSize: "0.98rem",
                        }}
                      >
                        ข้อมูลผู้ร้องขอ
                      </h4>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>ชื่อผู้ติดต่อ:</strong>{" "}
                        {selectedProject.requester_name ||
                          selectedProject.form_data?.requesterName ||
                          "-"}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>แผนก:</strong>{" "}
                        {selectedProject.form_data?.requesterDept || "-"}
                      </p>
                    </div>
                    <div
                      style={{
                        background: "var(--card-bg)",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--blue)",
                          margin: "0 0 10px 0",
                          fontSize: "0.98rem",
                        }}
                      >
                        เป้าหมายโปรเจกต์
                      </h4>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>วัตถุประสงค์:</strong>{" "}
                        {selectedProject.description}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>ผลที่คาดหวัง:</strong>{" "}
                        {selectedProject.form_data?.expectedOutcome || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "requirement" && (
                <div
                  style={{
                    background: "var(--card-bg)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "1px solid rgba(14,165,233,0.18)",
                    boxShadow: "inset 4px 0 0 0 rgba(14,165,233,0.2)",
                    whiteSpace: "pre-wrap",
                    color: "var(--text-color)",
                  }}
                >
                  <h4
                    style={{
                      color: "var(--blue)",
                      margin: "0 0 10px 0",
                      fontSize: "1rem",
                    }}
                  >
                    รายละเอียดเชิงลึก
                  </h4>
                  {selectedProject.form_data?.requirementDetail ||
                    "ไม่มีข้อมูลระบุไว้"}
                </div>
              )}
              {activeTab === "system" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--card-bg)",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--blue)",
                        margin: "0 0 10px 0",
                        fontSize: "0.98rem",
                      }}
                    >
                      ข้อมูลระบบ
                    </h4>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>App ID:</strong>{" "}
                      {selectedProject.form_data?.tracking?.appId || "-"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Owner:</strong>{" "}
                      {selectedProject.form_data?.tracking?.glsOwner || "-"}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "timeline" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--card-bg)",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "#d97706",
                        margin: "0 0 10px 0",
                        fontSize: "0.98rem",
                      }}
                    >
                      📋 แผนงานอนุมัติ
                    </h4>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>ผู้รับผิดชอบ:</strong>{" "}
                      <span style={{ color: "#d32f2f", fontWeight: "bold" }}>
                        {selectedProject.form_data?.tracking?.glsManager || "-"}
                      </span>
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>วันที่คาดว่าจะเริ่ม:</strong>{" "}
                      {formatDateTH(
                        selectedProject.form_data?.compliance?.baStartDate,
                      )}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "var(--card-bg)",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--blue)",
                        margin: "0 0 10px 0",
                        fontSize: "0.98rem",
                      }}
                    >
                      ⚡ ความคืบหน้าจริง
                    </h4>
                    <p style={{ margin: "0 0 10px 0" }}>
                      <strong>ความคืบหน้า:</strong>{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: getProgressColor(
                            selectedProject.form_data?.tracking
                              ?.completionPercent || 0,
                          ),
                          fontSize: "1.15rem",
                        }}
                      >
                        {selectedProject.form_data?.tracking
                          ?.completionPercent || 0}
                        %
                      </span>
                    </p>
                    {selectedProject.form_data?.tracking?.progressFile && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "10px 12px",
                          background: "var(--input-bg)",
                          borderRadius: "8px",
                          border: "1px dashed var(--border-color)",
                        }}
                      >
                        📄{" "}
                        <a
                          href={`http://localhost:4000/${selectedProject.form_data.tracking.progressFile.replace(/\\/g, "/")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--blue)", fontWeight: 600 }}
                        >
                          ดูไฟล์แนบหลักฐาน
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div
              className="project-modal-footer"
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                background: "var(--card-bg)",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (selectedProject.document_path)
                    window.open(
                      `http://localhost:4000/${selectedProject.document_path.replace(/\\/g, "/")}`,
                      "_blank",
                    );
                  else
                    Swal.fire(
                      "ไม่พบไฟล์",
                      "ไม่พบไฟล์เอกสารอนุมัติเริ่มต้น",
                      "error",
                    );
                }}
                style={{ padding: "10px 14px" }}
              >
                📂 เปิดเอกสารอนุมัติ
              </button>
              <button className="btn btn-primary" onClick={handleCloseModals}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editFormData && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <form
            className="pdf-preview-card"
            onSubmit={handleSaveEdit}
            style={{
              width: "95%",
              maxWidth: "900px",
              padding: 0,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: "12px",
              overflow: "hidden",
              background: "var(--card-bg)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "var(--card-bg)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 5px 0",
                    color: "var(--text-color)",
                    fontSize: "1.3rem",
                  }}
                >
                  📝 อัปเดตความคืบหน้าและการส่งต่องาน
                </h3>
                <span
                  style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
                >
                  {editFormData.id} - {editFormData.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseModals}
                style={{
                  background: "transparent",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  color: "var(--text-color)",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                background: "var(--bg-color)",
              }}
            >
              {editFormData.form_data?.approval_remark && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    padding: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4
                    style={{
                      color: "#92400e",
                      margin: "0 0 8px 0",
                      fontSize: "1.05rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    💬 ข้อสั่งการ / หมายเหตุจาก Manager
                  </h4>
                  <p
                    style={{ color: "#78350f", margin: 0, fontSize: "0.95rem" }}
                  >
                    {editFormData.form_data.approval_remark}
                  </p>
                </div>
              )}

              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
                    color: "var(--text-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      background: "var(--blue)",
                      color: "#fff",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    1
                  </span>
                  สถานะโครงการ (Project Status)
                </h4>
                {isPendingUpdate && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <h4 style={{ color: "#d97706", margin: "0 0 8px 0" }}>
                      ⏳ รอยืนยันการเปลี่ยนสถานะ
                    </h4>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "0.95rem",
                        color: "#92400e",
                      }}
                    >
                      พนักงานขอเปลี่ยนสถานะเป็น:{" "}
                      <strong>{editFormData.tracking.pendingStatus}</strong>{" "}
                      (Phase: {editFormData.tracking.pendingPhase})
                    </p>
                    {editFormData.tracking.progressFile && (
                      <p style={{ margin: 0, fontSize: "0.85rem" }}>
                        📄{" "}
                        <a
                          href={`http://localhost:4000/${editFormData.tracking.progressFile.replace(/\\/g, "/")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#0072bb", fontWeight: "bold" }}
                        >
                          ตรวจสอบไฟล์หลักฐานแนบ
                        </a>
                      </p>
                    )}
                    {isManager ? (
                      <div
                        style={{
                          marginTop: "15px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleManagerDecision("approve")}
                          className="btn btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.85rem",
                            background: "#16a34a",
                            border: "none",
                            borderRadius: "6px",
                          }}
                        >
                          ✅ อนุมัติให้เปลี่ยนสถานะ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManagerDecision("reject")}
                          className="btn btn-secondary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.85rem",
                            color: "#ef4444",
                            borderColor: "#fca5a5",
                            background: "#fef2f2",
                            borderRadius: "6px",
                          }}
                        >
                          ❌ ปฏิเสธคำขอ
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "0.85rem",
                          color: "#d97706",
                          fontStyle: "italic",
                        }}
                      >
                        (รอ Manager ตรวจสอบและอนุมัติ)
                      </div>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div
                    className="form-group"
                    style={{
                      gridColumn: "1 / -1",
                      background: "var(--bg-color)",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "1px dashed var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <label
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          color: "var(--text-color)",
                        }}
                      >
                        ความคืบหน้าปัจจุบัน (Progress)
                      </label>
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.2rem",
                          color: getProgressColor(
                            editFormData.tracking.completionPercent,
                          ),
                        }}
                      >
                        {editFormData.tracking.completionPercent}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "var(--border-color)",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: "100%",
                          background: getProgressColor(
                            editFormData.tracking.completionPercent,
                          ),
                          transform: `scaleX(${editFormData.tracking.completionPercent / 100})`,
                          transformOrigin: "left",
                          transition:
                            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      สถานะ (Status)
                    </label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditChange}
                      disabled={isPendingUpdate && !isManager}
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Initiate">Initiate</option>
                      <option value="Active">Active</option>
                      <option value="Hold">Hold</option>
                      <option value="Go-live">Go-live</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      ขั้นตอนปัจจุบัน (Phase)
                    </label>
                    <select
                      name="phase"
                      value={editFormData.phase}
                      onChange={handleEditChange}
                      disabled={isPendingUpdate && !isManager}
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Requirement">Requirement</option>
                      <option value="Preparation">Preparation</option>
                      <option value="Development/Implement">Development</option>
                      <option value="UAT">UAT</option>
                      <option value="Go-live">Go-live</option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
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
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    2
                  </span>
                  กำหนดการทำงานจริง (Actual Timeline)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: "var(--text-muted)" }}>
                      วันที่เริ่มงานจริง (Actual Start)
                    </label>
                    <DatePicker
                      selected={toDate(editFormData.tracking.actualStart)}
                      onChange={(date) =>
                        handleTrackingChange("actualStart", toIso(date))
                      }
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      placeholderText="คลิกเพื่อเลือกวัน"
                    />
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--blue)",
                        marginTop: "6px",
                      }}
                    >
                      📌 แผนที่วางไว้ (Plan):{" "}
                      {formatDateTH(
                        editFormData.form_data?.compliance?.baStartDate,
                      )}
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: "var(--text-muted)" }}>
                      วันที่เสร็จจริง (Actual Go-live)
                    </label>
                    <DatePicker
                      selected={toDate(editFormData.tracking.actualGoLive)}
                      onChange={(date) =>
                        handleTrackingChange("actualGoLive", toIso(date))
                      }
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      placeholderText="คลิกเพื่อเลือกวัน"
                    />
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--blue)",
                        marginTop: "6px",
                      }}
                    >
                      📌 แผนที่วางไว้ (Plan):{" "}
                      {formatDateTH(
                        editFormData.form_data?.compliance?.baEndDate,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
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
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    3
                  </span>
                  ข้อมูลระบบและผู้รับผิดชอบ
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      ชื่อผู้รับผิดชอบงาน (GLS PM)
                    </label>
                    <input
                      value={editFormData.tracking.glsManager}
                      onChange={(e) =>
                        handleTrackingChange("glsManager", e.target.value)
                      }
                      placeholder="เช่น Chatchai"
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      เจ้าของระบบ (GLS Owner)
                    </label>
                    <input
                      value={editFormData.tracking.glsOwner}
                      onChange={(e) =>
                        handleTrackingChange("glsOwner", e.target.value)
                      }
                      placeholder="เช่น SOG 6"
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      ชื่อแอปพลิเคชัน (App Name)
                    </label>
                    <input
                      value={editFormData.tracking.appName}
                      onChange={(e) =>
                        handleTrackingChange("appName", e.target.value)
                      }
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      รหัสระบบ (App ID)
                    </label>
                    <input
                      value={editFormData.tracking.appId}
                      onChange={(e) =>
                        handleTrackingChange("appId", e.target.value)
                      }
                      placeholder="เช่น APP-001"
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      ไซต์ที่ติดตั้ง (Deploy Site)
                    </label>
                    <input
                      value={editFormData.tracking.deployIn}
                      onChange={(e) =>
                        handleTrackingChange("deployIn", e.target.value)
                      }
                      placeholder="เช่น BSR"
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
                    color: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      background: "#8b5cf6",
                      color: "#fff",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    4
                  </span>
                  โครงสร้างเทคโนโลยี (Tech Stack)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      ภาษาที่ใช้ (Language)
                    </label>
                    <input
                      placeholder="เช่น React, PHP"
                      value={editFormData.tech.language}
                      onChange={(e) =>
                        handleTechChange("language", e.target.value)
                      }
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      แพลตฟอร์ม (Platform)
                    </label>
                    <select
                      value={editFormData.tech.platform}
                      onChange={(e) =>
                        handleTechChange("platform", e.target.value)
                      }
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Web Base">Web Base</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Desktop App">Desktop App</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      Database Server IP
                    </label>
                    <input
                      placeholder="10.x.x.x"
                      value={editFormData.tech.server}
                      onChange={(e) =>
                        handleTechChange("server", e.target.value)
                      }
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "var(--text-muted)" }}>
                      Web Server IP
                    </label>
                    <input
                      placeholder="10.x.x.x"
                      value={editFormData.tech.webServer}
                      onChange={(e) =>
                        handleTechChange("webServer", e.target.value)
                      }
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
              </div>

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
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 15px 0",
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
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                      }}
                    >
                      5
                    </span>
                    Impact Teams
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {impactTeamsList.map((team) => (
                      <label
                        key={team}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          background:
                            editFormData.tracking.impactTeams.includes(team)
                              ? "var(--input-bg)"
                              : "var(--bg-color)",
                          padding: "10px",
                          borderRadius: "6px",
                          border: editFormData.tracking.impactTeams.includes(
                            team,
                          )
                            ? "1px solid var(--blue)"
                            : "1px solid var(--border-color)",
                          transition: "all 0.2s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editFormData.tracking.impactTeams.includes(
                            team,
                          )}
                          onChange={() => handleImpactTeamToggle(team)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "var(--blue)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: editFormData.tracking.impactTeams.includes(
                              team,
                            )
                              ? "var(--blue)"
                              : "var(--text-color)",
                            fontWeight:
                              editFormData.tracking.impactTeams.includes(team)
                                ? "600"
                                : "normal",
                          }}
                        >
                          {team}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 15px 0",
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
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                      }}
                    >
                      6
                    </span>
                    จัดเก็บข้อมูล (PDPA)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {fullPdpaItems.map((item) => (
                      <label
                        key={item.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          background: editFormData.compliance.pdpa?.[item.key]
                            ? "var(--input-bg)"
                            : "var(--bg-color)",
                          padding: "10px",
                          borderRadius: "6px",
                          border: editFormData.compliance.pdpa?.[item.key]
                            ? "1px solid #ef4444"
                            : "1px solid var(--border-color)",
                          transition: "all 0.2s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            editFormData.compliance.pdpa?.[item.key] || false
                          }
                          onChange={(e) =>
                            handlePdpaChange(item.key, e.target.checked)
                          }
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#ef4444",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: editFormData.compliance.pdpa?.[item.key]
                              ? "#ef4444"
                              : "var(--text-color)",
                            fontWeight: editFormData.compliance.pdpa?.[item.key]
                              ? "600"
                              : "normal",
                          }}
                        >
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "20px 24px",
                background: "var(--card-bg)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                className="btn btn-tertiary"
                onClick={handleCloseModals}
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 30px" }}
                disabled={isPendingUpdate && !isManager}
              >
                {isStatusChangedUI && !isManager
                  ? "📤 ส่งคำขออนุมัติสถานะ"
                  : "💾 บันทึกการอัปเดตงาน"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectPortfolio;
