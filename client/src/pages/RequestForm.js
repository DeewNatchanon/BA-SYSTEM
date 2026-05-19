import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pdf } from "@react-pdf/renderer";
import RequestFormPdf from "../pdf/RequestFormPdf";
import { submitProjectRequest } from "../api/authApi";
import Swal from "sweetalert2";
import { usePermissions } from "../hooks/usePermissions";

function RequestForm({ currentUser }) {
  const { canCreate } = usePermissions(currentUser, "request_form");

  const createBlankCost = () => ({
    item: "",
    qty: "",
    cost: "",
    paymentDate: "",
  });

  const normalizeProjectCosts = (costs = []) => {
    const normalized = costs.map((cost) => ({
      item: cost.item || "",
      qty: cost.qty || "",
      cost: cost.cost || "",
      paymentDate: cost.paymentDate || "",
    }));
    return normalized.length ? normalized : [createBlankCost()];
  };

  const initialFormData = {
    requestId: "",
    requestDate: new Date().toISOString().split("T")[0],
    requesterName: "",
    requesterDept: "",
    requesterGroup: "",
    requesterSite: "",
    requesterTel: "",
    emergencyHOD: "",
    projectName: "",
    projectDetail: "",
    requirementDetail: "",
    targetUser: "",
    useDept: "",
    companyName: "",
    expectedOutcome: "",
    budgetSources: "",
    anticipatedDate: "",
    otherRemark: "",
    reqSign1: "",
    reqSign2: "",
    reqSign3: "",
    reqSign4: "",
    reqSign5: "",
    status: "",
    projectCategory: [],
    projectType: [],
    impactNewHISB: "No",
    impactHISBApp: "",
    impactAnalysis: "",
    interfaceWith: "",
    resources: [],
    vendor1Name: "",
    vendor2Name: "",
    projectManager: "",
    glsManagers: [],
    timelineStartDate: "",
    timelineEndDate: "",
    projectCosts: normalizeProjectCosts(),
    deploySite: "",
    preparedBy: "",
    approvedBy: "",
    tracking: {},
  };

  const loadInitialData = () => {
    const draft = localStorage.getItem("ba-system.request-draft");
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        return {
          ...initialFormData,
          ...parsedDraft,
          projectCosts: normalizeProjectCosts(parsedDraft.projectCosts),
          glsManagers: parsedDraft.glsManagers || [],
        };
      } catch (e) {
        return initialFormData;
      }
    }
    return initialFormData;
  };

  const [formData, setFormData] = useState(loadInitialData);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userDirectory, setUserDirectory] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");

  const resizeAllTextareas = () => {
    const nodes = document.querySelectorAll(".request-form textarea");
    nodes.forEach((node) => {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    });
  };

  useEffect(() => {
    localStorage.setItem("ba-system.request-draft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    resizeAllTextareas();
  }, [formData]);

  // 🌟 ดึงข้อมูลผู้ใช้งานในระบบ (เพิ่มการดักจับ result.rows ของ PostgreSQL)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const sessionRaw = localStorage.getItem("ba-system.auth-session");
        const token = sessionRaw ? JSON.parse(sessionRaw).token : null;

        const res = await fetch("http://localhost:4000/api/users", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const result = await res.json();

          let usersArray = [];
          if (Array.isArray(result)) {
            usersArray = result;
          } else if (result && result.rows && Array.isArray(result.rows)) {
            usersArray = result.rows;
          } else if (result && result.data && Array.isArray(result.data)) {
            usersArray = result.data;
          } else if (result && result.users && Array.isArray(result.users)) {
            usersArray = result.users;
          }

          setUserDirectory(usersArray);
        } else {
          console.error("API Error: ไม่สามารถดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์ได้");
        }
      } catch (e) {
        console.error("Network Error: ไม่สามารถเชื่อมต่อกับฐานข้อมูลผู้ใช้ได้", e);
      }
    };
    loadUsers();
  }, []);

  // 🌟 ฟิลเตอร์รายชื่อหัวหน้าตามคำค้นหา
  const filteredManagers = userDirectory.filter((u) => {
    const staffName = u.username || u.name || u.displayName || "";
    return staffName.toLowerCase().includes(managerSearch.toLowerCase());
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    if (formData.impactNewHISB !== "Yes")
      setFormData((prev) => ({
        ...prev,
        impactHISBApp: "",
        impactAnalysis: "",
      }));
  }, [formData.impactNewHISB]);

  const handleCheckboxChange = (name, option) => {
    setFormData((prev) => {
      const current = prev[name] || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, [name]: updated };
    });
  };

  const handleProjectCostChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.projectCosts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projectCosts: updated };
    });
  };

  const handleAddProjectCost = () => {
    setFormData((prev) => ({
      ...prev,
      projectCosts: [...prev.projectCosts, createBlankCost()],
    }));
  };

  const handleRemoveProjectCost = (index) => {
    setFormData((prev) => {
      const updated = prev.projectCosts.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        projectCosts: updated.length ? updated : normalizeProjectCosts([]),
      };
    });
  };

  const toIsoDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toDate = (value) => (value ? new Date(value) : null);

  const showVendorFields =
    formData.resources.includes("GLS จ้าง Vendor") ||
    formData.resources.includes("โรงพยาบาลจ้าง Vendor");

  const handleClearForm = () => {
    Swal.fire({
      title: "ล้างข้อมูล?",
      text: "คุณต้องการล้างข้อมูลทั้งหมดในฟอร์มใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ล้างข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("ba-system.request-draft");
        setFormData({
          ...initialFormData,
          requestDate: new Date().toISOString().split("T")[0],
        });
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleFinalSubmit = async () => {
    if (!formData.glsManagers || formData.glsManagers.length === 0) {
      return Swal.fire("แจ้งเตือน", "กรุณาระบุหัวหน้าโครงการที่จะส่งคำขออนุมัติเข้าระบบ (ขั้นตอนที่ 2)", "warning");
    }
    if (!selectedFile) {
      return Swal.fire("แจ้งเตือน", "กรุณาแนบไฟล์เอกสารอนุมัติ (ขั้นตอนที่ 3) ก่อนกดยืนยัน", "warning");
    }
    if (!currentUser || !currentUser.id) {
      return Swal.fire("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่", "error");
    }

    setIsSubmitting(true);
    try {
      const sessionRaw = localStorage.getItem("ba-system.auth-session");
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;

      // 🌟 แสตมป์ประวัติ: ระบุว่าใครเป็นคนยืนยันส่งฟอร์ม (Submitted By)
      const finalFormData = {
        ...formData,
        tracking: {
          ...(formData.tracking || {}),
          submittedBy: currentUser?.username || "Unknown",
          submittedAt: new Date().toISOString(),
          approvedBy: [],
        },
      };

      const requestData = {
        name: formData.projectName || "Untitled Project",
        site: formData.requesterSite || "N/A",
        category: formData.projectCategory.join(", ") || "N/A",
        description: formData.projectDetail || "N/A",
        status: "Pending Approval",
        requester_id: currentUser?.id,
        requester_name: currentUser?.username,
        form_data: finalFormData,
      };

      const formDataToSend = new FormData();
      formDataToSend.append("approvedDocument", selectedFile);
      formDataToSend.append("requestData", JSON.stringify(requestData));

      await submitProjectRequest(formDataToSend, token);

      Swal.fire("สำเร็จ!", "บันทึกข้อมูลและแนบไฟล์เข้าระบบ Flow สำเร็จ!", "success");
      handleCloseModal();
      localStorage.removeItem("ba-system.request-draft");
      setFormData({
        ...initialFormData,
        requestDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPdfBlob = async () => pdf(<RequestFormPdf data={formData} />).toBlob();

  const handleDownloadPreview = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `request-form-${formData.requestId || "draft"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenCombinedModal = async (e) => {
    if (e) e.preventDefault();
    setIsPreviewing(true);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsCombinedModalOpen(true);
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างพรีวิว PDF ได้", "error");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCloseModal = () => {
    setIsCombinedModalOpen(false);
    setSelectedFile(null);
    setManagerSearch("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  // ─────────────────────────────────────────────────────────
  // 🎨 UI helpers สำหรับ Modal เท่านั้น — ไม่กระทบ Logic เดิมใดๆ
  // ─────────────────────────────────────────────────────────
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
  const toggleManagerCard = (staffName) => {
    setFormData((prev) => ({
      ...prev,
      glsManagers: prev.glsManagers.includes(staffName)
        ? prev.glsManagers.filter((x) => x !== staffName)
        : [...prev.glsManagers, staffName],
    }));
  };
  // ─────────────────────────────────────────────────────────

  return (
    <div className="page-wrap page-request print-area">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="page-heading" style={{ margin: 0 }}>IT Project Request Form</h1>
      </div>
      <div className="page-rule print-hidden" />
      <form onSubmit={handleOpenCombinedModal} className="request-form">
        <div className="print-page-block">
          <section className="form-section requester-section print-keep">
            <div className="print-header">
              <img src="/logo.png" alt="Greenline Synergy" className="print-logo" />
              <div className="print-header-text">
                <div className="print-title">IT Project Request Form - Requester only</div>
                <div className="print-subtitle">Greenline Synergy</div>
              </div>
            </div>
            <div className="section-title">Requester only</div>
            <div className="form-row">
              <div className="form-group">
                <label>Request ID: <span className="note-label">(รหัสคำขอ)</span></label>
                <input type="text" name="requestId" value={formData.requestId} onChange={handleChange} placeholder="Request ID" className="print-hide-input" />
                <div className="print-only">{formData.requestId || "-"}</div>
              </div>
              <div className="form-group">
                <label>Status: <span className="note-label">(สถานะ)</span></label>
                <input type="text" name="status" value={formData.status || ""} onChange={handleChange} className="print-hide-input" />
                <div className="print-only">{formData.status || "-"}</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Request Date <span className="note-label">(วันที่ขอ)</span></label>
                <DatePicker selected={toDate(formData.requestDate)} onChange={(date) => setFormData((prev) => ({ ...prev, requestDate: toIsoDate(date) }))} dateFormat="dd/MM/yyyy" placeholderText="วัน/เดือน/ปี" className="date-input" />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Name of Requester <span className="note-label">(ชื่อของผู้ขอ)</span></label>
                <input type="text" name="requesterName" value={formData.requesterName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row details-row">
              <div className="form-group">
                <label>Dept. <span className="note-label">(แผนก)</span></label>
                <input type="text" name="requesterDept" value={formData.requesterDept} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Group <span className="note-label">(กลุ่ม)</span></label>
                <input type="text" name="requesterGroup" value={formData.requesterGroup} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Site: <span className="note-label">(ไซต์)</span></label>
                <input type="text" name="requesterSite" value={formData.requesterSite} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Tel: <span className="note-label">(เบอร์โทรศัพท์)</span></label>
                <input type="text" name="requesterTel" value={formData.requesterTel} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Project Name <span className="note-label">(ชื่อโครงการ)</span></label>
                <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Project Detail: <span className="note-label">(รายละเอียดของโครงการ)</span></label>
                <textarea name="projectDetail" rows="3" value={formData.projectDetail} onChange={handleChange} onInput={handleTextareaInput} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Requirement Detail: <span className="note-label">(รายละเอียดที่ต้องการ)</span></label>
                <textarea name="requirementDetail" rows="5" value={formData.requirementDetail} onChange={handleChange} onInput={handleTextareaInput} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Target User: <span className="note-label">(กลุ่มเป้าหมายผู้ใช้ระบบ)</span></label>
                <input type="text" name="targetUser" value={formData.targetUser} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group">
                <label>Use at Department: <span className="note-label">(แผนกที่ใช้)</span></label>
                <input type="text" name="useDept" value={formData.useDept} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Hospital/Company:<span className="note-label">(โรงพยาบาล/บริษัท)</span></label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Expected Outcome: <span className="note-label">(ผลลัพธ์ที่คาดหวังกับโครงการ)</span></label>
                <textarea name="expectedOutcome" rows="3" value={formData.expectedOutcome} onChange={handleChange} onInput={handleTextareaInput} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Budget Sources: <span className="note-label">(แหล่งที่มาของงบประมาณ)</span></label>
                <input type="text" name="budgetSources" value={formData.budgetSources} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Anticipated Date Needed: <span className="note-label">(วันที่ที่ต้องการเสร็จสิ้น)</span></label>
                <DatePicker selected={toDate(formData.anticipatedDate)} onChange={(date) => setFormData((prev) => ({ ...prev, anticipatedDate: toIsoDate(date) }))} dateFormat="dd/MM/yyyy" placeholderText="วัน/เดือน/ปี" className="date-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Other Remark: <span className="note-label">(ข้อมูลอื่นเพิ่มเติม)</span></label>
                <textarea name="otherRemark" rows="3" value={formData.otherRemark} onChange={handleChange} onInput={handleTextareaInput} />
              </div>
            </div>
            <div className="form-row approval-grid print-only-grid">
              <div className="approval-card">
                <div className="approval-title">Requested by <span className="note-label">(ผู้ร้องขอ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.reqSign1 || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Requester / IT Site Lead<br />(ผู้ขอ / หัวหน้าไซต์ IT)</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.reqSign2 || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Services & Operations Grc<br />(Or Delegated Person)</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.reqSign3 || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Service Support<br />(If any)</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.reqSign4 || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Finance<br />(If any)</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.reqSign5 || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">CIO / ผู้ที่ได้รับมอบอำนาจ</div>
              </div>
            </div>
            <div className="form-row print-hidden" style={{ marginTop: "20px" }}>
              <div className="form-group">
                <label>Requester Name <span className="note-label">(ชื่อผู้ขอ)</span></label>
                <input type="text" name="reqSign1" value={formData.reqSign1} onChange={handleChange} placeholder="ระบุชื่อผู้ขอ" />
              </div>
              <div className="form-group">
                <label>Head of Services Name <span className="note-label">(ชื่อหัวหน้าฝ่ายบริการ)</span></label>
                <input type="text" name="reqSign2" value={formData.reqSign2} onChange={handleChange} placeholder="ระบุชื่อผู้อนุมัติ" />
              </div>
              <div className="form-group">
                <label>Head of Support Name <span className="note-label">(ชื่อหัวหน้าฝ่ายสนับสนุน)</span></label>
                <input type="text" name="reqSign3" value={formData.reqSign3} onChange={handleChange} placeholder="ระบุชื่อผู้อนุมัติ" />
              </div>
            </div>
            <div className="form-row print-hidden">
              <div className="form-group">
                <label>Head of Finance Name <span className="note-label">(ชื่อหัวหน้าฝ่ายการเงิน)</span></label>
                <input type="text" name="reqSign4" value={formData.reqSign4} onChange={handleChange} placeholder="ระบุชื่อผู้อนุมัติ" />
              </div>
              <div className="form-group">
                <label>CIO Name <span className="note-label">(ชื่อผู้อำนวยการฝ่ายไอที)</span></label>
                <input type="text" name="reqSign5" value={formData.reqSign5} onChange={handleChange} placeholder="ระบุชื่อผู้อนุมัติ" />
              </div>
            </div>
          </section>
        </div>

        <section className="form-section gls-section print-break-before">
          <div className="print-header">
            <img src="/logo.png" alt="Greenline Synergy" className="print-logo" />
            <div className="print-header-text">
              <div className="print-title">IT Project Request Form - GLS IT only</div>
              <div className="print-subtitle">Greenline Synergy</div>
            </div>
          </div>
          <div className="section-title">GLS IT only</div>
          <fieldset className="role-fieldset">
            <div className="form-row">
              <div className="form-group full-width">
                <label>Project Category: <span className="note-label">(หมวดหมู่โปรเจ็ค)</span></label>
                <div className="checkbox-group">
                  {["Application", "Infrastructure Service", "Operation Service"].map((cat) => (
                    <label key={cat} className="checkbox-item">
                      <input type="checkbox" checked={formData.projectCategory.includes(cat)} onChange={() => handleCheckboxChange("projectCategory", cat)} />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Project Type: <span className="note-label">(ประเภทของโปรเจ็ค)</span></label>
                <div className="checkbox-group">
                  {["New System", "Infrastructure", "Consult (กรณีที่ IT Operation มีส่วนในการช่วยเหลือหรือให้บริการกับ Project ที่โรงพยาบาล เป็น Owner เท่านั้น)"].map((type) => (
                    <label key={type} className="checkbox-item">
                      <input type="checkbox" checked={formData.projectType.includes(type)} onChange={() => handleCheckboxChange("projectType", type)} />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group">
                <label>Impact New HISB-Connect/Listed App: <span className="note-label">(กระทบต่อระบบ New HIS)</span></label>
                <div className="radio-group">
                  {["No", "Yes"].map((option) => (
                    <label key={option} className="radio-item">
                      <input type="radio" name="impactNewHISB" value={option} checked={formData.impactNewHISB === option} onChange={handleChange} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Application Name/Site Name: <span className="note-label">(ชื่อระบบ/ไซต์)</span></label>
                <input type="text" name="impactHISBApp" placeholder="(Application Name/Site Name)" value={formData.impactHISBApp} onChange={handleChange} disabled={formData.impactNewHISB !== "Yes"} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Impact Analysis: <span className="note-label">(วิเคราะห์ผลกระทบ)</span></label>
                <textarea name="impactAnalysis" rows="3" value={formData.impactAnalysis} onChange={handleChange} onInput={handleTextareaInput} disabled={formData.impactNewHISB !== "Yes"} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Interface with: <span className="note-label">(การเชื่อมต่อกับระบบอื่น)</span></label>
                <textarea name="interfaceWith" rows="2" value={formData.interfaceWith} onChange={handleChange} onInput={handleTextareaInput} />
              </div>
            </div>
            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Resource: <span className="note-label">(ดำเนินการโดย)</span></label>
                <div className="checkbox-group">
                  {["GLS ดำเนินการเอง", "GLS จ้าง Vendor", "โรงพยาบาลจ้าง Vendor"].map((res) => (
                    <label key={res} className="checkbox-item">
                      <input type="checkbox" checked={formData.resources.includes(res)} onChange={() => handleCheckboxChange("resources", res)} />
                      {res}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {showVendorFields && (
              <div className="form-row timeline-row">
                <div className="form-group full-width">
                  <label>Vendor name <span className="note-label">(ระบุชื่อบริษัทผู้ให้บริการ)</span></label>
                  <input type="text" name="vendor1Name" placeholder="ระบุชื่อบริษัทผู้ให้บริการ" value={formData.vendor1Name} onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group full-width">
                <label>Project Manager: <span className="note-label">(ผู้รับผิดชอบโครงการ)</span></label>
                <input type="text" name="projectManager" value={formData.projectManager} onChange={handleChange} />
              </div>
            </div>

            <h4>Timeline</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date: <span className="note-label">(วันเริ่มโครงการ)</span></label>
                <DatePicker selected={toDate(formData.timelineStartDate)} onChange={(date) => setFormData((prev) => ({ ...prev, timelineStartDate: toIsoDate(date) }))} dateFormat="dd/MM/yyyy" placeholderText="วัน/เดือน/ปี" className="date-input" />
              </div>
              <div className="form-group">
                <label>End Date: <span className="note-label">(วันสิ้นสุดโครงการ)</span></label>
                <DatePicker selected={toDate(formData.timelineEndDate)} onChange={(date) => setFormData((prev) => ({ ...prev, timelineEndDate: toIsoDate(date) }))} dateFormat="dd/MM/yyyy" placeholderText="วัน/เดือน/ปี" className="date-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Project Cost: <span className="note-label">(ต้นทุนของโปรเจ็ค)</span></label>
                <div className="cost-table-wrapper">
                  <table className="cost-table">
                    <thead>
                      <tr>
                        <th>ลำดับที่</th>
                        <th>รายการค่าใช้จ่าย</th>
                        <th>QTY</th>
                        <th>ค่าใช้จ่าย(บาท)</th>
                        <th>กำหนดวันชำระ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.projectCosts.map((row, index) => (
                        <tr key={`cost-row-${index}`}>
                          <td>{index + 1}</td>
                          <td><input type="text" placeholder="รายการค่าใช้จ่าย" value={row.item} onChange={(e) => handleProjectCostChange(index, "item", e.target.value)} /></td>
                          <td><input type="text" placeholder="QTY" value={row.qty} onChange={(e) => handleProjectCostChange(index, "qty", e.target.value)} /></td>
                          <td><input type="text" placeholder="ค่าใช้จ่าย(บาท)" value={row.cost} onChange={(e) => handleProjectCostChange(index, "cost", e.target.value)} /></td>
                          <td><DatePicker selected={toDate(row.paymentDate)} onChange={(date) => handleProjectCostChange(index, "paymentDate", toIsoDate(date))} dateFormat="dd/MM/yyyy" placeholderText="วัน/เดือน/ปี" className="date-input" /></td>
                          <td><button type="button" className="btn btn-tertiary print-hidden" onClick={() => handleRemoveProjectCost(index)}>ลบ</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-secondary print-hidden" onClick={handleAddProjectCost}>Add Row</button>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Deploy at site: <span className="note-label">(ติดตั้งโปรเเกรมที่)</span></label>
                <input type="text" name="deploySite" value={formData.deploySite} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row gls-approval-grid print-only-grid">
              <div className="approval-card">
                <div className="approval-title">Prepared by <span className="note-label">(ผู้จัดเตรียม)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.preparedBy || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Application Lead/Manager</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign" />
                <div className="approval-name">({formData.approvedBy || "..........................................................................."})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">GLS Director, Customer Engagement Dept.</div>
              </div>
            </div>
            <div className="form-row print-hidden">
              <div className="form-group">
                <label>Prepared by <span className="note-label">(ชื่อผู้จัดเตรียม)</span></label>
                <input type="text" name="preparedBy" value={formData.preparedBy} onChange={handleChange} placeholder="ระบุชื่อผู้จัดเตรียม" />
              </div>
              <div className="form-group">
                <label>Approved by <span className="note-label">(ชื่อผู้อนุมัติ)</span></label>
                <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} placeholder="ระบุชื่อผู้อนุมัติ" />
              </div>
            </div>

            <div className="form-row button-row print-hidden" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px dashed var(--border-color)", gap: "12px", display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <button type="button" className="btn btn-tertiary" onClick={handleClearForm} style={{ padding: "10px 24px" }}>ล้างข้อมูล (Clear)</button>
              {canCreate ? (
                <button type="submit" className="btn btn-primary" style={{ padding: "10px 32px" }} disabled={isPreviewing}>
                  {isPreviewing ? "กำลังประมวลผล..." : "พรีวิวและแนบเอกสาร (Preview & Submit)"}
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={handleOpenCombinedModal} style={{ padding: "10px 32px" }} disabled={isPreviewing}>
                  {isPreviewing ? "กำลังประมวลผล..." : "ดูตัวอย่างเอกสาร (Preview Only)"}
                </button>
              )}
            </div>
          </fieldset>
        </section>
      </form>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL — แก้ไขเฉพาะ UI ส่วนนี้เท่านั้น
          State / Handler / Logic / API ทุกอย่างคงเดิม 100%
      ═══════════════════════════════════════════════════════════════ */}
      {isCombinedModalOpen && (
        <div
          className="pdf-preview-overlay"
          style={{
            zIndex: 1040,
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="pdf-preview-card"
            style={{
              width: "90%",
              maxWidth: 1020,
              height: "88vh",
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              background: "#f8fafc",
            }}
          >
            {/* ── HEADER ── */}
            <div
              style={{
                padding: "16px 24px",
                background: "linear-gradient(135deg,#0c4a6e 0%,#0284c7 100%)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>
                  📋 ตรวจสอบและส่งคำขออนุมัติ
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  IT Project Request Form — กรุณาทำตามขั้นตอนให้ครบก่อนกดยืนยัน
                </div>
              </div>

              {/* Step Progress Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[                  { n: 1, label: "พิมพ์เอกสาร",     done: true },                  { n: 2, label: "เลือกผู้อนุมัติ", done: (formData.glsManagers || []).length > 0 },
                  { n: 3, label: "แนบไฟล์",          done: !!selectedFile },
                ].map((s, i) => (
                  <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: s.done ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.15)",
                        border: `1.5px solid ${s.done ? "#22c55e" : "rgba(255,255,255,0.3)"}`,
                        borderRadius: 20,
                        padding: "4px 12px 4px 6px",
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: s.done ? "#22c55e" : "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {s.done ? "✓" : s.n}
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: s.done ? "#86efac" : "rgba(255,255,255,0.8)",
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 16, height: 1.5, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* ── BODY ── */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

              {/* LEFT: PDF Preview — ของเดิม 100% */}
              <div
                style={{
                  flex: "0 0 54%",
                  borderRight: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f8fafc",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>📄</span>
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>ตัวอย่างเอกสาร PDF</span>
                  <button
                    type="button"
                    onClick={handleDownloadPreview}
                    style={{
                      marginLeft: "auto",
                      padding: "5px 14px",
                      borderRadius: 8,
                      border: "1.5px solid #0284c7",
                      background: "#fff",
                      color: "#0284c7",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    📥 ดาวน์โหลด / พิมพ์ PDF
                  </button>
                </div>
                <div style={{ flex: 1, background: "#f5f5f5", overflow: "hidden" }}>
                  {previewUrl ? (
                    <iframe title="PDF Preview" src={previewUrl} style={{ width: "100%", height: "100%", border: "none" }} />
                  ) : (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>
                      กำลังโหลดเอกสาร...
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Action Steps */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  background: "#f8fafc",
                }}
              >
                {/* ── STEP 1: พิมพ์เอกสาร ── */}
                <div
                  style={{
                    borderRadius: 14,
                    border: "1.5px solid #22c55e",
                    background: "#fff",
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "#22c55e",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#15803d" }}>
                        ขั้นตอนที่ 1 — พิมพ์เอกสาร
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        ดาวน์โหลดเพื่อนำไปให้ผู้มีอำนาจเซ็นอนุมัติตามลำดับขั้น
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPreview}
                    style={{
                      width: "100%",
                      padding: "9px",
                      borderRadius: 8,
                      border: "1.5px solid #22c55e",
                      background: "#f0fdf4",
                      color: "#15803d",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    📥 ดาวน์โหลด / พิมพ์ PDF
                  </button>
                </div>

                {/* ── STEP 2: เลือกผู้อนุมัติ ── */}
                {canCreate && (
                  <div
                    style={{
                      borderRadius: 14,
                      border: `1.5px solid ${(formData.glsManagers || []).length > 0 ? "#22c55e" : "#bae6fd"}`,
                      background: "#fff",
                      padding: "14px 16px",
                      transition: "border-color 0.3s",
                    }}
                  >
                    {/* Step Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: (formData.glsManagers || []).length > 0 ? "#22c55e" : "#0284c7",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          flexShrink: 0,
                        }}
                      >
                        {(formData.glsManagers || []).length > 0 ? "✓" : "2"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: (formData.glsManagers || []).length > 0 ? "#15803d" : "#0284c7",
                          }}
                        >
                          ขั้นตอนที่ 2 — เลือกหัวหน้าผู้รับผิดชอบโครงการ{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          คลิกที่การ์ดเพื่อเลือก — สามารถเลือกได้หลายคน
                        </div>
                      </div>
                      {(formData.glsManagers || []).length > 0 && (
                        <div
                          style={{
                            background: "#22c55e",
                            color: "#fff",
                            borderRadius: 20,
                            padding: "3px 11px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          เลือกแล้ว {formData.glsManagers.length} คน
                        </div>
                      )}
                    </div>

                    {/* Search — ใช้ managerSearch + setManagerSearch เดิม */}
                    <div style={{ position: "relative", marginBottom: 8 }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "0.85rem",
                        }}
                      >
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อหรือตำแหน่ง..."
                        value={managerSearch}
                        onChange={(e) => setManagerSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px 8px 32px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#0f172a",
                          fontSize: "0.82rem",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* User Card List — ใช้ filteredManagers เดิม + toggleManagerCard (ใช้ setFormData เดิม) */}
                    <div
                      style={{
                        maxHeight: 200,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {filteredManagers.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#94a3b8",
                            fontSize: "0.8rem",
                            padding: "18px 0",
                          }}
                        >
                          ไม่พบรายชื่อจากการค้นหา
                        </div>
                      ) : (
                        filteredManagers.map((u) => {
                          const staffName = u.username || u.name || u.displayName || `User-${u.id}`;
                          const isSel = (formData.glsManagers || []).includes(staffName);
                          const roleKey = (u.role || "").toLowerCase();
                          const rc = ROLE_BADGE_COLORS[roleKey] || { bg: "#f1f5f9", color: "#475569" };
                          return (
                            <div
                              key={u.id || staffName}
                              onClick={() => toggleManagerCard(staffName)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 12px",
                                borderRadius: 10,
                                cursor: "pointer",
                                border: `1.5px solid ${isSel ? "#22c55e" : "#e2e8f0"}`,
                                background: isSel ? "#f0fdf4" : "#fafafa",
                                transition: "all 0.18s",
                                userSelect: "none",
                              }}
                            >
                              {/* Avatar */}
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  background: isSel
                                    ? "#22c55e"
                                    : `hsl(${(staffName.charCodeAt(0) * 37) % 360},55%,48%)`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontWeight: 800,
                                  fontSize: "0.78rem",
                                }}
                              >
                                {staffName.slice(0, 2).toUpperCase()}
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                                  {staffName}
                                </div>
                                {u.role && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 600,
                                      padding: "1px 8px",
                                      borderRadius: 20,
                                      background: rc.bg,
                                      color: rc.color,
                                    }}
                                  >
                                    {u.role}
                                  </span>
                                )}
                              </div>
                              {/* Checkbox */}
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  flexShrink: 0,
                                  border: `2px solid ${isSel ? "#22c55e" : "#cbd5e1"}`,
                                  background: isSel ? "#22c55e" : "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  transition: "all 0.18s",
                                }}
                              >
                                {isSel ? "✓" : ""}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected Tags */}
                    {(formData.glsManagers || []).length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: "1px dashed #e2e8f0",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                        }}
                      >
                        {formData.glsManagers.map((name) => (
                          <div
                            key={name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              background: "#dcfce7",
                              color: "#15803d",
                              borderRadius: 20,
                              padding: "3px 10px 3px 6px",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              border: "1px solid #86efac",
                            }}
                          >
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#15803d",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.6rem",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                            {name}
                            <span
                              onClick={(e) => { e.stopPropagation(); toggleManagerCard(name); }}
                              style={{ cursor: "pointer", opacity: 0.55, fontSize: "0.8rem", lineHeight: 1 }}
                            >
                              ✕
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 3: อัปโหลดไฟล์ ── */}
                {canCreate && (
                  <div
                    style={{
                      borderRadius: 14,
                      border: `1.5px solid ${selectedFile ? "#22c55e" : "#e2e8f0"}`,
                      background: "#fff",
                      padding: "14px 16px",
                      transition: "border-color 0.3s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: selectedFile ? "#22c55e" : "#94a3b8",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          flexShrink: 0,
                        }}
                      >
                        {selectedFile ? "✓" : "3"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: selectedFile ? "#15803d" : "#334155",
                          }}
                        >
                          ขั้นตอนที่ 3 — แนบไฟล์เอกสารที่เซ็นอนุมัติแล้ว{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>รองรับ PDF, JPG, PNG</div>
                      </div>
                    </div>

                    {/* Drop Zone — ใช้ handleFileChange เดิม */}
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        padding: "18px 12px",
                        borderRadius: 10,
                        border: `2px dashed ${selectedFile ? "#22c55e" : "#93c5fd"}`,
                        background: selectedFile ? "#f0fdf4" : "#f0f9ff",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: "2rem" }}>{selectedFile ? "✅" : "📎"}</span>
                      {selectedFile ? (
                        <>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              color: "#15803d",
                              textAlign: "center",
                              wordBreak: "break-all",
                            }}
                          >
                            {selectedFile.name}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB — คลิกเพื่อเปลี่ยนไฟล์
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, fontSize: "0.84rem", color: "#0284c7" }}>
                            คลิกเพื่อเลือกไฟล์
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>PDF, JPG, PNG</span>
                        </>
                      )}
                      {/* input เดิม — ไม่เปลี่ยนแปลง */}
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div
              style={{
                padding: "13px 24px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              {/* Status hint */}
              <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                {!canCreate
                  ? "👁 โหมดดูตัวอย่าง — ไม่มีสิทธิ์ส่งคำขอ"
                  : (formData.glsManagers || []).length > 0 && !!selectedFile
                    ? "✅ ครบถ้วนแล้ว พร้อมส่งคำขอเข้าระบบ"
                    : `⚠️ กรุณา${(formData.glsManagers || []).length === 0
                        ? "เลือกหัวหน้าผู้อนุมัติ (ขั้นตอนที่ 2)"
                        : "แนบไฟล์เอกสาร (ขั้นตอนที่ 3)"
                      }`}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {/* ปุ่มยกเลิก — ใช้ handleCloseModal เดิม */}
                <button
                  type="button"
                  className="btn btn-tertiary"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    color: "#64748b",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {canCreate ? "ยกเลิก (Cancel)" : "ปิดหน้าต่าง (Close)"}
                </button>

                {/* ปุ่ม Submit — ใช้ handleFinalSubmit + selectedFile เดิม */}
                {canCreate && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !selectedFile}
                    style={{
                      padding: "9px 26px",
                      borderRadius: 10,
                      border: "none",
                      background:
                        !isSubmitting && selectedFile
                          ? "linear-gradient(135deg,#0284c7,#0369a1)"
                          : "#e2e8f0",
                      color: !isSubmitting && selectedFile ? "#fff" : "#94a3b8",
                      fontWeight: 800,
                      fontSize: "0.88rem",
                      cursor: !isSubmitting && selectedFile ? "pointer" : "not-allowed",
                      boxShadow:
                        !isSubmitting && selectedFile
                          ? "0 4px 14px rgba(2,132,199,0.35)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSubmitting ? "กำลังส่งข้อมูล..." : "✅ ยืนยันและบันทึก (Submit)"}
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

export default RequestForm;
