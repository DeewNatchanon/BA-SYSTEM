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
  const [sortBy,setSortBy]=useState('name');
  const [sortOrder,setSortOrder]=useState('asc');
  const [filterSite,setFilterSite]=useState('All');
  const [filterStatus,setFilterStatus]=useState('All');
  const [filterPhase,setFilterPhase]=useState('All');
  const [showFilters,setShowFilters]=useState(false);

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
                        completionPercent: approvedPercent, 
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

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(newRequests.map(r => r.category).filter(Boolean))];
    return cats.sort((a,b) => a.localeCompare(b, 'th'));
  }, [newRequests]);

  const uniqueSites = useMemo(() => {
    const sites = [...new Set(displayData.map(r => r.site).filter(Boolean))];
    return sites.sort((a,b) => a.localeCompare(b, 'th'));
  }, [displayData]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(statusRequests.map(r => r.form_data?.tracking?.pendingStatus).filter(Boolean))];
    return statuses.sort((a,b) => a.localeCompare(b, 'th'));
  }, [statusRequests]);

  const uniquePhases = useMemo(() => {
    const phases = [...new Set(statusRequests.map(r => r.form_data?.tracking?.pendingPhase).filter(Boolean))];
    return phases.sort((a,b) => a.localeCompare(b, 'th'));
  }, [statusRequests]);

  const sortData = (data) => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (sortBy === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, ['th', 'en']);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
    });
  };

  const displayedRequests = useMemo(()=>{
    let filtered = filterRows(displayData,{
      searchQuery: searchQuery,
      filters: { 
        category: activeTab === 'new' && filterCategory !== 'All' ? filterCategory : null,
        site: filterSite !== 'All' ? filterSite : null
      },
      searchableFields: ['id','name','form_data.tracking.glsManager','form_data.assigned_to']
    });

    if (activeTab === 'status') {
      if (filterStatus !== 'All') {
        filtered = filtered.filter(r => r.form_data?.tracking?.pendingStatus === filterStatus);
      }
      if (filterPhase !== 'All') {
        filtered = filtered.filter(r => r.form_data?.tracking?.pendingPhase === filterPhase);
      }
    }

    return sortData(filtered);
  },[displayData,searchQuery,filterCategory,filterSite,filterStatus,filterPhase,sortBy,sortOrder,activeTab]);

  const hasActiveFilter = filterCategory !== 'All' || filterSite !== 'All' || filterStatus !== 'All' || filterPhase !== 'All';

  return(
    <div className="page-wrap page-project">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h1 className="page-heading" style={{margin:0}}>{isCEO ? 'Executive Dashboard (รายการรอพิจารณา)' : 'Manager Dashboard (รออนุมัติ)'}</h1>
      </div>
      <div className="page-rule"/>
      
      <section className="content-card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        
        {/* 🚀 Minimal Top-Right Toolbar (Tabs + Filters) 🚀 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', position: 'relative', zIndex: 20, flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Left: Minimal Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-color)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={()=>{setActiveTab('new'); setShowFilters(false);}} 
              style={{ padding:'6px 14px', borderRadius:'8px', border:'none', background: activeTab==='new' ? 'var(--card-bg)' : 'transparent', color: activeTab==='new' ? 'var(--blue)' : 'var(--text-muted)', fontWeight: activeTab==='new' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab==='new' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', fontSize: '0.85rem' }}>
              🆕 คำขอใหม่ ({newRequests.length})
            </button>
            <button 
              onClick={()=>{setActiveTab('status'); setShowFilters(false);}} 
              style={{ padding:'6px 14px', borderRadius:'8px', border:'none', background: activeTab==='status' ? 'var(--card-bg)' : 'transparent', color: activeTab==='status' ? 'var(--blue)' : 'var(--text-muted)', fontWeight: activeTab==='status' ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab==='status' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', fontSize: '0.85rem' }}>
              🔄 เปลี่ยนสถานะ ({statusRequests.length})
            </button>
          </div>

          {/* Right: Minimal Search & Filter Button */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 🚀 แก้ไขกล่องค้นหาให้ใช้ textIndent หลบไอคอน แทนการใช้ padding ที่โดน !important ทับ 🚀 */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', fontSize: '0.95rem', color: '#94a3b8', zIndex: 2, pointerEvents: 'none' }}>🔍</span>
              <input 
                value={searchQuery} 
                onChange={e=>setSearchQuery(e.target.value)} 
                placeholder="ค้นหา..." 
                style={{ 
                  borderRadius:'20px', 
                  border:'1px solid var(--border-color)', 
                  background:'var(--input-bg)', 
                  color:'var(--text-color)', 
                  fontSize:'0.85rem', 
                  width:'130px', 
                  outline:'none', 
                  transition:'all 0.3s ease', 
                  margin: 0,
                  textIndent: '24px' /* 🎯 ใช้ตัวนี้ดันข้อความให้หลบไอคอนแว่นขยาย */
                }} 
                onFocus={(e) => { e.target.style.width = '200px'; e.target.style.borderColor = 'var(--blue)'; }} 
                onBlur={(e) => { e.target.style.width = '130px'; e.target.style.borderColor = 'var(--border-color)'; }} 
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              style={{ padding:'6px 14px', borderRadius:'20px', border: showFilters || hasActiveFilter ? '1px solid var(--blue)' : '1px solid var(--border-color)', background: showFilters || hasActiveFilter ? 'rgba(2, 132, 199, 0.05)' : 'var(--card-bg)', color: showFilters || hasActiveFilter ? 'var(--blue)' : 'var(--text-muted)', fontSize:'0.85rem', fontWeight: 600, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', height: '100%' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filter
              {hasActiveFilter && <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>}
            </button>
          </div>

          {/* Floating Popover Menu (ซ่อน dropdowns ไว้ในนี้) */}
          {showFilters && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', width: '260px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-color)' }}>ตั้งค่าตัวกรอง</span>
                  {hasActiveFilter && (
                    <span onClick={()=>{setFilterCategory('All');setFilterSite('All');setFilterStatus('All');setFilterPhase('All');}} style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', fontWeight: 600, background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>ล้างทั้งหมด</span>
                  )}
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>จัดเรียงข้อมูล (Sort)</label>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ flex: 1, padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border-color)', fontSize:'0.8rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none' }}>
                     <option value="name">ชื่อ (Name)</option>
                     <option value="id">รหัส (ID)</option>
                     {activeTab === 'new' && <option value="category">ประเภท</option>}
                   </select>
                   <button onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')} style={{ padding:'6px', borderRadius:'6px', border:'1px solid var(--border-color)', background:'var(--input-bg)', cursor:'pointer', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {sortOrder==='asc'?'⬆️':'⬇️'}
                   </button>
                 </div>
               </div>

               {activeTab === 'new' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ประเภท (Category)</label>
                   <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border-color)', fontSize:'0.8rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none' }}>
                     <option value="All">ทั้งหมด</option>
                     {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                 </div>
               )}

               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ไซต์ (Site)</label>
                 <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border-color)', fontSize:'0.8rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none' }}>
                   <option value="All">ทั้งหมด</option>
                   {uniqueSites.map(site => <option key={site} value={site}>{site}</option>)}
                 </select>
               </div>

               {activeTab === 'status' && (
                 <>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>สถานะ (Status)</label>
                     <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border-color)', fontSize:'0.8rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none' }}>
                       <option value="All">ทั้งหมด</option>
                       {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                     </select>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ขั้นตอน (Phase)</label>
                     <select value={filterPhase} onChange={e=>setFilterPhase(e.target.value)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border-color)', fontSize:'0.8rem', background: 'var(--input-bg)', color: 'var(--text-color)', margin: 0, outline: 'none' }}>
                       <option value="All">ทั้งหมด</option>
                       {uniquePhases.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                     </select>
                   </div>
                 </>
               )}
            </div>
          )}
        </div>

        <div className="table-wrap" style={{ zIndex: 1, position: 'relative' }}>
          {isLoading?<div style={{padding:'40px',textAlign:'center',color:'var(--text-muted)'}}>กำลังโหลดข้อมูลคำขอ...</div>:displayData.length===0?<div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}><div style={{fontSize:'3rem',marginBottom:'10px'}}>🎉</div><div>ไม่มีคำขอในหมวดหมู่นี้ที่ต้องรอการพิจารณา</div></div>:(
            <table className="portfolio-table project-portfolio-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>Project ID</th><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>Project Name</th>{activeTab==='new'?<><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>Category</th><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>Site</th></>:<><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>ขอเปลี่ยนเป็นสถานะ</th><th style={{background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>ขอเปลี่ยนขั้นตอน (Phase)</th></>}<th style={{textAlign:'center',background:'var(--bg-color)',color:'var(--text-color)', padding: '14px', borderBottom: '2px solid var(--border-color)'}}>Action</th></tr></thead>
              <tbody>
                {displayedRequests.map(request=>(
                  <tr key={request.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8fafc)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{color:'var(--blue)',fontWeight:600, padding: '16px 14px'}}>{request.id}</td><td style={{fontWeight:600, padding: '16px 14px'}}>{request.name}</td>
                    {activeTab==='new'?<><td style={{padding: '16px 14px'}}><span style={{background: 'var(--bg-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-color)'}}>{request.category}</span></td><td style={{padding: '16px 14px'}}>{request.site}</td></>:<><td style={{padding: '16px 14px'}}><span style={{background: 'rgba(22, 163, 74, 0.1)', color:'#16a34a',fontWeight:'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(22, 163, 74, 0.2)'}}>{request.form_data?.tracking?.pendingStatus}</span></td><td style={{padding: '16px 14px'}}><span style={{background: 'rgba(14, 165, 233, 0.1)', color:'#0ea5e9',fontWeight:'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)'}}>{request.form_data?.tracking?.pendingPhase}</span></td></>}
                    <td style={{textAlign:'center', padding: '16px 14px'}}><button className="btn btn-primary" onClick={()=>handleOpenApproval(request)} style={{padding:'8px 16px',borderRadius:'10px',fontWeight:600, boxShadow: '0 2px 4px rgba(14,165,233,0.2)', transition: 'transform 0.1s'}} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>🔍 ตรวจสอบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ----------------- MODAL SECTION (REMAINS EXACTLY THE SAME) ----------------- */}
      {isApprovalModalOpen&&selectedRequest&&(
        <div className="pdf-preview-overlay" style={{zIndex:1040}}>
          <div className="pdf-preview-card" style={{width:'95%',maxWidth:'1100px',height:'90vh',display:'flex',flexDirection:'column',borderRadius:'24px',overflow:'hidden',padding:0}}>
            <div style={{padding:'20px 30px',background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0,color:'var(--text-color)',fontSize:'1.4rem'}}>📝 ตรวจสอบและพิจารณา: {selectedRequest.name}</h3>
                <button onClick={()=>setIsApprovalModalOpen(false)} style={{color:'var(--text-muted)',background:'var(--bg-color)',border:'none',width:'36px',height:'36px',borderRadius:'10px',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
            </div>
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
                    </>
                )}
              </div>
            </div>
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