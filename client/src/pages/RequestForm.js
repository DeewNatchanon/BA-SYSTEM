import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { pdf } from '@react-pdf/renderer';
import RequestFormPdf from '../pdf/RequestFormPdf';
import { submitProjectRequest } from '../api/authApi'; 

function RequestForm({ currentUser }) {
  const createBlankCost = () => ({
    item: '',
    qty: '',
    cost: '',
    paymentDate: ''
  });

  const normalizeProjectCosts = (costs = []) => {
    const normalized = costs.map(cost => ({
      item: cost.item || '',
      qty: cost.qty || '',
      cost: cost.cost || '',
      paymentDate: cost.paymentDate || ''
    }));
    return normalized.length ? normalized : [createBlankCost()];
  };

  const initialFormData = {
    requestId: '',
    requestDate: new Date().toISOString().split('T')[0],
    requesterName: '',
    requesterDept: '',
    requesterGroup: '',
    requesterSite: '',
    requesterTel: '',
    emergencyHOD: '',
    projectName: '',
    projectDetail: '',
    requirementDetail: '',
    targetUser: '',
    useDept: '',
    companyName: '',
    expectedOutcome: '',
    budgetSources: '',
    anticipatedDate: '',
    otherRemark: '',
    reqSign1: '',
    reqSign2: '',
    reqSign3: '',
    reqSign4: '',
    reqSign5: '',
    status: '',
    projectCategory: [], 
    projectType: [], 
    impactNewHISB: 'No', 
    impactHISBApp: '',
    impactAnalysis: '',
    interfaceWith: '',
    resources: [], 
    vendor1Name: '',
    vendor2Name: '',
    projectManager: '',
    timelineStartDate: '',
    timelineEndDate: '',
    projectCosts: normalizeProjectCosts(),
    deploySite: '',
    preparedBy: '',
    approvedBy: ''
  };

  const loadInitialData = () => {
    const draft = localStorage.getItem('ba-system.request-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        return {
          ...initialFormData,
          ...parsedDraft,
          projectCosts: normalizeProjectCosts(parsedDraft.projectCosts)
        };
      } catch (e) {
        return initialFormData;
      }
    }
    return initialFormData;
  };

  const [formData, setFormData] = useState(loadInitialData);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isManager = currentUser?.role === 'manager';

  const resizeAllTextareas = () => {
    const nodes = document.querySelectorAll('.request-form textarea');
    nodes.forEach(node => {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    });
  };

  useEffect(() => {
    localStorage.setItem('ba-system.request-draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    resizeAllTextareas();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    if (formData.impactNewHISB !== 'Yes') {
      setFormData(prev => ({ ...prev, impactHISBApp: '', impactAnalysis: '' }));
    }
  }, [formData.impactNewHISB]);

  const handleCheckboxChange = (name, option) => {
    setFormData(prev => {
      const current = prev[name] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [name]: updated };
    });
  };

  const handleProjectCostChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.projectCosts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projectCosts: updated };
    });
  };

  const handleAddProjectCost = () => {
    setFormData(prev => ({
      ...prev,
      projectCosts: [...prev.projectCosts, createBlankCost()]
    }));
  };

  const handleRemoveProjectCost = (index) => {
    setFormData(prev => {
      const updated = prev.projectCosts.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        projectCosts: updated.length ? updated : normalizeProjectCosts([])
      };
    });
  };

  const toIsoDate = (date) => (date ? date.toISOString().split('T')[0] : '');
  const toDate = (value) => (value ? new Date(value) : null);

  const showVendorFields = formData.resources.includes('GLS จ้าง Vendor') ||
    formData.resources.includes('โรงพยาบาลจ้าง Vendor');

  const handleClearForm = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?')) {
      localStorage.removeItem('ba-system.request-draft');
      setFormData({
        ...initialFormData,
        requestDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedFile) return alert("กรุณาแนบไฟล์เอกสารก่อนกดยืนยัน");
    
    if (!currentUser || !currentUser.id) {
      return alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
    }

    setIsSubmitting(true);
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const sessionData = sessionRaw ? JSON.parse(sessionRaw) : null;
      const token = sessionData?.token; 

      // 1. จัดเตรียมข้อมูล Text
      // 1. จัดเตรียมข้อมูล Text
      const requestData = {
        name: formData.projectName || 'Untitled Project',
        site: formData.requesterSite || 'N/A',
        category: formData.projectCategory.join(', ') || 'N/A',
        description: formData.projectDetail || 'N/A',
        status: 'Pending Approval', // 🚀 3. เพิ่มบรรทัดนี้! บังคับสถานะให้ตรงเป๊ะ
        requester_id: currentUser?.id,
        form_data: formData 
      };

      // 2. แพ็คไฟล์ + ข้อมูล Text เข้าด้วยกัน (FormData)
      const formDataToSend = new FormData();
      formDataToSend.append('approvedDocument', selectedFile); // แนบไฟล์
      formDataToSend.append('requestData', JSON.stringify(requestData)); // แนบข้อมูล

      // 3. ยิง API ด้วยฟังก์ชันที่รองรับการแนบไฟล์
      await submitProjectRequest(formDataToSend, token); 

      alert('บันทึกข้อมูลและแนบไฟล์เข้าระบบสำเร็จ!');
      handleCloseModal(); 
      
      localStorage.removeItem('ba-system.request-draft');
      setFormData({ ...initialFormData, requestDate: new Date().toISOString().split('T')[0] });
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPdfBlob = async () => pdf(<RequestFormPdf data={formData} />).toBlob();

  const handleDownloadPreview = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `request-form-${formData.requestId || 'draft'}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenCombinedModal = async (e) => {
    e.preventDefault();
    setIsPreviewing(true);
    
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsCombinedModalOpen(true); 
    } catch (error) {
      console.error('PDF preview failed', error);
      alert('ไม่สามารถสร้างพรีวิว PDF ได้');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCloseModal = () => {
    setIsCombinedModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  return (
    <div className="page-wrap page-request print-area">
      <form onSubmit={handleOpenCombinedModal} className="request-form">
        <div className="print-page-block">
          <h1 className="page-heading">IT Project Request Form</h1>
          
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
                <div className="print-only">{formData.requestId || '-'}</div>
              </div>
              <div className="form-group">
                <label>Status: <span className="note-label">(สถานะ)</span></label>
                <input
                  type="text"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="print-hide-input"
                />
                <div className="print-only">{formData.status || '-'}</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Request Date <span className="note-label">(วันที่ขอ)</span></label>
                <DatePicker
                  selected={toDate(formData.requestDate)}
                  onChange={(date) => setFormData(prev => ({ ...prev, requestDate: toIsoDate(date) }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วัน/เดือน/ปี"
                  className="date-input"
                />
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
                <textarea
                  name="projectDetail"
                  rows="3"
                  value={formData.projectDetail}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                ></textarea>
              </div>
            </div>

            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Requirement Detail: <span className="note-label">(รายละเอียดที่ต้องการ)</span></label>
                <textarea
                  name="requirementDetail"
                  rows="5"
                  value={formData.requirementDetail}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                ></textarea>
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
                <textarea
                  name="expectedOutcome"
                  rows="3"
                  value={formData.expectedOutcome}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                ></textarea>
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
                <DatePicker
                  selected={toDate(formData.anticipatedDate)}
                  onChange={(date) => setFormData(prev => ({ ...prev, anticipatedDate: toIsoDate(date) }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วัน/เดือน/ปี"
                  className="date-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Other Remark: <span className="note-label">(ข้อมูลอื่นเพิ่มเติม)</span></label>
                <textarea
                  name="otherRemark"
                  rows="3"
                  value={formData.otherRemark}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                ></textarea>
              </div>
            </div>

            <div className="form-row approval-grid print-only-grid">
              <div className="approval-card">
                <div className="approval-title">Requested by <span className="note-label">(ผู้ร้องขอ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.reqSign1 || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Requester / IT Site Lead<br />(ผู้ขอ / หัวหน้าไซต์ IT)</div>
              </div>

              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.reqSign2 || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Services & Operations Grc<br />(Or Delegated Person)</div>
              </div>

              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.reqSign3 || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Service Support<br />(If any)</div>
              </div>

              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.reqSign4 || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Head of Finance<br />(If any)</div>
              </div>
              
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.reqSign5 || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">CIO / ผู้ที่ได้รับมอบอำนาจ</div>
              </div>
            </div>

            <div className="form-row print-hidden" style={{ marginTop: '20px' }}>
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
                  {['Application', 'Infrastructure Service', 'Operation Service'].map(cat => (
                    <label key={cat} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.projectCategory.includes(cat)}
                        onChange={() => handleCheckboxChange('projectCategory', cat)}
                      />
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
                  {['New System', 'Infrastructure', 'Consult (กรณีที่ IT Operation มีส่วนในการช่วยเหลือหรือให้บริการกับ Project ที่โรงพยาบาล เป็น Owner เท่านั้น)'].map(type => (
                    <label key={type} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.projectType.includes(type)}
                        onChange={() => handleCheckboxChange('projectType', type)}
                      />
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
                  {['No', 'Yes'].map(option => (
                    <label key={option} className="radio-item">
                      <input
                        type="radio"
                        name="impactNewHISB"
                        value={option}
                        checked={formData.impactNewHISB === option}
                        onChange={handleChange}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Application Name/Site Name: <span className="note-label">(ชื่อระบบ/ไซต์)</span></label>
                <input
                  type="text"
                  name="impactHISBApp"
                  placeholder="(Application Name/Site Name)"
                  value={formData.impactHISBApp}
                  onChange={handleChange}
                  disabled={formData.impactNewHISB !== 'Yes'}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Impact Analysis: <span className="note-label">(วิเคราะห์ผลกระทบ)</span></label>
                <textarea
                  name="impactAnalysis"
                  rows="3"
                  value={formData.impactAnalysis}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                  disabled={formData.impactNewHISB !== 'Yes'}
                ></textarea>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Interface with: <span className="note-label">(การเชื่อมต่อกับระบบอื่น)</span></label>
                <textarea
                  name="interfaceWith"
                  rows="2"
                  value={formData.interfaceWith}
                  onChange={handleChange}
                  onInput={handleTextareaInput}
                ></textarea>
              </div>
            </div>

            <div className="form-row no-divider">
              <div className="form-group full-width">
                <label>Resource: <span className="note-label">(ดำเนินการโดย)</span></label>
                <div className="checkbox-group">
                  {['GLS ดำเนินการเอง', 'GLS จ้าง Vendor', 'โรงพยาบาลจ้าง Vendor'].map(res => (
                    <label key={res} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.resources.includes(res)}
                        onChange={() => handleCheckboxChange('resources', res)}
                      />
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
                  <input
                    type="text"
                    name="vendor1Name"
                    placeholder="ระบุชื่อบริษัทผู้ให้บริการ"
                    value={formData.vendor1Name}
                    onChange={handleChange}
                  />
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
                <DatePicker
                  selected={toDate(formData.timelineStartDate)}
                  onChange={(date) => setFormData(prev => ({ ...prev, timelineStartDate: toIsoDate(date) }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วัน/เดือน/ปี"
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <label>End Date: <span className="note-label">(วันสิ้นสุดโครงการ)</span></label>
                <DatePicker
                  selected={toDate(formData.timelineEndDate)}
                  onChange={(date) => setFormData(prev => ({ ...prev, timelineEndDate: toIsoDate(date) }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วัน/เดือน/ปี"
                  className="date-input"
                />
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
                          <td>
                            <input
                              type="text"
                              placeholder="รายการค่าใช้จ่าย"
                              value={row.item}
                              onChange={(e) => handleProjectCostChange(index, 'item', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="QTY"
                              value={row.qty}
                              onChange={(e) => handleProjectCostChange(index, 'qty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="ค่าใช้จ่าย(บาท)"
                              value={row.cost}
                              onChange={(e) => handleProjectCostChange(index, 'cost', e.target.value)}
                            />
                          </td>
                          <td>
                            <DatePicker
                              selected={toDate(row.paymentDate)}
                              onChange={(date) => handleProjectCostChange(index, 'paymentDate', toIsoDate(date))}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="วัน/เดือน/ปี"
                              className="date-input"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-tertiary print-hidden"
                              onClick={() => handleRemoveProjectCost(index)}
                            >
                              ลบ
                            </button>
                          </td>
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
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.preparedBy || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">Application Lead/Manager</div>
              </div>
              <div className="approval-card">
                <div className="approval-title">Approved by <span className="note-label">(ผู้อนุมัติ)</span></div>
                <div className="approval-sign"></div>
                <div className="approval-name">({formData.approvedBy || '...........................................................................'})</div>
                <div className="approval-date">Date :</div>
                <div className="approval-role">GLS Director, Customer Engagement Dept.</div>
              </div>
            </div>
            
            <div className="form-row print-hidden">
              <div className="form-group">
                <label>Prepared by <span className="note-label">(ชื่อผู้จัดเตรียม)</span></label>
                <input
                  type="text"
                  name="preparedBy"
                  value={formData.preparedBy}
                  onChange={handleChange}
                  placeholder="ระบุชื่อผู้จัดเตรียม"
                />
              </div>
              <div className="form-group">
                <label>Approved by <span className="note-label">(ชื่อผู้อนุมัติ)</span></label>
                <input
                  type="text"
                  name="approvedBy"
                  value={formData.approvedBy}
                  onChange={handleChange}
                  placeholder="ระบุชื่อผู้อนุมัติ"
                />
              </div>
            </div>
          </fieldset>
        </section>

        <div className="form-row button-row" style={{ marginTop: '30px', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={isPreviewing}>
            {isPreviewing ? 'กำลังประมวลผล...' : 'พรีวิวและแนบเอกสาร (Preview & Submit)'}
          </button>
          <button type="button" className="btn btn-tertiary" onClick={handleClearForm}>Clear</button>
        </div>
      </form>

      {/* ========================================== */}
      {/* 🚀 COMBINED MODAL: PREVIEW + UPLOAD 🚀 */}
      {/* ========================================== */}
      {isCombinedModalOpen && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ 
            width: '90%', maxWidth: '1000px', height: '85vh', padding: '24px', 
            display: 'flex', flexDirection: 'column' 
          }}>
            {/* ส่วนหัว Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--blue-dark)', fontSize: '1.4rem' }}>ตรวจสอบและแนบเอกสารอนุมัติ</h3>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModal} style={{ fontSize: '1.2rem', padding: '5px 10px' }}>✕</button>
            </div>

            {/* ส่วนเนื้อหา 2 ฝั่ง */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
              
              {/* ฝั่งซ้าย: ดูตัวอย่าง PDF */}
              <div style={{ flex: 1.5, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5' }}>
                {previewUrl ? (
                  <iframe title="PDF Preview" src={previewUrl} style={{width: '100%', height: '100%', border: 'none'}} />
                ) : (
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>กำลังโหลดเอกสาร...</div>
                )}
              </div>

              {/* ฝั่งขวา: เครื่องมือ (Print -> Upload) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                
                <div style={{ background: 'var(--surface-2)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--blue-dark)' }}>ขั้นตอนที่ 1: พิมพ์เอกสาร</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '15px' }}>
                    ดาวน์โหลดหรือพิมพ์เอกสารนี้ เพื่อนำไปให้ผู้มีอำนาจเซ็นอนุมัติตามลำดับขั้น
                  </p>
                  <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleDownloadPreview}>
                    📥 ดาวน์โหลด / พิมพ์ PDF
                  </button>
                </div>

                <div style={{ background: 'var(--surface-2)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--blue-dark)' }}>ขั้นตอนที่ 2: อัปโหลดและส่งเข้าระบบ</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '15px' }}>
                    เมื่อได้รับการเซ็นอนุมัติเรียบร้อยแล้ว ให้อัปโหลดไฟล์เอกสาร (PDF หรือรูปภาพ) ที่นี่
                  </p>
                  
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={handleFileChange} 
                    style={{ 
                      width: '100%', padding: '12px', border: '2px dashed var(--blue)', 
                      borderRadius: '8px', background: '#fff', cursor: 'pointer'
                    }} 
                  />
                  
                  {selectedFile && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                      <p style={{ color: '#2e7d32', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                        ✅ เลือกไฟล์แล้ว: {selectedFile.name}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ส่วนท้าย Modal (ปุ่มยืนยัน) */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModal} disabled={isSubmitting}>
                ยกเลิก (Cancel)
              </button>
              <button type="button" className="btn btn-primary" onClick={handleFinalSubmit} disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันและบันทึก (Submit)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestForm;