import React, { useState } from 'react';

function ApplicationPortfolio() {
  const pdpaItems = [
    { key: 'health', label: 'ข้อมูลสุขภาพ' },
    { key: 'id', label: 'บัตรประชาชน' },
    { key: 'email', label: 'Email' },
    { key: 'financial', label: 'ข้อมูลการเงิน' },
    { key: 'crime', label: 'ประวัติอาชญากรรม' },
    { key: 'religion', label: 'เชื้อชาติ/ศาสนา' },
    { key: 'photo', label: 'รูปถ่ายใบหน้า' }
  ];

  const ropaItems = [
    { key: 'collect', label: 'เก็บรวบรวม' },
    { key: 'store', label: 'จัดเก็บ' },
    { key: 'use', label: 'ใช้/ประมวลผล' },
    { key: 'share', label: 'ส่งต่อ' },
    { key: 'retain', label: 'ระยะเวลาเก็บ' },
    { key: 'delete', label: 'ลบทำลาย' }
  ];

  const [pdpaApps, setPdpaApps] = useState([
    {
      id: '0701',
      name: 'Cashier Pharmacy Queue',
      pdpa: { health: true, id: true },
      ropa: { collect: true, store: true, use: true }
    },
    {
      id: '0602',
      name: 'Patient Certificate',
      pdpa: { health: true, id: true, email: true },
      ropa: { collect: true, store: true, use: true, share: true }
    },
    {
      id: '0662',
      name: 'Vaccination Book',
      pdpa: { health: true, id: true, email: true, photo: true },
      ropa: { collect: true, store: true, use: true, retain: true }
    }
  ]);

  const toggleFlag = (appId, group, key) => {
    setPdpaApps(prev => prev.map(app => (
      app.id === appId
        ? { ...app, [group]: { ...app[group], [key]: !app[group]?.[key] } }
        : app
    )));
  };

  const generalInfo = [
    {
      appId: '0701',
      groupDept: 'SOG_6',
      site: 'BSI',
      name: 'Cashier Pharmacy Queue',
      abbr: 'CPQ',
      description: 'ระบบคิวหน้าห้องยาและการเงิน',
      module: 'Cashier Queue',
      status: 'Active',
      users: 18,
      enterprise: 'Patient Portal',
      category: 'EMR',
      director: 'Supat Plungprasertkul'
    },
    {
      appId: '0602',
      groupDept: 'SOG_6',
      site: 'BPK',
      name: 'Patient Certificate',
      abbr: 'PatientCer',
      description: 'ระบบใบรับรองแพทย์ออนไลน์',
      module: 'Certificate',
      status: 'Active',
      users: 24,
      enterprise: 'Patient Portal',
      category: 'EMR',
      director: 'Supat Plungprasertkul'
    },
    {
      appId: '0662',
      groupDept: 'SOG_6',
      site: 'BPK',
      name: 'Vaccination Book',
      abbr: 'Vaccine',
      description: 'สมุดวัคซีนออนไลน์',
      module: 'Vaccine',
      status: 'Active',
      users: 30,
      enterprise: 'Patient Portal',
      category: 'EMR',
      director: 'Supat Plungprasertkul'
    }
  ];

  const supportInfo = [
    {
      serviceHour: '8*5 (08.00-17.00)',
      owner: 'Wason Buncharoen',
      ownerContact: 'Wason.Bu@glsict.com | 076-254421-5 Ext.1215',
      deptName: 'Services & Operations Group 6',
      l3: 'Thanawat Tirsumvat',
      l3Contact: 'Thanawat.Ti@glsict.com | Ext.7788',
      l2: 'BPK IT',
      l2Contact: 'bpkit@bgh.co.th',
      l1: 'IT Operation BPK',
      l1Contact: 'Centralized IT Helpdesk 02-762-8055'
    }
  ];

  const serverBackup = [
    {
      ip: '10.143.10.36',
      serverName: 'Windows Server 2016',
      hisServer: '-',
      fileShare: '-',
      backup: 'Full backup_Monthly',
      standalone: 'No'
    },
    {
      ip: '10.143.10.36',
      serverName: 'bpk-webapp01',
      hisServer: '-',
      fileShare: '-',
      backup: 'Full backup_Monthly',
      standalone: 'Yes'
    }
  ];

  const techStack = [
    {
      language: 'ASP .Net (C#)',
      tools: 'Microsoft Visual Studio 2015',
      platform: 'Web Base',
      webServerIp: '10.143.10.37',
      webServerName: 'bpk-webapp-prd1',
      appServerIp: '10.143.10.37',
      appServerName: 'bpk-webapp-prd1'
    },
    {
      language: 'ASP .Net (C#)',
      tools: 'Microsoft Visual Studio 2012',
      platform: 'Web Base',
      webServerIp: '10.143.10.37',
      webServerName: 'bpk-webapp-prd1',
      appServerIp: '-',
      appServerName: '-'
    }
  ];

  const versionUsage = [
    {
      lastUpdate: '05/09/2022',
      version: '1.0.2',
      usageHour: '8*7 (08.00-17.00)',
      impact: 'Yes',
      dataRecord: 'Health Info.'
    },
    {
      lastUpdate: '16/08/2020',
      version: 'None',
      usageHour: '8*7 (08.00-17.00)',
      impact: 'No',
      dataRecord: 'Health Info.'
    }
  ];

  const catalog = [
    {
      catalog: 'Functional Application',
      type: 'Inhouse',
      customizedBy: 'GLS',
      vendor: '-',
      sourceAvailable: 'Yes',
      sourceName: 'Patient Certificate',
      sourceLocation: 'http://git.bdms.co.th/SOG6_Projects/patientcertification',
      firstInstall: '15/08/2021'
    },
    {
      catalog: 'Functional Application',
      type: 'Inhouse',
      customizedBy: 'GLS',
      vendor: '-',
      sourceAvailable: 'Yes',
      sourceName: 'Vaccination',
      sourceLocation: '\\\\10.143.10.36\\web\\Vaccination',
      firstInstall: '16/08/2019'
    }
  ];

  const supportRow = supportInfo[0] || {};
  const serverRow = serverBackup[0] || {};
  const techRow = techStack[0] || {};
  const versionRow = versionUsage[0] || {};
  const catalogRow = catalog[0] || {};

  return (
    <div className="page-wrap page-app">
      <h1 className="page-heading">Application Portfolio</h1>
      <div className="page-rule"></div>

      <section className="content-card portfolio-section">
        <div className="portfolio-section-title">Application Portfolio (Combined)</div>
        <div className="table-wrap">
          <table className="portfolio-table application-portfolio-table">
            <thead>
              <tr className="group-row">
                <th className="group-general" colSpan={8}>General</th>
                <th className="group-pdpa" colSpan={pdpaItems.length}>PDPA</th>
                <th className="group-ropa" colSpan={ropaItems.length}>ROPA</th>
                <th className="group-support" colSpan={6}>Support</th>
                <th className="group-server" colSpan={6}>Server/Backup</th>
                <th className="group-tech" colSpan={7}>Technology</th>
                <th className="group-version" colSpan={5}>Version/Usage</th>
                <th className="group-catalog" colSpan={8}>Catalog/Source</th>
              </tr>
              <tr>
                <th>App_ID</th>
                <th>Dept</th>
                <th>Site</th>
                <th>App Name</th>
                <th>Abbr</th>
                <th>Module</th>
                <th>Status</th>
                <th>Users</th>
                {pdpaItems.map(item => (
                  <th key={`pdpa-${item.key}`}>{item.label}</th>
                ))}
                {ropaItems.map(item => (
                  <th key={`ropa-${item.key}`}>{item.label}</th>
                ))}
                <th>Service Hour</th>
                <th>Owner</th>
                <th>Owner Contact</th>
                <th>L3</th>
                <th>L2</th>
                <th>L1</th>
                <th>DB IP</th>
                <th>DB Server</th>
                <th>HIS Conn</th>
                <th>File Share</th>
                <th>Backup</th>
                <th>Standalone</th>
                <th>Language</th>
                <th>Tools</th>
                <th>Platform</th>
                <th>Web IP</th>
                <th>Web Server</th>
                <th>App IP</th>
                <th>App Server</th>
                <th>Last Update</th>
                <th>Version</th>
                <th>Usage Hour</th>
                <th>Impact</th>
                <th>Data Record</th>
                <th>Catalog</th>
                <th>Type</th>
                <th>Customized</th>
                <th>Vendor</th>
                <th>Source</th>
                <th>Source Name</th>
                <th>Source Location</th>
                <th>First Install</th>
              </tr>
            </thead>
            <tbody>
              {generalInfo.map(app => {
                const pdpaRow = pdpaApps.find(row => row.id === app.appId) || {};
                return (
                  <tr key={app.appId}>
                    <td>{app.appId}</td>
                    <td>{app.groupDept}</td>
                    <td>{app.site}</td>
                    <td><strong>{app.name}</strong></td>
                    <td>{app.abbr}</td>
                    <td>{app.module}</td>
                    <td>{app.status}</td>
                    <td>{app.users}</td>
                    {pdpaItems.map(item => (
                      <td key={`pdpa-cell-${app.appId}-${item.key}`} className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={Boolean(pdpaRow.pdpa?.[item.key])}
                          onChange={() => toggleFlag(app.appId, 'pdpa', item.key)}
                        />
                      </td>
                    ))}
                    {ropaItems.map(item => (
                      <td key={`ropa-cell-${app.appId}-${item.key}`} className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={Boolean(pdpaRow.ropa?.[item.key])}
                          onChange={() => toggleFlag(app.appId, 'ropa', item.key)}
                        />
                      </td>
                    ))}
                    <td>{supportRow.serviceHour}</td>
                    <td>{supportRow.owner}</td>
                    <td>{supportRow.ownerContact}</td>
                    <td>{supportRow.l3}</td>
                    <td>{supportRow.l2}</td>
                    <td>{supportRow.l1}</td>
                    <td>{serverRow.ip}</td>
                    <td>{serverRow.serverName}</td>
                    <td>{serverRow.hisServer}</td>
                    <td>{serverRow.fileShare}</td>
                    <td>{serverRow.backup}</td>
                    <td>{serverRow.standalone}</td>
                    <td>{techRow.language}</td>
                    <td>{techRow.tools}</td>
                    <td>{techRow.platform}</td>
                    <td>{techRow.webServerIp}</td>
                    <td>{techRow.webServerName}</td>
                    <td>{techRow.appServerIp}</td>
                    <td>{techRow.appServerName}</td>
                    <td>{versionRow.lastUpdate}</td>
                    <td>{versionRow.version}</td>
                    <td>{versionRow.usageHour}</td>
                    <td>{versionRow.impact}</td>
                    <td>{versionRow.dataRecord}</td>
                    <td>{catalogRow.catalog}</td>
                    <td>{catalogRow.type}</td>
                    <td>{catalogRow.customizedBy}</td>
                    <td>{catalogRow.vendor}</td>
                    <td>{catalogRow.sourceAvailable}</td>
                    <td>{catalogRow.sourceName}</td>
                    <td>{catalogRow.sourceLocation}</td>
                    <td>{catalogRow.firstInstall}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ApplicationPortfolio;
