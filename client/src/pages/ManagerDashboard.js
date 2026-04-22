import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchPendingRequests, approveProjectRequest } from '../api/authApi';

function ManagerDashboard({ currentUser }) { // 🚀 รับ currentUser เข้ามา
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null); 
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  // ข้อมูลที่ Manager ต้องกรอกเพิ่ม
  const [approvalData, setApprovalData] = useState({
    assignee: '',
    phase: 'Requirement',
    startDate: '',
    endDate: '',
    manDay: 0,
    remark: ''
  });

  // โหลดข้อมูลเมื่อเปิดหน้าเว็บ
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

  // ฟังก์ชันคำนวณ Man-day อัตโนมัติ
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

  // 🚀 ฟังก์ชันนี้ที่หายไป! (ใช้สำหรับเปิดหน้าต่างตรวจสอบ)
  const handleOpenApproval = (request) => {
    setSelectedRequest(request);
    setIsApprovalModalOpen(true);
  };

  // ฟังก์ชันยืนยันการอนุมัติจริง (ส่งข้อมูลทั้งหมดเข้า DB)
  const handleConfirmApprove = async () => {
    if (!approvalData.assignee) {
      return alert("กรุณาระบุชื่อผู้รับผิดชอบ (Assignee) ก่อนอนุมัติ");
    }

    try {
      const finalData = {
        manager_id: currentUser?.id, // 🚀 ส่ง ID ของ Manager ไปให้หลังบ้าน
        ...approvalData,
        status: 'Initiate', 
        form_data: { ...selectedRequest.form_data, approval_remark: approvalData.remark }
      };
      
      const sessionRaw = localStorage.getItem('ba-system.auth-session');
      const token = sessionRaw ? JSON.parse(sessionRaw).token : null;
      
      await approveProjectRequest(selectedRequest.id, finalData, token);
      alert('อนุมัติและมอบหมายงานสำเร็จ!');
      setIsApprovalModalOpen(false);
      loadRequests(); // โหลดตารางใหม่หลังอนุมัติเสร็จ
      
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="page-wrap page-project">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Manager Dashboard (รออนุมัติ)</h1>
      </div>
      <div className="page-rule"></div>

      {/* ========================================== */}
      {/* 🚀 ตารางแสดงรายการรออนุมัติ 🚀 */}
      {/* ========================================== */}
      <section className="content-card">
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูลคำขอ...</div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>🎉 ไม่มีคำขอโปรเจกต์ที่รออนุมัติในขณะนี้</div>
          ) : (
            <table className="portfolio-table project-portfolio-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>Category</th>
                  <th>Site</th>
                  <th>Date Requested</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(request => (
                  <tr key={request.id}>
                    <td className="project-id">{request.id}</td>
                    <td className="project-name">{request.name}</td>
                    <td>{request.category}</td>
                    <td>{request.site}</td>
                    <td>{request.created_at ? new Date(request.created_at).toLocaleDateString('th-TH') : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-primary" onClick={() => handleOpenApproval(request)} style={{ padding: '8px 15px' }}>
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

      {/* ========================================== */}
      {/* 🚀 MODAL: ตรวจสอบข้อมูลก่อนอนุมัติ 🚀 */}
      {/* ========================================== */}
      {isApprovalModalOpen && selectedRequest && (
        <div className="pdf-preview-overlay" style={{zIndex: 9999}}>
          <div className="pdf-preview-card" style={{ width: '95%', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '20px', background: 'var(--blue-dark)', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>ตรวจสอบรายละเอียดและมอบหมายงาน: {selectedRequest.name}</h3>
              <button onClick={() => setIsApprovalModalOpen(false)} style={{ color: '#fff', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* ⬅️ ฝั่งซ้าย: ดูข้อมูลฟอร์มที่พนักงานส่งมา (Read-only) */}
              <div style={{ flex: 1.5, padding: '30px', overflowY: 'auto', borderRight: '1px solid #ddd', background: '#f8f9fa' }}>
                <h4 style={{ color: 'var(--blue)', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>ข้อมูลจากผู้ขอ (Request Detail)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <p><strong>ไซต์:</strong> {selectedRequest.site}</p>
                  <p><strong>ประเภทที่ขอมา:</strong> {selectedRequest.category}</p>
                  <p><strong>แผนกผู้ขอ:</strong> {selectedRequest.form_data?.requesterDept || '-'}</p>
                  <p><strong>เป้าหมาย (Expected):</strong> {selectedRequest.form_data?.expectedOutcome || '-'}</p>
                </div>
                
                <p><strong>รายละเอียดความต้องการ (Requirement Detail):</strong></p>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedRequest.form_data?.requirementDetail || 'ไม่มีข้อมูลเพิ่มเติม'}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => {
                    if(selectedRequest.document_path) window.open(`http://localhost:4000/${selectedRequest.document_path.replace(/\\/g, '/')}`, '_blank');
                    else alert("ไม่พบไฟล์แนบของโครงการนี้");
                  }}>
                    📂 ดูเอกสารอนุมัติฉบับเต็ม (PDF / รูปภาพ)
                  </button>
                </div>
              </div>

              {/* ➡️ ฝั่งขวา: ฟอร์มมอบหมายงานของ Manager */}
              <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#fff' }}>
                <h4 style={{ color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>ส่วนการอนุมัติและมอบหมายงาน</h4>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>มอบหมายงานให้ (Assignee) <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อ IT ที่รับผิดชอบ"
                    value={approvalData.assignee}
                    onChange={(e) => setApprovalData({...approvalData, assignee: e.target.value})}
                    style={{ background: '#fdfaef', border: '1px solid #f5e9c6' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>เริ่มงานใน Phase ไหน?</label>
                  <select value={approvalData.phase} onChange={(e) => setApprovalData({...approvalData, phase: e.target.value})}>
                    <option value="Requirement">Requirement (รับความต้องการเพิ่ม)</option>
                    <option value="Development">Development (พร้อมพัฒนาเลย)</option>
                    <option value="UAT">UAT (ทดสอบระบบ)</option>
                  </select>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>วันที่เริ่มงาน (Start)</label>
                    <DatePicker 
                      selected={approvalData.startDate ? new Date(approvalData.startDate) : null}
                      onChange={(date) => handleDateChange('startDate', date)}
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      placeholderText="ระบุวัน"
                    />
                  </div>
                  <div className="form-group">
                    <label>กำหนดเสร็จ (End)</label>
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

                <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', border: '1px solid #c8e6c9' }}>
                  <span style={{ fontSize: '0.9rem', color: '#2e7d32', fontWeight: 'bold' }}>ระยะเวลาประเมิน (Man-day)</span><br/>
                  <strong style={{ fontSize: '2rem', color: '#2e7d32' }}>{approvalData.manDay} <span style={{fontSize: '1rem'}}>วัน</span></strong>
                </div>

                <div className="form-group">
                  <label>หมายเหตุ / ข้อสั่งการ (ถ้ามี)</label>
                  <textarea 
                    rows="3"
                    placeholder="ระบุข้อความถึงทีม IT..."
                    value={approvalData.remark}
                    onChange={(e) => setApprovalData({...approvalData, remark: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '30px', padding: '15px', fontSize: '1.1rem' }}
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