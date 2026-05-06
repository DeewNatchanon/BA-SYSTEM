import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

const getFontUrl = () => {
  if (typeof window === 'undefined') {
    return '/pdf/fronts/THSarabunNew.ttf';
  }
  return `${window.location.origin}/pdf/fronts/THSarabunNew.ttf`;
};

Font.register({
  family: 'THSarabunNew',
  src: getFontUrl(),
  format: 'truetype'
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    fontSize: 10.8,
    fontFamily: 'THSarabunNew'
  },
  pageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  frame: {
    borderWidth: 1,
    borderColor: '#000',
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch'
  },
  frameFill: { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  
  /* 🚀 ใส่ objectFit: 'contain' กลับมา เพื่อรักษาสัดส่วนรูปให้เป๊ะ ไม่โดนบีบ/ยืด 🚀 */
  logo: {
    width: 160,       
    height: 45,       
    objectFit: 'contain',
    marginBottom: 8,
    marginLeft: 0
  }, 
  
  metaBlock: { fontSize: 8.6, textAlign: 'right', lineHeight: 1.25 },
  
  /* --- Style บรรทัดแรก (Title Bar) ปรับให้เหมือนรูป --- */
  titleBar: { backgroundColor: 'transparent', marginBottom: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  titleLeftCol: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3
  },
  titleRightCol: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 3
  },
  titleText: { fontSize: 18, fontWeight: 700 },
  
  /* --- แถบหัวข้อ Requester only และ GLS IT only (ยาวเต็มกรอบ) --- */
  headerBlock: {
    backgroundColor: '#fbe5d6',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 2,
    paddingHorizontal: 4
  },
  headerText: { fontSize: 9.6, fontWeight: 700, textDecoration: 'underline' },

  /* --- Styles ทั่วไป --- */
  fieldRowOuter: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 4 },
  fieldLabel: { width: '24%', fontSize: 8.8, lineHeight: 1.2, paddingRight: 6 },
  
  /* ช่อง Input สีเทาอ่อน #f2f2f2 */
  fieldValue: { flex: 1, flexGrow: 1, minHeight: 14, minWidth: 0, backgroundColor: '#f2f2f2', paddingVertical: 2, paddingHorizontal: 3 },
  fieldValueMedium: { minHeight: 20 },
  fieldValueTall: { minHeight: 36 },
  fieldValueText: { fontSize: 9.8, lineHeight: 1.2 },
  splitRowOuter: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000' },
  splitRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 4, gap: 6 },
  splitCell: { flex: 1, minWidth: 0, paddingVertical: 2 },
  inlineLabel: { fontSize: 8.8, marginBottom: 1 },
  inlineValue: { minHeight: 14, backgroundColor: '#f2f2f2', paddingVertical: 2, paddingHorizontal: 3 },
  inlineSingleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 4 },
  inlineSingleLabel: { fontSize: 8.8 },
  inlineSingleValue: { flex: 1, minHeight: 14, backgroundColor: '#f2f2f2', paddingVertical: 2, paddingHorizontal: 3 },

  /* --- Styles สำหรับหน้า 2 (GLS IT only) --- */
  glsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 20
  },
  glsLabelCol: { width: '22%', padding: 4, justifyContent: 'flex-start' },
  glsLabelColWide: { width: '38%', padding: 4, justifyContent: 'flex-start' },
  glsLabelText: { fontSize: 9.6 },
  glsLabelSub: { fontSize: 7.5, color: '#333' },
  glsContentCol: { flex: 1, padding: 4, justifyContent: 'center' },
  greyInputBox: {
    backgroundColor: '#f2f2f2', 
    minHeight: 14,
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    justifyContent: 'center'
  },

  /* --- Checkbox Styles --- */
  checkboxBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  checkboxTick: {
    width: 3.5,
    height: 6,
    borderRightWidth: 1.2,
    borderBottomWidth: 1.2,
    borderRightColor: '#000',
    borderBottomColor: '#000',
    transform: 'rotate(45deg)',
    marginTop: -1
  },

  /* --- Table & Bottom Styles --- */
  table: { borderWidth: 1, borderColor: '#000', marginTop: 4, marginHorizontal: 8 },
  sectionTextLabel: { fontSize: 8.8, lineHeight: 1.2, paddingHorizontal: 8, marginTop: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableRowLast: { borderBottomWidth: 0 },
  tableHeader: { backgroundColor: '#e9e9e9' },
  tableCell: { paddingVertical: 2.5, paddingHorizontal: 4, fontSize: 8.8, borderRightWidth: 1, borderRightColor: '#000' },
  tableCellLast: { borderRightWidth: 0 },
  colNo: { width: '8%' }, colItem: { width: '44%' }, colQty: { width: '12%' }, colCost: { width: '16%' }, colPay: { width: '20%' },
  
  approvalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 10, paddingHorizontal: 8 },
  approvalCard: { width: '19%', borderWidth: 1, borderColor: '#000' },
  approvalHeader: { backgroundColor: '#cfcfcf', textAlign: 'center', fontSize: 8.8, paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#000' },
  approvalBox: { height: 36, borderBottomWidth: 1, borderBottomColor: '#000' },
  approvalNameLine: { fontSize: 6.5, paddingVertical: 3, paddingHorizontal: 1, minHeight: 12, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000' },
  approvalLine: { fontSize: 7.8, padding: 2, borderBottomWidth: 1, borderBottomColor: '#000' },
  approvalRole: { fontSize: 7.8, padding: 2, textAlign: 'center' },
  
  glsApprovalRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, paddingHorizontal: 8, paddingBottom: 8 },
  glsApprovalCard: { width: 185, borderWidth: 1, borderColor: '#000' },
  glsApprovalHeader: { backgroundColor: '#cfcfcf', textAlign: 'center', fontSize: 8.8, paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#000' },
  glsApprovalBox: { height: 58, borderBottomWidth: 1, borderBottomColor: '#000' },
  glsApprovalNameLine: { fontSize: 7, paddingVertical: 4, paddingHorizontal: 1, minHeight: 16, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000' },
  glsApprovalLine: { fontSize: 7.8, padding: 2, borderBottomWidth: 1, borderBottomColor: '#000' },
  glsApprovalRole: { fontSize: 7.8, padding: 2, textAlign: 'center' },
  separator: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 8 }
});

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

