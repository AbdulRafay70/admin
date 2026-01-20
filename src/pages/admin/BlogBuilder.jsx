import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner, ButtonGroup, Tabs, Tab } from 'react-bootstrap';
import {
    Plus, Save, Eye, EyeOff, Trash2, MoveUp, MoveDown, Image as ImageIcon,
    Video, FileText, Link as LinkIcon, Type, Check, X, Upload, Layers, Palette
} from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import BlogStyleEditor from '../../components/blog/BlogStyleEditor';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/blog-management.css';

const BlogBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    // Blog State
    const [blog, setBlog] = useState({
        title: '',
        slug: '',
        summary: '',
        language: 'en',
        cover_image: null,
        status: 'draft',
        custom_styles: {},
        meta: {}
    });

    // Sections State
    const [sections, setSections] = useState([]);
    const [activeSection, setActiveSection] = useState(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [alert, setAlert] = useState(null);

    // Load existing blog if editing
    useEffect(() => {
        if (id) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://127.0.0.1:8000/api/blog/blogs/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlog(response.data);
            setSections(response.data.sections || []);
        } catch (error) {
            console.error('Error fetching blog:', error);
            showAlert('danger', 'Failed to load blog');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };

    // Section Management
    const addSection = (type = 'text') => {
        const newSection = {
            id: Date.now(),
            order: sections.length,
            section_type: type,
            content: {
                title: '',
                html_content: '',
                styling: {
                    font_family: 'Arial',
                    font_size: '16px',
                    font_color: '#000000',
                    background_color: '#ffffff',
                    divider_color: '#e0e0e0'
                },
                images: [],
                videos: [],
                attachments: [],
                links: []
            }
        };
        setSections([...sections, newSection]);
        setActiveSection(newSection.id);
    };

    const removeSection = (sectionId) => {
        setSections(sections.filter(s => s.id !== sectionId));
        if (activeSection === sectionId) setActiveSection(null);
    };

    const moveSectionUp = (index) => {
        if (index === 0) return;
        const newSections = [...sections];
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        newSections.forEach((s, i) => s.order = i);
        setSections(newSections);
    };

    const moveSectionDown = (index) => {
        if (index === sections.length - 1) return;
        const newSections = [...sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        newSections.forEach((s, i) => s.order = i);
        setSections(newSections);
    };

    const updateSection = (sectionId, updates) => {
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, content: { ...s.content, ...updates } } : s
        ));
    };

    const updateSectionStyling = (sectionId, styling) => {
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, content: { ...s.content, styling: { ...s.content.styling, ...styling } } } : s
        ));
    };

    const addImage = (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        const newImage = { url: '', caption: '', position: 'center' };
        updateSection(sectionId, { images: [...(section.content.images || []), newImage] });
    };

    const updateImage = (sectionId, imageIndex, updates) => {
        const section = sections.find(s => s.id === sectionId);
        const images = [...section.content.images];
        images[imageIndex] = { ...images[imageIndex], ...updates };
        updateSection(sectionId, { images });
    };

    const removeImage = (sectionId, imageIndex) => {
        const section = sections.find(s => s.id === sectionId);
        const images = section.content.images.filter((_, i) => i !== imageIndex);
        updateSection(sectionId, { images });
    };

    const addVideo = (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        const newVideo = { url: '' };
        updateSection(sectionId, { videos: [...(section.content.videos || []), newVideo] });
    };

    const updateVideo = (sectionId, videoIndex, url) => {
        const section = sections.find(s => s.id === sectionId);
        const videos = [...section.content.videos];
        videos[videoIndex] = { url };
        updateSection(sectionId, { videos });
    };

    const removeVideo = (sectionId, videoIndex) => {
        const section = sections.find(s => s.id === sectionId);
        const videos = section.content.videos.filter((_, i) => i !== videoIndex);
        updateSection(sectionId, { videos });
    };

    // Save Blog
    const saveBlog = async (publish = false) => {
        if (!blog.title || !blog.summary) {
            showAlert('danger', 'Please fill in title and summary');
            return;
        }

        try {
            setSaving(true);

            // Prepare sections data
            const sectionsData = sections.map(section => ({
                order: section.order,
                section_type: section.section_type,
                content: section.content
            }));

            // Prepare blog data
            const blogData = {
                title: blog.title,
                slug: blog.slug || generateSlug(blog.title),
                summary: blog.summary,
                language: blog.language || 'en',
                status: publish ? 'published' : 'draft',
                custom_styles: blog.custom_styles || {},
                meta: blog.meta || {},
                sections: sectionsData
            };

            // If there's a new cover image, upload it separately first
            if (blog.cover_image && typeof blog.cover_image !== 'string') {
                const imageFormData = new FormData();
                imageFormData.append('cover_image', blog.cover_image);

                if (id) {
                    await axios.patch(`http://127.0.0.1:8000/api/blog/blogs/${id}/`, imageFormData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                }
            }

            // Save blog data with sections as JSON
            if (id) {
                await axios.patch(`http://127.0.0.1:8000/api/blog/blogs/${id}/`, blogData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                showAlert('success', 'Blog updated successfully');
                fetchBlog(); // Reload to get saved sections
            } else {
                const response = await axios.post('http://127.0.0.1:8000/api/blog/blogs/', blogData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                showAlert('success', 'Blog created successfully');
                navigate(`/blog-builder/${response.data.id}`);
            }
        } catch (error) {
            console.error('Error saving blog:', error);
            console.error('Error response:', error.response?.data);
            showAlert('danger', 'Failed to save blog: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (title) => {
        return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
    };

    // Render section-specific form
    const renderSectionForm = (section) => {
        const sectionIndex = sections.findIndex(s => s.id === section.id);

        return (
            <Card.Body>
                {/* Common fields */}
                <Form.Group className="mb-3">
                    <Form.Label>Section Title</Form.Label>
                    <Form.Control
                        type="text"
                        value={section.content.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title"
                    />
                </Form.Group>

                {/* Type-specific fields */}
                {section.section_type === 'text' && (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                value={section.content.html_content || ''}
                                onChange={(e) => updateSection(section.id, { html_content: e.target.value })}
                                placeholder="Write your content here... (HTML supported)"
                            />
                            <Form.Text className="text-muted">You can use HTML tags for formatting</Form.Text>
                        </Form.Group>
                    </>
                )}

                {section.section_type === 'image' && (
                    <>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0">Images</Form.Label>
                                <Button variant="outline-primary" size="sm" onClick={() => addImage(section.id)}>
                                    <Plus size={14} className="me-1" /> Add Image
                                </Button>
                            </div>
                            {(section.content.images || []).map((img, idx) => (
                                <Card key={idx} className="mb-2">
                                    <Card.Body className="p-3">
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Image URL</Form.Label>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={img.url || ''}
                                                onChange={(e) => updateImage(section.id, idx, { url: e.target.value })}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </Form.Group>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small">Caption</Form.Label>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        value={img.caption || ''}
                                                        onChange={(e) => updateImage(section.id, idx, { caption: e.target.value })}
                                                        placeholder="Image caption"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small">Position</Form.Label>
                                                    <Form.Select
                                                        size="sm"
                                                        value={img.position || 'center'}
                                                        onChange={(e) => updateImage(section.id, idx, { position: e.target.value })}
                                                    >
                                                        <option value="left">Left</option>
                                                        <option value="center">Center</option>
                                                        <option value="right">Right</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="outline-danger" size="sm" onClick={() => removeImage(section.id, idx)}>
                                            <Trash2 size={14} /> Remove
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {section.section_type === 'video' && (
                    <>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0">Videos</Form.Label>
                                <Button variant="outline-primary" size="sm" onClick={() => addVideo(section.id)}>
                                    <Plus size={14} className="me-1" /> Add Video
                                </Button>
                            </div>
                            {(section.content.videos || []).map((video, idx) => (
                                <Card key={idx} className="mb-2">
                                    <Card.Body className="p-3">
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Video URL (YouTube/Vimeo)</Form.Label>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={video.url || ''}
                                                onChange={(e) => updateVideo(section.id, idx, e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                        </Form.Group>
                                        <Button variant="outline-danger" size="sm" onClick={() => removeVideo(section.id, idx)}>
                                            <Trash2 size={14} /> Remove
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {section.section_type === 'html' && (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>HTML Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={8}
                                value={section.content.html_content || ''}
                                onChange={(e) => updateSection(section.id, { html_content: e.target.value })}
                                placeholder="<div>Your HTML code here...</div>"
                                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                            />
                            <Form.Text className="text-muted">Raw HTML editor</Form.Text>
                        </Form.Group>
                    </>
                )}

                {/* Styling options (for all types) */}
                <hr />
                <h6 className="mb-3">Styling Options</h6>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Font Family</Form.Label>
                            <Form.Select
                                size="sm"
                                value={section.content.styling?.font_family || 'Arial'}
                                onChange={(e) => updateSectionStyling(section.id, { font_family: e.target.value })}
                            >
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Roboto">Roboto</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Font Size</Form.Label>
                            <Form.Control
                                size="sm"
                                type="text"
                                value={section.content.styling?.font_size || '16px'}
                                onChange={(e) => updateSectionStyling(section.id, { font_size: e.target.value })}
                                placeholder="16px"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Text Color</Form.Label>
                            <Form.Control
                                size="sm"
                                type="color"
                                value={section.content.styling?.font_color || '#000000'}
                                onChange={(e) => updateSectionStyling(section.id, { font_color: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Background</Form.Label>
                            <Form.Control
                                size="sm"
                                type="color"
                                value={section.content.styling?.background_color || '#ffffff'}
                                onChange={(e) => updateSectionStyling(section.id, { background_color: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Divider Color</Form.Label>
                            <Form.Control
                                size="sm"
                                type="color"
                                value={section.content.styling?.divider_color || '#e0e0e0'}
                                onChange={(e) => updateSectionStyling(section.id, { divider_color: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Card.Body>
        );
    };

    // Get active section
    const currentSection = sections.find(s => s.id === activeSection);

    if (loading) {
        return (
            <div className="d-flex">
                <Sidebar />
                <Container fluid className="p-0">
                    <Header title="Blog Builder" />
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Loading blog...</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <Container fluid className="p-0">
                <Header title="Blog Builder" />

                <div className="blog-management py-4 px-4">
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
                            {alert.message}
                        </Alert>
                    )}

                    {/* Header */}
                    <Row className="mb-4">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-1">Blog Content Builder</h2>
                                    <p className="text-muted mb-0">Create and manage blog sections</p>
                                </div>
                                <div>
                                    <Button
                                        variant={previewMode ? 'secondary' : 'outline-secondary'}
                                        size="sm"
                                        className="me-2"
                                        onClick={() => setPreviewMode(!previewMode)}
                                    >
                                        {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                                        <span className="ms-2">{previewMode ? 'Edit' : 'Preview'}</span>
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => saveBlog(false)}
                                        disabled={saving}
                                    >
                                        <Save size={16} className="me-2" />
                                        Save Draft
                                    </Button>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => saveBlog(true)}
                                        disabled={saving}
                                    >
                                        <Check size={16} className="me-2" />
                                        Publish
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        {/* Main Editor Area */}
                        <Col lg={previewMode ? 12 : 12}>
                            {!previewMode ? (
                                <>
                                    {/* Tabbed Interface for Better UX */}
                                    <Card className="blog-card">
                                        <Card.Body className="p-0">
                                            <Tabs
                                                activeKey={activeTab}
                                                onSelect={(k) => setActiveTab(k)}
                                                className="mb-0"
                                                fill
                                            >
                                                {/* Details Tab */}
                                                <Tab eventKey="details" title={<><FileText size={16} className="me-1" />Details</>}>
                                                    <div className="p-4">
                                                        <Row>
                                                            <Col md={8}>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label>Blog Title *</Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={blog.title}
                                                                        onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                                                                        placeholder="Enter blog title"
                                                                        size="lg"
                                                                    />
                                                                </Form.Group>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label>Language</Form.Label>
                                                                    <Form.Select
                                                                        value={blog.language || 'en'}
                                                                        onChange={(e) => setBlog({ ...blog, language: e.target.value })}
                                                                    >
                                                                        <option value="en">English</option>
                                                                        <option value="ur">Urdu (اردو)</option>
                                                                        <option value="ar">Arabic (العربية)</option>
                                                                    </Form.Select>
                                                                </Form.Group>
                                                            </Col>
                                                        </Row>

                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Summary *</Form.Label>
                                                            <Form.Control
                                                                as="textarea"
                                                                rows={3}
                                                                value={blog.summary}
                                                                onChange={(e) => setBlog({ ...blog, summary: e.target.value })}
                                                                placeholder="Brief description of the blog"
                                                            />
                                                        </Form.Group>

                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Cover Image</Form.Label>
                                                            <Form.Control
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setBlog({ ...blog, cover_image: e.target.files[0] })}
                                                            />
                                                            {blog.cover_image && typeof blog.cover_image === 'string' && (
                                                                <small className="text-muted d-block mt-1">Current: {blog.cover_image}</small>
                                                            )}
                                                        </Form.Group>
                                                    </div>
                                                </Tab>

                                                {/* Content Sections Tab */}
                                                <Tab eventKey="content" title={<><Layers size={16} className="me-1" />Content ({sections.length})</>}>
                                                    <div className="p-4">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h5 className="mb-0">Content Sections</h5>
                                                            <ButtonGroup size="sm">
                                                                <Button variant="outline-primary" onClick={() => addSection('text')}>
                                                                    <Type size={14} className="me-1" /> Text
                                                                </Button>
                                                                <Button variant="outline-primary" onClick={() => addSection('image')}>
                                                                    <ImageIcon size={14} className="me-1" /> Image
                                                                </Button>
                                                                <Button variant="outline-primary" onClick={() => addSection('video')}>
                                                                    <Video size={14} className="me-1" /> Video
                                                                </Button>
                                                                <Button variant="outline-primary" onClick={() => addSection('html')}>
                                                                    <FileText size={14} className="me-1" /> HTML
                                                                </Button>
                                                            </ButtonGroup>
                                                        </div>

                                                        {sections.length === 0 ? (
                                                            <div className="text-center py-5 text-muted">
                                                                <Layers size={48} className="mb-3 opacity-50" />
                                                                <p>No sections yet. Click a button above to add your first section.</p>
                                                            </div>
                                                        ) : (
                                                            sections.map((section, index) => (
                                                                <Card
                                                                    key={section.id}
                                                                    className={`mb-3 ${activeSection === section.id ? 'border-primary' : ''}`}
                                                                    onClick={() => setActiveSection(section.id)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                                                                        <div>
                                                                            <Badge bg="info" className="me-2">{section.section_type}</Badge>
                                                                            <strong>Section {index + 1}</strong>
                                                                            {section.content.title && <span className="text-muted ms-2">- {section.content.title}</span>}
                                                                        </div>
                                                                        <div>
                                                                            <Button
                                                                                variant="outline-secondary"
                                                                                size="sm"
                                                                                className="me-1"
                                                                                onClick={(e) => { e.stopPropagation(); moveSectionUp(index); }}
                                                                                disabled={index === 0}
                                                                            >
                                                                                <MoveUp size={14} />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline-secondary"
                                                                                size="sm"
                                                                                className="me-1"
                                                                                onClick={(e) => { e.stopPropagation(); moveSectionDown(index); }}
                                                                                disabled={index === sections.length - 1}
                                                                            >
                                                                                <MoveDown size={14} />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline-danger"
                                                                                size="sm"
                                                                                onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </Button>
                                                                        </div>
                                                                    </Card.Header>
                                                                    {activeSection === section.id && renderSectionForm(section)}
                                                                </Card>
                                                            ))
                                                        )}
                                                    </div>
                                                </Tab>

                                                {/* Styling Tab */}
                                                <Tab eventKey="styling" title={<><Palette size={16} className="me-1" />Styling</>}>
                                                    <div className="p-4">
                                                        <BlogStyleEditor
                                                            blogData={blog}
                                                            onStyleChange={(newStyles) => {
                                                                setBlog({ ...blog, custom_styles: newStyles });
                                                            }}
                                                        />
                                                    </div>
                                                </Tab>
                                            </Tabs>
                                        </Card.Body>
                                    </Card>
                                </>
                            ) : (
                                /* Preview Mode */
                                <Card className="blog-card">
                                    <Card.Body className="p-4">
                                        {blog.cover_image && (
                                            <img
                                                src={typeof blog.cover_image === 'string' ? blog.cover_image : URL.createObjectURL(blog.cover_image)}
                                                alt={blog.title}
                                                className="img-fluid mb-4 rounded"
                                                style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                        <h1 className="mb-3">{blog.title || 'Untitled Blog'}</h1>
                                        <p className="text-muted mb-4">{blog.summary}</p>
                                        <hr />
                                        {sections.map((section, index) => (
                                            <div
                                                key={section.id}
                                                className="mb-4 p-3 rounded"
                                                style={{
                                                    fontFamily: section.content.styling?.font_family,
                                                    fontSize: section.content.styling?.font_size,
                                                    color: section.content.styling?.font_color,
                                                    backgroundColor: section.content.styling?.background_color,
                                                    borderBottom: `2px solid ${section.content.styling?.divider_color}`
                                                }}
                                            >
                                                {section.content.title && <h3 className="mb-3">{section.content.title}</h3>}
                                                {section.content.html_content && <div dangerouslySetInnerHTML={{ __html: section.content.html_content }} />}

                                                {/* Render images */}
                                                {section.content.images && section.content.images.length > 0 && (
                                                    <div className="my-3">
                                                        {section.content.images.map((img, idx) => (
                                                            <div key={idx} className="mb-3">
                                                                <img src={img.url} alt={img.caption} className="img-fluid rounded" />
                                                                {img.caption && <p className="text-muted small mt-2">{img.caption}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Render videos */}
                                                {section.content.videos && section.content.videos.length > 0 && (
                                                    <div className="my-3">
                                                        {section.content.videos.map((video, idx) => (
                                                            <div key={idx} className="ratio ratio-16x9 mb-3">
                                                                <iframe src={video.url} title={`Video ${idx + 1}`} allowFullScreen />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </div>
            </Container>
        </div>
    );
};

export default BlogBuilder;
