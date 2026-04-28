import React, { useState, useEffect } from 'react';
import { fetchProjects, updateProjectInDb } from '../api/authApi';
import Swal from 'sweetalert2';

function ApplicationPortfolio({ currentUser }) {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fullPdpaItems = [
    { key: 'health', label: 'ข้อมูลสุขภาพ' }, { key: 'idCard', label: 'บัตรประชาชน' }, { key: 'passport', label: 'Passport' },
    { key: 'hn', label: 'HN' }, { key: 'name', label: 'ชื่อ-นามสกุล' }, { key: 'address', label: 'ที่อยู่' },
    { key: 'dob', label: 'วัน/เดือน/ปีเกิด' }, { key: 'phone', label: 'เบอร์โทร' }, { key: 'email', label: 'Email' },
    { key: 'financial', label: 'ข้อมูลการเงิน' }, { key: 'criminal', label: 'ประวัติอาชญากรรม' }, { key: 'ethnicity', label: 'เชื้อชาติ/ศาสนา' },
    { key: 'photo', label: 'รูปถ่ายใบหน้า' }
  ];

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const sessionData = sessionRaw ? JSON.parse(sessionRaw) : null;
      const token = sessionData?.token;

      if (token) {
        const data = await fetchProjects(token);
        
        const appsOnly = data
          .filter(item => item.phase && item.phase.toLowerCase() === 'go-live')
          .map(item => {
            let parsedForm = item.form_data;
            if (typeof parsedForm === 'string') {
              try { parsedForm = JSON.parse(parsedForm); } catch (e) { parsedForm = {}; }
            }
            parsedForm = parsedForm || {};

            return {
              ...item,
              form_data: parsedForm,
              tech: parsedForm.tech || {},
              compliance: parsedForm.compliance || { pdpa: {}, ropa: {} },
              support: parsedForm.support || {},
              manager: parsedForm.tracking?.glsManager || parsedForm.assigned_to || item.requester_name || '-',
              owner: parsedForm.tracking?.glsOwner || 'SOG6',
              users: parsedForm.users || '> 50 Users',
              comments: parsedForm.comments || ''
            };
          });

        setAllData(appsOnly);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูล Application Portfolio ได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setActiveTab('general');
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isEditing) {
      Swal.fire({
        title: 'ยกเลิกการแก้ไข?',
        text: 'คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างหรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ยืนยันปิด',
        cancelButtonText: 'ทำต่อ'
      }).then((result) => {
        if (result.isConfirmed) {
          setIsViewModalOpen(false);
          setSelectedApp(null);
          setIsEditing(false);
        }
      });
    } else {
      setIsViewModalOpen(false);
      setSelectedApp(null);
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    setEditFormData({
      ...selectedApp,
      tech: selectedApp.tech || {},
      support: selectedApp.support || {},
      interface: selectedApp.interface || {},
      compliance: {
        pdpa: selectedApp.compliance?.pdpa || {},
        ropa: selectedApp.compliance?.ropa || {}
      }
    });
    setIsEditing(true);
  };

  const handleNestedChange = (section, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
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

  const handleRopaChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        ropa: { ...(prev.compliance?.ropa || {}), [field]: value }
      }
    }));
  };

  const handleSaveEdit = async () => {
    Swal.fire({
      title: 'ยืนยันบันทึก?',
      text: 'คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลแอปพลิเคชันใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0072bb',
      cancelButtonColor: '#64748b',
      confirmButtonText: '💾 บันทึก',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsSaving(true);
          const sessionRaw = localStorage.getItem('ba-system.auth-session');
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
          if (!token) throw new Error("No token found");

          const finalDataToSave = {
            ...editFormData,
            form_data: {
              ...editFormData.form_data,
              tech: editFormData.tech,
              compliance: editFormData.compliance,
              support: editFormData.support,
              users: editFormData.users,
              comments: editFormData.comments
            }
          };

          await updateProjectInDb(editFormData.id, finalDataToSave, null, token);
          
          setAllData(prev => prev.map(item => item.id === editFormData.id ? finalDataToSave : item));
          setSelectedApp(finalDataToSave);
          setIsEditing(false);
          
          Swal.fire('สำเร็จ!', 'บันทึกข้อมูลการแก้ไขเรียบร้อยแล้ว', 'success');
          
        } catch (error) {
          console.error("Error updating application:", error);
          Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message, 'error');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const getActiveColor = () => {
    switch(activeTab) {
      case 'general': return '#0072bb'; 
      case 'tech': return '#8b5cf6';    
      case 'support': return '#10b981'; 
      case 'security': return '#ef4444';
      case 'history': return '#f59e0b'; 
      default: return 'var(--border-color)';
    }
  };

  const activeColor = getActiveColor();

  const getAppIdDisplay = (app) => {
    return app.form_data?.tracking?.appId || app.form_data?.appId || app.id;
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังดึงข้อมูล Application Portfolio...</div>;

  return (
    <div className="page-wrap page-app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Application Portfolio</h1>
      </div>
      <div className="page-rule"></div>

      {/* 1. ตารางแสดงผลหลัก (Impeccable Style) */}
      <section style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="table-wrap">
          <table className="portfolio-table project-portfolio-table">
            <thead>
              <tr>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>App ID</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Name / Site</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Category</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Status</th>
                <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Tech Summary</th>
                <th style={{ textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-color)' }}>Security</th>
                <th style={{ textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-color)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allData.length > 0 ? allData.map(app => {
                const hasPdpa = app.compliance?.pdpa && Object.values(app.compliance.pdpa).some(val => val === true);
                const hasRopa = app.compliance?.ropa && Object.values(app.compliance.ropa).some(val => typeof val === 'string' && val.trim() !== '');
                const isNewSystem = app.project_type === 'New System' || app.project_type === 'New';

                return (
                  <tr key={app.id}>
                    <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{getAppIdDisplay(app)}</td>
                    <td>
                      <span onClick={() => handleViewDetails(app)} style={{ color: 'var(--text-color)', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--blue)'} onMouseLeave={e => e.target.style.color = 'var(--text-color)'}>
                        {app.name}
                      </span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>SITE: <span style={{ color: 'var(--blue)' }}>{app.site || '-'}</span></div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-color)', fontSize: '0.85rem', fontWeight: 600 }}>{app.category || 'Support Application'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{isNewSystem ? 'Inhouse (New)' : 'Inhouse (Enhance)'}</div>
                    </td>
                    <td>
                      <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {app.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-color)', fontSize: '0.85rem', fontWeight: 600 }}>{app.tech?.language || '-'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{app.tech?.platform || 'Web Base'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {hasPdpa && (
                          <div title="มีการจัดเก็บข้อมูล PDPA" style={{ padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
                            🔒 PDPA
                          </div>
                        )}
                        {hasRopa && (
                          <div title="มีการบันทึก ROPA" style={{ padding: '4px 8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(14, 165, 233, 0.3)', whiteSpace: 'nowrap' }}>
                            🛡️ ROPA
                          </div>
                        )}
                        {!hasPdpa && !hasRopa && (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleViewDetails(app)} className="btn btn-primary" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                        🔍 View Details
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>ยังไม่มีแอปพลิเคชันที่ขึ้นระบบ (Go-live) แล้ว</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. MODAL: APPLICATION DETAILS & EDIT MODE (Impeccable Style) */}
      {isViewModalOpen && selectedApp && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '24px', padding: 0, overflow: 'hidden' }}>
            
            <div style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', color: 'var(--text-color)', fontSize: '1.5rem', fontWeight: 800 }}>
                  {isEditing ? '✏️ กำลังแก้ไข: ' : ''}{selectedApp.name}
                </h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                  App ID: <strong style={{color:'var(--text-color)'}}>{getAppIdDisplay(selectedApp)}</strong> &nbsp;|&nbsp; Site: <strong style={{color:'var(--text-color)'}}>{selectedApp.site}</strong>
                </span>
              </div>
              {!isEditing && (
                <button onClick={handleCloseModal} style={{ background: 'var(--bg-color)', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '10px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
              )}
            </div>

            <div style={{ padding: '10px 30px 0 30px', borderBottom: `3px solid ${activeColor}`, display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'flex-end', transition: 'border-color 0.3s ease', background: 'var(--card-bg)' }}>
              {[
                { id: 'general', label: 'General & Business', color: '#0072bb' },
                { id: 'tech', label: 'Tech & Interface', color: '#8b5cf6' },
                { id: 'support', label: 'Support & SLA', color: '#10b981' },
                { id: 'security', label: 'Security & PDPA/ROPA', color: '#ef4444' },
                { id: 'history', label: 'History', color: '#f59e0b' }
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    padding: '12px 24px', border: 'none',
                    background: activeTab === tab.id ? tab.color : 'var(--bg-color)', 
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)', 
                    fontWeight: activeTab === tab.id ? '800' : '600', 
                    fontSize: '0.85rem', cursor: 'pointer', borderRadius: '10px 10px 0 0',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, color: 'var(--text-color)', fontSize: '0.95rem', background: 'var(--bg-secondary, #f8fafc)' }}>
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#0072bb', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>1</span>
                    ข้อมูลทั่วไปและธุรกิจ (General & Business)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: '1 / -1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Description (รายละเอียด)</div>
                      {isEditing ? <textarea value={editFormData.description || ''} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)' }}>{selectedApp.description || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>ผู้จัดการระบบ (Manager)</div>
                      {isEditing ? <input type="text" value={editFormData.manager || ''} onChange={(e) => setEditFormData({...editFormData, manager: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.manager || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>หน่วยงานเจ้าของ (Owner)</div>
                      {isEditing ? <input type="text" value={editFormData.owner || ''} onChange={(e) => setEditFormData({...editFormData, owner: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.owner || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>จำนวนผู้ใช้ (No. of Users)</div>
                      {isEditing ? <input type="text" value={editFormData.users || ''} onChange={(e) => setEditFormData({...editFormData, users: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.users || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>สถานะ (Status)</div>
                      {isEditing ? (
                         <select value={editFormData.status || 'Active'} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                           <option value="Active">Active</option>
                           <option value="Hold">Hold</option>
                           <option value="Inactive">Inactive</option>
                         </select>
                      ) : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.status || 'Active'}</div>}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'tech' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#8b5cf6', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>2</span>
                    โครงสร้างเทคโนโลยี (Server & Tech Stack)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Programming Language</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.language || ''} onChange={(e) => handleNestedChange('tech', 'language', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.tech?.language || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Platform</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.platform || ''} onChange={(e) => handleNestedChange('tech', 'platform', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.tech?.platform || 'Web Base'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Database Server IP</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.server || ''} onChange={(e) => handleNestedChange('tech', 'server', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.tech?.server || '-'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Web Server IP</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.webServer || ''} onChange={(e) => handleNestedChange('tech', 'webServer', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.tech?.webServer || '-'}</div>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#10b981', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>3</span>
                    ระดับการสนับสนุนและสัญญา (Support & Contract)
                  </h4>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--blue)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Tier 2 (L2 Support) / Site IT</div>
                      {isEditing ? <input type="text" value={editFormData.support?.l2Contact || ''} onChange={(e) => handleNestedChange('support', 'l2Contact', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.support?.l2Contact || 'BPK IT Support on site'}</div>}
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ color: 'var(--blue)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Tier 3 (L3 Support) / App Owner</div>
                      {isEditing ? <input type="text" value={editFormData.support?.l3Contact || ''} onChange={(e) => handleNestedChange('support', 'l3Contact', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)', fontWeight: 600 }}>{selectedApp.support?.l3Contact || 'GLS-G6-Developer-Group'}</div>}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{background: '#ef4444', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>4</span>
                      PDPA: ข้อมูลส่วนบุคคลที่ระบบจัดเก็บ
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {fullPdpaItems.map(item => {
                        const isChecked = isEditing ? (editFormData.compliance?.pdpa?.[item.key] || false) : (selectedApp.compliance?.pdpa?.[item.key] || false);
                        return (
                          <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isChecked ? 'rgba(34, 197, 94, 0.1)' : 'var(--card-bg)', padding: '12px 16px', borderRadius: '10px', border: isChecked ? '1px solid #22c55e' : '1px solid var(--border-color)', cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                            {isEditing ? <input type="checkbox" checked={isChecked} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#22c55e' }} /> : <span style={{ fontSize: '1.1rem' }}>{isChecked ? '✅' : '⚪'}</span>}
                            <span style={{ fontWeight: isChecked ? '600' : 'normal', color: isChecked ? '#22c55e' : 'var(--text-color)' }}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{background: '#ef4444', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>5</span>
                      ROPA: บันทึกกิจกรรมการประมวลผลข้อมูล
                    </h4>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {[
                        { letter: 'C', key: 'collect', title: 'Collect (แหล่งที่เก็บรวบรวมข้อมูล)', placeholder: 'ระบุแหล่งที่มา...' },
                        { letter: 'S', key: 'store', title: 'Store (สถานที่และระยะเวลาจัดเก็บ)', placeholder: 'ระบุสถานที่เก็บ/ระยะเวลา...' },
                        { letter: 'U', key: 'use', title: 'Use (วัตถุประสงค์ในการใช้)', placeholder: 'ระบุวัตถุประสงค์...' },
                        { letter: 'D', key: 'disclose', title: 'Disclose (การเปิดเผยให้บุคคลที่ 3)', placeholder: 'ระบุบุคคลภายนอกที่ส่งต่อให้...' }
                      ].map(ropa => (
                        <div key={ropa.key} style={{ display: 'flex', gap: '20px', background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ width: '40px', height: '40px', background: 'var(--blue)', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>{ropa.letter}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-color)', fontWeight: 700, marginBottom: '8px', fontSize: '0.95rem' }}>{ropa.title}</div>
                            {isEditing ? <textarea placeholder={ropa.placeholder} value={editFormData.compliance?.ropa?.[ropa.key] || ''} onChange={(e) => handleRopaChange(ropa.key, e.target.value)} style={{ width: '100%', minHeight: '60px', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{selectedApp.compliance?.ropa?.[ropa.key] || '-'}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background: '#f59e0b', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'}}>6</span>
                    ประวัติและการเปลี่ยนแปลง (History)
                  </h4>
                  <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Comments / บันทึกย่อล่าสุด</div>
                    {isEditing ? <textarea value={editFormData.comments || ''} onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})} style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }} /> : <div style={{ color: 'var(--text-color)' }}>{selectedApp.comments || '-'}</div>}
                  </div>
                </div>
              )}

            </div>

            {/* 🚀 พื้นหลังปุ่มโปร่งใส และปุ่มดีไซน์โค้งมน (Impeccable Style) */}
            <div style={{ padding: '20px 30px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!isEditing && (
                  <button onClick={handleStartEdit} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    ✏️ แก้ไขข้อมูล (Edit Mode)
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {isEditing ? (
                  <>
                    <button onClick={handleCloseModal} disabled={isSaving} className="btn btn-tertiary" style={{ padding: '12px 24px', background: 'var(--bg-color)', borderRadius: '10px', cursor: 'pointer' }}>ยกเลิก (Cancel)</button>
                    <button onClick={handleSaveEdit} disabled={isSaving} className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: '10px', fontWeight: '700', cursor: isSaving?'not-allowed':'pointer' }}>
                      {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง (Save)'}
                    </button>
                  </>
                ) : (
                  <button onClick={handleCloseModal} className="btn btn-tertiary" style={{ padding: '12px 30px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', background: 'var(--bg-color)' }}>
                    ปิดหน้าต่าง
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

export default ApplicationPortfolio;