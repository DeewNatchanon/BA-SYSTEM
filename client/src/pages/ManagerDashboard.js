import React, { useState, useEffect, useCallback, forwardRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { fetchProjects, approveProjectRequest, updateProjectInDb } from "../api/authApi";
import Swal from "sweetalert2";
import { usePermissions } from "../hooks/usePermissions";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SortUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
const SortDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
);
const SortDefaultIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" /></svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const ChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// ─── คำนวณวันทำงาน (ไม่รวมเสาร์-อาทิตย์) ────────────────────────────────────
const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (start > end) return 0;
  let count = 0;
  let current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// ─── Helper: แปลง YYYY-MM-DD ↔ Date object ───────────────────────────────────
const strToDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
};
const dateToStr = (date) => {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// ─── Custom Input สำหรับ DatePicker (trigger button) ─────────────────────────
const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 12px",
      borderRadius: 8,
      border: "1px solid var(--border-color)",
      background: "var(--bg-color)",
      color: value ? "var(--text-color)" : "#94a3b8",
      cursor: "pointer",
      fontSize: ".83rem",
      textAlign: "left",
      fontFamily: "inherit",
      fontWeight: value ? 600 : 400,
      transition: "border-color .15s",
      boxSizing: "border-box",
    }}
  >
    <CalendarIcon />
    <span style={{ flex: 1 }}>{value || placeholder || "เลือกวันที่"}</span>
    <ChevronDown />
  </button>
));

// ─── Ba Date Picker Wrapper ───────────────────────────────────────────────────
const BaDatePicker = ({ value, onChange, placeholder, minDate }) => (
  <>
    <style>{`
      .ba-dp-wrap .react-datepicker-popper { z-index: 9999 !important; }
      .ba-dp-wrap .react-datepicker {
        font-family: inherit !important;
        border-radius: 12px !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 12px 40px rgba(0,0,0,.15) !important;
        overflow: hidden;
      }
      .ba-dp-wrap .react-datepicker__header {
        background: linear-gradient(135deg,#0c4a6e,#0284c7) !important;
        border-bottom: none !important;
        padding: 10px 10px 8px !important;
        border-radius: 0 !important;
      }
      .ba-dp-wrap .react-datepicker__current-month,
      .ba-dp-wrap .react-datepicker__day-name,
      .ba-dp-wrap .react-datepicker-time__header { color: #fff !important; font-weight: 700 !important; }
      .ba-dp-wrap .react-datepicker__day-name { color: rgba(255,255,255,.75) !important; font-size: .72rem !important; }
      .ba-dp-wrap .react-datepicker__navigation-icon::before { border-color: #fff !important; }
      .ba-dp-wrap .react-datepicker__day {
        border-radius: 8px !important;
        font-size: .82rem !important;
        transition: background .12s !important;
      }
      .ba-dp-wrap .react-datepicker__day:hover { background: #e0f2fe !important; color: #0284c7 !important; }
      .ba-dp-wrap .react-datepicker__day--selected,
      .ba-dp-wrap .react-datepicker__day--keyboard-selected {
        background: #0284c7 !important;
        color: #fff !important;
        font-weight: 800 !important;
      }
      .ba-dp-wrap .react-datepicker__day--today:not(.react-datepicker__day--selected) {
        font-weight: 800 !important;
        color: #0284c7 !important;
        border: 1.5px solid #0284c7 !important;
        background: transparent !important;
      }
      .ba-dp-wrap .react-datepicker__day--outside-month { opacity: .35 !important; }
      .ba-dp-wrap .react-datepicker__month-dropdown,
      .ba-dp-wrap .react-datepicker__year-dropdown {
        background: #fff !important;
        border-radius: 8px !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 4px 18px rgba(0,0,0,.12) !important;
      }
      .ba-dp-wrap .react-datepicker__month-option:hover,
      .ba-dp-wrap .react-datepicker__year-option:hover { background: #e0f2fe !important; }
      .ba-dp-wrap .react-datepicker__month-select,
      .ba-dp-wrap .react-datepicker__year-select {
        background: rgba(255,255,255,.15) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.3) !important;
        border-radius: 6px !important;
        padding: 2px 4px !important;
        font-size: .78rem !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }
      .ba-dp-wrap .react-datepicker__input-container { display: block; width: 100%; }
    `}</style>
    <div className="ba-dp-wrap">
      <DatePicker
        selected={strToDate(value)}
        onChange={(date) => onChange(dateToStr(date))}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        customInput={<CustomDateInput placeholder={placeholder} />}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={10}
        minDate={minDate || null}
        popperPlacement="bottom-start"
        popperModifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
      />
    </div>
  </>
);

// ─── Role Badge Colors ────────────────────────────────────────────────────────
const ROLE_BADGE_COLORS = {
  manager:   { bg: "#dbeafe", color: "#1d4ed8" },
  manager2:  { bg: "#dbeafe", color: "#1d4ed8" },
  manager3:  { bg: "#dbeafe", color: "#1d4ed8" },
  employee:  { bg: "#f1f5f9", color: "#475569" },
  employee2: { bg: "#f1f5f9", color: "#475569" },
  employee3: { bg: "#f1f5f9", color: "#475569" },
  admin:     { bg: "#f3e8ff", color: "#7e22ce" },
  ceo:       { bg: "#fef9c3", color: "#854d0e" },
  hr:        { bg: "#dcfce7", color: "#15803d" },
};

// ─── Step Progress Pill ───────────────────────────────────────────────────────
const StepPill = ({ n, label, done, last }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: done ? "rgba(34,197,94,.25)" : "rgba(255,255,255,.15)",
      border: `1.5px solid ${done ? "#22c55e" : "rgba(255,255,255,.3)"}`,
      borderRadius: 20, padding: "4px 12px 4px 6px",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: done ? "#22c55e" : "rgba(255,255,255,.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "0.7rem", color: "#fff", flexShrink: 0,
      }}>
        {done ? "✓" : n}
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: done ? "#86efac" : "rgba(255,255,255,.8)" }}>
        {label}
      </span>
    </div>
    {!last && <div style={{ width: 16, height: 1.5, background: "rgba(255,255,255,.25)", borderRadius: 2 }} />}
  </div>
);