const safeText = (value) => (value ? String(value) : '');
const withColon = (label = '') => (label.trim().endsWith(':') ? label : `${label}:`);

const getDotString = (text) => {
  if (text) return text;
  return '.............................................................';
};

const getLogoUrl = (filename) => (typeof window === 'undefined' ? '' : `${window.location.origin}/${filename}`);

const Checkbox = ({ label, subLabel, checked }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
    <View style={styles.checkboxBox}>
      {checked ? <View style={styles.checkboxTick} /> : null}
    </View>
    <View style={{ marginLeft: 4, flex: 1 }}>
      <Text style={{ fontSize: 9.6, lineHeight: 1.1 }}>{label}</Text>
      {subLabel && <Text style={{ fontSize: 7.5, lineHeight: 1.1, marginTop: 1 }}>{subLabel}</Text>}
    </View>
  </View>
);

const FieldRow = ({ label, value, variant }) => (
  <View style={styles.fieldRowOuter}>
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{withColon(label)}</Text>
      <View style={[styles.fieldValue, variant === 'medium' ? styles.fieldValueMedium : variant === 'tall' ? styles.fieldValueTall : null]}>
        <Text style={styles.fieldValueText}>{safeText(value)}</Text>
      </View>
    </View>
  </View>
);

const InlineField = ({ label, value }) => (
  <View style={styles.splitCell}>
    <Text style={styles.inlineLabel}>{withColon(label)}</Text>
    <View style={styles.inlineValue}><Text style={styles.fieldValueText}>{safeText(value)}</Text></View>
  </View>
);

const InlineFieldSingleLine = ({ label, value }) => (
  <View style={styles.splitCell}>
    <View style={styles.inlineSingleRow}>
      <Text style={styles.inlineSingleLabel}>{withColon(label)}</Text>
      <View style={styles.inlineSingleValue}><Text style={styles.fieldValueText}>{safeText(value)}</Text></View>
    </View>
  </View>
);

