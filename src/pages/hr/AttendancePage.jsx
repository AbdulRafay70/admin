import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Tabs, Tab, Badge } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import HRTabs from '../../components/HRTabs';
import api from './api';
import { ToastProvider, useToast } from './components/ToastProvider';
import { EmployeeProvider, useEmployees } from './components/EmployeeContext';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const AttendanceInner = ({ embedded = false }) => {
  const [records, setRecords] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10)); // Default to today
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch all employees
        const empResp = await api.get('/hr/employees/');
        const allEmps = Array.isArray(empResp.data) ? empResp.data : empResp.data.results || [];
        setAllEmployees(allEmps);

        // Build attendance query params
        let params = '';
        if (dateRangeStart && dateRangeEnd) {
          params = `?start_date=${dateRangeStart}&end_date=${dateRangeEnd}`;
        } else if (dateFilter) {
          params = `?date=${dateFilter}`;
        }

        // Fetch attendance records
        const resp = await api.get(`/hr/attendance/${params}`);
        let atts = Array.isArray(resp.data) ? resp.data : resp.data.results || [];

        // Create attendance map keyed by employee ID + date
        const attendanceMap = {};
        atts.forEach(att => {
          const key = `${att.employee}_${att.date}`;
          attendanceMap[key] = att;
        });

        // Determine which dates to show
        let datesToShow = [];
        if (dateRangeStart && dateRangeEnd) {
          const start = new Date(dateRangeStart);
          const end = new Date(dateRangeEnd);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            datesToShow.push(d.toISOString().slice(0, 10));
          }
        } else {
          datesToShow = [dateFilter];
        }

        // Merge employees with attendance - create a record for each employee+date combination
        const mergedRecords = [];
        allEmps.forEach(emp => {
          datesToShow.forEach(date => {
            const key = `${emp.id}_${date}`;
            if (attendanceMap[key]) {
              mergedRecords.push(attendanceMap[key]);
            } else {
              // Employee has no attendance for this date - mark as absent
              mergedRecords.push({
                id: `absent_${emp.id}_${date}`,
                employee: emp.id,
                employee_name: emp.name,
                date: date,
                check_in: null,
                check_out: null,
                working_hours: null,
                status: 'absent',
                notes: 'No attendance record'
              });
            }
          });
        });

        setRecords(mergedRecords);
      } catch (e) {
        console.warn('Attendance fetch failed', e?.message);
        toast('danger', 'Attendance fetch failed', e?.message || '');
      }
    };
    fetch();
  }, [dateFilter, dateRangeStart, dateRangeEnd]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (query) {
        const empName = r.employee_name || '';
        const empId = String(r.employee || '');
        const search = query.toLowerCase();
        if (!empName.toLowerCase().includes(search) && !empId.includes(search)) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      return true;
    });
  }, [records, query, statusFilter, dateFilter]);

  const resetFilters = () => { 
    setQuery(''); 
    setStatusFilter(''); 
    setDateFilter(new Date().toISOString().slice(0, 10)); // Reset to today
  };

  const exportPDF = () => {
    toast('info', 'Export', 'PDF export functionality coming soon');
    // TODO: Implement PDF export
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'on_time': { bg: 'success', text: 'On Time' },
      'grace': { bg: 'warning', text: 'Grace' },
      'late': { bg: 'danger', text: 'Late' },
      'present': { bg: 'info', text: 'Present' },
      'absent': { bg: 'secondary', text: 'Absent' },
      'half_day': { bg: 'warning', text: 'Half Day' }
    };
    const s = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={s.bg}>{s.text}</Badge>;
  };

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location?.pathname || '';

  const routeToKey = (pathname) => {
    if (pathname.startsWith('/hr/employees')) return 'employees';
    if (pathname.startsWith('/hr/attendance')) return 'attendance';
    if (pathname.startsWith('/hr/movements')) return 'movements';
    if (pathname.startsWith('/hr/commissions')) return 'commissions';
    if (pathname.startsWith('/hr/punctuality')) return 'punctuality';
    if (pathname.startsWith('/hr/approvals')) return 'approvals';
    return 'dashboard';
  };

  const [localKey, setLocalKey] = React.useState(routeToKey(location.pathname));
  React.useEffect(()=>{ setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  const todayRecords = records.filter(r => r.date === new Date().toISOString().slice(0, 10));
  const presentToday = todayRecords.filter(r => ['on_time', 'grace', 'present'].includes(r.status)).length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  const absentToday = todayRecords.filter(r => r.status === 'absent').length;

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Attendance</div>
          <div className="subtitle">View employee attendance status — on time, grace, late, present, or absent</div>
        </div>
        <div className="hr-actions">
          <Button className="btn-ghost" onClick={resetFilters}>Reset</Button>
          <Button className="btn-primary" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      <div className="hr-cards">
        <div className="hr-card">
          <h4>Present Today</h4>
          <p>{presentToday}</p>
        </div>
        <div className="hr-card">
          <h4>Late Today</h4>
          <p>{lateToday}</p>
        </div>
        <div className="hr-card">
          <h4>Absent Today</h4>
          <p>{absentToday}</p>
        </div>
        <div className="hr-card">
          <h4>Total Records</h4>
          <p>{todayRecords.length}</p>
        </div>
      </div>

      <div className="hr-panel">
        <div className="hr-filters mb-3">
          <InputGroup style={{ maxWidth: 300 }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control placeholder="Search by employee name or ID" value={query} onChange={e => setQuery(e.target.value)} />
          </InputGroup>

          <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 150 }}>
            <option value="">All Status</option>
            <option value="on_time">On Time</option>
            <option value="grace">Grace Period</option>
            <option value="late">Late</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half Day</option>
          </Form.Select>

          <Form.Control 
            type="date" 
            value={dateFilter} 
            onChange={e => {
              setDateFilter(e.target.value);
              setDateRangeStart('');
              setDateRangeEnd('');
            }} 
            style={{ maxWidth: 160 }}
            placeholder="Single Date" 
          />

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Form.Control 
              type="date" 
              value={dateRangeStart} 
              onChange={e => {
                setDateRangeStart(e.target.value);
                if (e.target.value) setDateFilter('');
              }} 
              style={{ minWidth: 160 }}
              placeholder="Start Date" 
            />
            <span style={{ color: '#666' }}>to</span>
            <Form.Control 
              type="date" 
              value={dateRangeEnd} 
              onChange={e => {
                setDateRangeEnd(e.target.value);
                if (e.target.value) setDateFilter('');
              }} 
              style={{ minWidth: 160 }}
              placeholder="End Date" 
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="hr-empty">No attendance records found for the selected filters.</div>
        ) : (
          <Table className="hr-table" responsive hover>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.employee_name || `Employee #${r.employee}`}</td>
                  <td>{r.date}</td>
                  <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>{r.working_hours ? r.working_hours : '-'}</td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td className="text-muted small">{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="py-4">
          <HRTabs activeName="Attendance" />
          {content}
        </Container>
      </div>
    </div>
  );
};

const AttendancePage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <AttendanceInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default AttendancePage;
