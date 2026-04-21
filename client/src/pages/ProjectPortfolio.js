import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchProjects, updateProjectInDb } from '../api/authApi';

function ProjectPortfolio({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormData, setEditFormData] = useState(null);

  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRaw = localStorage.getItem('ba-system.auth-session');
        const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
        if (token) {
          const data = await fetchProjects(token);
          setProjects(data);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const getStatusClass = (status) => {
    const statusMap = { Hold: 'status-hold', Active: 'status-active', Initiate: 'status-initiate', 'Go-live': 'status-go' };
    return statusMap[status] || 'status-active';
  };

  const getPhaseClass = (phase) => {
    const phaseMap = {
      'Go-live': 'phase-go', 'UAT': 'phase-uat', 'TEST': 'phase-uat', 
      'Development': 'phase-dev', 'Waiting Confirm': 'phase-prep', 'Requirement': 'phase-register' 
    };
    return phaseMap[phase] || 'phase-default';
  };

  const handleViewProject = (project) => {
    setSelectedProject(project); 
    setActiveTab('overview'); 
    setIsViewModalOpen(true);
  };

  const handleEditProject = (project) => {
    const safeCompliance = project.compliance || {};
    setEditFormData({ ...project, compliance: safeCompliance });
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false); setIsEditModalOpen(false);
    setSelectedProject(null); setEditFormData(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkflowChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      compliance: { ...prev.compliance, [field]: value }
    }));
  };

  // 🚀 ฟังก์ชันช่วยจัดการวันที่และคำนวณ Man-day อัตโนมัติ
  const handleWorkflowDateChange = (field, date) => {
    const isoDate = date ? date.toISOString().split('T')[0] : '';
    
    setEditFormData(prev => {
      const newCompliance = { ...prev.compliance, [field]: isoDate };

      // ถ้ามีการเลือกทั้งวันเริ่มและวันจบ ให้คำนวณ Man-day อัตโนมัติ
      if (field === 'baStartDate' || field === 'baEndDate') {
        const start = field === 'baStartDate' ? isoDate : newCompliance.baStartDate;
        const end = field === 'baEndDate' ? isoDate : newCompliance.baEndDate;
        
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          if (endDate >= startDate) {
            // คำนวณจำนวนวัน (รวมวันหยุดเบื้องต้น)
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            newCompliance.manDay = diffDays;
          } else {
            newCompliance.manDay = 0; // ถ้าเลือกวันจบก่อนวันเริ่ม
          }
        }
      }
      return { ...prev, compliance: newCompliance };
    });
  };

  const toDate = (dateString) => dateString ? new Date(dateString) : null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      const updatedProject = await updateProjectInDb(editFormData.id, editFormData, token);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      alert(`อัปเดตข้อมูลโปรเจกต์สำเร็จ!`);
      handleCloseModals();
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="page-wrap page-project">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Project Portfolio</h1>
      </div>
      <div className="page-rule"></div>

      {/* ========================================================= */}
      {/* 🚀 ตารางแสดงผลหลัก (เหมือนเดิม) 🚀 */}
      {/* ========================================================= */}
      <section className="content-card">
        <div className="table-wrap">
          <table className="portfolio-table project-portfolio-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Type</th>
                <th>Project Name</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Phase</th>
                <th>Man-day</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td className="project-id">{project.id}</td>
                  <td style={{ fontWeight: 'bold', color: project.project_type === 'New' ? '#28a745' : '#17a2b8' }}>
                    {project.project_type || '-'}
                  </td>
                  <td className="project-name">
                    <button onClick={() => handleViewProject(project)} style={{ color: '#0056b3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline', padding: 0, textAlign: 'left' }}>
                      {project.name}
                    </button>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
                      <strong>{project.owner || '-'}</strong><br/>
                      <span style={{ color: '#666' }}>({project.group_dept || '-'})</span>
                    </div>
                  </td>
                  <td><span className={`status-pill ${getStatusClass(project.status)}`}>{project.status}</span></td>
                  <td><span className={`phase-pill ${getPhaseClass(project.phase)}`}>{project.phase}</span></td>
                  <td>{project.compliance?.manDay ? `${project.compliance.manDay} วัน` : 'รอประเมิน'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-tertiary" onClick={() => handleEditProject(project)}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🚀 MODAL: VIEW DETAILS (หน้าต่างดูรายละเอียด - ย่อโค้ดไว้ให้เหมือนเดิม) 🚀 */}
      {/* ========================================================= */}
      {isViewModalOpen && selectedProject && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--blue-dark)', color: '#fff' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff' }}>{selectedProject.name}</h2>
                <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>Project ID: {selectedProject.id} | Type: <strong>{selectedProject.project_type || 'N/A'}</strong></span>
              </div>
              <button onClick={handleCloseModals} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
              {[
                { id: 'overview', label: 'ภาพรวม (Overview)' },
                { id: 'details', label: 'ความต้องการ (Requirements)' },
                { id: 'tech', label: 'ข้อมูลไอที (IT & Impact)' },
                { id: 'financial', label: 'งบประมาณ (Financial)' },
                { id: 'workflow', label: 'สถานะงาน (Workflow)' }
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id)} 
                  style={{ 
                    padding: '15px 20px', border: 'none', background: activeTab === tab.id ? '#fff' : 'transparent', 
                    borderBottom: activeTab === tab.id ? '3px solid var(--blue)' : '3px solid transparent', 
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal', cursor: 'pointer', 
                    color: activeTab === tab.id ? 'var(--blue-dark)' : '#666'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0, borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>ข้อมูลผู้ร้องขอ (Requester)</h4>
                    <p><strong>ชื่อผู้ร้องขอ:</strong> {selectedProject.owner || '-'}</p>
                    <p><strong>แผนก/กลุ่ม:</strong> {selectedProject.group_dept || '-'}</p>
                    <p><strong>ไซต์ (Site):</strong> {selectedProject.site || '-'}</p>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0, borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>บริบทของโครงการ (Context)</h4>
                    <p><strong>วัตถุประสงค์:</strong> {selectedProject.description}</p>
                  </div>
                </div>
              )}
              {activeTab === 'details' && (
                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--blue)', whiteSpace: 'pre-wrap' }}>
                  {selectedProject.form_data?.requirementDetail || 'ไม่มีข้อมูลรายละเอียดเชิงลึก'}
                </div>
              )}
              {activeTab === 'tech' && (
                <p><strong>กระทบระบบ:</strong> {selectedProject.form_data?.impactNewHISB || 'No'}</p>
              )}
              {activeTab === 'financial' && (
                <p><strong>แหล่งงบประมาณ:</strong> {selectedProject.form_data?.budgetSources || '-'}</p>
              )}
              {activeTab === 'workflow' && (
                <div>
                  <h4 style={{ color: 'var(--blue)' }}>สถานะการทำงาน (Workflow Tracking)</h4>
                  <p><strong>ช่วงเวลาปฏิบัติงาน (BA):</strong> {selectedProject.compliance?.baStartDate || '-'} ถึง {selectedProject.compliance?.baEndDate || '-'}</p>
                  <p><strong>เวลาประเมิน (Man-day):</strong> <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>{selectedProject.compliance?.manDay || 'รอประเมิน'} วัน</span></p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
               <button className="btn btn-secondary" onClick={() => {
                 if(selectedProject.document_path) window.open(`http://localhost:4000/${selectedProject.document_path.replace(/\\/g, '/')}`, '_blank');
                 else alert("ไม่พบไฟล์แนบของโครงการนี้");
               }}>
                 📂 ดูเอกสารอนุมัติฉบับเต็ม (PDF)
               </button>
               <button className="btn btn-primary" onClick={handleCloseModals}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 MODAL: EDIT FORM (อัปเกรด UI ใหม่ + ปฏิทินคำนวณ Man-day) 🚀 */}
      {/* ========================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <form className="pdf-preview-card" onSubmit={handleSaveEdit} style={{ width: '95%', maxWidth: '850px', padding: 0, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Modal */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--blue-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ✏️ อัปเดตสถานะงาน: {editFormData.id}
              </h3>
              <button type="button" onClick={handleCloseModals} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>✕</button>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 🟦 บล็อก 1: ข้อมูลหลัก */}
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--blue)', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>1. ข้อมูลหลัก (General Info)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label>ชื่อโครงการ (Project Name)</label>
                    <input name="name" value={editFormData.name} onChange={handleEditChange} disabled={!isManager} style={{ background: !isManager ? '#f5f5f5' : '#fff' }}/>
                  </div>

                  <div className="form-group">
                    <label>สถานะโครงการ (Status)</label>
                    <select name="status" value={editFormData.status || ''} onChange={handleEditChange} style={{ fontWeight: 'bold' }}>
                      <option value="Initiate">Initiate (เริ่มต้น)</option>
                      <option value="Active">Active (กำลังดำเนินงาน)</option>
                      <option value="Hold">Hold (ระงับชั่วคราว)</option>
                      <option value="Go-live">Go-live (ใช้งานจริง)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ขั้นตอนปัจจุบัน (Phase)</label>
                    <select name="phase" value={editFormData.phase || ''} onChange={handleEditChange} style={{ fontWeight: 'bold' }}>
                      <option value="Requirement">Requirement (รับความต้องการ)</option>
                      <option value="Waiting Confirm">Waiting Confirm (รอ รพ. อนุมัติ)</option>
                      <option value="Development">Development (กำลังพัฒนา)</option>
                      <option value="TEST">TEST (ทดสอบภายใน)</option>
                      <option value="UAT">UAT (ทดสอบระบบ)</option>
                      <option value="Go-live">Go-live (ใช้งานจริง)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 🟦 บล็อก 2: ประเมินเวลาด้วยปฏิทิน */}
              <div style={{ background: '#eef6ff', border: '1px solid #cce5ff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0056b3', borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}>2. ประเมินเวลาปฏิบัติงาน (Time Estimation)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>เริ่มงาน BA (Start Date)</label>
                    <DatePicker
                      selected={toDate(editFormData.compliance?.baStartDate)}
                      onChange={(date) => handleWorkflowDateChange('baStartDate', date)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันเริ่มงาน"
                      className="date-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>กำหนดเสร็จ (End Date)</label>
                    <DatePicker
                      selected={toDate(editFormData.compliance?.baEndDate)}
                      onChange={(date) => handleWorkflowDateChange('baEndDate', date)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันส่งงาน"
                      className="date-input"
                      minDate={toDate(editFormData.compliance?.baStartDate)} // ห้ามเลือกวันจบก่อนวันเริ่ม
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>ระยะเวลา (Man-day)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="number" 
                        value={editFormData.compliance?.manDay || ''} 
                        onChange={(e) => handleWorkflowChange('manDay', e.target.value)} 
                        placeholder="0"
                        style={{ fontWeight: 'bold', color: '#28a745', textAlign: 'center' }}
                      />
                      <span style={{ color: '#666' }}>วัน</span>
                    </div>
                  </div>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                  * เลือกระยะเวลาจากปฏิทิน ระบบจะคำนวณวันทำงานให้อัตโนมัติ (หรือคุณสามารถพิมพ์ตัวเลขทับได้)
                </p>
              </div>

              {/* 🟨 บล็อก 3: เช็คลิสต์เอกสาร */}
              <div style={{ background: '#fdfaef', border: '1px solid #f5e9c6', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#8a6d3b', borderBottom: '2px solid #f5e9c6', paddingBottom: '10px' }}>
                  3. ติดตามเอกสาร ({editFormData.project_type === 'New' ? 'สำหรับโปรเจกต์ใหม่' : 'สำหรับงานต่อยอด'})
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {editFormData.project_type === 'New' ? (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={editFormData.compliance?.docProposal || false} onChange={(e) => handleWorkflowChange('docProposal', e.target.checked)} />
                        <span>ส่งเอกสาร <strong>Project Proposal</strong> (SOG)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={editFormData.compliance?.docQuotation || false} onChange={(e) => handleWorkflowChange('docQuotation', e.target.checked)} />
                        <span>ส่งเอกสาร <strong>Quotation</strong> (CE)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee', gridColumn: '1 / -1' }}>
                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={editFormData.compliance?.docUrs || false} onChange={(e) => handleWorkflowChange('docUrs', e.target.checked)} />
                        <span>โรงพยาบาลพิจารณาและเซ็น <strong>URS Document</strong> แล้ว</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={editFormData.compliance?.docScr || false} onChange={(e) => handleWorkflowChange('docScr', e.target.checked)} />
                        <span>ส่งเอกสาร <strong>SCR Document</strong> (SOG)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={editFormData.compliance?.docQuotation || false} onChange={(e) => handleWorkflowChange('docQuotation', e.target.checked)} />
                        <span>ส่งเอกสาร <strong>Quotation</strong> (CE)</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

            </div>
            
            {/* Footer Buttons */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderTop: '1px solid #ddd', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModals}>ยกเลิก (Cancel)</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 30px' }}>💾 บันทึกและอัปเดตงาน</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectPortfolio;