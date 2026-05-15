import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { usePermissions } from "../hooks/usePermissions"; // 🌟 นำเข้า Hook

function RequestChange({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🌟 เช็คสิทธิ์ canCreate ในหมวด request_form
  const { canCreate } = usePermissions(currentUser, "request_form");

  // รับข้อมูลระบบเดิมที่ส่งมาจากการกดปุ่ม Change App
  const originalAppInfo = location.state?.originalAppInfo || null;

  const [changeReason, setChangeReason] = useState("");

  // ⛔ บล็อกหน้าจอถ้าไม่มีสิทธิ์สร้างคำขอ
  if (!canCreate) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#ef4444", minHeight: "80vh" }}>
        <h2>⛔ Access Denied</h2>
        <p>คุณไม่มีสิทธิ์ในการสร้างคำขอเปลี่ยนแปลงระบบ (Create Request)</p>
        <button onClick={() => navigate(-1)} className="btn btn-tertiary" style={{ marginTop: "20px", padding: "10px 20px" }}>ย้อนกลับ</button>
      </div>
    );
  }

  // ถ้าเข้าหน้านี้โดยไม่ได้กดปุ่มมาจาก Portfolio ให้เด้งกลับ
  if (!originalAppInfo) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>ไม่พบข้อมูลระบบที่ต้องการแก้ไข</h3>
        <button onClick={() => navigate("/applications")} className="btn btn-primary">
          กลับไปเลือกแอปพลิเคชัน
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // โค้ดส่งข้อมูลไป Backend จะอยู่ตรงนี้
    Swal.fire("สำเร็จ!", `ส่งคำขอแก้ไขระบบ ${originalAppInfo.name} เรียบร้อยแล้ว!`, "success").then(() => {
      navigate("/applications"); // ส่งเสร็จกลับหน้า Portfolio
    });
  };

  return (
    <div className="page-wrap" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "var(--text-color)", marginBottom: "20px" }}>📝 ฟอร์มขอเปลี่ยนแปลงระบบ (Change Request)</h2>
      
      <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <p style={{ margin: "0 0 8px 0" }}><strong style={{ color: "var(--text-muted)" }}>ระบบที่ต้องการแก้ไข:</strong> <span style={{ color: "var(--blue)", fontWeight: "bold", fontSize: "1.1rem" }}>{originalAppInfo.name}</span></p>
        <p style={{ margin: 0 }}><strong style={{ color: "var(--text-muted)" }}>App ID:</strong> {originalAppInfo.form_data?.tracking?.appId || originalAppInfo.id}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", background: "var(--card-bg)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <label style={{ fontWeight: 600, color: "var(--text-color)" }}>รายละเอียดที่ต้องการเปลี่ยนแปลง: <span style={{ color: "#ef4444" }}>*</span></label>
        <textarea 
          required
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          placeholder="ระบุรายละเอียดเหตุผลและความต้องการในการแก้ไขระบบ..."
          style={{ padding: "16px", borderRadius: "8px", minHeight: "150px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-color)", outline: "none", fontSize: "0.95rem", resize: "vertical" }}
        />
        
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-tertiary" style={{ padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", border: "1px solid var(--border-color)" }}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 30px", borderRadius: "8px", fontWeight: "bold", background: "#10b981", border: "none", color: "#fff", boxShadow: "0 4px 10px rgba(16,185,129,0.3)" }}>
            📤 ส่งคำขอ (Submit)
          </button>
        </div>
      </form>
    </div>
  );
}

export default RequestChange;