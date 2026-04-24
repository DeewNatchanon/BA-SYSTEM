import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchProjects, updateProjectInDb } from '../api/authApi';

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const impactTeamsList = ['iMed', 'HMS', 'Other Unit', 'EPMS', 'SAP SuccessFactor', 'SAP P2P', 'SAP R2C', 'SAP Non Hos-MFG', 'SAP Non Hos-Nhealth', 'Doctor Fee', 'E-Form', 'Infra', 'SOG'];

const fullPdpaItems = [
  { key: 'health', label: 'ข้อมูลสุขภาพ' }, { key: 'idCard', label: 'บัตรประชาชน' }, { key: 'passport', label: 'Passport' },
  { key: 'hn', label: 'HN' }, { key: 'name', label: 'ชื่อ-นามสกุล' }, { key: 'address', label: 'ที่อยู่' },
  { key: 'dob', label: 'วัน/เดือน/ปีเกิด' }, { key: 'phone', label: 'เบอร์โทร' }, { key: 'email', label: 'Email' },
  { key: 'financial', label: 'ข้อมูลการเงิน' }, { key: 'criminal', label: 'ประวัติอาชญากรรม' }, { key: 'photo', label: 'รูปถ่ายใบหน้า' }
];

function ProjectPortfolio({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      if (token) {
        const data = await fetchProjects(token);
        
        const safeData = data.map(p => {
          let parsedForm = p.form_data;
          if (typeof parsedForm === 'string') {
            try { parsedForm = JSON.parse(parsedForm); } catch (e) { parsedForm = {}; }
          }
          return { ...p, form_data: parsedForm || {} };
        });

        setProjects(safeData);
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project); 
    setActiveTab('overview'); 
    setIsViewModalOpen(true);
  };

  const handleEditProject = (project) => {
    const existingTracking = project.form_data?.tracking || {};
    
    const smartTracking = {
      completionPercent: existingTracking.completionPercent || 0,
      actualStart: existingTracking.actualStart || project.form_data?.compliance?.baStartDate || '',
      actualGoLive: existingTracking.actualGoLive || project.form_data?.compliance?.baEndDate || '',
      appName: existingTracking.appName || project.name || '',
      appId: existingTracking.appId || project.form_data?.appId || '',
      deployIn: existingTracking.deployIn || project.site || '',
      operatedBy: existingTracking.operatedBy || '',
      glsOwner: existingTracking.glsOwner || '',
      glsManager: existingTracking.glsManager || project.form_data?.assigned_to || '',
      impactTeams: existingTracking.impactTeams || []
    };

    const tech = { language: '', platform: 'Web Base', server: '', webServer: '', ...(project.form_data?.tech || {}) };
    const compliance = { pdpa: {}, ropa: {}, ...(project.form_data?.compliance || {}) };

    setEditFormData({ 
      ...project, 
      status: project.status || 'Initiate',
      phase: project.phase || 'Requirement', 
      tracking: smartTracking,
      tech,
      compliance
    });
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

  const handleTrackingChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      tracking: { ...prev.tracking, [field]: value }
    }));
  };

  const handleTechChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, tech: { ...prev.tech, [field]: value } }));
  };

  const handlePdpaChange = (key, checked) => {
    setEditFormData(prev => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        pdpa: { ...(prev.compliance?.pdpa || {}), [key]: checked }
      }
    }));
  };

  const handleImpactTeamToggle = (team) => {
    setEditFormData(prev => {
      const currentTeams = prev.tracking?.impactTeams || [];
      const updatedTeams = currentTeams.includes(team) ? currentTeams.filter(t => t !== team) : [...currentTeams, team];
      return { ...prev, tracking: { ...prev.tracking, impactTeams: updatedTeams } };
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      
      const finalData = { 
        ...editFormData, 
        form_data: { 
          ...editFormData.form_data, 
          tracking: editFormData.tracking,
          tech: editFormData.tech,
          compliance: editFormData.compliance 
        } 
      };
      
      const updated = await updateProjectInDb(editFormData.id, finalData, token);
      
      const parsedUpdated = {
        ...updated.data,
        form_data: typeof updated.data.form_data === 'string' ? JSON.parse(updated.data.form_data) : updated.data.form_data
      };
      
      setProjects(prev => prev.map(p => p.id === parsedUpdated.id ? parsedUpdated : p));
      
      if(finalData.phase === 'Go-live' || finalData.status === 'Go-live') {
        alert("อัปเดตเรียบร้อย! ข้อมูลโปรเจกต์นี้จะถูกส่งต่อไปยัง Application Portfolio อัตโนมัติ");
      } else {
        alert("อัปเดตข้อมูลความคืบหน้าสำเร็จเรียบร้อย!");
      }
      setIsEditModalOpen(false);
    } catch (error) { alert("ล้มเหลว: " + error.message); }
  };

  const toDate = (s) => s ? new Date(s) : null;
  const toIso = (d) => d ? d.toISOString().split('T')[0] : '';
  const formatDateTH = (dateString) => dateString ? new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  const getProgressColor = (percent) => {
    if (percent < 30) return '#dc3545'; 
    if (percent < 75) return '#ffc107'; 
    return '#28a745'; 
  };

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="page-wrap page-project">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Project Portfolio</h1>
      </div>
      <div className="page-rule"></div>

      <section className="content-card">
        <div className="table-wrap">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>รหัสโครงการ (ID)</th>
                <th>ชื่อโครงการ (Project Name)</th>
                <th>ผู้รับผิดชอบ (Assignee)</th>
                <th>สถานะ (Status)</th>
                <th>ขั้นตอน (Phase)</th>
                <th style={{ textAlign: 'center' }}>ความคืบหน้า (%)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <span onClick={() => handleViewProject(p)} style={{ color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
                      {p.name}
                    </span>
                  </td>
                  <td><span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{p.form_data?.tracking?.glsManager || p.form_data?.assigned_to || '-'}</span></td>
                  <td><span className={`status-badge ${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td>{p.phase || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <div style={{ width: '60px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), width: `${p.form_data?.tracking?.completionPercent || 0}%`, transition: 'width 0.3s ease' }}></div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleEditProject(p)} 
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }} 
                      title="อัปเดตงาน"
                    >
                      <EditIcon /> อัปเดต
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🚀 MODAL: VIEW DETAILS */}
      {/* ========================================================= */}
      {isViewModalOpen && selectedProject && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)' }}>
            <div style={{ padding: '20px', background: 'var(--blue-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>{selectedProject.name}</h2>
                <span style={{ opacity: 0.8, fontSize: '0.9rem', color: '#fff' }}>รหัสโครงการ: {selectedProject.id}</span>
              </div>
              <button onClick={handleCloseModals} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
              {[{ id: 'overview', label: '📌 ภาพรวม' }, { id: 'requirement', label: '📝 ความต้องการ' }, { id: 'system', label: '💻 ระบบ & ทีม' }, { id: 'timeline', label: '⏱️ กำหนดการ' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '15px 20px', border: 'none', background: activeTab === t.id ? 'var(--card-bg)' : 'transparent', borderBottom: activeTab === t.id ? '3px solid var(--blue)' : 'none', cursor: 'pointer', fontWeight: activeTab === t.id ? 'bold' : 'normal', color: activeTab === t.id ? 'var(--blue)' : 'var(--text-muted)' }}>{t.label}</button>
              ))}
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ข้อมูลผู้ร้องขอ (Requester)</h4>
                    <p><strong>ชื่อผู้ติดต่อ:</strong> {selectedProject.requester_name || selectedProject.form_data?.requesterName || selectedProject.form_data?.contactName || '-'}</p>
                    <p><strong>แผนก (Dept):</strong> {selectedProject.form_data?.requesterDept || selectedProject.form_data?.department || '-'}</p>
                    <p><strong>ไซต์ (Site):</strong> {selectedProject.site}</p>
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>บริบทโครงการ (Context)</h4>
                    <p><strong>วัตถุประสงค์:</strong> {selectedProject.description}</p>
                    <p><strong>เป้าหมาย (Outcome):</strong> {selectedProject.form_data?.expectedOutcome || selectedProject.form_data?.objective || '-'}</p>
                  </div>
                </div>
              )}
              {activeTab === 'requirement' && (
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--blue)', whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>
                  <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>รายละเอียดเชิงลึก (Requirement Details)</h4>
                  {selectedProject.form_data?.requirementDetail || selectedProject.form_data?.details || 'ไม่มีข้อมูลระบุไว้'}
                </div>
              )}
              {activeTab === 'system' && (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ข้อมูลระบบ (Application)</h4>
                        <p><strong>App Name:</strong> {selectedProject.form_data?.tracking?.appName || '-'}</p>
                        <p><strong>App ID:</strong> {selectedProject.form_data?.tracking?.appId || selectedProject.form_data?.appId || '-'}</p>
                        <p><strong>Deploy Site:</strong> {selectedProject.form_data?.tracking?.deployIn || '-'}</p>
                        <p><strong>Project Owner:</strong> {selectedProject.form_data?.tracking?.glsOwner || '-'}</p>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ทีมที่ได้รับผลกระทบ (Impact Teams)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {selectedProject.form_data?.tracking?.impactTeams?.map(team => <span key={team} className="status-badge" style={{background: 'var(--card-bg)', color: 'var(--blue)', border: '1px solid var(--blue)'}}>{team}</span>)}
                        </div>
                    </div>
                 </div>
              )}
              {activeTab === 'timeline' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: '#d97706', marginTop: 0 }}>📋 แผนงานประเมิน (Plan by Manager)</h4>
                    <p><strong>วันที่คาดว่าจะเริ่ม (Plan Start):</strong> {formatDateTH(selectedProject.form_data?.compliance?.baStartDate)}</p>
                    <p><strong>วันที่คาดว่าจะเสร็จ (Plan Go-live):</strong> {formatDateTH(selectedProject.form_data?.compliance?.baEndDate)}</p>
                    {/* 🚀 แก้ไขจุดที่ลืมปิดแท็ก </span> ตรงนี้ครับ */}
                    <p><strong>ผู้รับผิดชอบ (Assignee):</strong> <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{selectedProject.form_data?.tracking?.glsManager || selectedProject.form_data?.assigned_to || '-'}</span></p>
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>⚡ ความเป็นจริง (Actual Tracking)</h4>
                    <p><strong>วันที่เริ่มจริง (Actual Start):</strong> {formatDateTH(selectedProject.form_data?.tracking?.actualStart)}</p>
                    <p><strong>วันที่เสร็จจริง (Actual Go-live):</strong> {formatDateTH(selectedProject.form_data?.tracking?.actualGoLive)}</p>
                    <p><strong>ความคืบหน้า (Progress):</strong> <span style={{ fontWeight: 'bold', color: getProgressColor(selectedProject.form_data?.tracking?.completionPercent || 0), fontSize: '1.2rem' }}>{selectedProject.form_data?.tracking?.completionPercent || 0}%</span></p>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => { if(selectedProject.document_path) window.open(`http://localhost:4000/${selectedProject.document_path.replace(/\\/g, '/')}`, '_blank'); else alert("ไม่พบไฟล์แนบ"); }} style={{ marginRight: '10px' }}>📂 เปิดไฟล์เอกสารอนุมัติ</button>
              <button className="btn btn-primary" onClick={handleCloseModals}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 MODAL: UPDATE PROGRESS */}
      {/* ========================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <form className="pdf-preview-card" onSubmit={handleSaveEdit} style={{ width: '95%', maxWidth: '900px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-color)', fontSize: '1.3rem' }}>📝 อัปเดตความคืบหน้าและการส่งต่องาน</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{editFormData.id} - {editFormData.name}</span>
              </div>
              <button type="button" onClick={handleCloseModals} style={{ background: 'transparent', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-color)' }}>
              
              {/* Section 1 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{background: 'var(--blue)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>1</span>
                  สถานะโครงการ (Project Status)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-color)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-color)' }}>ความคืบหน้าปัจจุบัน (Progress)</label>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: getProgressColor(editFormData.tracking.completionPercent) }}>
                        {editFormData.tracking.completionPercent}%
                      </span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={editFormData.tracking.completionPercent} onChange={(e) => handleTrackingChange('completionPercent', e.target.value)} style={{ width: '100%', cursor: 'pointer', accentColor: getProgressColor(editFormData.tracking.completionPercent) }}/>
                  </div>

                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)' }}>สถานะ (Status)</label>
                    <select name="status" value={editFormData.status} onChange={handleEditChange} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                      <option value="Initiate">Initiate (เริ่มต้น)</option>
                      <option value="Active">Active (กำลังดำเนินงาน)</option>
                      <option value="Hold">Hold (ระงับชั่วคราว)</option>
                      <option value="Go-live">Go-live (ใช้งานจริง)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)' }}>ขั้นตอนปัจจุบัน (Phase)</label>
                    <select name="phase" value={editFormData.phase} onChange={handleEditChange} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                      <option value="Requirement">Requirement (รับความต้องการ)</option>
                      <option value="Preparation">Preparation (เตรียมการ)</option>
                      <option value="Development/Implement">Development/Implement (กำลังพัฒนา)</option>
                      <option value="UAT">UAT (ทดสอบระบบ)</option>
                      <option value="Go-live">Go-live (ขึ้นระบบจริง)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{background: '#10b981', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>2</span>
                  กำหนดการทำงานจริง (Actual Timeline)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--text-muted)' }}>วันที่เริ่มงานจริง (Actual Start)</label>
                    <DatePicker selected={toDate(editFormData.tracking.actualStart)} onChange={(date) => handleTrackingChange('actualStart', toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                    <div style={{ fontSize: '0.8rem', color: 'var(--blue)', marginTop: '6px' }}>
                       📌 แผนที่วางไว้ (Plan): {formatDateTH(editFormData.form_data?.compliance?.baStartDate)}
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--text-muted)' }}>วันที่เสร็จจริง (Actual Go-live)</label>
                    <DatePicker selected={toDate(editFormData.tracking.actualGoLive)} onChange={(date) => handleTrackingChange('actualGoLive', toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                    <div style={{ fontSize: '0.8rem', color: 'var(--blue)', marginTop: '6px' }}>
                       📌 แผนที่วางไว้ (Plan): {formatDateTH(editFormData.form_data?.compliance?.baEndDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: App & Responsibility */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{background: '#f59e0b', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>3</span>
                  ข้อมูลระบบและผู้รับผิดชอบ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>ชื่อผู้รับผิดชอบงาน (GLS PM)</label><input value={editFormData.tracking.glsManager} onChange={(e) => handleTrackingChange('glsManager', e.target.value)} placeholder="เช่น Chatchai" style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>เจ้าของระบบ (GLS Owner)</label><input value={editFormData.tracking.glsOwner} onChange={(e) => handleTrackingChange('glsOwner', e.target.value)} placeholder="เช่น SOG 6" style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>ชื่อแอปพลิเคชัน (App Name)</label><input value={editFormData.tracking.appName} onChange={(e) => handleTrackingChange('appName', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>รหัสระบบ (App ID)</label><input value={editFormData.tracking.appId} onChange={(e) => handleTrackingChange('appId', e.target.value)} placeholder="เช่น APP-001" style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>ไซต์ที่ติดตั้ง (Deploy Site)</label><input value={editFormData.tracking.deployIn} onChange={(e) => handleTrackingChange('deployIn', e.target.value)} placeholder="เช่น BSR" style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                </div>
              </div>

              {/* Section 4 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{background: '#8b5cf6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>4</span>
                  โครงสร้างเทคโนโลยี (Tech Stack - ข้อมูลสำหรับขึ้นระบบ)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>ภาษาที่ใช้ (Programming Language)</label><input placeholder="เช่น React, PHP" value={editFormData.tech.language} onChange={(e) => handleTechChange('language', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>แพลตฟอร์ม (Platform)</label>
                    <select value={editFormData.tech.platform} onChange={(e) => handleTechChange('platform', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }}>
                      <option value="Web Base">Web Base</option><option value="Mobile App">Mobile App</option><option value="Desktop App">Desktop App</option>
                    </select>
                  </div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>Database Server IP</label><input placeholder="10.x.x.x" value={editFormData.tech.server} onChange={(e) => handleTechChange('server', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)'}}>Web Server IP</label><input placeholder="10.x.x.x" value={editFormData.tech.webServer} onChange={(e) => handleTechChange('webServer', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} /></div>
                </div>
              </div>

              {/* Section 5 & 6 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#ef4444', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>5</span>
                    Impact Teams
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {impactTeamsList.map(team => (
                      <label key={team} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: editFormData.tracking.impactTeams.includes(team) ? 'var(--input-bg)' : 'var(--bg-color)', padding: '10px', borderRadius: '6px', border: editFormData.tracking.impactTeams.includes(team) ? '1px solid var(--blue)' : '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={editFormData.tracking.impactTeams.includes(team)} onChange={() => handleImpactTeamToggle(team)} style={{ width: '16px', height: '16px', accentColor: 'var(--blue)' }} />
                        <span style={{ fontSize: '0.85rem', color: editFormData.tracking.impactTeams.includes(team) ? 'var(--blue)' : 'var(--text-color)', fontWeight: editFormData.tracking.impactTeams.includes(team) ? '600' : 'normal' }}>{team}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#ef4444', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>6</span>
                    จัดเก็บข้อมูล (PDPA)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {fullPdpaItems.map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: editFormData.compliance.pdpa?.[item.key] ? 'var(--input-bg)' : 'var(--bg-color)', padding: '10px', borderRadius: '6px', border: editFormData.compliance.pdpa?.[item.key] ? '1px solid #ef4444' : '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={editFormData.compliance.pdpa?.[item.key] || false} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', color: editFormData.compliance.pdpa?.[item.key] ? '#ef4444' : 'var(--text-color)', fontWeight: editFormData.compliance.pdpa?.[item.key] ? '600' : 'normal' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ padding: '20px 24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModals} style={{ padding: '10px 20px', color: 'var(--text-muted)', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>ยกเลิก (Cancel)</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 30px' }}>
                💾 บันทึกและอัปเดตงาน (Save)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectPortfolio;