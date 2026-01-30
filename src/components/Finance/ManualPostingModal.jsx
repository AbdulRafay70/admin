import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Stack,
    Tabs,
    Tab,
    Box,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    CircularProgress,
    Alert
} from '@mui/material';
// import axios from 'axios'; // Removed raw axios
import api from '../../utils/Api'; // Authenticated client
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Tab Configuration mapping to Posting Types
const POSTING_TYPES = [
    { label: 'Expense', value: 'expense' },
    { label: 'Income', value: 'income' },
    { label: 'Transfer', value: 'cash_transfer' }, // Logic handles bank_transfer switch
    { label: 'Capital In', value: 'capital_in' },
    { label: 'Capital Out', value: 'capital_out' },
    { label: 'Salary', value: 'salary' },
    { label: 'Vendor Bill', value: 'credit_purchase' },
    { label: 'Vendor Pay', value: 'vendor_payment' },
    { label: 'Adjustment', value: 'adjustment' },
    { label: 'Opening Bal', value: 'opening_balance' },
    { label: 'Journal', value: 'journal' },
];

const ManualPostingModal = ({ open, onClose, onSuccess }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Data Sources
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [branchId, setBranchId] = useState('');

    // Account Selectors (Dynamic meaning based on tab)
    const [debitAccount, setDebitAccount] = useState('');
    const [creditAccount, setCreditAccount] = useState('');

    // References
    const [referenceType, setReferenceType] = useState('');
    const [referenceId, setReferenceId] = useState('');

    // Journal Lines
    const [lines, setLines] = useState([
        { account_id: '', debit: '', credit: '', remarks: '' },
        { account_id: '', debit: '', credit: '', remarks: '' }
    ]);

    useEffect(() => {
        if (open) {
            fetchAllData();
            // Reset fields
            resetForm();
        }
    }, [open]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [accRes, brRes, empRes, orgRes] = await Promise.all([
                api.get('/finance/accounts/list'),
                api.get('/branches/'),  // Check valid endpoint
                api.get('/hr/employees/'),
                api.get('/organizations/')
            ]);

            setAccounts(accRes.data || []);
            setBranches(brRes.data.results || brRes.data || []);
            setEmployees(empRes.data.results || empRes.data || []);
            setOrganizations(orgRes.data.results || orgRes.data || []);

        } catch (err) {
            console.error("Failed to fetch data", err);
            setError("Failed to load required data. Please check network.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setAmount('');
        setDebitAccount('');
        setCreditAccount('');
        setReferenceId('');
        setReferenceType('');
        setLines([{ account_id: '', debit: '', credit: '', remarks: '' }, { account_id: '', debit: '', credit: '', remarks: '' }]);
        setError(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
        resetForm(); // Clear form when switching types to avoid type mismatch
    };

    // Helper to get current posting type
    const getCurrentType = () => POSTING_TYPES[tabIndex].value;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const type = getCurrentType();
            // Get organization context
            const orgData = localStorage.getItem("selectedOrganization");
            const organizationId = orgData ? JSON.parse(orgData).id : null;

            let payload = {
                date,
                description,
                branch_id: branchId || null,
                organization: organizationId,
                posting_type: type,
                reference_type: referenceType || null,
                reference_id: referenceId ? parseInt(referenceId) : null
            };

            // Multi-line types
            if (['journal', 'adjustment', 'opening_balance', 'ledger_adjustment'].includes(type)) {
                // Validate balance
                const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
                const totalCr = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
                if (Math.abs(totalDr - totalCr) > 0.01) {
                    throw new Error(`Entry is unbalanced! Dr: ${totalDr}, Cr: ${totalCr}`);
                }
                payload.lines = lines.map(l => ({
                    ...l,
                    debit: l.debit || 0,
                    credit: l.credit || 0
                }));
            } else {
                // Single Amount Types
                if (!amount || parseFloat(amount) <= 0) throw new Error("Valid amount is required");
                payload.amount = amount;

                // Map Debit/Credit accounts based on type
                // Logic MUST match backend `manual_posting` expectations
                // UI shows logical labels (e.g. "Paid From"), payload maps to dr/cr_account

                // Default Mapping
                payload.debit_account = debitAccount;
                payload.credit_account = creditAccount;

                // Specific Overrides or Checks (Already handled by binding UI fields to debit/credit states)
                // Just ensuring we send what backend expects.
                if (type === 'cash_transfer' || type === 'bank_transfer') {
                    // In backend: credit_account is FROM, debit_account is TO
                    // UI Labels: From -> creditAccount, To -> debitAccount
                }
            }

            // Auto-set reference type if special type
            if (type === 'salary') payload.reference_type = 'employee';
            if (type === 'vendor_payment' || type === 'credit_purchase') payload.reference_type = 'vendor';

            await api.post('/finance/manual/post', payload);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Journal Helpers
    const updateLine = (idx, field, val) => {
        const newLines = [...lines];
        newLines[idx][field] = val;
        setLines(newLines);
    };
    const addLine = () => setLines([...lines, { account_id: '', debit: '', credit: '', remarks: '' }]);
    const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

    // Dynamic Labels based on Tab
    const getLabels = () => {
        const type = getCurrentType();
        switch (type) {
            case 'expense': return { dr: 'Expense Account', cr: 'Paid From (Asset)' };
            case 'income': return { dr: 'Deposit Into (Asset)', cr: 'Income Account' };
            case 'cash_transfer': return { dr: 'To Account (Receiver)', cr: 'From Account (Sender)' };
            case 'capital_in': return { dr: 'Asset Account (Received)', cr: 'Equity Account' };
            case 'capital_out': return { dr: 'Drawings Account', cr: 'Asset Account (Paid)' };
            case 'salary': return { dr: 'Salary Expense Account', cr: 'Paid From (Asset)' };
            case 'credit_purchase': return { dr: 'Expense/Purchase Account', cr: 'Vendor Payable Account' };
            case 'vendor_payment': return { dr: 'Vendor Payable Account', cr: 'Paid From (Asset)' };
            default: return { dr: 'Debit Account', cr: 'Credit Account' };
        }
    };

    const isJournalMode = ['journal', 'adjustment', 'opening_balance'].includes(getCurrentType());
    const labels = getLabels();
    const type = getCurrentType();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    Manual Posting / Journal Entry
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

                {!loading && (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs
                                value={tabIndex}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {POSTING_TYPES.map((t, i) => (
                                    <Tab key={t.value} label={t.label} />
                                ))}
                            </Tabs>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Stack spacing={2} sx={{ mt: 2 }}>
                            {/* Common Header Fields */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ width: 200 }}
                                />
                                <TextField
                                    label="Description / Narration"
                                    fullWidth
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <TextField
                                    select
                                    label="Branch"
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    sx={{ width: 200 }}
                                >
                                    {branches.map(b => (
                                        <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Stack>

                            {/* --- JOURNAL MODE UI --- */}
                            {isJournalMode ? (
                                <Box>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width="35%">Account</TableCell>
                                                <TableCell width="25%">Remarks</TableCell>
                                                <TableCell width="15%">Debit</TableCell>
                                                <TableCell width="15%">Credit</TableCell>
                                                <TableCell width="5%"></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {lines.map((line, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Select
                                                            fullWidth
                                                            size="small"
                                                            value={line.account_id}
                                                            onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="" disabled>Select Account</MenuItem>
                                                            {accounts.map(acc => (
                                                                <MenuItem key={acc.id} value={acc.id}>
                                                                    {acc.name} ({acc.account_type}) - Balance: {acc.balance}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth size="small"
                                                            value={line.remarks}
                                                            onChange={(e) => updateLine(idx, 'remarks', e.target.value)}
                                                            placeholder={description}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number" fullWidth size="small"
                                                            value={line.debit}
                                                            onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number" fullWidth size="small"
                                                            value={line.credit}
                                                            onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton color="error" size="small" onClick={() => removeLine(idx)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }}>Add Line</Button>

                                    <Typography align="right" variant="subtitle2" sx={{ mt: 2 }}>
                                        Total Dr: {lines.reduce((s, l) => s + Number(l.debit || 0), 0).toFixed(2)} |
                                        Total Cr: {lines.reduce((s, l) => s + Number(l.credit || 0), 0).toFixed(2)}
                                    </Typography>
                                </Box>
                            ) : (
                                /* --- DIRECT POSTING MODE UI --- */
                                <Stack spacing={2}>
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        fullWidth
                                    />

                                    <Stack direction="row" spacing={2}>
                                        {/* Dr Account */}
                                        <FormControl fullWidth>
                                            <InputLabel>{labels.dr}</InputLabel>
                                            <Select
                                                value={debitAccount}
                                                label={labels.dr}
                                                onChange={(e) => setDebitAccount(e.target.value)}
                                            >
                                                {accounts.map(acc => (
                                                    <MenuItem key={acc.id} value={acc.id}>
                                                        {acc.name} ({acc.account_type})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Cr Account */}
                                        <FormControl fullWidth>
                                            <InputLabel>{labels.cr}</InputLabel>
                                            <Select
                                                value={creditAccount}
                                                label={labels.cr}
                                                onChange={(e) => setCreditAccount(e.target.value)}
                                            >
                                                {accounts.map(acc => (
                                                    <MenuItem key={acc.id} value={acc.id}>
                                                        {acc.name} ({acc.account_type})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    {/* --- DYNAMIC SELECTORS --- */}
                                    {type === 'salary' && (
                                        <FormControl fullWidth>
                                            <InputLabel>Employee</InputLabel>
                                            <Select
                                                value={referenceId}
                                                label="Employee"
                                                onChange={(e) => setReferenceId(e.target.value)}
                                            >
                                                {employees.map(emp => (
                                                    <MenuItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {(type === 'vendor_payment' || type === 'credit_purchase') && (
                                        <FormControl fullWidth>
                                            <InputLabel>Vendor / Organization</InputLabel>
                                            <Select
                                                value={referenceId}
                                                label="Vendor / Organization"
                                                onChange={(e) => setReferenceId(e.target.value)}
                                            >
                                                {organizations.map(org => (
                                                    <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || submitting}
                >
                    {submitting ? 'Processing...' : 'Post Entry'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManualPostingModal;
