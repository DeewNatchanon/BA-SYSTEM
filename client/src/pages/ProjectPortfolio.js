import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchProjects, updateProjectInDb } from '../api/authApi';
import Swal from 'sweetalert2';

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
  
  const [progressFile, setProgressFile] = useState(null);

  const isManager = currentUser?.role === 'manager';

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
    } catch (error) { 
      console.error(error); 
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโครงการได้', 'error');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project); 
    setActiveTab('overview'); 
    setIsViewModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project); // บังคับจำโปรเจกต์เสมอ
    
    const existingTracking = project.form_data?.tracking || {};
    
    const currentStatus = project.status || 'Initiate';
    const currentPhase = project.phase || 'Requirement';
    let autoPercent = existingTracking.completionPercent || 0;
    
    if (currentStatus === 'Go-live' || currentPhase === 'Go-live') {
      autoPercent = 100;
    } else if (currentPhase === 'Requirement') {
      autoPercent = 25;
    } else if (currentPhase === 'Preparation') {
      autoPercent = 50;
    } else if (currentPhase === 'Development/Implement') {
      autoPercent = 75;
    } else if (currentPhase === 'UAT') {
      autoPercent = 90;
    }
    
    const smartTracking = {
      completionPercent: autoPercent,
      actualStart: existingTracking.actualStart || project.form_data?.compliance?.baStartDate || '',
      actualGoLive: existingTracking.actualGoLive || project.form_data?.compliance?.baEndDate || '',
      appName: existingTracking.appName || project.name || '',
      appId: existingTracking.appId || project.form_data?.appId || '',
      deployIn: existingTracking.deployIn || project.site || '',
      operatedBy: existingTracking.operatedBy || '',
      glsOwner: existingTracking.glsOwner || '',
      glsManager: existingTracking.glsManager || project.form_data?.assigned_to || '',
      impactTeams: existingTracking.impactTeams || [],
      isPendingApproval: existingTracking.isPendingApproval || false,
      pendingStatus: existingTracking.pendingStatus || null,
      pendingPhase: existingTracking.pendingPhase || null,
      progressFile: existingTracking.progressFile || null
    };

    const tech = { language: '', platform: 'Web Base', server: '', webServer: '', ...(project.form_data?.tech || {}) };
    const compliance = { pdpa: {}, ropa: {}, ...(project.form_data?.compliance || {}) };

    setEditFormData({ 
      ...project, 
      status: currentStatus,
      phase: currentPhase, 
      tracking: smartTracking,
      tech,
      compliance
    });
    setProgressFile(null);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false); setIsEditModalOpen(false);
    setSelectedProject(null); setEditFormData(null); setProgressFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'phase' || name === 'status') {
        const currentPhase = name === 'phase' ? value : prev.phase;
        const currentStatus = name === 'status' ? value : prev.status;
        
        let autoPercent = prev.tracking?.completionPercent || 0;
        
        if (currentStatus === 'Go-live' || currentPhase === 'Go-live') {
          autoPercent = 100;
        } else if (currentPhase === 'Requirement') {
          autoPercent = 25;
        } else if (currentPhase === 'Preparation') {
          autoPercent = 50;
        } else if (currentPhase === 'Development/Implement') {
          autoPercent = 75;
        } else if (currentPhase === 'UAT') {
          autoPercent = 90;
        }
        
        return {
          ...newData,
          tracking: {
            ...(newData.tracking || {}),
            completionPercent: autoPercent
          }
        };
      }
      return newData;
    });
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

  const handleManagerDecision = async (decision) => {
    const isApprove = decision === 'approve';
    
    Swal.fire({
      title: isApprove ? 'ยืนยันอนุมัติ?' : 'ปฏิเสธคำขอ?',
      text: isApprove ? 'ข้อมูลจะถูกอัปเดตเข้าระบบทันที' : 'สถานะจะกลับไปเป็นค่าเดิม',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const sessionRaw = localStorage.getItem('ba-system.auth-session');
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;

          const newStatus = isApprove ? editFormData.tracking.pendingStatus : selectedProject.status;
          const newPhase = isApprove ? editFormData.tracking.pendingPhase : selectedProject.phase;
          
          let autoPercent = editFormData.tracking.completionPercent || 0;
          if (isApprove) {
              if (newStatus === 'Go-live' || newPhase === 'Go-live') autoPercent = 100;
              else if (newPhase === 'Requirement') autoPercent = 25;
              else if (newPhase === 'Preparation') autoPercent = 50;
              else if (newPhase === 'Development/Implement') autoPercent = 75;
              else if (newPhase === 'UAT') autoPercent = 90;
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
                      pendingPhase: null
                  },
                  tech: editFormData.tech,
                  compliance: editFormData.compliance
              }
          };

          const updated = await updateProjectInDb(editFormData.id, finalData, null, token);
          const parsedUpdated = { ...updated.data, form_data: typeof updated.data.form_data === 'string' ? JSON.parse(updated.data.form_data) : updated.data.form_data };
          setProjects(prev => prev.map(p => p.id === parsedUpdated.id ? parsedUpdated : p));
          
          Swal.fire('สำเร็จ', isApprove ? '✅ อนุมัติการเปลี่ยนสถานะเรียบร้อยแล้ว!' : '❌ ปฏิเสธคำขอและคงสถานะเดิมเรียบร้อย!', 'success');
          setIsEditModalOpen(false);
        } catch (err) {
          Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
        }
      }
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    const isStatusChanged = selectedProject.status !== editFormData.status || selectedProject.phase !== editFormData.phase;

    let confirmTitle = 'ยืนยันการอัปเดตข้อมูล';
    let confirmText = 'คุณต้องการบันทึกข้อมูลความคืบหน้าใช่หรือไม่?';
    let confirmBtnText = '💾 บันทึก';

    if (isStatusChanged) {
      if (!isManager) {
        confirmTitle = 'ส่งคำขออนุมัติ';
        confirmText = `ส่งคำขอเปลี่ยนสถานะเป็น "${editFormData.status}" (Phase: ${editFormData.phase}) ให้ Manager ตรวจสอบใช่หรือไม่?`;
        confirmBtnText = '📤 ส่งคำขอ';
      } else {
        confirmTitle = 'ยืนยันเปลี่ยนสถานะ';
        confirmText = `คุณเป็น Manager: ยืนยันการเปลี่ยนสถานะเป็น "${editFormData.status}" ใช่หรือไม่?`;
        confirmBtnText = '✅ ยืนยัน';
      }
    }

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0072bb',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmBtnText,
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        let finalStatusToSave = editFormData.status;
        let finalPhaseToSave = editFormData.phase;
        let trackingData = { ...editFormData.tracking };

        if (isStatusChanged) {
          if (!isManager) {
            finalStatusToSave = selectedProject.status;
            finalPhaseToSave = selectedProject.phase;
            
            trackingData.isPendingApproval = true;
            trackingData.pendingStatus = editFormData.status;
            trackingData.pendingPhase = editFormData.phase;
          } else {
            trackingData.isPendingApproval = false;
          }
        }

        try {
          const sessionRaw = localStorage.getItem('ba-system.auth-session');
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
          
          const finalData = { 
            ...editFormData, 
            status: finalStatusToSave,
            phase: finalPhaseToSave,
            form_data: { 
              ...editFormData.form_data, 
              tracking: trackingData,
              tech: editFormData.tech,
              compliance: editFormData.compliance 
            } 
          };
          
          // ส่งข้อมูลไปยัง API
          const updated = await updateProjectInDb(editFormData.id, finalData, progressFile, token);
          
          const parsedUpdated = {
            ...updated.data,
            form_data: typeof updated.data.form_data === 'string' ? JSON.parse(updated.data.form_data) : updated.data.form_data
          };
          
          setProjects(prev => prev.map(p => p.id === parsedUpdated.id ? parsedUpdated : p));
          
          if (isStatusChanged && !isManager) {
            Swal.fire('สำเร็จ!', 'ส่งคำขอเปลี่ยนสถานะไปให้ Manager ตรวจสอบเรียบร้อยแล้วครับ!', 'success');
          } else {
            Swal.fire('สำเร็จ!', 'อัปเดตข้อมูลสำเร็จเรียบร้อย!', 'success');
          }
          setIsEditModalOpen(false);
        } catch (error) { 
          Swal.fire('ไม่สามารถบันทึกได้', error.message, 'error');
        }
      }
    });
  };

  const toDate = (s) => s ? new Date(s) : null;
  const toIso = (d) => d ? d.toISOString().split('T')[0] : '';
  const formatDateTH = (dateString) => dateString ? new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  const getProgressColor = (percent) => {
    if (percent < 30) return '#ef4444'; 
    if (percent < 75) return '#f59e0b'; 
    return '#10b981'; 
  };

  const isStatusChangedUI = selectedProject && editFormData && (selectedProject.status !== editFormData.status || selectedProject.phase !== editFormData.phase);
  const isPendingUpdate = editFormData?.tracking?.isPendingApproval;

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="page-wrap page-project">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Project Portfolio</h1>
      </div>
      <div className="page-rule"></div>

      <section style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="table-wrap">
          <table className="portfolio-table project-portfolio-table">
            <thead>
              <tr>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>รหัสโครงการ (ID)</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>ชื่อโครงการ (Project Name)</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>ผู้รับผิดชอบ (Assignee)</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>สถานะ (Status)</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>ขั้นตอน (Phase)</th>
                <th style={{ textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-color)' }}>ความคืบหน้า (%)</th>
                <th style={{ textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-color)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{p.id}</td>
                  <td>
                    <span onClick={() => handleViewProject(p)} style={{ color: 'var(--text-color)', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--blue)'} onMouseLeave={e => e.target.style.color = 'var(--text-color)'}>
                      {p.name}
                    </span>
                  </td>
                  <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>{p.form_data?.tracking?.glsManager || p.form_data?.assigned_to || '-'}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <span className={`status-badge ${p.status?.toLowerCase()}`}>{p.status}</span>
                      {p.form_data?.tracking?.isPendingApproval && (
                        <div style={{ fontSize: '0.7rem', color: '#d97706', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', border: '1px solid #fde68a' }}>
                          ⏳ รอ Manager ยืนยัน
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{p.phase || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <div style={{ width: '70px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), width: `${p.form_data?.tracking?.completionPercent || 0}%`, transition: 'width 0.4s ease' }}></div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleEditProject(p)} 
                      style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontWeight: 600 }} 
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
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '24px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px', background: 'var(--blue-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>{selectedProject.name}</h2>
                <span style={{ opacity: 0.8, fontSize: '0.9rem', color: '#fff' }}>รหัสโครงการ: {selectedProject.id}</span>
              </div>
              <button onClick={handleCloseModals} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', padding: '0 30px' }}>
              {[{ id: 'overview', label: '📌 ภาพรวม' }, { id: 'requirement', label: '📝 ความต้องการ' }, { id: 'system', label: '💻 ระบบ & ทีม' }, { id: 'timeline', label: '⏱️ กำหนดการ' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '16px 24px', border: 'none', background: activeTab === t.id ? 'var(--card-bg)' : 'transparent', borderBottom: activeTab === t.id ? '3px solid var(--blue)' : 'none', cursor: 'pointer', fontWeight: activeTab === t.id ? 'bold' : 'normal', color: activeTab === t.id ? 'var(--blue)' : 'var(--text-muted)' }}>{t.label}</button>
              ))}
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ข้อมูลผู้ร้องขอ (Requester)</h4>
                    <p><strong>ชื่อผู้ติดต่อ:</strong> {selectedProject.requester_name || selectedProject.form_data?.requesterName || selectedProject.form_data?.contactName || '-'}</p>
                    <p><strong>แผนก (Dept):</strong> {selectedProject.form_data?.requesterDept || selectedProject.form_data?.department || '-'}</p>
                    <p><strong>ไซต์ (Site):</strong> {selectedProject.site}</p>
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>บริบทโครงการ (Context)</h4>
                    <p><strong>วัตถุประสงค์:</strong> {selectedProject.description}</p>
                    <p><strong>เป้าหมาย (Outcome):</strong> {selectedProject.form_data?.expectedOutcome || selectedProject.form_data?.objective || '-'}</p>
                  </div>
                </div>
              )}
              {activeTab === 'requirement' && (
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', borderLeft: '5px solid var(--blue)', whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>
                  <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>รายละเอียดเชิงลึก (Requirement Details)</h4>
                  {selectedProject.form_data?.requirementDetail || selectedProject.form_data?.details || 'ไม่มีข้อมูลระบุไว้'}
                </div>
              )}
              {activeTab === 'system' && (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ข้อมูลระบบ (Application)</h4>
                        <p><strong>App Name:</strong> {selectedProject.form_data?.tracking?.appName || '-'}</p>
                        <p><strong>App ID:</strong> {selectedProject.form_data?.tracking?.appId || selectedProject.form_data?.appId || '-'}</p>
                        <p><strong>Deploy Site:</strong> {selectedProject.form_data?.tracking?.deployIn || '-'}</p>
                        <p><strong>Project Owner:</strong> {selectedProject.form_data?.tracking?.glsOwner || '-'}</p>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>ทีมที่ได้รับผลกระทบ (Impact Teams)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {selectedProject.form_data?.tracking?.impactTeams?.map(team => <span key={team} className="status-badge" style={{background: 'var(--card-bg)', color: 'var(--blue)', border: '1px solid var(--blue)'}}>{team}</span>)}
                        </div>
                    </div>
                 </div>
              )}
              {activeTab === 'timeline' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: '#d97706', marginTop: 0 }}>📋 แผนงานประเมิน (Plan by Manager)</h4>
                    <p><strong>วันที่คาดว่าจะเริ่ม (Plan Start):</strong> {formatDateTH(selectedProject.form_data?.compliance?.baStartDate)}</p>
                    <p><strong>วันที่คาดว่าจะเสร็จ (Plan Go-live):</strong> {formatDateTH(selectedProject.form_data?.compliance?.baEndDate)}</p>
                    <p><strong>ผู้รับผิดชอบ (Assignee):</strong> <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{selectedProject.form_data?.tracking?.glsManager || selectedProject.form_data?.assigned_to || '-'}</span></p>
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--blue)', marginTop: 0 }}>⚡ ความเป็นจริง (Actual Tracking)</h4>
                    <p><strong>วันที่เริ่มจริง (Actual Start):</strong> {formatDateTH(selectedProject.form_data?.tracking?.actualStart)}</p>
                    <p><strong>วันที่เสร็จจริง (Actual Go-live):</strong> {formatDateTH(selectedProject.form_data?.tracking?.actualGoLive)}</p>
                    <p><strong>ความคืบหน้า (Progress):</strong> <span style={{ fontWeight: 'bold', color: getProgressColor(selectedProject.form_data?.tracking?.completionPercent || 0), fontSize: '1.2rem' }}>{selectedProject.form_data?.tracking?.completionPercent || 0}%</span></p>
                    
                    {selectedProject.form_data?.tracking?.progressFile && (
                      <div style={{ marginTop: '10px', padding: '15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        📄 <strong>หลักฐานล่าสุด:</strong> <a href={`http://localhost:4000/${selectedProject.form_data.tracking.progressFile.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>ดูไฟล์แนบ</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '20px 30px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-color)' }}>
              <button className="btn btn-secondary" onClick={() => { if(selectedProject.document_path) window.open(`http://localhost:4000/${selectedProject.document_path.replace(/\\/g, '/')}`, '_blank'); else Swal.fire('ข้อผิดพลาด', 'ไม่พบไฟล์แนบของโครงการนี้', 'error'); }} style={{ borderRadius: '8px' }}>📂 เปิดไฟล์เอกสารอนุมัติเริ่มต้น</button>
              <button className="btn btn-primary" onClick={handleCloseModals} style={{ borderRadius: '8px' }}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 MODAL: UPDATE PROGRESS */}
      {/* ========================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <form className="pdf-preview-card" onSubmit={handleSaveEdit} style={{ width: '95%', maxWidth: '950px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '24px 30px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-color)', fontSize: '1.4rem' }}>📝 อัปเดตความคืบหน้าและการส่งต่องาน</h3>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{editFormData.id} - {editFormData.name}</span>
              </div>
              <button type="button" onClick={handleCloseModals} style={{ background: 'var(--bg-color)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '30px', background: 'var(--bg-secondary, #f8fafc)' }}>
              
              {/* Section 1 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                  <span style={{background: 'var(--blue)', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>1</span>
                  สถานะโครงการ (Project Status)
                </h4>

                {isPendingUpdate && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                      <h4 style={{ color: '#d97706', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⏳ รอยืนยันการเปลี่ยนสถานะ
                      </h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#92400e' }}>
                          พนักงานขอเปลี่ยนสถานะเป็น: <strong>{editFormData.tracking.pendingStatus}</strong> (Phase: {editFormData.tracking.pendingPhase})
                      </p>
                      {editFormData.tracking.progressFile && (
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            📄 <a href={`http://localhost:4000/${editFormData.tracking.progressFile.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ color: '#0072bb', fontWeight: 'bold', textDecoration: 'underline' }}>คลิกเพื่อตรวจสอบไฟล์หลักฐานแนบ</a>
                          </p>
                      )}
                      
                      {isManager ? (
                          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => handleManagerDecision('approve')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', background: '#10b981', border: 'none', borderRadius: '8px' }}>✅ อนุมัติให้เปลี่ยนสถานะ</button>
                            <button type="button" onClick={() => handleManagerDecision('reject')} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2', borderRadius: '8px' }}>❌ ปฏิเสธคำขอ</button>
                          </div>
                      ) : (
                          <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#d97706', fontStyle: 'italic' }}>
                            (คุณไม่สามารถเปลี่ยนสถานะเพิ่มเติมได้ จนกว่า Manager จะตรวจสอบและอนุมัติคำขอนี้)
                          </div>
                      )}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-color)' }}>
                        ความคืบหน้าปัจจุบัน (Progress)
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '10px' }}>(อัปเดตอัตโนมัติตาม Phase)</span>
                      </label>
                      <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: getProgressColor(editFormData.tracking.completionPercent), lineHeight: 1 }}>
                        {editFormData.tracking.completionPercent}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '14px', background: 'var(--border-color)', borderRadius: '7px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${editFormData.tracking.completionPercent}%`, 
                        background: getProgressColor(editFormData.tracking.completionPercent), 
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }}></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>สถานะ (Status)</label>
                    <select 
                      name="status" value={editFormData.status} onChange={handleEditChange} 
                      disabled={isPendingUpdate && !isManager}
                      style={{ background: 'var(--input-bg)', color: 'var(--text-color)', opacity: (isPendingUpdate && !isManager) ? 0.6 : 1, padding: '12px', borderRadius: '8px' }}
                    >
                      <option value="Initiate">Initiate (เริ่มต้น)</option>
                      <option value="Active">Active (กำลังดำเนินงาน)</option>
                      <option value="Hold">Hold (ระงับชั่วคราว)</option>
                      <option value="Go-live">Go-live (ใช้งานจริง)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ขั้นตอนปัจจุบัน (Phase)</label>
                    <select 
                      name="phase" value={editFormData.phase} onChange={handleEditChange} 
                      disabled={isPendingUpdate && !isManager}
                      style={{ background: 'var(--input-bg)', color: 'var(--text-color)', opacity: (isPendingUpdate && !isManager) ? 0.6 : 1, padding: '12px', borderRadius: '8px' }}
                    >
                      <option value="Requirement">Requirement (รับความต้องการ)</option>
                      <option value="Preparation">Preparation (เตรียมการ)</option>
                      <option value="Development/Implement">Development/Implement (กำลังพัฒนา)</option>
                      <option value="UAT">UAT (ทดสอบระบบ)</option>
                      <option value="Go-live">Go-live (ขึ้นระบบจริง)</option>
                    </select>
                  </div>
                  
                  {/* 🚀 ไฟล์หลักฐานความคืบหน้า (เปิดให้แสดงตลอดเวลา ไม่ต้องซ่อน) */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(14, 165, 233, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '12px', display: 'block' }}>
                      📂 ไฟล์หลักฐานความคืบหน้า <span style={{color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.85rem', fontWeight: 'normal'}}>(แนบเพิ่มเติมได้หากมี)</span>
                    </label>
                    
                    <input 
                      type="file" 
                      onChange={(e) => setProgressFile(e.target.files[0])} 
                      style={{ width: '100%', padding: '10px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px dashed var(--blue)', color: 'var(--text-color)' }}
                      disabled={isPendingUpdate && !isManager} 
                    />

                    {editFormData.form_data?.tracking?.progressFile && !progressFile && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        📄 ไฟล์หลักฐานที่แนบไว้ปัจจุบัน: <a href={`http://localhost:4000/${editFormData.form_data.tracking.progressFile.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 'bold' }}>คลิกเพื่อดูไฟล์</a>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Section 2 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                  <span style={{background: '#10b981', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>2</span>
                  กำหนดการทำงานจริง (Actual Timeline)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>วันที่เริ่มงานจริง (Actual Start)</label>
                    <DatePicker selected={toDate(editFormData.tracking.actualStart)} onChange={(date) => handleTrackingChange('actualStart', toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                    <div style={{ fontSize: '0.85rem', color: 'var(--blue)', marginTop: '8px' }}>
                       📌 แผนที่วางไว้ (Plan): {formatDateTH(editFormData.form_data?.compliance?.baStartDate)}
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>วันที่เสร็จจริง (Actual Go-live)</label>
                    <DatePicker selected={toDate(editFormData.tracking.actualGoLive)} onChange={(date) => handleTrackingChange('actualGoLive', toIso(date))} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="คลิกเพื่อเลือกวัน" />
                    <div style={{ fontSize: '0.85rem', color: 'var(--blue)', marginTop: '8px' }}>
                       📌 แผนที่วางไว้ (Plan): {formatDateTH(editFormData.form_data?.compliance?.baEndDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: App & Responsibility */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                  <span style={{background: '#f59e0b', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>3</span>
                  ข้อมูลระบบและผู้รับผิดชอบ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>ชื่อผู้รับผิดชอบงาน (GLS PM)</label><input value={editFormData.tracking.glsManager} onChange={(e) => handleTrackingChange('glsManager', e.target.value)} placeholder="เช่น Chatchai" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>เจ้าของระบบ (GLS Owner)</label><input value={editFormData.tracking.glsOwner} onChange={(e) => handleTrackingChange('glsOwner', e.target.value)} placeholder="เช่น SOG 6" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>ชื่อแอปพลิเคชัน (App Name)</label><input value={editFormData.tracking.appName} onChange={(e) => handleTrackingChange('appName', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>รหัสระบบ (App ID)</label><input value={editFormData.tracking.appId} onChange={(e) => handleTrackingChange('appId', e.target.value)} placeholder="เช่น APP-001" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>ไซต์ที่ติดตั้ง (Deploy Site)</label><input value={editFormData.tracking.deployIn} onChange={(e) => handleTrackingChange('deployIn', e.target.value)} placeholder="เช่น BSR" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                </div>
              </div>

              {/* Section 4 */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                  <span style={{background: '#8b5cf6', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>4</span>
                  โครงสร้างเทคโนโลยี (Tech Stack)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>ภาษาที่ใช้ (Programming Language)</label><input placeholder="เช่น React, PHP" value={editFormData.tech.language} onChange={(e) => handleTechChange('language', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>แพลตฟอร์ม (Platform)</label>
                    <select value={editFormData.tech.platform} onChange={(e) => handleTechChange('platform', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }}>
                      <option value="Web Base">Web Base</option><option value="Mobile App">Mobile App</option><option value="Desktop App">Desktop App</option>
                    </select>
                  </div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>Database Server IP</label><input placeholder="10.x.x.x" value={editFormData.tech.server} onChange={(e) => handleTechChange('server', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                  <div className="form-group"><label style={{color: 'var(--text-muted)', fontWeight: 600}}>Web Server IP</label><input placeholder="10.x.x.x" value={editFormData.tech.webServer} onChange={(e) => handleTechChange('webServer', e.target.value)} style={{ background: 'var(--input-bg)', color: 'var(--text-color)', padding: '12px', borderRadius: '8px' }} /></div>
                </div>
              </div>

              {/* Section 5 & 6 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                    <span style={{background: '#ef4444', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>5</span>
                    Impact Teams
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {impactTeamsList.map(team => (
                      <label key={team} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: editFormData.tracking.impactTeams.includes(team) ? 'var(--input-bg)' : 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: editFormData.tracking.impactTeams.includes(team) ? '1px solid var(--blue)' : '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={editFormData.tracking.impactTeams.includes(team)} onChange={() => handleImpactTeamToggle(team)} style={{ width: '18px', height: '18px', accentColor: 'var(--blue)' }} />
                        <span style={{ fontSize: '0.9rem', color: editFormData.tracking.impactTeams.includes(team) ? 'var(--blue)' : 'var(--text-color)', fontWeight: editFormData.tracking.impactTeams.includes(team) ? '600' : 'normal' }}>{team}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                    <span style={{background: '#ef4444', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>6</span>
                    จัดเก็บข้อมูล (PDPA)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {fullPdpaItems.map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: editFormData.compliance.pdpa?.[item.key] ? 'var(--input-bg)' : 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: editFormData.compliance.pdpa?.[item.key] ? '1px solid #ef4444' : '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={editFormData.compliance.pdpa?.[item.key] || false} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ef4444' }} />
                        <span style={{ fontSize: '0.9rem', color: editFormData.compliance.pdpa?.[item.key] ? '#ef4444' : 'var(--text-color)', fontWeight: editFormData.compliance.pdpa?.[item.key] ? '600' : 'normal' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ padding: '20px 30px', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-tertiary" onClick={handleCloseModals} style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '1rem' }}>ยกเลิก (Cancel)</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }} disabled={isPendingUpdate && !isManager}>
                {selectedProject && (selectedProject.status !== editFormData.status || selectedProject.phase !== editFormData.phase) && !isManager ? '📤 ส่งคำขออนุมัติสถานะ' : '💾 บันทึกและอัปเดตงาน'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectPortfolio;