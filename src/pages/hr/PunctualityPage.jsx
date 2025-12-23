import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Table, Tabs, Tab, ProgressBar, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HRTabs from '../../components/HRTabs';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';

// --- Icons ---
const Icons = {
  Users: () => <i className="bi bi-people"></i>,
  Clock: () => <i className="bi bi-clock"></i>,
  Alert: () => <i className="bi bi-exclamation-octagon"></i>,
  Check: () => <i className="bi bi-check-circle"></i>,
  ChevronDown: () => <i className="bi bi-chevron-down"></i>,
  ChevronUp: () => <i className="bi bi-chevron-up"></i>,
  Filter: () => <i className="bi bi-sliders"></i>,
  Refresh: () => <i className="bi bi-arrow-repeat"></i>,
  Calendar: () => <i className="bi bi-calendar4"></i>,
  TrendUp: () => <i className="bi bi-graph-up-arrow"></i>
};

// --- Modern Components ---

const MetricCard = ({ label, value, subtext, icon, activeColor }) => (
  <div className="metric-card">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {subtext && <div className="metric-subtext">{subtext}</div>}
      </div>
      <div className={`metric-icon text-${activeColor}`}>
        {icon}
      </div>
    </div>
    <div className={`metric-bar bg-${activeColor}`}></div>
  </div>
);

const StatusDot = ({ color, label }) => (
  <span className="d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill status-pill">
    <span className={`status-dot bg-${color}`}></span>
    <span className={`status-text text-${color}`}>{label}</span>
  </span>
);

const InnerPunctuality = ({ embedded = false }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const { show: toast } = useToast();
  const [employeeFilter, setEmployeeFilter] = useState('');
  
  // Default to last 30 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const empResp = await api.get('/hr/employees/');
      const emps = Array.isArray(empResp.data) ? empResp.data : empResp.data.results || [];
      setAllEmployees(emps);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const resp = await api.get(`/hr/attendance/?${params.toString()}`);
      const recs = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
      setAttendanceRecords(recs);
    } catch (e) {
      console.error('Punctuality fetch failed', e?.message);
      toast('danger', 'Fetch failed', 'Could not load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [startDate, endDate]);

  // Analytics Logic with improved date handling
  const analytics = useMemo(() => {
    const stats = {};
    allEmployees.forEach(emp => {
      stats[emp.id] = { employee: emp, totalDays: 0, late: 0, onTime: 0, grace: 0, absent: 0, earlyLeave: 0, violations: [] };
    });

    // Parse dates properly
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const totalDaysInRange = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const employeePresenceDates = {};
    
    // Filter attendance records by date range
    const filteredRecords = attendanceRecords.filter(rec => {
      const recDate = new Date(rec.date + 'T00:00:00');
      return recDate >= start && recDate <= end;
    });
    
    filteredRecords.forEach(rec => {
      const empId = rec.employee;
      if (!stats[empId]) return;
      stats[empId].totalDays++;
      if (!employeePresenceDates[empId]) employeePresenceDates[empId] = new Set();
      employeePresenceDates[empId].add(rec.date);

      if (rec.status === 'late') {
        stats[empId].late++;
        const checkInTime = rec.check_in ? new Date(rec.check_in).toTimeString().slice(0, 5) : '-';
        stats[empId].violations.push({ date: rec.date, type: 'Late', time: checkInTime, color: 'danger' });
      } else if (rec.status === 'on_time') {
        stats[empId].onTime++;
      } else if (rec.status === 'grace') {
        stats[empId].grace++;
        const checkInTime = rec.check_in ? new Date(rec.check_in).toTimeString().slice(0, 5) : '-';
        stats[empId].violations.push({ date: rec.date, type: 'Grace', time: checkInTime, color: 'warning' });
      }

      // Check for early leave
      if (rec.check_in && rec.check_out && stats[empId].employee.check_out_time) {
          const checkOutTime = new Date(rec.check_out).toTimeString().slice(0, 5);
          if (checkOutTime < stats[empId].employee.check_out_time) {
            stats[empId].earlyLeave++;
            stats[empId].violations.push({ date: rec.date, type: 'Early Out', time: checkOutTime, color: 'info' });
          }
      }
    });

    // Calculate absent days within the date range
    allEmployees.forEach(emp => {
      const presentDays = employeePresenceDates[emp.id] ? employeePresenceDates[emp.id].size : 0;
      const absentDays = Math.max(0, totalDaysInRange - presentDays);
      stats[emp.id].absent = absentDays;
      
      // Add individual absent dates (limit to reasonable number for performance)
      if (absentDays > 0 && absentDays <= 30) {
        const presentDatesSet = employeePresenceDates[emp.id] || new Set();
        const currentDate = new Date(start);
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().slice(0, 10);
          if (!presentDatesSet.has(dateStr)) {
            stats[emp.id].violations.push({ date: dateStr, type: 'Absent', time: '-', color: 'dark' });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    // Sort violations by date (newest first)
    Object.values(stats).forEach(stat => stat.violations.sort((a,b) => new Date(b.date) - new Date(a.date)));
    
    // Apply employee filter
    return Object.values(stats).filter(s => employeeFilter ? s.employee.id === Number(employeeFilter) : true);
  }, [attendanceRecords, allEmployees, employeeFilter, startDate, endDate]);

  const sortedAnalytics = useMemo(() => {
    return [...analytics].sort((a, b) => (b.late + b.absent) - (a.late + a.absent));
  }, [analytics]);

  const resetFilters = () => {
    setEmployeeFilter('');
    setStartDate(getDefaultStartDate());
    setEndDate(new Date().toISOString().slice(0, 10));
  };

  const getPunctualityScore = (stat) => {
    const totalWorkDays = stat.totalDays + stat.absent;
    if (totalWorkDays === 0) return 100;
    
    // Calculate weighted penalties
    const latePenalty = stat.late * 3;        // 3 points per late arrival
    const absentPenalty = stat.absent * 5;    // 5 points per absence (more severe)
    const gracePenalty = stat.grace * 1;      // 1 point per grace period usage
    const earlyPenalty = stat.earlyLeave * 2; // 2 points per early leave
    
    const totalPenalty = latePenalty + absentPenalty + gracePenalty + earlyPenalty;
    const maxPossiblePenalty = totalWorkDays * 5; // Maximum possible penalty
    
    // Calculate score as percentage (100% = perfect, 0% = all days violated)
    const score = Math.max(0, Math.min(100, 100 - (totalPenalty / maxPossiblePenalty * 100)));
    return Math.round(score);
  };

  const navigate = useNavigate();
  const [localKey, setLocalKey] = useState('punctuality');

  // --- Styles Injection ---
  const styles = `
    :root {
        --hr-primary: #4f46e5; /* Indigo 600 */
        --hr-bg: #f8fafc; /* Slate 50 */
        --hr-card-bg: #ffffff;
        --hr-border: #e2e8f0;
        --hr-text-main: #0f172a;
        --hr-text-sub: #64748b;
    }
    
    .hr-dashboard-root {
        background-color: var(--hr-bg);
        min-height: 100vh;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .metric-card {
        background: var(--hr-card-bg);
        border: 1px solid var(--hr-border);
        border-radius: 8px;
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
        height: 100%;
        transition: transform 0.2s;
    }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .metric-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hr-text-sub); font-weight: 600; margin-bottom: 0.5rem; }
    .metric-value { font-size: 1.875rem; font-weight: 700; color: var(--hr-text-main); line-height: 1; }
    .metric-subtext { font-size: 0.8rem; color: var(--hr-text-sub); margin-top: 0.5rem; }
    .metric-icon { font-size: 1.5rem; opacity: 0.8; }
    .metric-bar { height: 4px; width: 100%; position: absolute; bottom: 0; left: 0; opacity: 0.5; }

    .control-bar {
        background: var(--hr-card-bg);
        border: 1px solid var(--hr-border);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .modern-table-card {
        background: var(--hr-card-bg);
        border: 1px solid var(--hr-border);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .modern-table th {
        background-color: #f1f5f9;
        color: var(--hr-text-sub);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: none;
        padding: 1rem 1.5rem;
    }
    .modern-table td {
        padding: 1rem 1.5rem;
        vertical-align: middle;
        border-bottom: 1px solid var(--hr-border);
        color: var(--hr-text-main);
        font-size: 0.9rem;
    }
    .modern-table tr:last-child td { border-bottom: none; }
    
    .status-pill { background: #f1f5f9; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 600; }
    .status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; }
    .status-text { margin-left: 2px; }

    .user-avatar {
        width: 32px; height: 32px;
        background: var(--hr-primary);
        color: white;
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 0.8rem;
    }
    
    .btn-modern {
        background: white; border: 1px solid var(--hr-border);
        color: var(--hr-text-main); font-weight: 500; font-size: 0.9rem;
        padding: 0.5rem 1rem; border-radius: 6px;
    }
    .btn-modern:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-primary-modern {
        background: var(--hr-primary); border: 1px solid var(--hr-primary);
        color: white; font-weight: 500; font-size: 0.9rem;
        padding: 0.5rem 1rem; border-radius: 6px;
    }
    .btn-primary-modern:hover { background: #4338ca; }
    
    /* Custom Input Styles */
    .form-control-modern {
        border: 1px solid var(--hr-border); border-radius: 6px;
        padding: 0.5rem; font-size: 0.9rem; background: #fff;
    }
    .form-control-modern:focus { border-color: var(--hr-primary); box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1); outline: none; }
  `;

  const content = (
    <Container fluid className="p-0">
      <style>{styles}</style>

      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Punctuality Insights</h4>
          <div className="text-secondary small">Analytics & Violation Tracking</div>
        </div>
        <div className="d-flex gap-2">
            <button className="btn-modern" onClick={resetFilters}>
                <Icons.Refresh /> Reset
            </button>
            <button className="btn-primary-modern" onClick={fetch} disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : <Icons.Filter />} Update View
            </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <MetricCard 
            label="Violation Rate" 
            value={analytics.reduce((sum, s) => sum + s.late, 0)} 
            subtext="Late arrivals this period"
            icon={<Icons.Alert />}
            activeColor="danger"
          />
        </Col>
        <Col md={3}>
          <MetricCard 
            label="Grace Usage" 
            value={analytics.reduce((sum, s) => sum + s.grace, 0)} 
            subtext="Within 15m allowance"
            icon={<Icons.Clock />}
            activeColor="warning"
          />
        </Col>
        <Col md={3}>
          <MetricCard 
            label="Absenteeism" 
            value={analytics.reduce((sum, s) => sum + s.absent, 0)} 
            subtext="Unexcused absences"
            icon={<Icons.Calendar />}
            activeColor="dark"
          />
        </Col>
        <Col md={3}>
          <MetricCard 
            label="Avg Punctuality" 
            value={`${Math.round(sortedAnalytics.reduce((acc, curr) => acc + getPunctualityScore(curr), 0) / (sortedAnalytics.length || 1))}%`}
            subtext="Team average score"
            icon={<Icons.TrendUp />}
            activeColor="success"
          />
        </Col>
      </Row>

      {/* Controls */}
      <div className="control-bar mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
            <Icons.Filter className="text-secondary" />
            <select 
                className="form-control-modern" 
                style={{minWidth: '200px'}}
                value={employeeFilter}
                onChange={e => setEmployeeFilter(e.target.value)}
            >
                <option value="">All Employees</option>
                {allEmployees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
        </div>
        <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-bold">From</span>
            <input type="date" className="form-control-modern" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-bold">To</span>
            <input type="date" className="form-control-modern" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Main Table */}
      <div className="modern-table-card shadow-sm">
        {loading ? (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        ) : sortedAnalytics.length === 0 ? (
            <div className="text-center py-5 text-muted">No records found.</div>
        ) : (
            <Table responsive className="modern-table mb-0" hover>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th className="text-center">Working Days</th>
                        <th>Violations Summary</th>
                        <th>Score</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAnalytics.map(stat => {
                        const score = getPunctualityScore(stat);
                        const isExpanded = expandedRows.has(stat.employee.id);
                        return (
                            <React.Fragment key={stat.employee.id}>
                                <tr style={{backgroundColor: isExpanded ? '#f8fafc' : 'transparent'}}>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="user-avatar">
                                                {stat.employee.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="fw-bold">{stat.employee.first_name} {stat.employee.last_name}</div>
                                                <div className="small text-muted">{stat.employee.role || 'Staff'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center fw-bold text-secondary">{stat.totalDays}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            {stat.late > 0 && <StatusDot color="danger" label={`${stat.late} Late`} />}
                                            {stat.absent > 0 && <StatusDot color="dark" label={`${stat.absent} Absent`} />}
                                            {stat.grace > 0 && <StatusDot color="warning" label={`${stat.grace} Grace`} />}
                                            {stat.late === 0 && stat.absent === 0 && stat.grace === 0 && <span className="text-muted small">Perfect Record</span>}
                                        </div>
                                    </td>
                                    <td style={{width: '180px'}}>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="flex-grow-1">
                                                <ProgressBar now={score} variant={score > 90 ? 'success' : score > 70 ? 'warning' : 'danger'} style={{height: '6px'}} />
                                            </div>
                                            <span className="small fw-bold">{score}%</span>
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <button 
                                            className="btn btn-sm btn-link text-secondary text-decoration-none"
                                            onClick={() => toggleRow(stat.employee.id)}
                                            disabled={stat.violations.length === 0}
                                        >
                                            {isExpanded ? 'Hide' : 'Details'} {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                                        </button>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-light">
                                        <td colSpan={5} className="p-0">
                                            <div className="p-4 border-bottom">
                                                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Violation History</h6>
                                                <div className="row g-2">
                                                    {stat.violations.map((v, i) => (
                                                        <Col md={4} key={i}>
                                                            <div className="bg-white p-2 border rounded d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className={`text-${v.color} small fw-bold`}>{v.type}</div>
                                                                    <div className="small text-muted">{v.date}</div>
                                                                </div>
                                                                <div className="badge bg-light text-dark border">
                                                                    {v.time && v.time !== '-' ? (v.time.length > 5 ? v.time.substring(0,5) : v.time) : '--:--'}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </Table>
        )}
      </div>
    </Container>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-dashboard-root">
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column">
        <Header />
        <Container fluid className="py-4 px-4">
          <HRTabs activeName="Punctuality" />
          {content}
        </Container>
      </div>
    </div>
  );
};

const PunctualityPage = (props) => (
  <ToastProvider>
    <InnerPunctuality {...props} />
  </ToastProvider>
);

export default PunctualityPage;