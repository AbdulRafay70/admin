import React, { useState, useEffect } from 'react';
import { Card, Badge, Collapse } from 'react-bootstrap';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';

/**
 * HotelRulesSection Component
 * Displays hotel rules as horizontal collapsible rows
 * Each rule is a single row that expands vertically when clicked
 */
const HotelRulesSection = () => {
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
                    page: 'hotel_page',
                    language: 'en'
                }
            });
            setRules(response.data.rules || []);
        } catch (err) {
            console.error('Error fetching hotel rules:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRuleTypeColor = (ruleType) => {
        const colors = {
            'terms_and_conditions': '#2196F3',
            'cancellation_policy': '#FF9800',
            'refund_policy': '#4CAF50',
            'commission_policy': '#9C27B0',
            'transport_policy': '#607D8B',
            'document_policy': '#795548',
            'hotel_policy': '#00BCD4',
            'visa_policy': '#F44336'
        };
        return colors[ruleType] || '#9E9E9E';
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
        <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
                <div className="d-flex align-items-center">
                    <FileText size={20} className="me-2 text-primary" />
                    <h5 className="mb-0">Hotel Policies & Rules</h5>
                    <Badge bg="secondary" className="ms-2">{rules.length}</Badge>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                {rules.map((rule, index) => (
                    <div key={rule.id}>
                        {/* Horizontal Row for Each Rule */}
                        <div
                            className="d-flex align-items-center justify-content-between p-3 border-bottom"
                            style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                backgroundColor: expandedRuleId === rule.id ? '#f8f9fa' : 'transparent',
                                borderLeft: `4px solid ${getRuleTypeColor(rule.rule_type)}`
                            }}
                            onClick={() => toggleRule(rule.id)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => {
                                if (expandedRuleId !== rule.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {/* Left side: Icon and Title */}
                            <div className="d-flex align-items-center flex-grow-1">
                                {expandedRuleId === rule.id ? (
                                    <ChevronDown size={18} className="me-2 text-primary" />
                                ) : (
                                    <ChevronRight size={18} className="me-2 text-muted" />
                                )}
                                <h6 className="mb-0 fw-bold">{rule.title}</h6>
                            </div>

                            {/* Right side: Badge */}
                            <Badge
                                style={{
                                    backgroundColor: getRuleTypeColor(rule.rule_type),
                                    fontSize: '0.75rem'
                                }}
                            >
                                {getRuleTypeLabel(rule.rule_type)}
                            </Badge>
                        </div>

                        {/* Collapsible Content - Expands Vertically */}
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

export default HotelRulesSection;
