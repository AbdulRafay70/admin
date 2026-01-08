import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

/**
 * RulesDisplay Component
 * Displays rules for a specific page
 * 
 * @param {string} page - The page identifier (e.g., 'dashboard', 'hotel_page')
 * @param {string} title - Optional title for the rules section
 * @param {string} language - Language code (default: 'en')
 */
const RulesDisplay = ({ page, title = "Important Rules & Policies", language = "en" }) => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRules();
    }, [page, language]);

    const fetchRules = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('http://127.0.0.1:8000/api/rules/list', {
                params: {
                    page: page,
                    language: language
                }
            });

            console.log('Rules API Response:', response.data);
            setRules(response.data.rules || []);
        } catch (err) {
            console.error('Error fetching rules:', err);
            setError('Failed to load rules');
        } finally {
            setLoading(false);
        }
    };

    const getRuleTypeColor = (ruleType) => {
        const colors = {
            'terms_and_conditions': 'info',
            'cancellation_policy': 'warning',
            'refund_policy': 'success',
            'commission_policy': 'primary',
            'transport_policy': 'secondary',
            'document_policy': 'dark',
            'hotel_policy': 'info',
            'visa_policy': 'danger'
        };
        return colors[ruleType] || 'secondary';
    };

    const getRuleTypeLabel = (ruleType) => {
        const labels = {
            'terms_and_conditions': 'Terms & Conditions',
            'cancellation_policy': 'Cancellation Policy',
            'refund_policy': 'Refund Policy',
            'commission_policy': 'Commission Policy',
            'transport_policy': 'Transport Policy',
            'document_policy': 'Document Policy',
            'hotel_policy': 'Hotel Policy',
            'visa_policy': 'Visa Policy'
        };
        return labels[ruleType] || ruleType;
    };

    if (loading) {
        return (
            <Card className="shadow-sm">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading rules...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="d-flex align-items-center">
                <AlertCircle size={20} className="me-2" />
                {error}
            </Alert>
        );
    }

    if (rules.length === 0) {
        return (
            <Alert variant="info" className="d-flex align-items-center">
                <FileText size={20} className="me-2" />
                No rules available for this page.
            </Alert>
        );
    }

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                    <FileText size={20} className="me-2" style={{ verticalAlign: 'middle' }} />
                    {title}
                </h5>
            </Card.Header>
            <Card.Body>
                {rules.map((rule, index) => (
                    <div key={rule.id} className={`mb-4 ${index !== rules.length - 1 ? 'pb-3 border-bottom' : ''}`}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold text-dark mb-0">{rule.title}</h6>
                            <Badge bg={getRuleTypeColor(rule.rule_type)}>
                                {getRuleTypeLabel(rule.rule_type)}
                            </Badge>
                        </div>
                        <div className="text-muted small" style={{ whiteSpace: 'pre-line' }}>
                            {rule.description}
                        </div>
                        {rule.version && (
                            <small className="text-muted d-block mt-2">
                                Version {rule.version} • Last updated: {new Date(rule.updated_at).toLocaleDateString()}
                            </small>
                        )}
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
};

export default RulesDisplay;
