import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function RequestForm() {
  const createBlankCost = () => ({
    item: '',
    qty: '',
    cost: '',
    paymentDate: ''
  });

  const normalizeProjectCosts = (costs = []) => {
    const normalized = costs.map(cost => ({
      item: cost.item || '',
      qty: cost.qty || '',
      cost: cost.cost || '',
      paymentDate: cost.paymentDate || ''
    }));

    return normalized.length ? normalized : [createBlankCost()];
  };

  const initialFormData = {
    // Requester only section
    requestId: '',
    requestDate: new Date().toISOString().split('T')[0],
    requesterName: '',
    requesterDept: '',
    requesterGroup: '',
    requesterSite: '',
    requesterTel: '',
    emergencyHOD: '',
    projectName: '',
    projectDetail: '',
    requirementDetail: '',
    targetUser: '',
    useDept: '',
    companyName: '',
    expectedOutcome: '',
    budgetSources: '',
    anticipatedDate: '',
    otherRemark: '',
    
    // GLS IT only section
    status: '',
    projectCategory: [], // Application, Infrastructure Service, Operation Service
    projectType: [], // New System, Infrastructure, Consult
    impactNewHISB: 'No', // Yes/No
    impactHISBApp: '',
    impactAnalysis: '',
    interfaceWith: '',
    resources: [], // GLS สำหรับระบบ, GLS ทำ Infrastructure, etc
    vendor1Name: '',
    vendor2Name: '',
    projectManager: '',
    timelineStartDate: '',
    timelineEndDate: '',
    projectCosts: normalizeProjectCosts(),
    deploySite: '',
    preparedBy: '',
    approvedBy: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const resizeAllTextareas = () => {
    const nodes = document.querySelectorAll('.request-form textarea');
    nodes.forEach(node => {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    });
  };

  useEffect(() => {
    const draft = localStorage.getItem('ba-system.request-draft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setFormData({
        ...initialFormData,
        ...parsedDraft,
        projectCosts: normalizeProjectCosts(parsedDraft.projectCosts)
      });
    }
  }, []);

  useEffect(() => {
    resizeAllTextareas();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    if (formData.impactNewHISB !== 'Yes') {
      setFormData(prev => ({ ...prev, impactHISBApp: '', impactAnalysis: '' }));
    }
  }, [formData.impactNewHISB]);

  const handleCheckboxChange = (name, option) => {
    setFormData(prev => {
      const current = prev[name] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [name]: updated };
    });
  };

  const handleProjectCostChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.projectCosts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projectCosts: updated };
    });
  };

  const handleAddProjectCost = () => {
    setFormData(prev => ({
      ...prev,
      projectCosts: [...prev.projectCosts, createBlankCost()]
    }));
  };

  const handleRemoveProjectCost = (index) => {
    setFormData(prev => {
      const updated = prev.projectCosts.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        projectCosts: updated.length ? updated : normalizeProjectCosts([])
      };
    });
  };

  const toIsoDate = (date) => (date ? date.toISOString().split('T')[0] : '');
  const toDate = (value) => (value ? new Date(value) : null);

  const showVendorFields = formData.resources.includes('GLS จ้าง Vendor') ||
    formData.resources.includes('โรงพยาบาลจ้าง Vendor');


  const handleSaveDraft = () => {
    setFormData(prev => {
      const updated = {
        ...prev,
        projectCosts: prev.projectCosts
      };
      localStorage.setItem('ba-system.request-draft', JSON.stringify(updated));
      return updated;
    });
    alert('Draft saved successfully.');
  };

  const handleClearForm = () => {
    localStorage.removeItem('ba-system.request-draft');
    setFormData({
      ...initialFormData,
      requestDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData(prev => {
      const updated = {
        ...prev,
        projectCosts: prev.projectCosts
      };
      localStorage.setItem('ba-system.request-draft', JSON.stringify(updated));
      return updated;
    });
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="page-wrap page-request print-area">
      <form onSubmit={handleSubmit} className="request-form">
        <div className="print-page-block">
          <h1 className="page-heading">IT Project Request Form</h1>
        {/* REQUESTER ONLY SECTION */}
        <section className="form-section requester-section print-keep">
          <div className="print-header">
            <img src="/logo.png" alt="Greenline Synergy" className="print-logo" />
            <div className="print-header-text">
              <div className="print-title">IT Project Request Form - Requester only</div>
              <div className="print-subtitle">Greenline Synergy</div>
            </div>
          </div>
          <div className="section-title">Requester only</div>

          <div className="form-row">
            <div className="form-group">
              <label>Request ID:</label>
              <input type="text" name="requestId" value={formData.requestId} onChange={handleChange} placeholder="Request ID" className="print-hide-input" />
              <div className="print-only">{formData.requestId || '-'}</div>
            </div>
            <div className="form-group">
              <label>Status:</label>
              <input type="text" name="status" value={formData.status || ''} onChange={handleChange} className="print-hide-input" />
              <div className="print-only">{formData.status || '-'}</div>
            </div>
          </div>

          {/* Request Date Row */}
          <div className="form-row">
            <div className="form-group">
              <label>Request Date <span className="note-label">(วันที่ขอ)</span></label>
              <DatePicker
                selected={toDate(formData.requestDate)}
                onChange={(date) => setFormData(prev => ({ ...prev, requestDate: toIsoDate(date) }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="วัน/เดือน/ปี"
                className="date-input"
              />
            </div>
          </div>

          {/* Name of Requester Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Name of Requester <span className="note-label">(ชื่อของผู้ขอ)</span></label>
              <input type="text" name="requesterName" value={formData.requesterName} onChange={handleChange} />
            </div>
          </div>

          {/* Requester Details - 5 columns */}
          <div className="form-row details-row">
            <div className="form-group">
              <label>Dept.</label>
              <input type="text" name="requesterDept" value={formData.requesterDept} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Group</label>
              <input type="text" name="requesterGroup" value={formData.requesterGroup} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Site:</label>
              <input type="text" name="requesterSite" value={formData.requesterSite} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Tel:</label>
              <input type="text" name="requesterTel" value={formData.requesterTel} onChange={handleChange} />
            </div>
          </div>

          {/* Project Name Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Project Name. <span className="note-label">(ชื่อโครงการ)</span></label>
              <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} />
            </div>
          </div>

          {/* Project Detail Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Project Detail: <span className="note-label">(รายละเอียดของโครงการ)</span></label>
              <textarea
                name="projectDetail"
                rows="3"
                value={formData.projectDetail}
                onChange={handleChange}
                onInput={handleTextareaInput}
              ></textarea>
            </div>
          </div>

          {/* Requirement Detail Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Requirement Detail: <span className="note-label">(รายละเอียดของต้องการ)</span></label>
              <textarea
                name="requirementDetail"
                rows="5"
                value={formData.requirementDetail}
                onChange={handleChange}
                onInput={handleTextareaInput}
              ></textarea>
            </div>
          </div>

          {/* Target User Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Target User: <span className="note-label">(กลุ่มเป้าหมายผู้ใช้ระบบ)</span></label>
              <input type="text" name="targetUser" value={formData.targetUser} onChange={handleChange} />
            </div>
          </div>

          {/* Use at Department Row */}
          <div className="form-row no-divider">
            <div className="form-group">
              <label>Use at Department: <span className="note-label">(แผนกที่ใช้)</span></label>
              <input type="text" name="useDept" value={formData.useDept} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hospital/Company:<span className="note-label">(โรงพยาบาล/บริษัท)</span></label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
            </div>
          </div>

          {/* Expected Outcome Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Expected Outcome: <span className="note-label">(ผลลัพธ์ที่คาดหวังกับโครงการ)</span></label>
              <textarea
                name="expectedOutcome"
                rows="3"
                value={formData.expectedOutcome}
                onChange={handleChange}
                onInput={handleTextareaInput}
              ></textarea>
            </div>
          </div>

          {/* Budget Sources Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Budget Sources: <span className="note-label">(แหล่งที่มาของงบประมาณ)</span></label>
              <input type="text" name="budgetSources" value={formData.budgetSources} onChange={handleChange} />
            </div>
          </div>

          {/* Anticipated Date Needed Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Anticipated Date Needed: <span className="note-label">(วันที่ที่ต้องการเสร็จสิ้น)</span></label>
              <DatePicker
                selected={toDate(formData.anticipatedDate)}
                onChange={(date) => setFormData(prev => ({ ...prev, anticipatedDate: toIsoDate(date) }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="วัน/เดือน/ปี"
                className="date-input"
              />
            </div>
          </div>

          {/* Other Remark Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Other Remark: <span className="note-label">(ข้อมูลอื่นเพิ่มเติม)</span></label>
              <textarea
                name="otherRemark"
                rows="3"
                value={formData.otherRemark}
                onChange={handleChange}
                onInput={handleTextareaInput}
              ></textarea>
            </div>
          </div>

          {/* Approval Section */}
          <div className="form-row approval-grid print-only-grid">
            <div className="approval-card">
              <div className="approval-title">Requested by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(อุษณีย์ ทองเชื่อม)</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">Requester / IT Site Lead(ผู้ขอ / หัวหน้าไซต์ IT)</div>
            </div>

            <div className="approval-card">
              <div className="approval-title">Approved by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(ภูมิชาย เกษสำลี)</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">Head of Services & Operations Grc<br />(Or Delegated Person)</div>
            </div>

            <div className="approval-card">
              <div className="approval-title">Approved by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(........................................)</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">Head of Service Support<br />(If any)</div>
            </div>

            <div className="approval-card">
              <div className="approval-title">Approved by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(........................................)</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">Head of Finance<br />(If any)</div>
            </div>
            <div className="approval-card">
              <div className="approval-title">Approved by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(........................................)</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">CIO/ผู้ที่ได้รับมอบอำนาจ</div>
            </div>
          </div>

        </section>

        </div>

        {/* GLS IT ONLY SECTION */}
        <section className="form-section gls-section print-break-before">
          <div className="print-header">
            <img src="/logo.png" alt="Greenline Synergy" className="print-logo" />
            <div className="print-header-text">
              <div className="print-title">IT Project Request Form - GLS IT only</div>
              <div className="print-subtitle">Greenline Synergy</div>
            </div>
          </div>
          <div className="section-title">GLS IT only</div>

          {/* Project Category Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Project Category: <span className="note-label">(หมวดหมู่โปรเจ็ค)</span></label>
              <div className="checkbox-group">
                {['Application', 'Infrastructure Service', 'Operation Service'].map(cat => (
                  <label key={cat} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.projectCategory.includes(cat)}
                      onChange={() => handleCheckboxChange('projectCategory', cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Project Type Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Project Type: <span className="note-label">(ประเภทของโปรเจ็ค)</span></label>
              <div className="checkbox-group">
                {['New System', 'Infrastructure', 'Consult (กรณีที่ IT Operation มีส่วนในการช่วยเหลือหรือให้บริการกับ Project ที่โรงพยาบาล เป็น Owner เท่านั้น)'].map(type => (
                  <label key={type} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.projectType.includes(type)}
                      onChange={() => handleCheckboxChange('projectType', type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Impact New HISB Row */}
          <div className="form-row no-divider">
            <div className="form-group">
              <label>Impact New HISB-Connect/Listed App:<span className="note-label">(กระทบต่อระบบ New HIS)</span></label>
              <div className="radio-group">
                {['No', 'Yes'].map(option => (
                  <label key={option} className="radio-item">
                    <input
                      type="radio"
                      name="impactNewHISB"
                      value={option}
                      checked={formData.impactNewHISB === option}
                      onChange={handleChange}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Application Name/Site Name:</label>
              <input
                type="text"
                name="impactHISBApp"
                placeholder="(Application Name/Site Name)"
                value={formData.impactHISBApp}
                onChange={handleChange}
                disabled={formData.impactNewHISB !== 'Yes'}
              />
            </div>
          </div>

          {/* Impact Analysis Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Impact Analysis: <span className="note-label">(วิเคราะห์ผลกระทบ)</span></label>
              <textarea
                name="impactAnalysis"
                rows="3"
                value={formData.impactAnalysis}
                onChange={handleChange}
                onInput={handleTextareaInput}
                disabled={formData.impactNewHISB !== 'Yes'}
              ></textarea>
            </div>
          </div>

          {/* Interface With Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Interface with: <span className="note-label">(การเชื่อต่อกับระบบอื่น)</span></label>
              <textarea
                name="interfaceWith"
                rows="2"
                value={formData.interfaceWith}
                onChange={handleChange}
                onInput={handleTextareaInput}
              ></textarea>
            </div>
          </div>

          {/* Resource Row */}
          <div className="form-row no-divider">
            <div className="form-group full-width">
              <label>Resource: <span className="note-label">(ดำเนินการโดย)</span></label>
              <div className="checkbox-group">
                {['GLS ดำเนินการเอง', 'GLS จ้าง Vendor', 'โรงพยาบาลจ้าง Vendor'].map(res => (
                  <label key={res} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.resources.includes(res)}
                      onChange={() => handleCheckboxChange('resources', res)}
                    />
                    {res}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {showVendorFields && (
            <div className="form-row">
              <div className="form-group full-width">
                <label>Vendor name (ระบุบริษัทผู้ให้บริการ)</label>
                <input
                  type="text"
                  name="vendor1Name"
                  placeholder="ระบุชื่อบริษัทผู้ให้บริการ"
                  value={formData.vendor1Name}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Project Manager Row */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Project Manager: <span className="note-label">(ผู้รับผิดชอบโครงการ)</span></label>
              <input type="text" name="projectManager" value={formData.projectManager} onChange={handleChange} />
            </div>
          </div>

          {/* Timeline Row */}
          <h4>Timeline</h4>
            <div className="form-row">
            <div className="form-group">
              <label>Start Date: <span className="note-label">(วันเริ่มโครงการ)</span></label>
              <DatePicker
                selected={toDate(formData.timelineStartDate)}
                onChange={(date) => setFormData(prev => ({ ...prev, timelineStartDate: toIsoDate(date) }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="วัน/เดือน/ปี"
                className="date-input"
              />
            </div>
            <div className="form-group">
              <label>End Date: <span className="note-label">(วันสิ้นสุดโครงการ)</span></label>
              <DatePicker
                selected={toDate(formData.timelineEndDate)}
                onChange={(date) => setFormData(prev => ({ ...prev, timelineEndDate: toIsoDate(date) }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="วัน/เดือน/ปี"
                className="date-input"
              />
            </div>
          </div>

          {/* Project Cost Table */}
          <div className="form-row">
            <div className="form-group full-width">
              <label className="print-hidden">Project Cost: <span className="note-label">(ต้นทุนของโปรเจ็ค)</span></label>
              <div className="cost-table-wrapper">
                <table className="cost-table">
                  <thead>
                    <tr className="print-only-row">
                      <th colSpan="6" className="cost-continued">Project Cost (continued)</th>
                    </tr>
                    <tr>
                      <th>ลำดับที่</th>
                      <th>รายการค่าใช้จ่าย</th>
                      <th>QTY</th>
                      <th>ค่าใช้จ่าย(บาท)</th>
                      <th>กำหนดวันชำระ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.projectCosts.map((row, index) => (
                      <tr key={`cost-row-${index}`}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            placeholder="รายการค่าใช้จ่าย"
                            value={row.item}
                            onChange={(e) => handleProjectCostChange(index, 'item', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="QTY"
                            value={row.qty}
                            onChange={(e) => handleProjectCostChange(index, 'qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="ค่าใช้จ่าย(บาท)"
                            value={row.cost}
                            onChange={(e) => handleProjectCostChange(index, 'cost', e.target.value)}
                          />
                        </td>
                        <td>
                          <DatePicker
                            selected={toDate(row.paymentDate)}
                            onChange={(date) => handleProjectCostChange(index, 'paymentDate', toIsoDate(date))}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="วัน/เดือน/ปี"
                            className="date-input"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-tertiary print-hidden"
                            onClick={() => handleRemoveProjectCost(index)}
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-secondary print-hidden" onClick={handleAddProjectCost}>Add Row</button>
            </div>
          </div>

          {/* Deploy at Site Row */}
          <div className="form-row">
            <div className="form-group">
              <label>Deploy at site: <span className="note-label">(ติดตั้งโปรเเกรมที่)</span></label>
              <input type="text" name="deploySite" value={formData.deploySite} onChange={handleChange} />
            </div>
          </div>

          {/* Approval Signatures Row */}
          <div className="form-row gls-approval-grid print-only-grid">
            <div className="approval-card">
              <div className="approval-title">Prepared by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(     วสันต์  บุญเจริญ    )</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">Application Lead/Manager</div>
            </div>
            <div className="approval-card">
              <div className="approval-title">Approved by</div>
              <div className="approval-sign"></div>
              <div className="approval-name">(     คุณสุภัทร์ ปลั่งประเสริฐกุล    )</div>
              <div className="approval-date">Date :</div>
              <div className="approval-role">GLS Director, Customer Engagement Dept.</div>
            </div>
          </div>

        </section>

        {/* Buttons */}
        <div className="form-row button-row">
          <button type="submit" className="btn btn-primary">Submit</button>
          <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
          <button type="button" className="btn btn-tertiary" onClick={handleClearForm}>Clear</button>
          <button type="button" className="btn btn-secondary" onClick={handleExportPdf}>Export PDF</button>
        </div>
      </form>
    </div>
  );
}

export default RequestForm;
