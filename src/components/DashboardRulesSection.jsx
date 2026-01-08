import React, { useState, useEffect } from 'react';
import { Card, Collapse, Badge } from 'react-bootstrap';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';

/**
 * DashboardRulesSection Component
 * Displays dashboard rules as horizontal collapsible lines
 * Each line shows rule title, clicking expands to show full details
 */
const DashboardRulesSection = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRuleId, setExpandedRuleId] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8000/api/rules/list', {
                params: {
                    page: 'dashboard',
                    language: 'en'
                }
            });
            setRules(response.data.rules || []);
        } catch (err) {
            console.error('Error fetching dashboard rules:', err);
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

    const toggleRule = (ruleId) => {
        setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
    };

    if (loading || rules.length === 0) {
        return null; // Don't show anything if loading or no rules
    }

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex align-items-center">
                    <FileText size={20} className="me-2" />
                    <h5 className="mb-0">Important Policies & Rules</h5>
                    <Badge bg="light" text="dark" className="ms-2">{rules.length}</Badge>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                {rules.map((rule, index) => (
                    <div key={rule.id}>
                        <div
                            className="d-flex align-items-center justify-content-between p-3 border-bottom"
                            style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                backgroundColor: expandedRuleId === rule.id ? '#f8f9fa' : 'transparent'
                            }}
                            onClick={() => toggleRule(rule.id)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => {
                                if (expandedRuleId !== rule.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <div className="d-flex align-items-center flex-grow-1">
                                {expandedRuleId === rule.id ? (
                                    <ChevronDown size={18} className="me-2 text-primary" />
                                ) : (
                                    <ChevronRight size={18} className="me-2 text-muted" />
                                )}
                                <div className="flex-grow-1">
                                    <h6 className="mb-0 fw-bold">{rule.title}</h6>
                                </div>
                                <Badge bg={getRuleTypeColor(rule.rule_type)} className="ms-2">
                                    {getRuleTypeLabel(rule.rule_type)}
                                </Badge>
                            </div>
                        </div>

                        <Collapse in={expandedRuleId === rule.id}>
                            <div className="px-4 py-3 bg-light border-bottom">
                                <div
                                    className="text-muted"
                                    style={{
                                        whiteSpace: 'pre-line',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {rule.description}
                                </div>
                                {rule.version && (
                                    <small className="text-muted d-block mt-3">
                                        Version {rule.version} • Last updated: {new Date(rule.updated_at).toLocaleDateString()}
                                    </small>
                                )}
                            </div>
                        </Collapse>
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
};

export default DashboardRulesSection;