// ─── User Card List ───────────────────────────────────────────────────────────
const UserCardList = ({ users, selected, onToggle, searchVal, onSearch, placeholder }) => (
  <div>
    <div style={{ position: "relative", marginBottom: 8 }}>
      <span style={{
        position: "absolute", left: 10, top: "50%",
        transform: "translateY(-50%)",
        display: "flex", alignItems: "center",
        pointerEvents: "none",
      }}>
        <SearchIcon />
      </span>
      <input
        type="text"
        value={searchVal}
        onChange={e => onSearch(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 12px 8px 34px",
          borderRadius: 8,
          border: "1px solid var(--border-color)",
          background: "var(--bg-color)",
          color: "var(--text-color)",
          fontSize: ".82rem",
          boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
      {users.length === 0
        ? <div style={{ textAlign: "center", color: "#94a3b8", fontSize: ".8rem", padding: "18px 0" }}>ไม่พบรายชื่อจากการค้นหา</div>
        : users.map(u => {
            const name  = u.username || u.name || u.displayName || `User-${u.id}`;
            const isSel = selected.includes(name);
            const rc    = ROLE_BADGE_COLORS[(u.role || "").toLowerCase()] || { bg: "#f1f5f9", color: "#475569" };
            return (
              <div
                key={u.id || name}
                onClick={() => onToggle(name)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${isSel ? "#22c55e" : "var(--border-color)"}`,
                  background: isSel ? "#f0fdf4" : "var(--card-bg)",
                  transition: "all .18s", userSelect: "none",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: isSel ? "#22c55e" : `hsl(${(name.charCodeAt(0) * 37) % 360},55%,48%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: ".78rem",
                }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".84rem", color: "var(--text-color)" }}>{name}</div>
                  {u.role && (
                    <span style={{ fontSize: ".68rem", fontWeight: 600, padding: "1px 8px", borderRadius: 20, background: rc.bg, color: rc.color }}>
                      {u.role}
                    </span>
                  )}
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${isSel ? "#22c55e" : "#cbd5e1"}`,
                  background: isSel ? "#22c55e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: ".75rem", fontWeight: 800, transition: "all .18s",
                }}>
                  {isSel ? "✓" : ""}
                </div>
              </div>
            );
          })}
    </div>
    {selected.length > 0 && (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border-color)", display: "flex", flexWrap: "wrap", gap: 5 }}>
        {selected.map(name => (
          <div key={name} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#dcfce7", color: "#15803d",
            borderRadius: 20, padding: "3px 10px 3px 6px",
            fontSize: ".74rem", fontWeight: 700, border: "1px solid #86efac",
          }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#15803d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 800, flexShrink: 0 }}>
              {name.slice(0, 2).toUpperCase()}
            </div>
            {name}
            <span
              onClick={e => { e.stopPropagation(); onToggle(name); }}
              style={{ cursor: "pointer", opacity: .55, fontSize: ".8rem", lineHeight: 1 }}
            >✕</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
function ManagerDashboard({ currentUser }) {
  const { canRead, canUpdate } = usePermissions(currentUser, "manager_dashboard");

  const [activeTab, setActiveTab]         = useState("new_projects");
  const [newProjects, setNewProjects]     = useState([]);
  const [phaseRequests, setPhaseRequests] = useState([]);
  const [userDirectory, setUserDirectory] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);

  const [sortBy, setSortBy]       = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest]         = useState(null);

  const [managerSearch, setManagerSearch]   = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [assignFormData, setAssignFormData] = useState({
    glsManagers: [],
    assignees:   [],
    priority:    "Medium",
    remark:      "",
    baStartDate: "",
    baEndDate:   "",
    manDay:      "",
  });

  // ── Load user directory ──────────────────────────────────────────────────────
  const loadUserDirectory = useCallback(async () => {
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      const response = await fetch("http://localhost:4000/api/users", {
        headers: { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });
      if (response.ok) {
        const result = await response.json();
        let usersArray = [];
        if (Array.isArray(result))                             usersArray = result;
        else if (result?.rows  && Array.isArray(result.rows))  usersArray = result.rows;
        else if (result?.data  && Array.isArray(result.data))  usersArray = result.data;
        else if (result?.users && Array.isArray(result.users)) usersArray = result.users;
        setUserDirectory(usersArray);
      }
    } catch (e) {
      console.error("Network Error:", e);
    }
  }, []);

  // ── Load projects ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      if (token) {
        const allProjects = await fetchProjects(token);
        const safeProjects = allProjects.map((p) => {
          let parsedForm = p.form_data;
          if (typeof parsedForm === "string") {
            try { parsedForm = JSON.parse(parsedForm); } catch { parsedForm = {}; }
          }
          let parsedTimeline = p.timeline;
          if (typeof parsedTimeline === "string") {
            try { parsedTimeline = JSON.parse(parsedTimeline); } catch { parsedTimeline = {}; }
          }
          if (!parsedTimeline || Object.keys(parsedTimeline).length === 0)
            parsedTimeline = parsedForm?.timeline || {};
          return { ...p, form_data: parsedForm || {}, timeline: parsedTimeline || {} };
        });

        // 🌟 แก้ไข: New Projects แสดงเฉพาะโปรเจกต์ที่เราระบุชื่อเป็นหัวหน้าเท่านั้น!
        const myName = currentUser?.username || "";
        
        setNewProjects(safeProjects.filter(p => {
          if (p.status !== "Pending Approval") return false;
          
          // เช็คว่า user ปัจจุบันอยู่ในรายชื่อ glsManagers ที่เลือกมาจาก RequestForm หรือไม่
          const reqGlsManagers = Array.isArray(p.form_data?.glsManagers) ? p.form_data.glsManagers : [];
          return reqGlsManagers.includes(myName);
        }));

        // 🌟 แก้ไข: Phase Requests แสดงเฉพาะหัวหน้างาน (ตัดสิทธิ์ Assignees ไม่ให้อนุมัติงานตัวเองได้)
        setPhaseRequests(safeProjects.filter((p) => {
          const isPending =
            p.status !== "Pending Approval" &&
            (p.form_data?.tracking?.isPendingApproval === true ||
              String(p.form_data?.tracking?.isPendingApproval).toLowerCase() === "true");
          if (!isPending) return false;
          
          const gls  = Array.isArray(p.form_data?.glsManagers) ? p.form_data.glsManagers : [];
          const trackingManagerStr = p.form_data?.tracking?.glsManager || "";
          const projectManagerStr = p.form_data?.projectManager || "";
          const ownerStr = p.form_data?.tracking?.glsOwner || "";

          // ❌ ไม่ให้ผู้ปฏิบัติงาน (Assignees) อนุมัติเฟสเองอีกต่อไป
          return gls.includes(myName) ||
            trackingManagerStr.includes(myName) ||
            projectManagerStr.includes(myName) ||
            ownerStr.includes(myName);
        }));
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลโครงการได้", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); loadUserDirectory(); }, [loadData, loadUserDirectory]);

  // ── Sort ──────────────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const sortData = (data) => [...data].sort((a, b) => {
    let av = a[sortBy] || a.form_data?.[sortBy] || "";
    let bv = b[sortBy] || b.form_data?.[sortBy] || "";
    if (sortBy === "created_at" || sortBy === "updated_at") {
      av = new Date(a[sortBy] || 0).getTime();
      bv = new Date(b[sortBy] || 0).getTime();
    }
    if (typeof av === "string") return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortOrder === "asc" ? av - bv : bv - av;
  });

  const displayedData  = sortData(activeTab === "new_projects" ? newProjects : phaseRequests);
  const filteredManagers  = userDirectory.filter(u => (u.username || u.name || u.displayName || "").toLowerCase().includes(managerSearch.toLowerCase()));
  const filteredAssignees = userDirectory.filter(u => (u.username || u.name || u.displayName || "").toLowerCase().includes(assigneeSearch.toLowerCase()));

  // ── Toggles ───────────────────────────────────────────────────────────────────
  const toggleGlsManager = (name) => setAssignFormData(p => ({
    ...p, glsManagers: p.glsManagers.includes(name) ? p.glsManagers.filter(x => x !== name) : [...p.glsManagers, name],
  }));
  const toggleAssignee = (name) => setAssignFormData(p => ({
    ...p, assignees: p.assignees.includes(name) ? p.assignees.filter(x => x !== name) : [...p.assignees, name],
  }));

  // ── Open Modal ────────────────────────────────────────────────────────────────
  const handleOpenApproveModal = (req) => {
    setSelectedRequest(req);
    setAssignFormData({
      glsManagers: req.form_data?.glsManagers || [],
      assignees:   req.form_data?.assignees   || [],
      priority:    req.form_data?.priority    || "Medium",
      remark:      req.form_data?.tracking?.remark || "",
      baStartDate: req.form_data?.compliance?.baStartDate || "",
      baEndDate:   req.form_data?.compliance?.baEndDate   || "",
      manDay:      req.form_data?.compliance?.manDay      || "",
    });
    setManagerSearch(""); setAssigneeSearch("");
    setIsApprovalModalOpen(true);
  };

  // ── Approve New Project ───────────────────────────────────────────────────────
  const handleConfirmApproveNewProject = async () => {
    if (
      assignFormData.glsManagers.length === 0 || assignFormData.assignees.length === 0 ||
      !assignFormData.baStartDate || !assignFormData.baEndDate || !assignFormData.manDay
    ) return Swal.fire("แจ้งเตือน", "กรุณาระบุกลุ่มหัวหน้า, กลุ่มผู้รับผิดชอบ, กรอบเวลา และ Man-Day ให้ครบถ้วน", "warning");

    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      let currentPool = selectedRequest.form_data?.approvalPool || [];
      if (!currentPool.includes(currentUser.username)) currentPool.push(currentUser.username);

      const allManagersApproved = assignFormData.glsManagers.every(m => currentPool.includes(m));
      const finalStatus = allManagersApproved ? "Active" : "Pending Approval";

      const finalFormData = {
        ...selectedRequest.form_data,
        ...assignFormData,
        assignedBy: selectedRequest.form_data?.assignedBy || currentUser.username,
        approvalPool: currentPool,
        tracking: {
          ...selectedRequest.form_data?.tracking,
          appName:    selectedRequest.name,
          glsManager: assignFormData.glsManagers.join(", "),
          remark:     assignFormData.remark,
        },
        compliance: {
          ...(selectedRequest.form_data?.compliance || {}),
          baStartDate: assignFormData.baStartDate,
          baEndDate:   assignFormData.baEndDate,
          manDay:      assignFormData.manDay,
        },
      };

      await updateProjectInDb(selectedRequest.id, {
        status:    finalStatus,
        phase:     selectedRequest.phase || "Requirement",
        form_data: JSON.stringify(finalFormData),
        timeline:  typeof selectedRequest.timeline === "object"
          ? JSON.stringify(selectedRequest.timeline || {}) : selectedRequest.timeline,
      }, null, token);

      finalStatus === "Active"
        ? Swal.fire("สำเร็จ!", "หัวหน้าโครงการลงนามครบทุกคนเรียบร้อย! โครงการเริ่มงานสถานะ Active ทันที", "success")
        : Swal.fire("บันทึกการลงนามสำเร็จ", `คุณอนุมัติเรียบร้อยแล้ว (${currentPool.length}/${assignFormData.glsManagers.length} คน) รอหัวหน้าท่านอื่นร่วมลงนามให้ครบ`, "info");

      setIsApprovalModalOpen(false); loadData();
    } catch (error) { Swal.fire("ข้อผิดพลาด", error.message, "error"); }
  };

  // ── Reject New Project ────────────────────────────────────────────────────────
  const handleConfirmRejectNewProject = async () => {
    const result = await Swal.fire({
      title: "ปฏิเสธโครงการ?", text: "ระบบจะยกเลิกคำขอเปิดโครงการและส่งกลับคืนทันที",
      input: "text", inputPlaceholder: "ระบุเหตุผลการปฏิเสธ...", icon: "warning",
      showCancelButton: true, confirmButtonText: "❌ ยืนยันปฏิเสธ",
      cancelButtonText: "กลับ", confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      await approveProjectRequest(selectedRequest.id, {
        status: "Rejected",
        remark: `[โดนปฏิเสธโดย ${currentUser.username}]: ${result.value || "ไม่ระบุเหตุผล"}`,
      }, token);
      Swal.fire("สำเร็จ", "ปฏิเสธคำขอโครงการเรียบร้อยแล้ว", "success");
      setIsApprovalModalOpen(false); loadData();
    } catch (error) { Swal.fire("ข้อผิดพลาด", error.message, "error"); }
  };

  // ── Approve Phase ─────────────────────────────────────────────────────────────
  const handleApprovePhaseChange = async (req) => {
    const phaseToApprove = req.form_data?.tracking?.pendingPhase;
    const targetStatus   = req.form_data?.tracking?.pendingStatus;
    const commentMessage = document.getElementById(`workspace-remark-${req.id}`)?.value || "";
    const result = await Swal.fire({
      title: `อนุมัติปิดเฟส ${phaseToApprove}?`, text: "พิจารณาหลักฐานเรียบร้อยและอนุมัติให้ผ่านด่าน",
      icon: "question", showCancelButton: true, confirmButtonText: "✅ ยืนยันอนุมัติ",
      cancelButtonText: "ยกเลิก", confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      const upd = JSON.parse(JSON.stringify(req));
      if (phaseToApprove && upd.timeline[phaseToApprove]) {
        upd.timeline[phaseToApprove].status = "Completed";
        if (!upd.timeline[phaseToApprove].actualEnd)
          upd.timeline[phaseToApprove].actualEnd = new Date().toISOString().split("T")[0];
      }
      if (targetStatus === "Completed") { upd.status = "Completed"; upd.phase = "Go-live"; }
      else {
        upd.status = "Active";
        const next = { Requirement: "Preparation", Preparation: "Development", Development: "UAT", UAT: "Go-live" };
        if (next[phaseToApprove]) upd.phase = next[phaseToApprove];
      }
      upd.form_data.tracking.isPendingApproval = false;
      upd.form_data.tracking.pendingPhase      = null;
      upd.form_data.tracking.pendingStatus     = null;
      upd.form_data.tracking.remark = `[อนุมัติโดย ${currentUser.username}]: ${commentMessage || "งานผ่านเกณฑ์มาตรฐานเรียบร้อย"}`;
      await updateProjectInDb(req.id, { ...upd, updated_at: new Date().toISOString(), timeline: JSON.stringify(upd.timeline), form_data: JSON.stringify({ ...upd.form_data, timeline: upd.timeline }) }, null, token);
      Swal.fire("สำเร็จ!", `อนุมัติปิดเฟส ${phaseToApprove} เรียบร้อยแล้ว`, "success"); loadData();
    } catch (error) { Swal.fire("เกิดข้อผิดพลาด", error.message, "error"); }
  };

  // ── Reject Phase ──────────────────────────────────────────────────────────────
  const handleRejectPhaseChange = async (req) => {
    const phaseToApprove = req.form_data?.tracking?.pendingPhase;
    const result = await Swal.fire({
      title: "ตีกลับแผนงาน (Reject Phase)", text: `ปฏิเสธคำขอปิดด่าน ${phaseToApprove}`,
      input: "text", inputPlaceholder: "ระบุข้อแนะนำและสิ่งที่ต้องแก้ไข...", icon: "warning",
      showCancelButton: true, confirmButtonText: "❌ ส่งกลับไปแก้ไข",
      cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      const upd = JSON.parse(JSON.stringify(req));
      upd.form_data.tracking.isPendingApproval = false;
      upd.form_data.tracking.pendingPhase      = null;
      upd.form_data.tracking.pendingStatus     = null;
      upd.form_data.tracking.remark = `[ตีกลับโดย ${currentUser.username}]: ${result.value || "ไม่ระบุเหตุผล"}`;
      if (phaseToApprove && upd.timeline[phaseToApprove]) upd.timeline[phaseToApprove].actualEnd = null;
      await updateProjectInDb(req.id, { ...upd, updated_at: new Date().toISOString(), timeline: JSON.stringify(upd.timeline), form_data: JSON.stringify(upd.form_data) }, null, token);
      Swal.fire("ตีกลับสำเร็จ", "ส่งกลับไปที่หน้า Workspace ของทีมแล้ว", "success"); loadData();
    } catch (error) { Swal.fire("เกิดข้อผิดพลาด", error.message, "error"); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const SortableHeader = ({ label, columnKey, align = "left" }) => {
    const isActive = sortBy === columnKey;
    return (
      <th onClick={() => handleSort(columnKey)} style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: isActive ? "var(--blue)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", textAlign: align, background: isActive ? "rgba(2,132,199,0.05)" : "transparent", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: align === "center" ? "center" : "flex-start", gap: 6 }}>
          {label}
          <span style={{ color: isActive ? "var(--blue)" : "#cbd5e1" }}>
            {isActive ? (sortOrder === "asc" ? <SortUpIcon /> : <SortDownIcon />) : <SortDefaultIcon />}
          </span>
        </div>
      </th>
    );
  };

  const formatDateTH = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const step1Done    = assignFormData.glsManagers.length > 0;
  const step2Done    = assignFormData.assignees.length > 0;
  const step3Done    = !!assignFormData.baStartDate && !!assignFormData.baEndDate && !!assignFormData.manDay;
  const allStepsDone = step1Done && step2Done && step3Done;

  if (!canRead) return (
    <div style={{ padding: "100px", textAlign: "center", color: "#ef4444", minHeight: "80vh" }}>
      <h2>⛔ Access Denied</h2><p>คุณไม่มีสิทธิ์เข้าถึงหน้า Manager Dashboard</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrap" style={{ gap: "24px" }}>

      <div>
        <h1 className="page-heading" style={{ margin: "0 0 8px 0" }}>Manager Dashboard</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>ระบบคัดแยกคำขอ มอบหมายกลุ่มทีมรับผิดชอบ และพิจารณาลงนามอนุมัติร่วมกัน</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid var(--border-color)", paddingBottom: "12px" }}>
        {[          { key: "new_projects",   label: "📄 คำขอเปิดโครงการใหม่",                count: newProjects.length },          { key: "phase_requests", label: "🔄 คำขออนุมัติจบเฟสงาน (ในทีมรับผิดชอบ)", count: phaseRequests.length },        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "10px 20px", border: "none", background: activeTab === tab.key ? "var(--blue)" : "var(--card-bg)", color: activeTab === tab.key ? "#fff" : "var(--text-muted)", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {tab.label}
            {tab.count > 0 && <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: ".75rem" }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ width: "100%", overflowX: "auto", background: "var(--card-bg)", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</div>
        ) : displayedData.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: .3 }}>🎉</div>
            <h3 style={{ margin: 0 }}>ไม่มีงานค้างการตัดสินใจ</h3>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <SortableHeader label="รหัสคำขอ"   columnKey="id" />
                <SortableHeader label="ชื่อโครงการ" columnKey="name" />
                {activeTab === "new_projects" ? (
                  <SortableHeader label="ผู้ส่งคำขอ" columnKey="created_at" />
                ) : (
                  <>
                    <SortableHeader label="เฟสที่ขอจบงาน" columnKey="phase" />
                    <th style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: ".75rem", fontWeight: 800, textAlign: "center" }}>หมายเหตุ</th>
                  </>
                )}
                <SortableHeader label="สถานะ" columnKey="status" />
                {canUpdate && <th style={{ padding: "16px 14px", borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: ".75rem", fontWeight: 700, textAlign: "center" }}>การจัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {displayedData.map(req => (
                <tr key={req.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "16px 14px", fontWeight: 700, fontSize: ".85rem" }}>{req.form_data?.requestId || req.id}</td>
                  <td style={{ padding: "16px 14px", fontSize: ".85rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--blue)" }}>{req.name}</div>
                    {req.form_data?.glsManagers?.length > 0 && (
                      <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: 4 }}>
                        <strong>หัวร่วมคุม:</strong> {Array.isArray(req.form_data.glsManagers) ? req.form_data.glsManagers.join(", ") : req.form_data.glsManagers}
                      </div>
                    )}
                  </td>

                  {activeTab === "new_projects" ? (
                    <td style={{ padding: "16px 14px", fontSize: ".85rem" }}>
                      <div style={{ fontWeight: 600 }}>{req.form_data?.tracking?.submittedBy || req.requester_name || "-"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: ".75rem" }}>{formatDateTH(req.form_data?.tracking?.submittedAt || req.created_at)}</div>
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: "16px 14px", fontSize: ".85rem" }}>
                        <div style={{ fontWeight: "bold", color: "#d97706" }}>{req.form_data?.tracking?.pendingPhase || "-"}</div>
                        {req.form_data?.tracking?.progressFile && (
                          <a href={`http://localhost:4000/${req.form_data.tracking.progressFile.replace(/\\/g, "/")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "4px 8px", background: "rgba(2,132,199,0.1)", color: "var(--blue)", borderRadius: 4, fontSize: ".75rem", textDecoration: "none", fontWeight: "bold" }}>
                            📄 ดูไฟล์หลักฐาน
                          </a>
                        )}
                      </td>
                      <td style={{ padding: "16px 14px", textAlign: "center" }}>
                        <input type="text" id={`workspace-remark-${req.id}`} placeholder="พิมพ์ข้อความ/หมายเหตุ..." style={{ width: "90%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-color)", fontSize: ".8rem" }} />
                      </td>
                    </>
                  )}

                  <td style={{ padding: "16px 14px", fontSize: ".85rem" }}>
                    <span style={{ padding: "6px 12px", background: "#fef3c7", color: "#b45309", borderRadius: 20, fontWeight: "bold", fontSize: ".75rem" }}>
                      {activeTab === "new_projects" ? "รอลงนามรับงาน" : "รอตรวจสอบปิดเฟส"}
                    </span>
                  </td>

                  {canUpdate && (
                    <td style={{ padding: "16px 14px", textAlign: "center" }}>
                      {activeTab === "new_projects" ? (
                        <button onClick={() => handleOpenApproveModal(req)} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--blue)", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".85rem" }}>
                          <IconCheck /> ตรวจสอบ & จ่ายงาน
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button onClick={() => handleApprovePhaseChange(req)} style={{ padding: "8px 16px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".85rem" }}>
                            <IconCheck /> ผ่านด่าน
                          </button>
                          <button onClick={() => handleRejectPhaseChange(req)} style={{ padding: "8px 16px", borderRadius: 8, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".85rem" }}>
                            <IconX /> ตีกลับ
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          Modal: จ่ายงาน
      ══════════════════════════════════════════════ */}
      {isApprovalModalOpen && selectedRequest && (
        <div className="pdf-preview-overlay" style={{ zIndex: 1050 }}>
          <div style={{ width: "90%", maxWidth: 680, maxHeight: "92vh", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,.28)", background: "var(--bg-color)" }}>

            {/* Header */}
            <div style={{ padding: "16px 24px", background: "linear-gradient(135deg,#0c4a6e,#0284c7)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>พิจารณาอนุมัติจ่ายงานระบบไอที</div>
                <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,.7)", marginTop: 2 }}>กรุณาระบุทีมรับผิดชอบและกรอบเวลาให้ครบก่อนลงนาม</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <StepPill n={1} label="หัวหน้า"  done={step1Done} />
                <StepPill n={2} label="พนักงาน"  done={step2Done} />
                <StepPill n={3} label="กรอบเวลา" done={step3Done} last />
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} style={{ background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Project Info */}
              <div style={{ background: "var(--card-bg)", padding: "14px 18px", borderRadius: 14, border: "1.5px solid var(--border-color)" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>📋 โครงสร้างโปรเจกต์</div>
                <div style={{ fontWeight: 800, color: "var(--blue)", fontSize: ".95rem" }}>{selectedRequest.name}</div>
                <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  ส่งคำขอโดย: <strong>{selectedRequest.form_data?.tracking?.submittedBy || selectedRequest.form_data?.requesterName}</strong>
                  &nbsp;·&nbsp;รหัส: <strong>{selectedRequest.form_data?.requestId || selectedRequest.id}</strong>
                </div>
              </div>

              {/* Step 1 */}
              <div style={{ background: "var(--card-bg)", borderRadius: 14, border: `1.5px solid ${step1Done ? "#22c55e" : "#bae6fd"}`, padding: "14px 16px", transition: "border-color .3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: step1Done ? "#22c55e" : "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".82rem", flexShrink: 0 }}>{step1Done ? "✓" : "1"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: ".88rem", color: step1Done ? "#15803d" : "#0284c7" }}>เลือกรายชื่อกลุ่มหัวหน้าโครงการคุมงาน <span style={{ color: "#ef4444" }}>*</span></div>
                    <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>คลิกที่การ์ดเพื่อเลือก — สามารถเลือกได้หลายคน</div>
                  </div>
                  {step1Done && <div style={{ background: "#22c55e", color: "#fff", borderRadius: 20, padding: "3px 11px", fontSize: ".72rem", fontWeight: 800, flexShrink: 0 }}>เลือกแล้ว {assignFormData.glsManagers.length} คน</div>}
                </div>
                <UserCardList users={filteredManagers} selected={assignFormData.glsManagers} onToggle={toggleGlsManager} searchVal={managerSearch} onSearch={setManagerSearch} placeholder="ค้นหาชื่อหัวหน้า..." />
              </div>

              {/* Step 2 */}
              <div style={{ background: "var(--card-bg)", borderRadius: 14, border: `1.5px solid ${step2Done ? "#22c55e" : "var(--border-color)"}`, padding: "14px 16px", transition: "border-color .3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: step2Done ? "#22c55e" : "#94a3b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".82rem", flexShrink: 0 }}>{step2Done ? "✓" : "2"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: ".88rem", color: step2Done ? "#15803d" : "var(--text-color)" }}>เลือกรายชื่อกลุ่มพนักงานรับผิดชอบหลัก <span style={{ color: "#ef4444" }}>*</span></div>
                    <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>คลิกที่การ์ดเพื่อเลือก — สามารถเลือกได้หลายคน</div>
                  </div>
                  {step2Done && <div style={{ background: "#22c55e", color: "#fff", borderRadius: 20, padding: "3px 11px", fontSize: ".72rem", fontWeight: 800, flexShrink: 0 }}>เลือกแล้ว {assignFormData.assignees.length} คน</div>}
                </div>
                <UserCardList users={filteredAssignees} selected={assignFormData.assignees} onToggle={toggleAssignee} searchVal={assigneeSearch} onSearch={setAssigneeSearch} placeholder="ค้นหาชื่อผู้ปฏิบัติงาน..." />
              </div>

              {/* Step 3: Calendar DatePicker */}
              <div style={{ background: step3Done ? "#f0fdf4" : "rgba(16,185,129,.04)", borderRadius: 14, border: `1.5px solid ${step3Done ? "#22c55e" : "rgba(16,185,129,.3)"}`, padding: "14px 16px", transition: "border-color .3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: step3Done ? "#22c55e" : "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".82rem", flexShrink: 0 }}>{step3Done ? "✓" : "3"}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".88rem", color: step3Done ? "#15803d" : "#059669" }}>กำหนดกรอบเวลาพัฒนาและ Man-Day <span style={{ color: "#ef4444" }}>*</span></div>
                    <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>ระบบคำนวณวันทำงาน จ.–ศ. อัตโนมัติ · แสดงผลเป็น วว/ดด/ปปปป</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: ".75rem", color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 600 }}>📅 วันเริ่มโครงการ (Plan Start)</label>
                    <BaDatePicker
                      value={assignFormData.baStartDate}
                      placeholder="เลือกวันเริ่มต้น"
                      onChange={(val) => {
                        const days = calculateWorkingDays(val, assignFormData.baEndDate);
                        setAssignFormData(p => ({ ...p, baStartDate: val, manDay: days !== "" ? days : p.manDay }));
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: ".75rem", color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 600 }}>📅 วันสิ้นสุดโครงการ (Plan End)</label>
                    <BaDatePicker
                      value={assignFormData.baEndDate}
                      placeholder="เลือกวันสิ้นสุด"
                      minDate={strToDate(assignFormData.baStartDate)}
                      onChange={(val) => {
                        const days = calculateWorkingDays(assignFormData.baStartDate, val);
                        setAssignFormData(p => ({ ...p, baEndDate: val, manDay: days !== "" ? days : p.manDay }));
                      }}
                    />
                  </div>
                </div>

                {/* Man-Day summary */}
                <div style={{ background: step3Done ? "rgba(34,197,94,.08)" : "rgba(16,185,129,.06)", borderRadius: 10, padding: "10px 14px", border: `1px dashed ${step3Done ? "#86efac" : "rgba(16,185,129,.3)"}` }}>
                  <label style={{ fontSize: ".75rem", color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 600 }}>🗓️ Total Man-Day (วันทำงาน จ.–ศ.)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      placeholder="คำนวณอัตโนมัติ (แก้ไขได้)"
                      value={assignFormData.manDay}
                      onChange={(e) => setAssignFormData(p => ({ ...p, manDay: e.target.value }))}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-color)", boxSizing: "border-box", fontSize: ".85rem", fontWeight: 700 }}
                    />
                    {step3Done && (
                      <div style={{ background: "#22c55e", color: "#fff", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: ".85rem", whiteSpace: "nowrap" }}>
                        {assignFormData.manDay} วัน
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#059669", marginTop: 6 }}>
                    * ปรับแก้ตัวเลขได้หากมีวันหยุดนักขัตฤกษ์เพิ่มเติม
                  </div>
                </div>
              </div>

              {/* Step 4: Remark */}
              <div style={{ background: "var(--card-bg)", borderRadius: 14, border: "1.5px solid var(--border-color)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#94a3b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".82rem", flexShrink: 0 }}>4</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".88rem", color: "var(--text-color)" }}>บันทึกหมายเหตุสั่งสารเพิ่มเติม</div>
                    <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>ไม่บังคับ — จะแสดงในหน้า Workspace ของทีม</div>
                  </div>
                </div>
                <textarea
                  rows="2"
                  value={assignFormData.remark}
                  onChange={(e) => setAssignFormData(p => ({ ...p, remark: e.target.value }))}
                  placeholder="พิมพ์ข้อความสั่งสารถึงทีมงาน..."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-color)", outline: "none", resize: "vertical", boxSizing: "border-box", fontSize: ".84rem" }}
                />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: "13px 24px", borderTop: "1px solid var(--border-color)", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
                {allStepsDone
                  ? "✅ ครบถ้วนแล้ว พร้อมลงนามอนุมัติ"
                  : `⚠️ กรุณาระบุ${!step1Done ? "กลุ่มหัวหน้า (ขั้น 1)" : !step2Done ? "กลุ่มพนักงาน (ขั้น 2)" : "กรอบเวลา และ Man-Day (ขั้น 3)"}`}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button type="button" onClick={handleConfirmRejectNewProject} style={{ padding: "9px 18px", background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}>
                  ❌ ปฏิเสธคำขอ
                </button>
                <button type="button" onClick={() => setIsApprovalModalOpen(false)} style={{ padding: "9px 18px", background: "var(--card-bg)", color: "var(--text-muted)", border: "1.5px solid var(--border-color)", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproveNewProject}
                  disabled={!allStepsDone}
                  style={{ padding: "9px 28px", border: "none", borderRadius: 10, background: allStepsDone ? "linear-gradient(135deg,#0284c7,#0369a1)" : "#e2e8f0", color: allStepsDone ? "#fff" : "#94a3b8", fontWeight: 800, fontSize: ".88rem", cursor: allStepsDone ? "pointer" : "not-allowed", boxShadow: allStepsDone ? "0 4px 14px rgba(2,132,199,.35)" : "none", transition: "all .2s" }}
                >
                  ✅ ยืนยันอนุมัติลงนาม
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ManagerDashboard;