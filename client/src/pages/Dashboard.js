import React, { useState, useEffect, useMemo } from 'react';
import { fetchProjects } from '../api/authApi';
import { Link } from 'react-router-dom';

// --- Icons (Inline SVGs for performance) ---
const ActivityIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FolderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

function Dashboard({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCEO = currentUser?.role === 'ceo';
  const roleName = isCEO ? 'Executive' : currentUser?.role === 'manager' ? 'Manager' : 'Employee';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 📊 คำนวณสถิติ ---
  const stats = useMemo(() => {
    const total = projects.length;
    // นับรวม Initiate และ Active ให้อยู่ในกล่อง Active in Progress
    const active = projects.filter(p => p.status === 'Active' || p.status === 'Initiate').length;
    const golive = projects.filter(p => p.status === 'Go-live' || p.phase === 'Go-live').length;
    const pending = projects.filter(p => p.status === 'Pending Approval' || p.form_data?.tracking?.isPendingApproval).length;
    const hold = projects.filter(p => p.status === 'Hold').length;

    const pipeline = {
      Requirement: projects.filter(p => p.phase === 'Requirement').length,
      Preparation: projects.filter(p => p.phase === 'Preparation').length,
      Development: projects.filter(p => p.phase === 'Development/Implement' || p.phase === 'Development').length,
      UAT: projects.filter(p => p.phase === 'UAT').length,
    };

    const recent = [...projects]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 5);

    return { total, active, golive, pending, hold, pipeline, recent };
  }, [projects]);

  // 🚀 ฟังก์ชันกำหนดสีของ Progress Bar (ที่หายไป ผมใส่กลับมาให้แล้วครับ)
  const getProgressColor = (percent) => {
    if (percent < 30) return '#ef4444'; // สีแดง
    if (percent < 75) return '#f59e0b'; // สีส้ม
    return '#10b981'; // สีเขียว
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>กำลังวิเคราะห์ข้อมูลเชิงลึก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: '1400px' }}>
      
      {/* 1. Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-dark), var(--blue))', borderRadius: '16px', padding: '32px 40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.2)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Welcome back, {currentUser?.username}
          </h1>
          <p style={{ margin: 0, fontSize: '1.05rem', opacity: 0.9 }}>
            Here's what's happening with your IT Projects today.
          </p>
        </div>
        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, opacity: 0.9 }}>Current Role</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{roleName}</div>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '24px' }}>
        
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Projects</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Active in Progress</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Go-Live (Success)</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{stats.golive}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending / Bottleneck</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{stats.pending}</div>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: Pipeline & Actionable Insight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* Pipeline / Funnel View */}
        <div style={{ background: 'var(--card-bg)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Project Pipeline (Phase Distribution)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                <span>1. Requirement (เก็บ Requirement)</span>
                <span>{stats.pipeline.Requirement} Projects</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.pipeline.Requirement / (stats.total || 1)) * 100}%`, height: '100%', background: '#94a3b8', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                <span>2. Preparation (เตรียมทรัพยากร)</span>
                <span>{stats.pipeline.Preparation} Projects</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.pipeline.Preparation / (stats.total || 1)) * 100}%`, height: '100%', background: '#38bdf8', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                <span>3. Development (กำลังพัฒนา)</span>
                <span>{stats.pipeline.Development} Projects</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.pipeline.Development / (stats.total || 1)) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
                <span>4. UAT (รอทดสอบระบบ)</span>
                <span>{stats.pipeline.UAT} Projects</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.pipeline.UAT / (stats.total || 1)) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '6px' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div style={{ background: 'var(--card-bg)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-color)' }}>
            ⚡ Actionable Insights
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {(isCEO || currentUser?.role === 'manager') && (
              <div style={{ background: stats.pending > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${stats.pending > 0 ? '#fecaca' : '#bbf7d0'}`, padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: stats.pending > 0 ? '#b91c1c' : '#15803d', fontSize: '1rem' }}>
                    {stats.pending > 0 ? '⚠️ Attention Required' : '✅ All Caught Up!'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: stats.pending > 0 ? '#991b1b' : '#166534', marginTop: '4px' }}>
                    {stats.pending > 0 ? `มี ${stats.pending} รายการที่กำลังรอพิจารณา/อนุมัติ` : 'ไม่มีรายการคำขอคั่งค้างในระบบ'}
                  </div>
                </div>
                {stats.pending > 0 && (
                  <Link to="/manager-dashboard" className="btn btn-primary" style={{ background: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff' }}>Review Now</Link>
                )}
              </div>
            )}

            <div style={{ background: 'var(--bg-color)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-color)', fontSize: '1rem' }}>Hold Projects</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                โปรเจกต์ที่ถูกระงับชั่วคราว: <strong>{stats.hold}</strong> โครงการ
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Bottom Section: Recent Critical Activities */}
      <div className="content-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>🕒 Recent Project Updates (อัปเดตล่าสุด)</h3>
          <Link to="/projects" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>View All <ArrowRightIcon /></Link>
        </div>
        
        <div className="table-wrap" style={{ border: 'none', borderRadius: '0', boxShadow: 'none' }}>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th style={{ background: 'transparent' }}>Project ID</th>
                <th style={{ background: 'transparent' }}>Name</th>
                <th style={{ background: 'transparent' }}>Status</th>
                <th style={{ background: 'transparent' }}>Phase</th>
                <th style={{ background: 'transparent', textAlign: 'center' }}>Progress</th>
                <th style={{ background: 'transparent', textAlign: 'right' }}>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{p.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-color)' }}>{p.name}</td>
                  <td>
                    <span className={`status-badge ${p.status?.toLowerCase()}`}>{p.status}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.phase || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <div style={{ width: '60px', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), transform: `scaleX(${(p.form_data?.tracking?.completionPercent || 0) / 100})`, transformOrigin: 'left', transition: 'transform 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#d32f2f' }}>
                    {p.form_data?.tracking?.glsManager || p.form_data?.assigned_to || '-'}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>ไม่มีข้อมูลการอัปเดตล่าสุด</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;