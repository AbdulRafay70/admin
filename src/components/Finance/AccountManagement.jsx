import React, { useState, useEffect } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableHead, TableRow,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    IconButton, Typography, Alert, Stack, Chip, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../utils/Api';

const ACCOUNT_TYPES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK', label: 'Bank' },
    { value: 'RECEIVABLE', label: 'Receivable' },
    { value: 'PAYABLE', label: 'Payable' },
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'INCOME', label: 'Income' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
];

const AccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        account_type: 'CASH',
        branch_id: '',
        bank_name: '',
        account_number: '',
        iban: '',
        opening_balance: '',
        opening_balance_type: 'debit'
    });

    useEffect(() => {
        fetchAccounts();
        fetchBranches();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/finance/accounts/list');
            setAccounts(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load accounts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches/');
            setBranches(res.data.results || res.data || []);
        } catch (err) {
            console.warn("Failed to load branches");
        }
    };

    const handleOpen = (acc = null) => {
        if (acc) {
            setEditMode(true);
            setSelectedId(acc.id);
            setFormData({
                name: acc.name,
                account_type: acc.account_type,
                branch_id: acc.branch_id || '', // API might not return branch_id directly, assume standard serializer
                bank_name: acc.bank_name || '',
                account_number: acc.account_number || '',
                iban: acc.iban || '',
                opening_balance: '', // Don't show opening balance on edit usually
                opening_balance_type: 'debit'
            });
        } else {
            setEditMode(false);
            setSelectedId(null);
            setFormData({
                name: '',
                account_type: 'CASH',
                branch_id: '',
                bank_name: '',
                account_number: '',
                iban: '',
                opening_balance: '',
                opening_balance_type: 'debit'
            });
        }
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setError(null);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.opening_balance) delete payload.opening_balance;

            if (editMode) {
                await api.put(`/finance/accounts/update/${selectedId}/`, payload);
            } else {
                await api.post('/finance/accounts/create', payload);
            }
            fetchAccounts();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Chart of Accounts</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Account
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Account Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Bank Details</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell>
                            </TableRow>
                        ) : accounts.map((acc) => (
                            <TableRow key={acc.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{acc.name}</TableCell>
                                <TableCell>
                                    <Chip label={acc.account_type} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    {acc.account_type === 'BANK' && (
                                        <Box fontSize="0.85rem" color="text.secondary">
                                            {acc.bank_name && <div>Bank: {acc.bank_name}</div>}
                                            {acc.account_number && <div>Acct#: {acc.account_number}</div>}
                                            {acc.iban && <div>IBAN: {acc.iban}</div>}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: acc.balance < 0 ? 'error.main' : 'success.main' }}>
                                    {Number(acc.balance).toLocaleString()}
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => handleOpen(acc)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editMode ? 'Edit Account' : 'Create New Account'}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} pt={1}>
                        <TextField
                            label="Account Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Account Type</InputLabel>
                            <Select
                                value={formData.account_type}
                                label="Account Type"
                                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                                disabled={editMode} // Usually type isn't changed after creation to preserve ledger integrity
                            >
                                {ACCOUNT_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Branch</InputLabel>
                            <Select
                                value={formData.branch_id}
                                label="Branch"
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            >
                                <MenuItem value="">All Branches</MenuItem>
                                {branches.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Bank Specific Fields */}
                        {formData.account_type === 'BANK' && (
                            <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle2" gutterBottom>Bank Details</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Bank Name"
                                        size="small"
                                        fullWidth
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    />
                                    <TextField
                                        label="Account Number"
                                        size="small"
                                        fullWidth
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    />
                                    <TextField
                                        label="IBAN"
                                        size="small"
                                        fullWidth
                                        value={formData.iban}
                                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                    />
                                </Stack>
                            </Box>
                        )}

                        {/* Opening Balance (Only on Create) */}
                        {!editMode && (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Opening Balance"
                                    type="number"
                                    fullWidth
                                    value={formData.opening_balance}
                                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                                />
                                <FormControl sx={{ minWidth: 120 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.opening_balance_type}
                                        label="Type"
                                        onChange={(e) => setFormData({ ...formData, opening_balance_type: e.target.value })}
                                    >
                                        <MenuItem value="debit">Debit</MenuItem>
                                        <MenuItem value="credit">Credit</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting}
                    >
                        {submitting ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccountManagement;
