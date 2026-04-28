import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchProjects, fetchPendingRequests } from '../api/authApi';
import Swal from 'sweetalert2';

function Dashboard({ currentUser }) {
  const [stats, setStats] = useState({
    total: 0, active: 0, golive: 0, pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      if (!token) return;

      const allProjects = await fetchProjects(token) || [];
      let pendingData = [];
      if (isManager) {
        pendingData = await fetchPendingRequests(token) || [];
      }

      // คำนวณสถิติแบบ BI Summary
      const total = allProjects.length;
      const active = allProjects.filter(p => p.status === 'Active' || p.status === 'Initiate').length;
      const golive = allProjects.filter(p => p.status === 'Go-live' || p.phase === 'Go-live').length;
      
      // ถ้ารออนุมัติ (Manager เห็นคำขอทั้งหมด, พนักงานเห็นแค่ของตัวเองที่ติดสถานะ Pending)
      const pending = isManager 
        ? pendingData.length 
        : allProjects.filter(p => p.status === 'Pending Approval' || p.form_data?.tracking?.isPendingApproval).length;

      setStats({ total, active, golive, pending });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสถิติได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: 'รวมทุกโครงการ', value: stats.total, color: '#0ea5e9', bg: '#e0f2fe', icon: '📊' },
    { title: 'กำลังดำเนินงาน', value: stats.active, color: '#f59e0b', bg: '#fef3c7', icon: '⚙️' },
    { title: 'ขึ้นระบบใช้งานจริง', value: stats.golive, color: '#10b981', bg: '#d1fae5', icon: '🚀' },
    { title: 'รอการตรวจสอบ', value: stats.pending, color: '#ef4444', bg: '#fee2e2', icon: '⏳' }
  ];

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังสรุปข้อมูลระบบ...</div>;

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--blue-dark)', margin: '0 0 8px 0' }}>สวัสดี, {currentUser?.username} 👋</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>ยินดีต้อนรับสู่ศูนย์กลางการจัดการระบบ BA Business Analysis</p>
      </div>

      {/* KPI Cards (Impeccable Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {statCards.map((card, idx) => (
          <div key={idx} style={{ 
            background: 'var(--card-bg)', borderRadius: '20px', padding: '24px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & BI Insight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* แผงควบคุมด่วน */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>⚡ เมนูจัดการด่วน</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <NavLink to="/request" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 20px', background: 'var(--bg-color)', borderRadius: '12px', color: 'var(--blue)', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📝 สร้างคำขอโปรเจกต์ใหม่ (Request Form)</span>
                <span>→</span>
              </div>
            </NavLink>
            <NavLink to="/projects" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 20px', background: 'var(--bg-color)', borderRadius: '12px', color: 'var(--text-color)', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 อัปเดตความคืบหน้า (Project Portfolio)</span>
                <span>→</span>
              </div>
            </NavLink>
            {isManager && (
              <NavLink to="/manager-dashboard" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '16px 20px', background: '#fef2f2', borderRadius: '12px', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🛡️ ตรวจสอบคำขอ (Manager Dashboard)</span>
                  {stats.pending > 0 && (
                    <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '0.8rem' }}>{stats.pending} รายการ</span>
                  )}
                </div>
              </NavLink>
            )}
          </div>
        </div>

        {/* แผง Data Visualization แบบง่าย */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>📈 สัดส่วนสถานะโครงการ</h3>
          {stats.total === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>ยังไม่มีข้อมูลโครงการในระบบ</div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
              <div style={{ width: '100%', height: '24px', borderRadius: '12px', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(stats.golive/stats.total)*100}%`, background: '#10b981', transition: 'width 1s ease' }} title={`Go-live: ${stats.golive}`}></div>
                <div style={{ width: `${(stats.active/stats.total)*100}%`, background: '#f59e0b', transition: 'width 1s ease' }} title={`Active: ${stats.active}`}></div>
                <div style={{ width: `${(stats.pending/stats.total)*100}%`, background: '#ef4444', transition: 'width 1s ease' }} title={`Pending: ${stats.pending}`}></div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981' }}></div> 
                  Go-live ({(stats.golive/stats.total*100).toFixed(0)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#f59e0b' }}></div> 
                  Active ({(stats.active/stats.total*100).toFixed(0)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#ef4444' }}></div> 
                  Pending ({(stats.pending/stats.total*100).toFixed(0)}%)
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;