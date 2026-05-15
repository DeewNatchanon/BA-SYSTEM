import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { fetchAllRoles, updateRolePermissions, createNewRole, deleteRole } from "../api/authApi"; 
import { usePermissions } from "../hooks/usePermissions"; 

const modules = [
  { id: "dashboard", label: "หน้า Dashboard", icon: "📊", allowedActions: ["read"] },
  { id: "request_form", label: "แบบฟอร์มขอโครงการ (Request Form)", icon: "📝", allowedActions: ["read", "create"] },
  { id: "project_portfolio", label: "พอร์ตโครงการ (Project Portfolio)", icon: "📂", allowedActions: ["read", "update", "delete"] },
  { id: "app_portfolio", label: "พอร์ตแอปพลิเคชัน (App Portfolio)", icon: "💻", allowedActions: ["read", "create", "update", "delete"] },
  { id: "manager_dashboard", label: "หน้าอนุมัติ (Manager Dashboard)", icon: "🛡️", allowedActions: ["read", "update"] },
  { id: "role_settings", label: "จัดการสิทธิ์ (Role Management)", icon: "🔐", allowedActions: ["read", "create", "update", "delete"] },
];

const crudActions = [
  { key: "read", label: "R", desc: "อ่าน (จำเป็น)", color: "#3b82f6" },
  { key: "create", label: "C", desc: "สร้าง", color: "#10b981" },
  { key: "update", label: "U", desc: "แก้ไข", color: "#f59e0b" },
  { key: "delete", label: "D", desc: "ลบ", color: "#ef4444" }
];

const CORE_ROLES = ["employee", "manager", "ceo"];

