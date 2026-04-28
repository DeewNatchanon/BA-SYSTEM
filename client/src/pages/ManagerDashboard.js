import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchPendingRequests, approveProjectRequest } from '../api/authApi';
import Swal from 'sweetalert2';

function ManagerDashboard({ currentUser }) { 
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null); 
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  const [approvalData, setApprovalData] = useState({
    assignee: '',
    phase: 'Requirement',
    startDate: '',
    endDate: '',
    manDay: 0,
    remark: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      const data = await fetchPendingRequests(token);
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (field, date) => {
    const isoDate = date ? date.toISOString().split('T')[0] : '';
    setApprovalData(prev => {
      const newData = { ...prev, [field]: isoDate };
      if (newData.startDate && newData.endDate) {
        const start = new Date(newData.startDate);
        const end = new Date(newData.endDate);
        if (end >= start) {
          const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
          newData.manDay = diffDays;
        } else {
          newData.manDay = 0;
        }
      }
      return newData;
    });
  };

  const handleOpenApproval = (request) => {
    setSelectedRequest(request);
    setIsApprovalModalOpen(true);
  };

  // 🚀 ฟังก์ชันนี้ถูกอัปเดตใช้ SweetAlert2 และยึดลอจิกเดิมของคุณ 100%
  const handleConfirmApprove = async () => {
    if (!approvalData.assignee) {
      return Swal.fire({
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาระบุชื่อผู้รับผิดชอบ (Assignee) ก่อนอนุมัติ',
        icon: 'warning',
        confirmButtonColor: '#0072bb'
      });
    }

    Swal.fire({
      title: 'ยืนยันการอนุมัติ?',
      text: 'คุณต้องการอนุมัติและเริ่มโปรเจกต์นี้ใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: '✅ ยืนยันการอนุมัติ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const finalData = {
            manager_id: currentUser?.id, 
            assignee: approvalData.assignee,
            phase: approvalData.phase,
            startDate: approvalData.startDate,
            endDate: approvalData.endDate,
            manDay: approvalData.manDay,
            remark: approvalData.remark,
            status: 'Initiate', 
            form_data: selectedRequest.form_data // ดึงของเก่ากลับไปรวมด้วย
          };
          
          const sessionRaw = localStorage.getItem('ba-system.auth-session');
          const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
          
          await approveProjectRequest(selectedRequest.id, finalData, token);
          
          Swal.fire({
            title: 'สำเร็จ!',
            text: 'อนุมัติและมอบหมายงานสำเร็จเรียบร้อย',
            icon: 'success',
            confirmButtonColor: '#0072bb'
          });
          
          setIsApprovalModalOpen(false);
          loadRequests(); 
          
        } catch (error) {
          Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        }
      }
    });
  };

  return (
    <div className="page-wrap page-project">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Manager Dashboard (รออนุมัติ)</h1>
      </div>
      <div className="page-rule"></div>

      {/* ตารางแสดงผล Impeccable Style */}
      <section style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลคำขอ...</div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
              <div>ไม่มีคำขอโปรเจกต์ที่รออนุมัติในขณะนี้</div>
            </div>
          ) : (
            <table className="portfolio-table project-portfolio-table">
              <thead>
                <tr>
                  <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Project ID</th>
                  <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Project Name</th>
                  <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Category</th>
                  <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Site</th>
                  <th style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>Date Requested</th>
                  <th style={{ textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-color)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(request => (
                  <tr key={request.id}>
                    <td className="project-id" style={{ color: 'var(--blue)', fontWeight: 600 }}>{request.id}</td>
                    <td className="project-name" style={{ fontWeight: 600 }}>{request.name}</td>
                    <td>{request.category}</td>
                    <td>{request.site}</td>
                    <td>{request.created_at ? new Date(request.created_at).toLocaleDateString('th-TH') : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-primary" onClick={() => handleOpenApproval(request)} style={{ padding: '8px 15px', borderRadius: '8px', fontWeight: 600 }}>
                        🔍 ตรวจสอบและอนุมัติ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Modal อนุมัติ Impeccable Style */}
      {isApprovalModalOpen && selectedRequest && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '20px 30px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.4rem' }}>📝 ตรวจสอบรายละเอียดและมอบหมายงาน: {selectedRequest.name}</h3>
              <button onClick={() => setIsApprovalModalOpen(false)} style={{ color: 'var(--text-muted)', background: 'var(--bg-color)', border: 'none', width: '36px', height: '36px', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg-color)' }}>
              
              {/* ฝั่งซ้าย */}
              <div style={{ flex: 1.5, padding: '30px', overflowY: 'auto', borderRight: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                <h4 style={{ color: 'var(--blue)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', fontSize: '1.1rem' }}>📌 ข้อมูลจากผู้ขอ (Request Detail)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', color: 'var(--text-color)' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '10px' }}><strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>ไซต์:</strong> {selectedRequest.site}</div>
                  <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '10px' }}><strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>ประเภทที่ขอมา:</strong> {selectedRequest.category}</div>
                  <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '10px' }}><strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>แผนกผู้ขอ:</strong> {selectedRequest.form_data?.requesterDept || '-'}</div>
                  <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '10px' }}><strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>เป้าหมาย (Expected):</strong> {selectedRequest.form_data?.expectedOutcome || '-'}</div>
                </div>
                
                <h4 style={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>รายละเอียดความต้องการ (Requirement Detail):</h4>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-color)' }}>
                  {selectedRequest.form_data?.requirementDetail || 'ไม่มีข้อมูลเพิ่มเติม'}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px' }} onClick={() => {
                    if(selectedRequest.document_path) {
                      window.open(`http://localhost:4000/${selectedRequest.document_path.replace(/\\/g, '/')}`, '_blank');
                    } else {
                      Swal.fire('ข้อผิดพลาด', 'ไม่พบไฟล์แนบของโครงการนี้', 'error');
                    }
                  }}>
                    📂 ดูเอกสารอนุมัติฉบับเต็ม (PDF / รูปภาพ)
                  </button>
                </div>
              </div>

              {/* ฝั่งขวา */}
              <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
                <h4 style={{ color: '#10b981', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', paddingBottom: '10px', fontSize: '1.1rem' }}>✅ ส่วนการอนุมัติและมอบหมายงาน</h4>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>มอบหมายงานให้ (Assignee) <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อ IT ที่รับผิดชอบ"
                    value={approvalData.assignee}
                    onChange={(e) => setApprovalData({...approvalData, assignee: e.target.value})}
                    style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>เริ่มงานใน Phase ไหน?</label>
                  <select value={approvalData.phase} onChange={(e) => setApprovalData({...approvalData, phase: e.target.value})} style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px', color: 'var(--text-color)' }}>
                    <option value="Requirement">Requirement (รับความต้องการเพิ่ม)</option>
                    <option value="Development">Development (พร้อมพัฒนาเลย)</option>
                    <option value="UAT">UAT (ทดสอบระบบ)</option>
                  </select>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>วันที่เริ่มงาน (Start)</label>
                    <DatePicker 
                      selected={approvalData.startDate ? new Date(approvalData.startDate) : null}
                      onChange={(date) => handleDateChange('startDate', date)}
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      placeholderText="ระบุวัน"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>กำหนดเสร็จ (End)</label>
                    <DatePicker 
                      selected={approvalData.endDate ? new Date(approvalData.endDate) : null}
                      onChange={(date) => handleDateChange('endDate', date)}
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      minDate={approvalData.startDate ? new Date(approvalData.startDate) : null}
                      placeholderText="ระบุวัน"
                    />
                  </div>
                </div>

                <div style={{ background: '#d1fae5', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 700 }}>ระยะเวลาประเมิน (Man-day)</span><br/>
                  <strong style={{ fontSize: '2.5rem', color: '#047857', lineHeight: 1.2 }}>{approvalData.manDay} <span style={{fontSize: '1rem'}}>วัน</span></strong>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>หมายเหตุ / ข้อสั่งการ (ถ้ามี)</label>
                  <textarea 
                    rows="3"
                    placeholder="ระบุข้อความถึงทีม IT..."
                    value={approvalData.remark}
                    onChange={(e) => setApprovalData({...approvalData, remark: e.target.value})}
                    style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}
                  ></textarea>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '30px', padding: '15px', fontSize: '1.1rem', borderRadius: '12px', background: '#10b981', border: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                  onClick={handleConfirmApprove}
                >
                  ✅ ยืนยันการอนุมัติและเริ่มโปรเจกต์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;