import React, { useState, useEffect, useMemo } from 'react';
import { fetchProjects } from '../api/authApi';
import { Link } from 'react-router-dom';

// --- Icons (Inline SVGs for performance) ---
const ActivityIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FolderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const ArrowRightIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

function Dashboard({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับคุม Animation ของหลอด Progress
  const [animateBars, setAnimateBars] = useState(false);

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
        // หน่วงเวลาเล็กน้อยเพื่อให้แอนิเมชันทำงานนุ่มนวล
        setTimeout(() => setAnimateBars(true), 100);
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

    // 🚀 เพิ่มการคำนวณหาโปรเจกต์ที่ได้รับมอบหมายให้ currentUser 🚀
    const myTasks = projects.filter(p => 
      (p.status !== 'Go-live' && p.phase !== 'Go-live' && p.status !== 'Hold') && // ไม่นับงานที่เสร็จแล้วหรือโดน Hold
      (p.form_data?.tracking?.glsManager === currentUser?.username || p.form_data?.assigned_to === currentUser?.username)
    ).length;

    return { total, active, golive, pending, hold, pipeline, recent, myTasks };
  }, [projects, currentUser]);

  const getProgressColor = (percent) => {
    if (percent < 30) return '#ef4444'; 
    if (percent < 75) return '#f59e0b'; 
    return '#10b981'; 
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⌛</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>กำลังวิเคราะห์ข้อมูลเชิงลึก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: '1400px', gap: '24px' }}>
      
      {/* 1. Welcome Banner (Clean & Modern Gradient) */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-dark), var(--blue))', borderRadius: '24px', padding: '36px 48px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.15)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Abstract Background Element for extra neatness */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Welcome back, {currentUser?.username} 👋
          </h1>
          <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9, fontWeight: 500 }}>
            Here's what's happening with your IT Projects today.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '16px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, opacity: 0.9, marginBottom: '4px' }}>Current Role</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{roleName}</div>
        </div>
      </div>

      {/* 2. Executive KPI Cards (Hover Effects & Soft Shadows) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: 'var(--card-bg)', padding: '28px 24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Projects</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '28px 24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Active in Progress</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '28px 24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Go-Live (Success)</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{stats.golive}</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '28px 24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pending / Bottleneck</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{stats.pending}</div>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: Pipeline & Actionable Insight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Pipeline / Funnel View */}
        <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
            📊 Project Pipeline <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>(Phase Distribution)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-color)' }}>
                <span>1. Requirement (เก็บ Requirement)</span>
                <span style={{ color: 'var(--text-muted)' }}>{stats.pipeline.Requirement} Projects</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: animateBars ? `${(stats.pipeline.Requirement / (stats.total || 1)) * 100}%` : '0%', height: '100%', background: '#94a3b8', borderRadius: '8px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-color)' }}>
                <span>2. Preparation (เตรียมทรัพยากร)</span>
                <span style={{ color: 'var(--text-muted)' }}>{stats.pipeline.Preparation} Projects</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: animateBars ? `${(stats.pipeline.Preparation / (stats.total || 1)) * 100}%` : '0%', height: '100%', background: '#38bdf8', borderRadius: '8px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-color)' }}>
                <span>3. Development (กำลังพัฒนา)</span>
                <span style={{ color: 'var(--text-muted)' }}>{stats.pipeline.Development} Projects</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: animateBars ? `${(stats.pipeline.Development / (stats.total || 1)) * 100}%` : '0%', height: '100%', background: '#3b82f6', borderRadius: '8px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-color)' }}>
                <span>4. UAT (รอทดสอบระบบ)</span>
                <span style={{ color: 'var(--text-muted)' }}>{stats.pipeline.UAT} Projects</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: animateBars ? `${(stats.pipeline.UAT / (stats.total || 1)) * 100}%` : '0%', height: '100%', background: '#f59e0b', borderRadius: '8px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: 'var(--text-color)', fontWeight: 800 }}>
            ⚡ Actionable Insights
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 🚀 เงื่อนไขสำหรับผู้บริหาร/Manager 🚀 */}
            {(isCEO || currentUser?.role === 'manager') && (
              <div style={{ background: stats.pending > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${stats.pending > 0 ? '#fecaca' : '#bbf7d0'}`, padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ fontWeight: 800, color: stats.pending > 0 ? '#b91c1c' : '#15803d', fontSize: '1.1rem' }}>
                    {stats.pending > 0 ? '⚠️ Attention Required' : '✅ All Caught Up!'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: stats.pending > 0 ? '#991b1b' : '#166534', marginTop: '6px', fontWeight: 500 }}>
                    {stats.pending > 0 ? `มี ${stats.pending} คำขอที่กำลังรอคุณพิจารณา/อนุมัติ` : 'ไม่มีรายการคำขอคั่งค้างในระบบ เยี่ยมมาก!'}
                  </div>
                </div>
                {stats.pending > 0 && (
                  <Link to="/manager-dashboard" className="btn btn-primary" style={{ background: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '10px', color: '#fff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>Review Now</Link>
                )}
              </div>
            )}

            {/* 🚀 เงื่อนไขสำหรับ Employee (My Assigned Tasks) 🚀 */}
            {(!isCEO && currentUser?.role !== 'manager') && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '1.1rem' }}>
                    👨‍💻 My Assigned Tasks
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#0c4a6e', marginTop: '6px', fontWeight: 500 }}>
                    {stats.myTasks > 0 ? `คุณมีโปรเจกต์ที่ต้องดำเนินการต่อ ${stats.myTasks} รายการ` : 'คุณไม่มีโปรเจกต์ที่ต้องรับผิดชอบในขณะนี้'}
                  </div>
                </div>
                {stats.myTasks > 0 && (
                  <Link to="/projects" className="btn btn-primary" style={{ background: 'var(--blue)', border: 'none', padding: '10px 20px', borderRadius: '10px', color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>View Tasks</Link>
                )}
              </div>
            )}

            <div style={{ background: 'var(--bg-color)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1.1rem' }}>⚠️ Hold Projects</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                โปรเจกต์ที่ถูกระงับชั่วคราวขณะนี้: <strong style={{ color: '#d97706', fontSize: '1rem' }}>{stats.hold}</strong> โครงการ
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Bottom Section: Recent Critical Activities (Clean Borderless Table) */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-color)', fontWeight: 800 }}>🕒 Recent Project Updates <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>(อัปเดตล่าสุด)</span></h3>
          <Link to="/projects" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(2, 132, 199, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            View All <ArrowRightIcon />
          </Link>
        </div>
        
        {/* 🚀 Clean Borderless Table 🚀 */}
        <div className="table-wrap" style={{ width: '100%', overflowX: 'auto', position: 'relative', zIndex: 1, border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>Project ID</th>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>Name</th>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>Status</th>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', background: 'transparent' }}>Phase</th>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', background: 'transparent' }}>Progress</th>
                <th style={{ padding: '16px 24px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right', background: 'transparent' }}>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8fafc)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)', padding: '16px 24px', background: 'transparent', fontSize: '0.85rem' }}>{p.id}</td>
                  <td style={{ fontWeight: 700, color: 'var(--blue)', padding: '16px 24px', background: 'transparent', fontSize: '0.9rem' }}>{p.name}</td>
                  <td style={{ padding: '16px 24px', background: 'transparent' }}>
                    <span className={`status-badge ${p.status?.toLowerCase()}`} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{p.status}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 24px', background: 'transparent', fontWeight: 600 }}>{p.phase || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '16px 24px', background: 'transparent' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                      <div style={{ width: '80px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div style={{ height: '100%', width: animateBars ? `${(p.form_data?.tracking?.completionPercent || 0)}%` : '0%', background: getProgressColor(p.form_data?.tracking?.completionPercent || 0), borderRadius: '4px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-color)', width: '35px', textAlign: 'right' }}>{p.form_data?.tracking?.completionPercent || 0}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#d32f2f', padding: '16px 24px', background: 'transparent', fontSize: '0.85rem' }}>
                    {p.form_data?.tracking?.glsManager || p.form_data?.assigned_to || '-'}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>ไม่มีข้อมูลการอัปเดตล่าสุด</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;