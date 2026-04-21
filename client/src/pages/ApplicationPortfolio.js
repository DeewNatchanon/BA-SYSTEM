import React, { useState, useEffect } from 'react';
import { fetchProjects } from '../api/authApi';

function ApplicationPortfolio({ currentUser }) {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // รายการหัวข้อสำหรับ PDPA/ROPA (ใช้แมปกับ JSONB ใน Database)
  const pdpaItems = [
    { key: 'health', label: 'ข้อมูลสุขภาพ' },
    { key: 'id', label: 'บัตรประชาชน' },
    { key: 'email', label: 'Email' },
    { key: 'photo', label: 'รูปถ่ายใบหน้า' }
  ];

  const ropaItems = [
    { key: 'collect', label: 'เก็บรวบรวม' },
    { key: 'store', label: 'จัดเก็บ' },
    { key: 'use', label: 'ใช้/ประมวลผล' }
  ];

  // 🚀 ดึงข้อมูลทั้งหมดจาก Database
  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRaw = localStorage.getItem('ba-system.auth-session');
        const sessionData = sessionRaw ? JSON.parse(sessionRaw) : null;
        const token = sessionData?.token;

        if (token) {
          const data = await fetchProjects(token);
          // กรองเฉพาะอันที่ Go-live (รองรับทั้งพิมพ์เล็กพิมพ์ใหญ่)
          const appsOnly = data.filter(item => item.phase && item.phase.toLowerCase() === 'go-live');
          setAllData(appsOnly);
        }
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setActiveTab('general');
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedApp(null);
  };

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>กำลังดึงข้อมูล Application Portfolio...</div>;

  return (
    <div className="page-wrap page-app">
      <h1 className="page-heading">Application Portfolio</h1>
      <div className="page-rule"></div>

      <section className="content-card portfolio-section">
        <div className="portfolio-section-title">Active Applications (Sync from Projects)</div>
        <div className="table-wrap">
          <table className="portfolio-table application-portfolio-table">
            <thead>
              <tr className="group-row">
                <th className="group-general" colSpan={5}>General Info</th>
                <th className="group-pdpa" colSpan={pdpaItems.length}>PDPA Flags</th>
                <th className="group-tech" colSpan={3}>Technology Stack</th>
                <th className="group-support" colSpan={2}>Support</th>
              </tr>
              <tr>
                <th>App ID</th>
                <th>Site</th>
                <th>Application Name</th>
                <th>Status</th>
                <th>Go-Live Date</th>
                {pdpaItems.map(item => <th key={item.key}>{item.label}</th>)}
                <th>Language</th>
                <th>DB Server</th>
                <th>Platform</th>
                <th>Manager</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allData.length > 0 ? allData.map(app => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td>{app.site}</td>
                  <td>
                    <button 
                      onClick={() => handleViewDetails(app)}
                      style={{ 
                        color: '#0056b3', background: 'none', border: 'none', 
                        cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline', padding: 0 
                      }}
                    >
                      {app.name}
                    </button>
                  </td>
                  <td><span className="status-pill status-go">{app.status}</span></td>
                  <td>{app.actual_go_live || app.plan_go_live || '-'}</td>
                  
                  {pdpaItems.map(item => (
                    <td key={item.key} style={{ textAlign: 'center' }}>
                      {app.compliance?.pdpa?.[item.key] || app.compliance?.[item.key] ? '✅' : '-'}
                    </td>
                  ))}

                  <td>{app.tech?.language || '-'}</td>
                  <td>{app.tech?.server || '-'}</td>
                  <td>{app.tech?.platform || 'Web Base'}</td>

                  <td>{app.manager}</td>
                  <td>
                    <button className="btn btn-tertiary" onClick={() => handleViewDetails(app)}>View</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="15" style={{ textAlign: 'center', padding: '20px' }}>ยังไม่มีแอปพลิเคชันที่ Go-live</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🚀 MODAL: APPLICATION DASHBOARD (แก้สีปุ่ม Tab แล้ว) 🚀 */}
      {/* ========================================== */}
      {isViewModalOpen && selectedApp && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '90%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: 'var(--blue-dark)' }}>{selectedApp.name}</h2>
                <span style={{ color: '#666' }}>App ID: {selectedApp.id} | Site: {selectedApp.site}</span>
              </div>
              <button className="btn btn-tertiary" onClick={handleCloseModal}>✕</button>
            </div>

            {/* 🛠️ แก้ไขสีตัวอักษรของ Tab ตรงนี้ครับ */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
              {['general', 'infrastructure', 'security', 'history'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    padding: '12px 24px', border: 'none', 
                    background: activeTab === tab ? '#fff' : 'transparent',
                    borderBottom: activeTab === tab ? '3px solid var(--blue)' : '3px solid transparent',
                    fontWeight: activeTab === tab ? 'bold' : 'normal', cursor: 'pointer',
                    color: activeTab === tab ? '#0056b3' : '#666' /* 👈 เพิ่มสีให้ตัวหนังสือแล้ว */
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {activeTab === 'general' && (
                <div>
                  <h4>ข้อมูลทั่วไป (General Information)</h4>
                  <p><strong>รายละเอียด:</strong> {selectedApp.description}</p>
                  <p><strong>ผู้จัดการระบบ:</strong> {selectedApp.manager}</p>
                  <p><strong>หน่วยงานเจ้าของ:</strong> {selectedApp.owner || 'SOG6'}</p>
                </div>
              )}
              {activeTab === 'infrastructure' && (
                <div>
                  <h4>ข้อมูลโครงสร้างระบบ (Infrastructure)</h4>
                  <table className="portfolio-table">
                    <tbody>
                      <tr><td><strong>Language/Framework:</strong></td><td>{selectedApp.tech?.language || '-'}</td></tr>
                      <tr><td><strong>Database Server:</strong></td><td>{selectedApp.tech?.server || '-'}</td></tr>
                      <tr><td><strong>Web Server:</strong></td><td>{selectedApp.tech?.webServer || '-'}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'security' && (
                <div>
                  <h4>ความปลอดภัยและ PDPA</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                      <h5>PDPA ข้อมูลที่จัดเก็บ:</h5>
                      <ul>
                        {pdpaItems.map(item => (
                          <li key={item.key} style={{ color: selectedApp.compliance?.pdpa?.[item.key] ? 'green' : '#ccc' }}>
                            {selectedApp.compliance?.pdpa?.[item.key] ? '✅' : '⚪'} {item.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div>
                  <h4>ประวัติโปรเจกต์ (Project History)</h4>
                  <p>แอปพลิเคชันนี้เริ่มต้นจากโปรเจกต์ ID: {selectedApp.id}</p>
                  <p>วันที่เริ่มดำเนินการจริง: {selectedApp.actual_start || '-'}</p>
                  <p>วันที่เปิดใช้งานจริง (Go-Live): {selectedApp.actual_go_live || '-'}</p>
                </div>
              )}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={handleCloseModal}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationPortfolio;