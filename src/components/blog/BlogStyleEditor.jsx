import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import { Palette, Type, Layout, Code, RotateCcw } from 'lucide-react';
import './blog-styling.css';

const BlogStyleEditor = ({ blogData, onStyleChange }) => {
    const [styles, setStyles] = useState({
        colors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            accent: '#e74c3c',
            background: '#ffffff',
            text: '#333333',
            link: '#3498db',
            ...blogData?.custom_styles?.colors
        },
        typography: {
            headingFont: 'Playfair Display',
            bodyFont: 'Open Sans',
            fontSize: {
                h1: '2.5rem',
                h2: '2rem',
                h3: '1.75rem',
                body: '1rem'
            },
            lineHeight: '1.6',
            fontWeight: {
                heading: '700',
                body: '400'
            },
            ...blogData?.custom_styles?.typography
        },
        layout: {
            containerWidth: '1200px',
            sectionSpacing: '3rem',
            contentAlignment: 'left',
            ...blogData?.custom_styles?.layout
        },
        customCSS: blogData?.custom_styles?.customCSS || ''
    });

    // Google Fonts list (popular fonts)
    const googleFonts = [
        'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Oswald',
        'Raleway', 'PT Sans', 'Merriweather', 'Playfair Display',
        'Poppins', 'Nunito', 'Ubuntu', 'Inter', 'Noto Sans',
        'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq' // Urdu fonts
    ];

    const handleColorChange = (colorKey, value) => {
        const newStyles = {
            ...styles,
            colors: {
                ...styles.colors,
                [colorKey]: value
            }
        };
        setStyles(newStyles);
        onStyleChange(newStyles);
    };

    const handleTypographyChange = (key, value) => {
        const newStyles = {
            ...styles,
            typography: {
                ...styles.typography,
                [key]: value
            }
        };
        setStyles(newStyles);
        onStyleChange(newStyles);
    };

    const handleFontSizeChange = (sizeKey, value) => {
        const newStyles = {
            ...styles,
            typography: {
                ...styles.typography,
                fontSize: {
                    ...styles.typography.fontSize,
                    [sizeKey]: value
                }
            }
        };
        setStyles(newStyles);
        onStyleChange(newStyles);
    };

    const handleLayoutChange = (key, value) => {
        const newStyles = {
            ...styles,
            layout: {
                ...styles.layout,
                [key]: value
            }
        };
        setStyles(newStyles);
        onStyleChange(newStyles);
    };

    const handleCustomCSSChange = (value) => {
        const newStyles = {
            ...styles,
            customCSS: value
        };
        setStyles(newStyles);
        onStyleChange(newStyles);
    };

    const resetToDefaults = () => {
        const defaultStyles = {
            colors: {
                primary: '#3498db',
                secondary: '#2ecc71',
                accent: '#e74c3c',
                background: '#ffffff',
                text: '#333333',
                link: '#3498db'
            },
            typography: {
                headingFont: 'Playfair Display',
                bodyFont: 'Open Sans',
                fontSize: {
                    h1: '2.5rem',
                    h2: '2rem',
                    h3: '1.75rem',
                    body: '1rem'
                },
                lineHeight: '1.6',
                fontWeight: {
                    heading: '700',
                    body: '400'
                }
            },
            layout: {
                containerWidth: '1200px',
                sectionSpacing: '3rem',
                contentAlignment: 'left'
            },
            customCSS: ''
        };
        setStyles(defaultStyles);
        onStyleChange(defaultStyles);
    };

    return (
        <div className="blog-style-editor">
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <Palette size={20} className="me-2" />
                        Blog Styling
                    </h5>
                    <Button variant="outline-secondary" size="sm" onClick={resetToDefaults}>
                        <RotateCcw size={16} className="me-1" />
                        Reset to Defaults
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Tabs defaultActiveKey="colors" className="mb-3">
                        {/* Colors Tab */}
                        <Tab eventKey="colors" title={<><Palette size={16} className="me-1" />Colors</>}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Primary Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                placeholder="#3498db"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Secondary Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                placeholder="#2ecc71"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Accent Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.accent}
                                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.accent}
                                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                                placeholder="#e74c3c"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Background Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.background}
                                                onChange={(e) => handleColorChange('background', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.background}
                                                onChange={(e) => handleColorChange('background', e.target.value)}
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Text Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.text}
                                                onChange={(e) => handleColorChange('text', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.text}
                                                onChange={(e) => handleColorChange('text', e.target.value)}
                                                placeholder="#333333"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Link Color</Form.Label>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="color"
                                                value={styles.colors.link}
                                                onChange={(e) => handleColorChange('link', e.target.value)}
                                                className="me-2"
                                                style={{ width: '60px', height: '40px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={styles.colors.link}
                                                onChange={(e) => handleColorChange('link', e.target.value)}
                                                placeholder="#3498db"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Tab>

                        {/* Typography Tab */}
                        <Tab eventKey="typography" title={<><Type size={16} className="me-1" />Typography</>}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Heading Font</Form.Label>
                                        <Form.Select
                                            value={styles.typography.headingFont}
                                            onChange={(e) => handleTypographyChange('headingFont', e.target.value)}
                                        >
                                            {googleFonts.map(font => (
                                                <option key={font} value={font}>{font}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Body Font</Form.Label>
                                        <Form.Select
                                            value={styles.typography.bodyFont}
                                            onChange={(e) => handleTypographyChange('bodyFont', e.target.value)}
                                        >
                                            {googleFonts.map(font => (
                                                <option key={font} value={font}>{font}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>H1 Size</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={styles.typography.fontSize.h1}
                                            onChange={(e) => handleFontSizeChange('h1', e.target.value)}
                                            placeholder="2.5rem"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>H2 Size</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={styles.typography.fontSize.h2}
                                            onChange={(e) => handleFontSizeChange('h2', e.target.value)}
                                            placeholder="2rem"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Body Size</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={styles.typography.fontSize.body}
                                            onChange={(e) => handleFontSizeChange('body', e.target.value)}
                                            placeholder="1rem"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Line Height</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={styles.typography.lineHeight}
                                            onChange={(e) => handleTypographyChange('lineHeight', e.target.value)}
                                            placeholder="1.6"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Tab>

                        {/* Layout Tab */}
                        <Tab eventKey="layout" title={<><Layout size={16} className="me-1" />Layout</>}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Container Width</Form.Label>
                                        <Form.Select
                                            value={styles.layout.containerWidth}
                                            onChange={(e) => handleLayoutChange('containerWidth', e.target.value)}
                                        >
                                            <option value="960px">Narrow (960px)</option>
                                            <option value="1200px">Medium (1200px)</option>
                                            <option value="1400px">Wide (1400px)</option>
                                            <option value="100%">Full Width</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Section Spacing</Form.Label>
                                        <Form.Select
                                            value={styles.layout.sectionSpacing}
                                            onChange={(e) => handleLayoutChange('sectionSpacing', e.target.value)}
                                        >
                                            <option value="1.5rem">Compact</option>
                                            <option value="3rem">Normal</option>
                                            <option value="5rem">Spacious</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Content Alignment</Form.Label>
                                        <Form.Select
                                            value={styles.layout.contentAlignment}
                                            onChange={(e) => handleLayoutChange('contentAlignment', e.target.value)}
                                        >
                                            <option value="left">Left</option>
                                            <option value="center">Center</option>
                                            <option value="right">Right</option>
                                            <option value="justify">Justify</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Tab>

                        {/* Custom CSS Tab */}
                        <Tab eventKey="customCSS" title={<><Code size={16} className="me-1" />Custom CSS</>}>
                            <Alert variant="info">
                                <small>Add custom CSS to further customize your blog's appearance. This CSS will be applied to your blog post.</small>
                            </Alert>
                            <Form.Group>
                                <Form.Label>Custom CSS</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={10}
                                    value={styles.customCSS}
                                    onChange={(e) => handleCustomCSSChange(e.target.value)}
                                    placeholder="/* Add your custom CSS here */&#10;.blog-content {&#10;  /* Your styles */&#10;}"
                                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                                />
                            </Form.Group>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </div>
    );
};

export default BlogStyleEditor;