function EditRole({ currentUser }) {
  // 🌟 ดึงสิทธิ์ canUpdate เพิ่มเติมมาเพื่อควบคุมการเข้าถึงหน้าจอแก้ไข
  const { canCreate, canUpdate, canDelete } = usePermissions(currentUser, "role_settings");

  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sessionRaw = localStorage.getItem('ba-system.auth-session');
  const token = sessionRaw ? JSON.parse(sessionRaw).token : null;

  const loadRoles = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await fetchAllRoles(token);
      const formattedData = data.map(r => {
        let parsedPerms = r.permissions;
        if (typeof parsedPerms === 'string') {
          try { parsedPerms = JSON.parse(parsedPerms); } catch (e) { parsedPerms = {}; }
        }
        return { ...r, permissions: parsedPerms || {} };
      });
      setRoles(formattedData);
    } catch (err) {
      console.error("Fetch Roles Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleAddRole = async () => {
    const { value: name } = await Swal.fire({
      title: 'สร้างบทบาท (Role) ใหม่',
      input: 'text',
      inputLabel: 'ระบุชื่อตำแหน่งที่ต้องการเพิ่ม (ห้ามซ้ำกับ employee, manager, ceo)',
      showCancelButton: true,
      confirmButtonColor: "var(--blue)",
      inputValidator: (value) => { 
        if (!value) return 'กรุณาระบุชื่อ Role!';
        if (CORE_ROLES.includes(value.toLowerCase().trim())) return 'ไม่อนุญาตให้ใช้ชื่อ Role หลักซ้ำได้!';
      }
    });

    if (name) {
      try {
        const newRoleFromDb = await createNewRole(name.toLowerCase().trim(), {}, token);
        let parsedPerms = newRoleFromDb.permissions;
        if (typeof parsedPerms === 'string') {
            try { parsedPerms = JSON.parse(parsedPerms); } catch (e) { parsedPerms = {}; }
        }
        newRoleFromDb.permissions = parsedPerms || {};
        
        setRoles([...roles, newRoleFromDb]);
        Swal.fire("สร้างสำเร็จ!", `เพิ่มบทบาท "${name}" เรียบร้อยแล้ว`, "success");
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างบทบาทได้: " + err.message, "error");
      }
    }
  };

  const handleDeleteRole = async (e, roleId, roleName) => {
    e.stopPropagation(); 
    
    const confirm = await Swal.fire({
      title: `ยืนยันการลบ ${roleName}?`,
      text: "ผู้ใช้งานที่อยู่ใน Role นี้จะถูกย้ายไปที่ Employee อัตโนมัติ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก"
    });

    if (confirm.isConfirmed) {
      try {
        await deleteRole(roleId, token);
        Swal.fire("ลบสำเร็จ!", `ย้ายผู้ใช้งานไปที่ Employee เรียบร้อยแล้ว`, "success");
        loadRoles(); 
      } catch (err) {
        Swal.fire("ผิดพลาด", err.message, "error");
      }
    }
  };

  const togglePermission = (moduleId, action) => {
    setSelectedRole(prev => {
      const currentPerms = prev.permissions?.[moduleId] || [];
      let newPerms = [...currentPerms];

      if (newPerms.includes(action)) {
        newPerms = newPerms.filter(a => a !== action);
        if (action === "read") newPerms = [];
      } else {
        newPerms.push(action);
        if (action !== "read" && !newPerms.includes("read")) {
          newPerms.push("read");
        }
      }

      return { ...prev, permissions: { ...prev.permissions, [moduleId]: newPerms } };
    });
  };

  const handleSavePermissions = async () => {
    try {
      await updateRolePermissions(selectedRole.id, selectedRole.permissions, token);
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? selectedRole : r));
      setIsModalOpen(false);
      
      Swal.fire({
        title: "บันทึกสิทธิ์สำเร็จ!",
        text: `อัปเดตข้อมูลฐานข้อมูลเรียบร้อยแล้ว`,
        icon: "success",
        timer: 1500
      }).then(() => {
        if (currentUser?.role === selectedRole.name) window.location.reload();
      });
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกสิทธิ์ได้", "error");
    }
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>กำลังโหลดข้อมูลบทบาท...</div>;

  return (
    <div className="page-wrap" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-color)" }}>🛡️ ระบบจัดการสิทธิ์ (Role Settings)</h1>
          <p style={{ color: "var(--text-muted)", margin: "5px 0 0 0" }}>จัดการสิทธิ์เข้าถึง (หากไม่ติ๊ก Read จะไม่สามารถให้สิทธิ์อื่นได้)</p>
        </div>
        {canCreate && (
          <button onClick={handleAddRole} style={{ background: "var(--blue)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)" }}>
            + สร้าง Role ใหม่
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {roles.map(role => {
          const isCoreRole = CORE_ROLES.includes(role.name.toLowerCase());
          return (
            <div 
              key={role.id}
              onClick={() => { 
                // 🌟 บล็อกไม่ให้เข้าถึงการแก้ไขสิทธิ์ ถ้าไม่มีสิทธิ์ Update
                if (!canUpdate) {
                  return Swal.fire("ไม่มีสิทธิ์เข้าถึง", "คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่าบทบาท", "warning");
                }
                setSelectedRole(JSON.parse(JSON.stringify(role))); 
                setIsModalOpen(true); 
              }}
              style={{ 
                background: "var(--card-bg)", padding: "24px", borderRadius: "20px", border: "1px solid var(--border-color)", 
                // 🌟 เปลี่ยนเมาส์ตามสิทธิ์ Update
                cursor: canUpdate ? "pointer" : "not-allowed", 
                transition: "all 0.3s ease", position: "relative", overflow: "hidden"
              }}
              onMouseEnter={(e) => { 
                if (canUpdate) {
                  e.currentTarget.style.transform = "translateY(-5px)"; 
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.05)"; 
                  e.currentTarget.style.borderColor = "var(--blue)"; 
                }
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = "translateY(0)"; 
                e.currentTarget.style.boxShadow = "none"; 
                e.currentTarget.style.borderColor = "var(--border-color)"; 
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: "50px", height: "50px", background: "var(--blue-light)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "15px" }}>👤</div>
                {!isCoreRole && canDelete && (
                  <button 
                    onClick={(e) => handleDeleteRole(e, role.id, role.name)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", padding: "5px", borderRadius: "8px", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    title="ลบบทบาทนี้"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-color)" }}>{role.name} {isCoreRole && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "var(--bg-color)", borderRadius: "10px", color: "var(--text-muted)", marginLeft: "5px", verticalAlign: "middle" }}>Core</span>}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>มีสิทธิ์เข้าถึง {Object.keys(role.permissions || {}).length} หมวดหมู่</p>
              <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end" }}>
                {canUpdate && <span style={{ color: "var(--blue)", fontWeight: "bold", fontSize: "0.85rem" }}>ตั้งค่าสิทธิ์ →</span>}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && selectedRole && (
        <div className="pdf-preview-overlay" style={{ zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card-bg)", width: "95%", maxWidth: "900px", maxHeight: "90vh", borderRadius: "24px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "24px 30px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--table-header-bg)" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem" }}>⚙️ แก้ไขสิทธิ์: {selectedRole.name}</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>ฟังก์ชันที่ไม่มีในหน้าจอ จะถูกแสดงเป็นเครื่องหมาย -</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "30px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-color)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", borderRadius: "12px 0 0 12px" }}>หมวดหมู่หน้าจอ (Categories)</th>
                    {crudActions.map(action => (<th key={action.key} style={{ padding: "16px", textAlign: "center", width: "80px" }}>{action.label}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod, idx) => {
                    const perms = selectedRole.permissions?.[mod.id] || [];
                    const hasRead = perms.includes("read");
                    return (
                      <tr key={mod.id} style={{ borderBottom: idx === modules.length - 1 ? "none" : "1px solid var(--border-color)" }}>
                        <td style={{ padding: "20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "1.2rem" }}>{mod.icon}</span>
                            <span style={{ fontWeight: "700", color: "var(--text-color)", opacity: hasRead ? 1 : 0.6 }}>{mod.label}</span>
                          </div>
                        </td>
                        {crudActions.map(action => {
                          const isActionAllowed = mod.allowedActions.includes(action.key);
                          if (!isActionAllowed) {
                            return <td key={action.key} style={{ textAlign: "center", color: "var(--border-color)", fontWeight: "bold" }}>-</td>;
                          }
                          const isChecked = perms.includes(action.key);
                          const isDisabled = action.key !== "read" && !hasRead;
                          return (
                            <td key={action.key} style={{ textAlign: "center" }}>
                              <input type="checkbox" checked={isChecked} disabled={isDisabled} onChange={() => togglePermission(mod.id, action.key)} style={{ width: "22px", height: "22px", cursor: isDisabled ? "not-allowed" : "pointer", accentColor: action.color, opacity: isDisabled ? 0.3 : 1 }} title={isDisabled ? "ต้องเปิดสิทธิ์ Read ก่อน" : ""} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "20px 30px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer", color: "var(--text-muted)", fontWeight: "bold" }}>ยกเลิก</button>
              <button onClick={handleSavePermissions} style={{ padding: "10px 30px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>💾 บันทึกการเปลี่ยนแปลง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditRole;