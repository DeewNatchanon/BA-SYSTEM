import React,{useState,useEffect,useMemo}from'react';
import DatePicker from'react-datepicker';
import'react-datepicker/dist/react-datepicker.css';
import{fetchPendingRequests,approveProjectRequest,updateProjectInDb}from'../api/authApi';
import Swal from'sweetalert2';
// inline filter helper (page-scoped)
function getNested(obj, path){
  if(!path) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for(const p of parts){
    if(cur==null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function filterRows(data, {searchQuery = '', filters = {}, searchableFields = []} = {}){
  if(!Array.isArray(data)) return [];
  const q = String(searchQuery || '').trim().toLowerCase();

  return data.filter(row => {
    if(q){
      let hay = '';
      if(Array.isArray(searchableFields) && searchableFields.length){
        hay = searchableFields.map(f => String(getNested(row,f) ?? '')).join(' ');
      } else {
        try{ hay = JSON.stringify(row); }catch(e){ hay = '' }
      }
      if(!String(hay).toLowerCase().includes(q)) return false;
    }

    for(const [key,value] of Object.entries(filters||{})){
      if(value==null) continue;
      const raw = getNested(row,key);
      const rawStr = raw==null? '': String(raw);
      if(Array.isArray(value)){
        if(value.length===0) continue;
        const rawLower = rawStr.toLowerCase();
        const allowed = value.map(v=>String(v).toLowerCase());
        if(!allowed.some(a=> rawLower.includes(a))) return false;
      }else{
        const v = String(value);
        if(v==='All' || v==='') continue;
        const vLower = v.toLowerCase();
        if(!rawStr.toLowerCase().includes(vLower)) return false;
      }
    }

    return true;
  });
}

function ManagerDashboard({currentUser}){
  const[pendingRequests,setPendingRequests]=useState([]);
  const[isLoading,setIsLoading]=useState(true);
  const[selectedRequest,setSelectedRequest]=useState(null);
  const[isApprovalModalOpen,setIsApprovalModalOpen]=useState(false);
  const[activeTab,setActiveTab]=useState('new');
  const[approvalData,setApprovalData]=useState({assignee:'',phase:'Requirement',startDate:'',endDate:'',manDay:0,remark:''});

  const isCEO = currentUser?.role === 'ceo';

  const [searchQuery,setSearchQuery]=useState('');
  const [filterCategory,setFilterCategory]=useState('All');

  useEffect(()=>{loadRequests();},[]);

  const loadRequests=async()=>{
    setIsLoading(true);
    try{
      const sessionRaw=localStorage.getItem('ba-system.auth-session');
      const token=sessionRaw?JSON.parse(sessionRaw).token:null;
      const data=await fetchPendingRequests(token);
      const safeData=(data||[]).map(p=>{
          let parsedForm=p.form_data;
          if(typeof parsedForm==='string'){try{parsedForm=JSON.parse(parsedForm);}catch(e){parsedForm={};}}
          return{...p,form_data:parsedForm||{}};
      });
      setPendingRequests(safeData);
    }catch(error){console.error(error);Swal.fire('ข้อผิดพลาด','ไม่สามารถโหลดข้อมูลคำขอได้','error');}
    finally{setIsLoading(false);}
  };

  const handleDateChange=(field,date)=>{
    const isoDate=date?date.toISOString().split('T')[0]:'';
    setApprovalData(prev=>{
      const newData={...prev,[field]:isoDate};
      if(newData.startDate&&newData.endDate){
        const start=new Date(newData.startDate);
        const end=new Date(newData.endDate);
        newData.manDay=end>=start?Math.ceil(Math.abs(end-start)/(1000*60*60*24))+1:0;
      }
      return newData;
    });
  };

  const handleOpenApproval=(request)=>{
    setSelectedRequest(request);
    setApprovalData({assignee:request.form_data?.assigned_to||'',phase:request.phase||'Requirement',startDate:request.form_data?.compliance?.baStartDate||'',endDate:request.form_data?.compliance?.baEndDate||'',manDay:request.form_data?.compliance?.manDay||0,remark:''});
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApprove=async()=>{
    if(isCEO) return;
    if(selectedRequest.status==='Pending Approval'&&!approvalData.assignee)return Swal.fire('ข้อมูลไม่ครบ','กรุณาระบุชื่อผู้รับผิดชอบ (Assignee) ก่อนอนุมัติ','warning');
    Swal.fire({title:'ยืนยันการอนุมัติ?',text:'ข้อมูลจะถูกอัปเดตเข้าระบบทันที',icon:'question',showCancelButton:true,confirmButtonColor:'#10b981',cancelButtonColor:'#64748b',confirmButtonText:'✅ ยืนยัน',cancelButtonText:'ยกเลิก'}).then(async(result)=>{
      if(result.isConfirmed){
        try{
          const sessionRaw=localStorage.getItem('ba-system.auth-session');
          const token=sessionRaw?JSON.parse(sessionRaw).token:null;
          if(selectedRequest.status==='Pending Approval'){
            const finalData={manager_id:currentUser?.id,assignee:approvalData.assignee,phase:approvalData.phase,startDate:approvalData.startDate,endDate:approvalData.endDate,manDay:approvalData.manDay,remark:approvalData.remark,status:'Initiate',form_data:selectedRequest.form_data};
            await approveProjectRequest(selectedRequest.id,finalData,token);
          }else{
            
            // 🚀 FIX: ให้คำนวณและปรับเปอร์เซ็นต์หลอดความคืบหน้า "เฉพาะตอนที่อนุมัติแล้วเท่านั้น"
            const newStatus = selectedRequest.form_data.tracking.pendingStatus;
            const newPhase = selectedRequest.form_data.tracking.pendingPhase;
            
            let approvedPercent = selectedRequest.form_data?.tracking?.completionPercent || 0;
            if(newStatus==='Go-live'||newPhase==='Go-live') approvedPercent=100;
            else if(newPhase==='Requirement') approvedPercent=25;
            else if(newPhase==='Preparation') approvedPercent=50;
            else if(newPhase==='Development/Implement'||newPhase==='Development') approvedPercent=75;
            else if(newPhase==='UAT') approvedPercent=90;

            const finalData={
                ...selectedRequest,
                status: newStatus,
                phase: newPhase,
                form_data:{
                    ...selectedRequest.form_data,
                    approval_remark: approvalData.remark,
                    tracking:{
                        ...selectedRequest.form_data.tracking,
                        completionPercent: approvedPercent, // อัปเดต % เข้าไปตรงนี้
                        isPendingApproval: false,
                        pendingStatus: null,
                        pendingPhase: null
                    }
                }
            };
            await updateProjectInDb(selectedRequest.id,finalData,null,token);
          }
          Swal.fire('สำเร็จ!','อนุมัติเรียบร้อยแล้ว','success');setIsApprovalModalOpen(false);loadRequests();
        }catch(error){Swal.fire('เกิดข้อผิดพลาด',error.message,'error');}
      }
    });
  };

  const handleConfirmReject=async()=>{
    if(isCEO) return;
    Swal.fire({title:'ยืนยันปฏิเสธคำขอ?',text:'กรุณาระบุหมายเหตุเพื่อให้พนักงานทราบสาเหตุการปฏิเสธ',icon:'warning',showCancelButton:true,confirmButtonColor:'#ef4444',cancelButtonColor:'#64748b',confirmButtonText:'❌ ปฏิเสธคำขอ',cancelButtonText:'ยกเลิก'}).then(async(result)=>{
      if(result.isConfirmed){
        try{
          const sessionRaw=localStorage.getItem('ba-system.auth-session');
          const token=sessionRaw?JSON.parse(sessionRaw).token:null;
          if(selectedRequest.status==='Pending Approval'){
            const finalData={...selectedRequest,status:'Rejected',form_data:{...selectedRequest.form_data,approval_remark:approvalData.remark}};
            await updateProjectInDb(selectedRequest.id,finalData,null,token);
          }else{
            // 🚀 FIX: คำนวณเปอร์เซ็นต์ย้อนกลับตาม Phase เดิม
            let revertedPercent=0;
            if(selectedRequest.status==='Go-live'||selectedRequest.phase==='Go-live')revertedPercent=100;
            else if(selectedRequest.phase==='Requirement')revertedPercent=25;
            else if(selectedRequest.phase==='Preparation')revertedPercent=50;
            else if(selectedRequest.phase==='Development/Implement'||selectedRequest.phase==='Development')revertedPercent=75;
            else if(selectedRequest.phase==='UAT')revertedPercent=90;
            else revertedPercent=selectedRequest.form_data?.tracking?.completionPercent||0;

            const finalData={...selectedRequest,form_data:{...selectedRequest.form_data,approval_remark:approvalData.remark,tracking:{...selectedRequest.form_data.tracking,completionPercent:revertedPercent,isPendingApproval:false,pendingStatus:null,pendingPhase:null}}};
            await updateProjectInDb(selectedRequest.id,finalData,null,token);
          }
          Swal.fire('สำเร็จ!','ปฏิเสธคำขอเรียบร้อยแล้ว','info');setIsApprovalModalOpen(false);loadRequests();
        }catch(error){Swal.fire('เกิดข้อผิดพลาด',error.message,'error');}
      }
    });
  };

  const newRequests=pendingRequests.filter(r=>r.status==='Pending Approval');
  const statusRequests=pendingRequests.filter(r=>r.status!=='Pending Approval'&&r.form_data?.tracking?.isPendingApproval);
  const displayData=activeTab==='new'?newRequests:statusRequests;

  const displayedRequests = useMemo(()=>{
    return filterRows(displayData,{
      searchQuery: searchQuery,
      filters: { category: filterCategory },
      searchableFields: ['id','name','form_data.tracking.glsManager','form_data.assigned_to']
    });
  },[displayData,searchQuery,filterCategory]);

  return(
    <div className="page-wrap page-project">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><h1 className="page-heading" style={{margin:0}}>{isCEO ? 'Executive Dashboard (รายการรอพิจารณา)' : 'Manager Dashboard (รออนุมัติ)'}</h1></div>
      <div className="page-rule"/>
      <div style={{display:'flex',gap:'15px',marginBottom:'20px'}}>
        <button onClick={()=>setActiveTab('new')} style={{padding:'12px 24px',borderRadius:'12px',border:'none',background:activeTab==='new'?'var(--blue)':'var(--card-bg)',color:activeTab==='new'?'#fff':'var(--text-muted)',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 10px rgba(0,0,0,0.05)',transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'}}>🆕 คำขอโปรเจกต์ใหม่ ({newRequests.length})</button>
        <button onClick={()=>setActiveTab('status')} style={{padding:'12px 24px',borderRadius:'12px',border:'none',background:activeTab==='status'?'var(--blue)':'var(--card-bg)',color:activeTab==='status'?'#fff':'var(--text-muted)',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 10px rgba(0,0,0,0.05)',transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'}}>🔄 คำขอเปลี่ยนสถานะ ({statusRequests.length})</button>
      </div>
      <section className="content-card">
        <div style={{display:'flex',flexWrap:'wrap',gap:'12px',alignItems:'center',marginBottom:'12px'}}>
          <div style={{flex:'1 1 260px',display:'flex',alignItems:'center',background:'var(--card-bg)',borderRadius:'8px',padding:'0 12px',border:'1px solid var(--border-color)'}}>
            <span style={{color:'var(--text-muted)'}}>🔎</span>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="ค้นหา ID, ชื่อโครงการ หรือผู้รับผิดชอบ..." style={{width:'100%',border:'none',background:'transparent',padding:'10px',outline:'none',color:'var(--text-color)'}}/>
          </div>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{padding:'10px 12px',borderRadius:'8px',border:'1px solid var(--border-color)',background:'var(--card-bg)',color:'var(--text-color)'}}>
            <option value="All">หมวดหมู่: ทุกค่า</option>
            <option value="Support Application">Support Application</option>
            <option value="New System">New System</option>
          </select>
          <button onClick={()=>{setSearchQuery('');setFilterCategory('All');}} className="btn btn-tertiary" style={{padding:'8px 12px'}}>รีเซ็ต</button>
          <div style={{marginLeft:'auto',color:'var(--text-muted)',fontWeight:700}}>{displayedRequests.length} / {displayData.length} ผลลัพธ์</div>
        </div>

        <div className="table-wrap">
          {isLoading?<div style={{padding:'40px',textAlign:'center',color:'var(--text-muted)'}}>กำลังโหลดข้อมูลคำขอ...</div>:displayData.length===0?<div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}><div style={{fontSize:'3rem',marginBottom:'10px'}}>🎉</div><div>ไม่มีคำขอในหมวดหมู่นี้ที่ต้องรอการพิจารณา</div></div>:(
            <table className="portfolio-table project-portfolio-table">
              <thead><tr><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>Project ID</th><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>Project Name</th>{activeTab==='new'?<><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>Category</th><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>Site</th></>:<><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>ขอเปลี่ยนเป็นสถานะ</th><th style={{background:'var(--bg-color)',color:'var(--text-color)'}}>ขอเปลี่ยนขั้นตอน (Phase)</th></>}<th style={{textAlign:'center',background:'var(--bg-color)',color:'var(--text-color)'}}>Action</th></tr></thead>
              <tbody>
                {displayedRequests.map(request=>(
                  <tr key={request.id}>
                    <td style={{color:'var(--blue)',fontWeight:600}}>{request.id}</td><td style={{fontWeight:600}}>{request.name}</td>
                    {activeTab==='new'?<><td>{request.category}</td><td>{request.site}</td></>:<><td><span style={{color:'#16a34a',fontWeight:'bold'}}>{request.form_data?.tracking?.pendingStatus}</span></td><td><span style={{color:'#0ea5e9',fontWeight:'bold'}}>{request.form_data?.tracking?.pendingPhase}</span></td></>}
                    <td style={{textAlign:'center'}}><button className="btn btn-primary" onClick={()=>handleOpenApproval(request)} style={{padding:'8px 15px',borderRadius:'8px',fontWeight:600}}>🔍 ตรวจสอบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isApprovalModalOpen&&selectedRequest&&(
        <div className="pdf-preview-overlay" style={{zIndex:1040}}>
          <div className="pdf-preview-card" style={{width:'95%',maxWidth:'1100px',height:'90vh',display:'flex',flexDirection:'column',borderRadius:'24px',overflow:'hidden',padding:0}}>
            
            {/* 1. HEADER */}
            <div style={{padding:'20px 30px',background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0,color:'var(--text-color)',fontSize:'1.4rem'}}>📝 ตรวจสอบและพิจารณา: {selectedRequest.name}</h3>
                <button onClick={()=>setIsApprovalModalOpen(false)} style={{color:'var(--text-muted)',background:'var(--bg-color)',border:'none',width:'36px',height:'36px',borderRadius:'10px',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
            </div>
            
            {/* 2. BODY */}
            <div style={{display:'flex',flex:1,overflow:'hidden',background:'var(--bg-color)'}}>
              <div style={{flex:1.5,padding:'30px',overflowY:'auto',borderRight:'1px solid var(--border-color)',background:'var(--card-bg)'}}>
                <h4 style={{color:'var(--blue)',borderBottom:'1px solid rgba(14, 165, 233, 0.2)',boxShadow:'0 1px 0 rgba(14, 165, 233, 0.1)',paddingBottom:'10px',fontSize:'1.1rem'}}>📌 ข้อมูลจากผู้ขอ (Request Detail)</h4>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',marginBottom:'20px',color:'var(--text-color)'}}>
                  <div style={{background:'var(--bg-color)',padding:'15px',borderRadius:'10px'}}><strong style={{color:'var(--text-muted)',display:'block',fontSize:'0.85rem'}}>ไซต์:</strong> {selectedRequest.site}</div>
                  <div style={{background:'var(--bg-color)',padding:'15px',borderRadius:'10px'}}><strong style={{color:'var(--text-muted)',display:'block',fontSize:'0.85rem'}}>ประเภทที่ขอมา:</strong> {selectedRequest.category}</div>
                  <div style={{background:'var(--bg-color)',padding:'15px',borderRadius:'10px'}}><strong style={{color:'var(--text-muted)',display:'block',fontSize:'0.85rem'}}>แผนกผู้ขอ:</strong> {selectedRequest.form_data?.requesterDept||'-'}</div>
                  <div style={{background:'var(--bg-color)',padding:'15px',borderRadius:'10px'}}><strong style={{color:'var(--text-muted)',display:'block',fontSize:'0.85rem'}}>เป้าหมาย (Expected):</strong> {selectedRequest.form_data?.expectedOutcome||'-'}</div>
                </div>
                {selectedRequest.form_data?.tracking?.progressFile&&(<div style={{marginTop:'20px',padding:'15px',background:'#eff6ff',border:'1px dashed #3b82f6',borderRadius:'12px'}}><strong style={{color:'#1e40af'}}>📎 ไฟล์หลักฐานที่พนักงานแนบมา:</strong><br/><a href={`http://localhost:4000/${selectedRequest.form_data.tracking.progressFile.replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{color:'#2563eb',fontWeight:'bold',textDecoration:'underline',marginTop:'5px',display:'inline-block'}}>👉 เปิดดูไฟล์หลักฐาน</a></div>)}
                <div style={{marginTop:'20px'}}><button className="btn btn-secondary" style={{padding:'10px 20px',borderRadius:'8px'}} onClick={()=>{if(selectedRequest.document_path)window.open(`http://localhost:4000/${selectedRequest.document_path.replace(/\\/g,'/')}`,'_blank');else Swal.fire('ข้อผิดพลาด','ไม่พบไฟล์เอกสารอนุมัติเริ่มต้น','error');}}>📂 ดูเอกสารอนุมัติฉบับเต็ม (PDF / รูปภาพ)</button></div>
              </div>
              <div style={{flex:1,padding:'30px',overflowY:'auto',background:'var(--bg-secondary, #f8fafc)'}}>
                {isCEO ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '15px' }}>⏳</div>
                        <h3 style={{ color: 'var(--blue-dark)', margin: '0 0 10px 0', fontSize: '1.4rem' }}>รอการดำเนินการจาก Manager</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                        {activeTab === 'new' 
                            ? 'คำขอนี้ถูกส่งเข้ามาในระบบและกำลังรอให้ผู้จัดการ ระบุผู้รับผิดชอบงานและประเมินระยะเวลาครับ'
                            : `พนักงานขอเปลี่ยนสถานะเป็น ${selectedRequest.form_data?.tracking?.pendingStatus} กำลังรอผู้จัดการตรวจสอบและอนุมัติครับ`}
                        </p>
                    </div>
                ) : (
                    <>
                        <h4 style={{color:'#10b981',borderBottom:'1px solid rgba(16, 185, 129, 0.2)',boxShadow:'0 1px 0 rgba(16, 185, 129, 0.1)',paddingBottom:'10px',fontSize:'1.1rem'}}>✅ ส่วนการพิจารณาและสั่งการ</h4>
                        {activeTab==='new'?<>
                        <div className="form-group" style={{marginBottom:'20px'}}><label style={{fontWeight:600,color:'var(--text-color)'}}>มอบหมายงานให้ (Assignee) <span style={{color:'#ef4444'}}>*</span></label><input type="text" placeholder="ระบุชื่อ IT ที่รับผิดชอบ" value={approvalData.assignee} onChange={(e)=>setApprovalData({...approvalData,assignee:e.target.value})} style={{background:'#fff',border:'1px solid var(--border-color)',padding:'12px',borderRadius:'10px'}}/></div>
                        <div className="form-group" style={{marginBottom:'20px'}}><label style={{fontWeight:600,color:'var(--text-color)'}}>เริ่มงานใน Phase ไหน?</label><select value={approvalData.phase} onChange={(e)=>setApprovalData({...approvalData,phase:e.target.value})} style={{background:'#fff',border:'1px solid var(--border-color)',padding:'12px',borderRadius:'10px',color:'var(--text-color)'}}><option value="Requirement">Requirement (รับความต้องการเพิ่ม)</option><option value="Development">Development (พร้อมพัฒนาเลย)</option><option value="UAT">UAT (ทดสอบระบบ)</option></select></div>
                        <div className="form-row" style={{display:'flex',gap:'15px',marginBottom:'20px'}}><div className="form-group"><label style={{fontWeight:600,color:'var(--text-color)'}}>วันที่เริ่มงาน (Start)</label><DatePicker selected={approvalData.startDate?new Date(approvalData.startDate):null} onChange={(date)=>handleDateChange('startDate',date)} dateFormat="dd/MM/yyyy" className="date-input" placeholderText="ระบุวัน"/></div><div className="form-group"><label style={{fontWeight:600,color:'var(--text-color)'}}>กำหนดเสร็จ (End)</label><DatePicker selected={approvalData.endDate?new Date(approvalData.endDate):null} onChange={(date)=>handleDateChange('endDate',date)} dateFormat="dd/MM/yyyy" className="date-input" minDate={approvalData.startDate?new Date(approvalData.startDate):null} placeholderText="ระบุวัน"/></div></div>
                        <div style={{background:'#e8f5e9',padding:'15px',borderRadius:'8px',textAlign:'center',marginBottom:'20px',border:'1px solid #c8e6c9'}}><span style={{fontSize:'0.9rem',color:'#2e7d32',fontWeight:'bold'}}>ระยะเวลาประเมิน (Man-day)</span><br/><strong style={{fontSize:'2rem',color:'#2e7d32'}}>{approvalData.manDay} <span style={{fontSize:'1rem'}}>วัน</span></strong></div>
                        </>:
                        <div style={{background:'#dcfce7',padding:'20px',borderRadius:'12px',textAlign:'center',marginBottom:'20px',border:'1px solid #86efac',boxShadow:'inset 0 0 0 1px rgba(22, 101, 52, 0.1)'}}><p style={{margin:'0 0 5px 0',color:'#166534',fontSize:'0.9rem'}}>พนักงานขอเปลี่ยนสถานะเป็น:</p><h2 style={{margin:0,color:'#15803d',fontSize:'2rem'}}>{selectedRequest.form_data.tracking.pendingStatus}</h2><p style={{margin:'5px 0 0 0',color:'#166534'}}>Phase: {selectedRequest.form_data.tracking.pendingPhase}</p></div>
                        }
                        <div className="form-group"><label style={{fontWeight:600,color:'var(--text-color)'}}>หมายเหตุ / ข้อสั่งการ (จะแสดงให้พนักงานเห็น)</label><textarea rows="3" placeholder="ระบุเหตุผลในการปฏิเสธ หรือคำสั่งการเพิ่มเติม..." value={approvalData.remark} onChange={(e)=>setApprovalData({...approvalData,remark:e.target.value})} style={{background:'#fff',border:'1px solid var(--border-color)',padding:'12px',borderRadius:'10px'}}/></div>
                        {/* 🚀 ย้ายปุ่มออกจากตรงนี้แล้ว 🚀 */}
                    </>
                )}
              </div>
            </div>

            {/* 🚀 3. FOOTER: แถบปุ่มกดด้านล่างสุดที่จะแสดงเสมอ ไม่ว่าจะเลื่อนเนื้อหาไปแค่ไหนก็ตาม */}
            <div style={{padding:'20px 30px',borderTop:'1px solid var(--border-color)',background:'var(--card-bg)',display:'flex',justifyContent:'flex-end',gap:'12px',zIndex:10}}>
              <button type="button" className="btn btn-tertiary" onClick={()=>setIsApprovalModalOpen(false)}>ยกเลิก (Cancel)</button>
              {!isCEO && (
                 <>
                   <button className="btn btn-secondary" style={{padding:'10px 24px',fontSize:'1rem',borderRadius:'10px',background:'#fff5f5',color:'#ef4444',border:'1.5px solid #fecaca',fontWeight:700}} onClick={handleConfirmReject}>❌ ปฏิเสธ (Reject)</button>
                   <button className="btn btn-primary" style={{padding:'10px 32px',fontSize:'1rem',borderRadius:'10px',background:'#10b981',border:'none',fontWeight:700,boxShadow:'0 4px 12px rgba(16,185,129,0.3)'}} onClick={handleConfirmApprove}>✅ ยืนยันอนุมัติ (Approve)</button>
                 </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
export default ManagerDashboard;