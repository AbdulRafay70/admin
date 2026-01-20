import React, { useEffect, useState, useMemo } from 'react';
import { Container, Table, Button, Form, Badge } from 'react-bootstrap';
import { Search, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PartnersTabs from '../../components/PartnersTabs';
import axios from 'axios';
import AdminFooter from '../../components/AdminFooter';

const CommissionEarnings = () => {
    const [commissions, setCommissions] = useState([]);
    const [branches, setBranches] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const getAccessToken = () => localStorage.getItem('accessToken');

    const getAxiosInstance = () => {
        const token = getAccessToken();
        return axios.create({
            baseURL: 'https://b2bapi.saer.pk/api/',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const axiosInstance = getAxiosInstance();
            const [commissionsRes, branchesRes, agenciesRes] = await Promise.all([
                axiosInstance.get('commissions/earnings/'),
                axiosInstance.get('branches/'),
                axiosInstance.get('agencies/'),
            ]);

            setCommissions(commissionsRes.data || []);
            setBranches(branchesRes.data || []);
            setAgencies(agenciesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const getBranchName = (branchId) => {
        const branch = branches.find((b) => b.id === branchId);
        return branch ? branch.name : `Branch ID: ${branchId}`;
    };

    const getAgencyName = (agencyId) => {
        const agency = agencies.find((a) => a.id === agencyId);
        return agency ? agency.name : `Agency ID: ${agencyId}`;
    };

    const filteredCommissions = useMemo(() => {
        return commissions.filter((c) => {
            const matchesSearch =
                !searchQuery ||
                c.booking_id?.toString().includes(searchQuery) ||
                c.earned_by_id?.toString().includes(searchQuery);

            const matchesStatus = !statusFilter || c.status === statusFilter;
            const matchesType = !typeFilter || c.earned_by_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [commissions, searchQuery, statusFilter, typeFilter]);

    const paginatedCommissions = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredCommissions.slice(startIndex, startIndex + perPage);
    }, [filteredCommissions, currentPage]);

    const totalPages = Math.ceil(filteredCommissions.length / perPage);

    const getTotalEarned = () =>
        filteredCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);
    const getTotalPending = () =>
        filteredCommissions
            .filter((c) => c.status === 'pending')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);
    const getTotalEarnedStatus = () =>
        filteredCommissions
            .filter((c) => c.status === 'earned')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);
    const getTotalPaid = () =>
        filteredCommissions
            .filter((c) => c.status === 'paid')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);

    const getStatusBadge = (status) => {
        const labels = {
            pending: 'Pending',
            earned: 'Earned',
            paid: 'Paid',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    const getTypeBadge = (type) => {
        const labels = {
            branch: 'Branch',
            area_agent: 'Area Agent',
            employee: 'Employee',
        };
        return labels[type] || type;
    };

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1" style={{ backgroundColor: '#F9FAFB' }}>
                <Header />
                <Container fluid className="px-4 py-4">
                    <PartnersTabs activeName="Commission Earnings" />

                    <div className="mt-4 mb-4">
                        <h3 className="fw-bold mb-1" style={{ color: '#111827' }}>
                            Commission Earnings
                        </h3>
                        <p className="text-muted mb-0">
                            Track and manage commission earnings across branches, agencies, and employees
                        </p>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    background: 'linear-gradient(135deg, #1476D1 0%, #0D5AB8 100%)',
                                    borderRadius: '1rem',
                                }}
                            >
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <div
                                            className="rounded-circle p-2 me-3"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        >
                                            <TrendingUp size={24} color="white" />
                                        </div>
                                        <h6 className="text-white mb-0 opacity-75">Total Earned</h6>
                                    </div>
                                    <h2 className="text-white fw-bold mb-0">
                                        Rs. {getTotalEarned().toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    background: 'linear-gradient(135deg, #1476D1 0%, #1E88E5 100%)',
                                    borderRadius: '1rem',
                                }}
                            >
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <div
                                            className="rounded-circle p-2 me-3"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        >
                                            <Clock size={24} color="white" />
                                        </div>
                                        <h6 className="text-white mb-0 opacity-75">Pending</h6>
                                    </div>
                                    <h2 className="text-white fw-bold mb-0">
                                        Rs. {getTotalPending().toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    background: 'linear-gradient(135deg, #1476D1 0%, #42A5F5 100%)',
                                    borderRadius: '1rem',
                                }}
                            >
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <div
                                            className="rounded-circle p-2 me-3"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        >
                                            <DollarSign size={24} color="white" />
                                        </div>
                                        <h6 className="text-white mb-0 opacity-75">Earned</h6>
                                    </div>
                                    <h2 className="text-white fw-bold mb-0">
                                        Rs. {getTotalEarnedStatus().toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    background: 'linear-gradient(135deg, #1476D1 0%, #1565C0 100%)',
                                    borderRadius: '1rem',
                                }}
                            >
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <div
                                            className="rounded-circle p-2 me-3"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        >
                                            <CheckCircle size={24} color="white" />
                                        </div>
                                        <h6 className="text-white mb-0 opacity-75">Paid</h6>
                                    </div>
                                    <h2 className="text-white fw-bold mb-0">
                                        Rs. {getTotalPaid().toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
                        <div className="card-body p-4">
                            <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
                                <div className="input-group" style={{ maxWidth: '320px' }}>
                                    <span className="input-group-text bg-white border-end-0">
                                        <Search size={18} className="text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="Search by booking ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ borderRadius: '0 0.5rem 0.5rem 0' }}
                                    />
                                </div>

                                <Form.Select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    style={{ maxWidth: '180px', borderRadius: '0.5rem' }}
                                    className="border"
                                >
                                    <option value="">All Types</option>
                                    <option value="branch">Branch</option>
                                    <option value="area_agent">Area Agent</option>
                                    <option value="employee">Employee</option>
                                </Form.Select>

                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ maxWidth: '180px', borderRadius: '0.5rem' }}
                                    className="border"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="earned">Earned</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                </Form.Select>

                                {(searchQuery || typeFilter || statusFilter) && (
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setTypeFilter('');
                                            setStatusFilter('');
                                        }}
                                        style={{ borderRadius: '0.5rem' }}
                                    >
                                        Reset
                                    </Button>
                                )}

                                <div className="ms-auto text-muted small">
                                    <strong>{filteredCommissions.length}</strong> commissions found
                                </div>
                            </div>

                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                                        <tr>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                #
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Booking
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Type
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Earned By
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Amount
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Status
                                            </th>
                                            <th className="border-0 py-3" style={{ color: '#6B7280', fontWeight: '600' }}>
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedCommissions.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <div className="text-muted">
                                                        <TrendingUp size={48} className="mb-3 opacity-25" />
                                                        <p className="mb-0">No commissions found</p>
                                                        <small>Commissions will appear here once bookings are created</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedCommissions.map((commission, index) => (
                                                <tr key={commission.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                    <td className="py-3">
                                                        <span className="text-muted">{(currentPage - 1) * perPage + index + 1}</span>
                                                    </td>
                                                    <td className="py-3">
                                                        #{commission.booking_id || '-'}
                                                    </td>
                                                    <td className="py-3">{getTypeBadge(commission.earned_by_type)}</td>
                                                    <td className="py-3">
                                                        {commission.earned_by_type === 'branch' && getBranchName(commission.earned_by_id)}
                                                        {commission.earned_by_type === 'area_agent' && getAgencyName(commission.earned_by_id)}
                                                        {commission.earned_by_type === 'employee' && `Employee #${commission.earned_by_id}`}
                                                    </td>
                                                    <td className="py-3">
                                                        Rs. {parseFloat(commission.commission_amount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="py-3">{getStatusBadge(commission.status)}</td>
                                                    <td className="py-3 text-muted">
                                                        {new Date(commission.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4 pt-3 border-top">
                                    <nav>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    style={{ borderRadius: '0.5rem 0 0 0.5rem' }}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    style={{ borderRadius: '0 0.5rem 0.5rem 0' }}
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
                <AdminFooter />
            </div>
        </div>
    );
};

export default CommissionEarnings;