const RequestFormPdf = ({ data }) => {
  const logoGls = getLogoUrl('logo.png');
  const costRows = (data.projectCosts || []).filter(row => row.item || row.qty || row.cost || row.paymentDate);

  const HeaderSection = ({ showMeta }) => (
    <View style={styles.titleBar}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeftCol}>
          <Text style={styles.titleText}>IT Project Request Form</Text>
        </View>
        <View style={styles.titleRightCol}>
          {showMeta && (
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                 <Text style={{ fontSize: 10, fontWeight: 700, width: 55, textAlign: 'right' }}>Request ID : </Text>
                 <Text style={{ fontSize: 10, fontWeight: 700 }}>{getDotString(data.requestId)}</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                 <Text style={{ fontSize: 10, fontWeight: 700, width: 55, textAlign: 'right' }}>Status : </Text>
                 <Text style={{ fontSize: 10, fontWeight: 700 }}>{getDotString(data.status)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      {/* ---------------- Page 1: Requester only ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageTopRow}>
          <View style={styles.logoRow}>{logoGls ? <Image src={logoGls} style={styles.logo} /> : null}</View>
          <View style={styles.metaBlock}>
            <Text>F/M-01-QM-009 Version 1.0.0</Text>
            <Text>Date: {formatDate(data.requestDate)}</Text>
            <Text>Internal Use Only</Text>
          </View>
        </View>
        <View style={[styles.frame, styles.frameFill]}>
          <HeaderSection showMeta={true} />
          
          <View style={styles.headerBlock}>
            <Text style={styles.headerText}>Requester only</Text>
          </View>

          <FieldRow label="Request Date (วันที่ร้องขอ)" value={formatDate(data.requestDate)} />
          <FieldRow label="Name of Requester (ชื่อผู้ร้องขอ)" value={safeText(data.requesterName)} />

          <View style={styles.splitRowOuter}>
            <View style={styles.splitRow}>
              <InlineFieldSingleLine label="Dept" value={safeText(data.requesterDept)} />
              <InlineFieldSingleLine label="Group" value={safeText(data.requesterGroup)} />
              <InlineFieldSingleLine label="Site" value={safeText(data.requesterSite)} />
              <InlineFieldSingleLine label="Tel" value={safeText(data.requesterTel)} />
            </View>
          </View>

          <FieldRow label="Project Name (ชื่อโครงการ)" value={safeText(data.projectName)} />
          <FieldRow label="Project Detail (รายละเอียดโครงการ)" value={safeText(data.projectDetail)} variant="medium" />
          <FieldRow label="Requirement Detail (รายละเอียดของความต้องการ)" value={safeText(data.requirementDetail)} variant="tall" />
          <FieldRow label="Target User (กลุ่มเป้าหมายผู้ใช้ระบบ)" value={safeText(data.targetUser)} />

          <View style={styles.splitRowOuter}>
            <View style={styles.splitRow}>
              <InlineField label="Use at Department (แผนกที่ใช้)" value={safeText(data.useDept)} />
              <InlineField label="Hospital/Company (โรงพยาบาล/บริษัท)" value={safeText(data.companyName)} />
            </View>
          </View>

          <FieldRow label="Expected Outcome (ผลลัพธ์ที่คาดหวัง)" value={safeText(data.expectedOutcome)} variant="medium" />
          <FieldRow label="Budget Sources (แหล่งงบประมาณ)" value={safeText(data.budgetSources)} />
          <FieldRow label="Anticipated Date Needed (วันที่ต้องการเสร็จ)" value={formatDate(data.anticipatedDate)} />
          <FieldRow label="Other Remark (ข้อมูลอื่นเพิ่มเติม)" value={safeText(data.otherRemark)} variant="medium" />

          <View style={styles.approvalGrid}>
            {[
              { title: 'Requested by', role: 'Requester / IT Site Lead', signName: data.reqSign1 },
              { title: 'Approved by', role: 'Head of Services & Operations Group', signName: data.reqSign2 },
              { title: 'Approved by', role: 'Head of Service Support (If any)', signName: data.reqSign3 },
              { title: 'Approved by', role: 'Head of Finance (If any)', signName: data.reqSign4 },
              { title: 'Approved by', role: 'CIO/ผู้มีอำนาจ', signName: data.reqSign5 }
            ].map((item, index) => (
              <View style={styles.approvalCard} key={index}>
                <Text style={styles.approvalHeader}>{item.title}</Text>
                <View style={styles.approvalBox}></View>
                <Text style={styles.approvalNameLine}>({safeText(item.signName) || '.............................................'})</Text>
                <Text style={styles.approvalLine}>Date: </Text>
                <Text style={styles.approvalRole}>{item.role}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ---------------- Page 2: GLS IT only ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageTopRow}>
          <View style={styles.logoRow}>{logoGls ? <Image src={logoGls} style={styles.logo} /> : null}</View>
          <View style={styles.metaBlock}>
            <Text>F/M-01-QM-009 Version 1.0.0</Text>
            <Text>Date: {formatDate(data.requestDate)}</Text>
            <Text>Internal Use Only</Text>
          </View>
        </View>
        <View style={[styles.frame, styles.frameFill]}>
          <HeaderSection showMeta={false} />
          
          <View style={styles.headerBlock}>
            <Text style={styles.headerText}>GLS IT only</Text>
          </View>

          {/* Row 1: Project Category */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelCol}>
              <Text style={styles.glsLabelText}>Project Category:</Text>
            </View>
            <View style={[styles.glsContentCol, { flexDirection: 'row' }]}>
              <View style={{ width: 110 }}><Checkbox label="Application" checked={(data.projectCategory || []).includes('Application')} /></View>
              <View style={{ width: 140 }}><Checkbox label="Infrastructure Service" checked={(data.projectCategory || []).includes('Infrastructure Service')} /></View>
              <View style={{ width: 110 }}><Checkbox label="Operation Service" checked={(data.projectCategory || []).includes('Operation Service')} /></View>
            </View>
          </View>

          {/* Row 2: Project Type */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelCol}>
              <Text style={styles.glsLabelText}>Project Type:</Text>
              <Text style={styles.glsLabelSub}>(ประเภทของโครงการ)</Text>
            </View>
            <View style={[styles.glsContentCol, { flexDirection: 'row' }]}>
              <View style={{ width: '42%', gap: 4 }}>
                <Checkbox label="New System" checked={(data.projectType || []).includes('New System')} />
                <Checkbox label="Infrastructure" checked={(data.projectType || []).includes('Infrastructure')} />
                <Checkbox label="Consult" subLabel="(กรณีที่IT Operationมีส่วนในการช่วยเหลือหรือให้บริการกับ Project ที่โรงพยาบาล เป็น Owner เท่านั้น)" checked={(data.projectType || []).includes('Consult')} />
              </View>
              <View style={{ width: '58%', gap: 6, paddingTop: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 80 }}><Checkbox label="Enhancement" /></View>
                  <Text style={{ fontSize: 9.6, width: 35 }}>From :</Text>
                  <View style={styles.greyInputBox}>
                     <Text style={{ fontSize: 9.6 }}>{safeText(data.enhancementFrom)}</Text>
                  </View>
                  <Text style={[styles.glsLabelSub, { width: 70, textAlign: 'right', marginLeft: 4 }]}>(Application Name)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 80 }}><Checkbox label="Roll-Out" /></View>
                  <Text style={{ fontSize: 9.6, width: 35 }}>From :</Text>
                  <View style={styles.greyInputBox}>
                     <Text style={{ fontSize: 9.6 }}>{safeText(data.rollOutFrom)}</Text>
                  </View>
                  <Text style={[styles.glsLabelSub, { width: 70, textAlign: 'right', marginLeft: 4 }]}>(Site Name)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Row 3: Impact New HIS */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelColWide}>
              <Text style={styles.glsLabelText}>Impact New HIS(B-Connect/Listed App ):</Text>
              <Text style={styles.glsLabelSub}>(กระทบต่อระบบ New HIS)</Text>
            </View>
            <View style={[styles.glsContentCol, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ width: 45 }}><Checkbox label="No" checked={safeText(data.impactNewHISB).trim().toLowerCase() === 'no'} /></View>
              <View style={{ width: 45 }}><Checkbox label="Yes" checked={safeText(data.impactNewHISB).trim().toLowerCase() === 'yes'} /></View>
              <View style={[styles.greyInputBox, { marginLeft: 6 }]}>
                 <Text style={{ fontSize: 9.6 }}>{safeText(data.impactHISBApp)}</Text>
              </View>
              <Text style={[styles.glsLabelSub, { width: 70, textAlign: 'right', marginLeft: 4 }]}>(Application Name)</Text>
            </View>
          </View>

          {/* Row 4: Impact Analysis */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelCol}>
              <Text style={styles.glsLabelText}>Impact Analysis:</Text>
              <Text style={styles.glsLabelSub}>(วิเคราะห์ผลกระทบ)</Text>
            </View>
            <View style={styles.glsContentCol}>
              <View style={[styles.greyInputBox, { minHeight: 28 }]}>
                <Text style={{ fontSize: 9.6 }}>{safeText(data.impactAnalysis)}</Text>
              </View>
            </View>
          </View>

          {/* Row 5: Interface with */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelCol}>
              <Text style={styles.glsLabelText}>Interface with:</Text>
              <Text style={styles.glsLabelSub}>(เชื่อมต่อกับโปรแกรมอื่น)</Text>
            </View>
            <View style={styles.glsContentCol}>
              <View style={[styles.greyInputBox, { minHeight: 24 }]}>
                <Text style={{ fontSize: 9.6 }}>{safeText(data.interfaceWith)}</Text>
              </View>
            </View>
          </View>

          {/* Row 6: Resource */}
          <View style={styles.glsRow}>
            <View style={styles.glsLabelCol}>
              <Text style={styles.glsLabelText}>Resource:</Text>
              <Text style={styles.glsLabelSub}>(ดำเนินการโดย)</Text>
            </View>
            <View style={[styles.glsContentCol, { flexDirection: 'row', alignItems: 'flex-start' }]}>
              <View style={{ width: '42%', gap: 4 }}>
                <Checkbox label="GLS ดำเนินการเอง" checked={(data.resources || []).includes('GLS ดำเนินการเอง')} />
                <Checkbox label="GLS จ้าง Vendor" checked={(data.resources || []).includes('GLS จ้าง Vendor')} />
              </View>
              <View style={{ width: '58%', flexDirection: 'row', alignItems: 'center', paddingTop: 14 }}>
                 <Text style={{ fontSize: 9.6, width: 55 }}>Vendor name:</Text>
                 <View style={styles.greyInputBox}>
                   <Text style={{ fontSize: 9.6 }}>{safeText(data.vendor1Name)}</Text>
                 </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTextLabel}>Project Cost (ค่าใช้จ่ายโครงการ):</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colNo]}>ลำดับ</Text>
              <Text style={[styles.tableCell, styles.colItem]}>รายการค่าใช้จ่าย</Text>
              <Text style={[styles.tableCell, styles.colQty]}>QTY</Text>
              <Text style={[styles.tableCell, styles.colCost]}>ค่าใช้จ่าย(บาท)</Text>
              <Text style={[styles.tableCell, styles.colPay, styles.tableCellLast]}>กำหนดวันชำระ</Text>
            </View>
            {(costRows.length ? costRows : [{item:'', qty:'', cost:'', paymentDate:''}]).map((row, index, arr) => (
              <View style={[styles.tableRow, index === arr.length - 1 ? styles.tableRowLast : null]} key={`cost-${index}`}>
                <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.colItem]}>{safeText(row.item)}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{safeText(row.qty)}</Text>
                <Text style={[styles.tableCell, styles.colCost]}>{safeText(row.cost)}</Text>
                <Text style={[styles.tableCell, styles.colPay, styles.tableCellLast]}>{formatDate(row.paymentDate)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.separator} />
          
          <FieldRow label="Deploy at site" value={safeText(data.deploySite)} />
          
          <View style={styles.glsApprovalRow}>
            <View style={styles.glsApprovalCard}>
              <Text style={styles.glsApprovalHeader}>Prepared by</Text>
              <View style={styles.glsApprovalBox}></View>
              <Text style={styles.glsApprovalNameLine}>({safeText(data.preparedBy) || '.................................................................'})</Text>
              <Text style={styles.glsApprovalLine}>Date:</Text>
              <Text style={styles.glsApprovalRole}>Application Lead/Manager</Text>
            </View>
            <View style={styles.glsApprovalCard}>
              <Text style={styles.glsApprovalHeader}>Approved by</Text>
              <View style={styles.glsApprovalBox}></View>
              <Text style={styles.glsApprovalNameLine}>({safeText(data.approvedBy) || '.................................................................'})</Text>
              <Text style={styles.glsApprovalLine}>Date:</Text>
              <Text style={styles.glsApprovalRole}>GLS Director</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default RequestFormPdf;