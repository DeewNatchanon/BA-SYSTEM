import React, { useState, useEffect } from 'react';
import { fetchProjects, updateProjectInDb } from '../api/authApi';

function ApplicationPortfolio({ currentUser }) {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isManager = currentUser?.role === 'manager';

  const fullPdpaItems = [
    { key: 'health', label: 'ข้อมูลสุขภาพ' },
    { key: 'idCard', label: 'บัตรประชาชน' },
    { key: 'passport', label: 'Passport' },
    { key: 'hn', label: 'HN' },
    { key: 'name', label: 'ชื่อ-นามสกุล' },
    { key: 'address', label: 'ที่อยู่' },
    { key: 'dob', label: 'วัน/เดือน/ปีเกิด' },
    { key: 'phone', label: 'เบอร์โทร' },
    { key: 'email', label: 'Email' },
    { key: 'financial', label: 'ข้อมูลการเงิน' },
    { key: 'criminal', label: 'ประวัติอาชญากรรม' },
    { key: 'ethnicity', label: 'เชื้อชาติ/ศาสนา' },
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
        const appsOnly = data.filter(item => item.phase && item.phase.toLowerCase() === 'go-live');
        setAllData(appsOnly);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
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
      if(!window.confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างหรือไม่?')) return;
    }
    setIsViewModalOpen(false);
    setSelectedApp(null);
    setIsEditing(false);
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
    try {
      setIsSaving(true);
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      
      if (!token) throw new Error("No token found");

      await updateProjectInDb(editFormData.id, editFormData, token);
      
      setAllData(prev => prev.map(item => item.id === editFormData.id ? editFormData : item));
      setSelectedApp(editFormData);
      setIsEditing(false);
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      
    } catch (error) {
      console.error("Error updating application:", error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 ฟังก์ชันดึงสีของ Tab ที่ถูกเลือก เพื่อให้เส้นขอบด้านล่างเปลี่ยนสีตาม
  const getActiveColor = () => {
    switch(activeTab) {
      case 'general': return '#0072bb'; // Blue
      case 'tech': return '#8b5cf6';    // Purple
      case 'support': return '#10b981'; // Green
      case 'security': return '#ef4444';// Red (สีแดงชัดเจน)
      case 'history': return '#f59e0b'; // Amber (สีเหลืองอำพัน ไม่ซ้ำกับสีแดง)
      default: return '#e2e8f0';
    }
  };

  const activeColor = getActiveColor();

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังดึงข้อมูล Application Portfolio...</div>;

  return (
    <div className="page-wrap page-app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Application Portfolio</h1>
      </div>

      {/* ========================================== */}
      {/* 1. ตารางแสดงผลหลัก (Master Table) */}
      {/* ========================================== */}
      <section style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(15, 43, 75, 0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700 }}>App ID</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700 }}>Application Name / Site</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700 }}>Category / Type</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700 }}>Tech Stack Summary</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>Security Flag</th>
                <th style={{ padding: '16px 20px', color: '#0f2b4b', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allData.length > 0 ? allData.map(app => {
                const hasPdpa = app.compliance?.pdpa && Object.values(app.compliance.pdpa).some(val => val === true);
                const hasRopa = app.compliance?.ropa && Object.values(app.compliance.ropa).some(val => typeof val === 'string' && val.trim() !== '');
                const isNewSystem = app.project_type === 'New System' || app.project_type === 'New';

                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='#f8fafc'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>{app.id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#0f2b4b', fontSize: '0.95rem', fontWeight: 700 }}>{app.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>SITE: <span style={{ color: '#0072bb' }}>{app.site || '-'}</span></div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>{app.category || 'Support Application'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>{isNewSystem ? 'Inhouse (New)' : 'Inhouse (Enhance)'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {app.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>{app.tech?.language || '-'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>{app.tech?.platform || 'Web Base'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {hasPdpa && (
                          <div title="มีการจัดเก็บข้อมูล PDPA" style={{ padding: '4px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                            🔒 PDPA
                          </div>
                        )}
                        {hasRopa && (
                          <div title="มีการบันทึก ROPA" style={{ padding: '4px 8px', background: '#e0e7ff', color: '#0369a1', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
                            🛡️ ROPA
                          </div>
                        )}
                        {!hasPdpa && !hasRopa && (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button onClick={() => handleViewDetails(app)} style={{ background: 'linear-gradient(135deg, #0072bb, #005a9c)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 114, 187, 0.2)', transition: 'transform 0.15s' }}>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>ยังไม่มีแอปพลิเคชันในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. MODAL: APPLICATION DETAILS & EDIT MODE */}
      {/* ========================================== */}
      {isViewModalOpen && selectedApp && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1000px', height: '88vh', display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '16px', padding: 0 }}>
            
            {/* Header Modal */}
            <div style={{ padding: '24px 30px 16px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', color: 'var(--blue-dark)', fontSize: '1.6rem', fontWeight: 800 }}>
                  {isEditing ? '✏️ กำลังแก้ไข: ' : ''}{selectedApp.name}
                </h2>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                  App ID: <strong style={{color:'#0f2b4b'}}>{selectedApp.id}</strong> &nbsp;|&nbsp; Site: <strong style={{color:'#0f2b4b'}}>{selectedApp.site}</strong>
                </span>
              </div>
              {!isEditing && (
                <button onClick={handleCloseModal} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', width: '36px', height: '36px', borderRadius: '10px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
              )}
            </div>

            {/* 🚀 Tab Navigation (ดีไซน์ใหม่ สีชัดเจนเต็มกรอบ) */}
            <div style={{ 
              padding: '10px 30px 0 30px', 
              borderBottom: `3px solid ${activeColor}`, // เส้นขอบล่างเปลี่ยนสีตามแท็บ
              display: 'flex', 
              gap: '6px', 
              overflowX: 'auto', 
              alignItems: 'flex-end',
              transition: 'border-color 0.3s ease'
            }}>
              {[
                { id: 'general', label: 'General & Business', color: '#0072bb' },
                { id: 'tech', label: 'Tech & Interface', color: '#8b5cf6' },
                { id: 'support', label: 'Support & SLA', color: '#10b981' },
                { id: 'security', label: 'Security & PDPA/ROPA', color: '#ef4444' }, // แดงสด
                { id: 'history', label: 'History', color: '#f59e0b' } // เหลืองอำพัน
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    padding: '12px 24px', 
                    border: 'none',
                    background: activeTab === tab.id ? tab.color : '#f1f5f9', // ถ้า active สีจะเต็มกรอบ
                    color: activeTab === tab.id ? '#ffffff' : '#64748b', // ถ้า active ตัวหนังสือจะเป็นสีขาว
                    fontWeight: activeTab === tab.id ? '800' : '600', 
                    fontSize: '0.85rem',
                    cursor: 'pointer', 
                    borderRadius: '10px 10px 0 0',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, color: '#334155', fontSize: '0.95rem' }}>
              
              {/* 📑 TAB 1: GENERAL & BUSINESS */}
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>ข้อมูลทั่วไปและธุรกิจ (General & Business)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Description (รายละเอียด)</div>
                      {isEditing ? (
                        <textarea value={editFormData.description || ''} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      ) : <div style={{ color: '#1e293b' }}>{selectedApp.description || '-'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>ผู้จัดการระบบ (Manager)</div>
                      {isEditing ? (
                         <input type="text" value={editFormData.manager || ''} onChange={(e) => setEditFormData({...editFormData, manager: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      ) : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.manager || '-'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>หน่วยงานเจ้าของ (Owner)</div>
                      {isEditing ? (
                         <input type="text" value={editFormData.owner || ''} onChange={(e) => setEditFormData({...editFormData, owner: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      ) : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.owner || 'SOG6'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>จำนวนผู้ใช้ (No. of Users)</div>
                      {isEditing ? (
                         <input type="text" value={editFormData.users || ''} onChange={(e) => setEditFormData({...editFormData, users: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      ) : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.users || '> 50 Users'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>สถานะ (Status)</div>
                      {isEditing ? (
                         <select value={editFormData.status || 'Active'} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                           <option value="Active">Active</option>
                           <option value="Hold">Hold</option>
                           <option value="Inactive">Inactive</option>
                         </select>
                      ) : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.status || 'Active'}</div>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 📑 TAB 2: TECHNOLOGY & INTERFACE */}
              {activeTab === 'tech' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>โครงสร้างเทคโนโลยี (Server & Tech Stack)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Programming Language</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.language || ''} onChange={(e) => handleNestedChange('tech', 'language', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.tech?.language || '-'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Platform</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.platform || ''} onChange={(e) => handleNestedChange('tech', 'platform', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.tech?.platform || 'Web Base'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Database Server IP</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.server || ''} onChange={(e) => handleNestedChange('tech', 'server', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.tech?.server || '-'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Web Server IP</div>
                      {isEditing ? <input type="text" value={editFormData.tech?.webServer || ''} onChange={(e) => handleNestedChange('tech', 'webServer', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.tech?.webServer || '-'}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* 📑 TAB 3: SUPPORT & SLA */}
              {activeTab === 'support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>ระดับการสนับสนุนและสัญญา (Support & Contract)</h4>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#0072bb', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Tier 2 (L2 Support) / Site IT</div>
                      {isEditing ? <input type="text" value={editFormData.support?.l2Contact || ''} onChange={(e) => handleNestedChange('support', 'l2Contact', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.support?.l2Contact || 'BPK IT Support on site'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#0072bb', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Tier 3 (L3 Support) / App Owner</div>
                      {isEditing ? <input type="text" value={editFormData.support?.l3Contact || ''} onChange={(e) => handleNestedChange('support', 'l3Contact', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.support?.l3Contact || 'GLS-G6-Developer-Group'}</div>}
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#0072bb', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Contract Type</div>
                      {isEditing ? <input type="text" value={editFormData.support?.contractType || ''} onChange={(e) => handleNestedChange('support', 'contractType', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> : <div style={{ color: '#1e293b', fontWeight: 600 }}>{selectedApp.support?.contractType || 'Obligation'}</div>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 📑 TAB 4: SECURITY, PDPA & ROPA */}
              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* PDPA */}
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>PDPA: ข้อมูลส่วนบุคคลที่ระบบจัดเก็บ</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {fullPdpaItems.map(item => {
                        const isChecked = isEditing ? (editFormData.compliance?.pdpa?.[item.key] || false) : (selectedApp.compliance?.pdpa?.[item.key] || false);
                        return (
                          <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isChecked ? '#f0fdf4' : '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: isChecked ? '1px solid #bbf7d0' : '1px solid #e2e8f0', cursor: isEditing ? 'pointer' : 'default' }}>
                            {isEditing ? (
                              <input type="checkbox" checked={isChecked} onChange={(e) => handlePdpaChange(item.key, e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            ) : (
                              <span style={{ fontSize: '1.1rem' }}>{isChecked ? '✅' : '⚪'}</span> 
                            )}
                            <span style={{ fontWeight: isChecked ? '600' : 'normal', color: isChecked ? '#166534' : '#64748b' }}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ROPA */}
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>ROPA: บันทึกกิจกรรมการประมวลผลข้อมูล</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {[
                        { letter: 'C', key: 'collect', title: 'Collect (แหล่งที่เก็บรวบรวมข้อมูล)', placeholder: 'ระบุแหล่งที่มา...' },
                        { letter: 'S', key: 'store', title: 'Store (สถานที่และระยะเวลาจัดเก็บ)', placeholder: 'ระบุสถานที่เก็บ/ระยะเวลา...' },
                        { letter: 'U', key: 'use', title: 'Use (วัตถุประสงค์ในการใช้)', placeholder: 'ระบุวัตถุประสงค์...' },
                        { letter: 'D', key: 'disclose', title: 'Disclose (การเปิดเผยให้บุคคลที่ 3)', placeholder: 'ระบุบุคคลภายนอกที่ส่งต่อให้...' }
                      ].map(ropa => (
                        <div key={ropa.key} style={{ display: 'flex', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ width: '36px', height: '36px', background: '#0072bb', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{ropa.letter}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#0f2b4b', fontWeight: 700, marginBottom: '4px', fontSize: '0.95rem' }}>{ropa.title}</div>
                            {isEditing ? (
                              <textarea placeholder={ropa.placeholder} value={editFormData.compliance?.ropa?.[ropa.key] || ''} onChange={(e) => handleRopaChange(ropa.key, e.target.value)} style={{ width: '100%', minHeight: '50px', marginTop: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ color: '#475569', fontSize: '0.9rem' }}>{selectedApp.compliance?.ropa?.[ropa.key] || '-'}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
              
              {/* 📑 TAB 5: HISTORY */}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ margin: '0', fontSize: '1.15rem', color: '#0f2b4b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>ประวัติและการเปลี่ยนแปลง (History)</h4>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Comments / บันทึกย่อล่าสุด</div>
                    {isEditing ? (
                      <textarea value={editFormData.comments || ''} onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ) : <div style={{ color: '#1e293b' }}>{selectedApp.comments || '-'}</div>}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{ padding: '16px 30px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              <div>
                {!isEditing && isManager && (
                  <button onClick={handleStartEdit} style={{ background: '#0f2b4b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    ✏️ แก้ไขข้อมูล (Edit Mode)
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {isEditing ? (
                  <>
                    <button onClick={handleCloseModal} disabled={isSaving} className="btn btn-tertiary" style={{ padding: '10px 24px', border: 'none', background: '#e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>ยกเลิก (Cancel)</button>
                    <button onClick={handleSaveEdit} disabled={isSaving} style={{ background: '#166534', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: '700', cursor: isSaving?'not-allowed':'pointer' }}>
                      {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง (Save)'}
                    </button>
                  </>
                ) : (
                  <button onClick={handleCloseModal} style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 30px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
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