import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Chip,
    Button
} from '@mui/material';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/Api';
import { formatCurrency } from '../../utils/formatCurrency'; // Assuming this exists or define inline

const BalanceSheet = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            const orgData = localStorage.getItem("selectedOrganization");
            const orgId = orgData ? JSON.parse(orgData).id : null;

            const response = await api.get('/finance/balance-sheet', {
                params: { organization: orgId }
            });
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching balance sheet:", err);
            setError("Failed to load Balance Sheet. " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const SectionTable = ({ title, accounts, total, color = "primary" }) => (
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
                <Typography variant="h6">{title}</Typography>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Account Name</TableCell>
                            <TableCell align="right">Balance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {accounts.map((acc, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">{acc.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">{acc.type} {acc.bank_details ? `via ${acc.bank_details}` : ''}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    {formatCurrency(acc.balance)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {accounts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No accounts found in this category
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell><Typography fontWeight="bold">Total {title}</Typography></TableCell>
                            <TableCell align="right"><Typography fontWeight="bold">{formatCurrency(total)}</Typography></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );

    if (loading) return <Box p={4} textAlign="center">Loading Balance Sheet...</Box>;
    if (error) return <Box p={4} textAlign="center" color="error.main">{error}</Box>;
    if (!data) return null;

    const isBalanced = data.summary.is_balanced;

    return (
        <Box p={3}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" gutterBottom>Balance Sheet</Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        As of {data.date} for {data.organization}
                    </Typography>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                    <Chip
                        icon={isBalanced ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        label={isBalanced ? "Balanced" : "Unbalanced"}
                        color={isBalanced ? "success" : "error"}
                        variant="outlined"
                        sx={{ px: 1 }}
                    />
                    <Button
                        startIcon={<RefreshCw size={16} />}
                        variant="outlined"
                        onClick={fetchBalanceSheet}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Assets */}
                <Grid item xs={12} md={6}>
                    <SectionTable
                        title="Assets"
                        accounts={data.assets.accounts}
                        total={data.assets.total}
                        color="primary"
                    />
                </Grid>

                {/* Right Column: Liabilities & Equity */}
                <Grid item xs={12} md={6}>
                    <SectionTable
                        title="Liabilities"
                        accounts={data.liabilities.accounts}
                        total={data.liabilities.total}
                        color="error"
                    />

                    {/* Retained Earnings Injection */}
                    <SectionTable
                        title="Equity"
                        accounts={[
                            ...data.equity.accounts,
                            {
                                name: "Retained Earnings (Net Income)",
                                type: "Calculated",
                                balance: data.equity.retained_earnings
                            }
                        ]}
                        total={data.equity.total}
                        color="info"
                    />

                    <Card variant="outlined" sx={{ mt: 2, bgcolor: isBalanced ? 'success.light' : 'warning.light' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontWeight="bold" color="white">Total Liabilities & Equity</Typography>
                                <Typography fontWeight="bold" color="white">
                                    {formatCurrency(data.summary.total_liabilities_and_equity)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BalanceSheet;
