import React from 'react';

function ProjectPortfolio() {
  const projects = [
    {
      id: '2023016',
      name: 'eConsent สำหรับ OR_BSI',
      description: 'พัฒนา API สำหรับรับส่งข้อมูลโรคติดต่ออันตราย และโรคติดต่อเฝ้าระวังที่กำหนด ให้กับกรมควบคุมโรค - สำหรับ Site BSR',
      status: 'Hold',
      planStart: '-',
      actualStart: '-',
      planGoLive: '-',
      actualGoLive: '-',
      owner: 'Services & Operations Group6',
      manager: 'Chatchai Anupat',
      group: 'SOG6',
      site: 'BSR',
      operatedBy: '1',
      projectType: 'N',
      phase: 'Go-live'
    },
    {
      id: '2023019',
      name: 'ระบบใบแจ้งตัว Online_BSI',
      description: 'จัดทำ Dashboard ตรวจเช็คผู้ป่วยนัด, ESI, เพิ่มประสิทธิภาพการจ่ายยาและบริการผู้ป่วย',
      status: 'Active',
      planStart: '16/6/2023',
      actualStart: '16/6/2023',
      planGoLive: '1/1/2026',
      actualGoLive: '-',
      owner: 'Services & Operations Group6',
      manager: 'Chatchai Anupat',
      group: 'SOG6',
      site: 'BSR',
      operatedBy: '1',
      projectType: 'N',
      phase: 'User Acceptance Test (UAT)'
    },
    {
      id: '2025114',
      name: 'BSR_Work Permit Online',
      description: 'ระบบแจ้งงานบุคคลภายนอกอย่างถูกต้องตามปฏิบัติงานในพื้นที่โรงพยาบาล',
      status: 'Initiate',
      planStart: '1/7/2025',
      actualStart: '1/12/2025',
      planGoLive: '1/2/2026',
      actualGoLive: '-',
      owner: 'Services & Operations Group6',
      manager: 'Burin Panchat',
      group: 'SOG6',
      site: 'BSR',
      operatedBy: '1',
      projectType: 'N',
      phase: 'Project Registration'
    },
    {
      id: '2025115',
      name: 'BSI_Q Pharmacy Dashboard',
      description: 'ระบบแสดง Dashboard การรอจ่ายผู้ป่วยในของห้องยา IPD',
      status: 'Active',
      planStart: '1/4/2025',
      actualStart: '1/5/2025',
      planGoLive: '1/6/2025',
      actualGoLive: '1/8/2025',
      owner: 'Services & Operations Group6',
      manager: 'Bamrung Jampeepan',
      group: 'SOG6',
      site: 'BSI',
      operatedBy: '1',
      projectType: 'N',
      phase: 'Development/Implement'
    },
    {
      id: '2025122',
      name: 'BHH_QueueSystem',
      description: 'ระบบแสดงคิว Cashier & Pharmacy',
      status: 'Active',
      planStart: '1/7/2025',
      actualStart: '1/7/2025',
      planGoLive: '1/1/2026',
      actualGoLive: '-',
      owner: 'Services & Operations Group6',
      manager: 'Naphat Suksatchatham',
      group: 'SOG6',
      site: 'BHH',
      operatedBy: '1',
      projectType: 'N',
      phase: 'User Acceptance Test (UAT)'
    },
    {
      id: '2025123',
      name: 'BSI_OR Instrument',
      description: 'โปรแกรมนับสินค้า OR Inventory และ OR Sterile Item',
      status: 'Active',
      planStart: '1/3/2025',
      actualStart: '1/5/2025',
      planGoLive: '1/4/2025',
      actualGoLive: '-',
      owner: 'Services & Operations Group6',
      manager: 'Naphat Suksatchatham',
      group: 'SOG6',
      site: 'BSI',
      operatedBy: '1',
      projectType: 'N',
      phase: 'Preparation'
    }
  ];

  const getStatusClass = (status) => {
    const statusMap = {
      Hold: 'status-hold',
      Active: 'status-active',
      Initiate: 'status-initiate',
      'Go live': 'status-go',
      'Go-live': 'status-go'
    };
    return statusMap[status] || 'status-active';
  };

  const getPhaseClass = (phase) => {
    const phaseMap = {
      'Go-live': 'phase-go',
      'User Acceptance Test (UAT)': 'phase-uat',
      'Project Registration': 'phase-register',
      'Development/Implement': 'phase-dev',
      Preparation: 'phase-prep'
    };
    return phaseMap[phase] || 'phase-default';
  };

  return (
    <div className="page-wrap page-project">
      <h1 className="page-heading">Project Portfolio</h1>
      <div className="page-rule"></div>

      <section className="content-card">
        <div className="table-wrap">
          <table className="portfolio-table project-portfolio-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Plan Start Date</th>
                <th>Actual Start Date</th>
                <th>Plan Go-live Date</th>
                <th>Actual Go-live Date</th>
                <th>GLS Project Owner</th>
                <th>GLS Project Manager</th>
                <th>Group</th>
                <th>Site</th>
                <th>Project Operated by</th>
                <th>Project Type</th>
                <th>Project Phase</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td className="project-id">{project.id}</td>
                  <td className="project-name"><strong>{project.name}</strong></td>
                  <td className="project-description">{project.description}</td>
                  <td>
                    <span className={`status-pill ${getStatusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>{project.planStart}</td>
                  <td>{project.actualStart}</td>
                  <td>{project.planGoLive}</td>
                  <td>{project.actualGoLive}</td>
                  <td>{project.owner}</td>
                  <td>{project.manager}</td>
                  <td>{project.group}</td>
                  <td>{project.site}</td>
                  <td>{project.operatedBy}</td>
                  <td>{project.projectType}</td>
                  <td>
                    <span className={`phase-pill ${getPhaseClass(project.phase)}`}>
                      {project.phase}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ProjectPortfolio;
