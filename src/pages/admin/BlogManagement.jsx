import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, Search, Filter, Calendar, User, Tag, BookOpen, Settings, Layers } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import './styles/blog-management.css';

const BlogManagement = () => {
  // Active Tab
  const [activeTab, setActiveTab] = useState('list');

  // Blogs State
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get organization and auth details
  const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
  const organizationId = orgData?.id || orgData?.organization || Number(localStorage.getItem('organizationId')) || Number(localStorage.getItem('organization')) || null;
  const token = localStorage.getItem("accessToken");

  // Form State
  const [blogForm, setBlogForm] = useState({
    title: '',
    summary: '',
    tags: '',
    hashtags: '',
    meta_title: '',
    meta_description: '',
    cover_image: null,
    status: 'draft',
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    tag: ''
  });

  // Alert State
  const [alert, setAlert] = useState(null);

  // Fetch Blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      // Don't filter by organization - let backend handle permissions
      // Staff users can see all blogs, non-staff only see published ones

      const response = await axios.get('http://127.0.0.1:8000/api/blog/blogs/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlogs(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showAlert('danger', 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Statistics Component
  const StatsCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className={`stats-card stats-${color}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <small className="text-muted">{title}</small>
            <h4 className="mb-1">{value}</h4>
            {subtitle && <small className="text-secondary">{subtitle}</small>}
          </div>
          <Icon size={32} className={`text-${color}`} />
        </div>
      </Card.Body>
    </Card>
  );

  // Show Alert
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Get Status Badge
  const getStatusBadge = (status) => {
    const badges = {
      published: { bg: 'success', label: 'Published ✓' },
      draft: { bg: 'warning', label: 'Draft' },
      archived: { bg: 'danger', label: 'Archived' }
    };
    return badges[status] || { bg: 'secondary', label: status };
  };

  // Auto-generate slug
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate page URL
  const generatePageUrl = (slug) => {
    return `/blogs/${slug}/`;
  };

  // Handle Add Blog
  const handleAddBlog = () => {
    setSelectedBlog(null);
    setBlogForm({
      title: '',
      summary: '',
      tags: '',
      hashtags: '',
      meta_title: '',
      meta_description: '',
      cover_image: null,
      status: 'draft',
    });
    setShowAddModal(true);
  };

  // Handle Save Blog
  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.summary) {
      showAlert('danger', 'Please fill all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', blogForm.title);
      formData.append('slug', generateSlug(blogForm.title)); // Add slug
      formData.append('summary', blogForm.summary);
      formData.append('status', blogForm.status);

      if (blogForm.cover_image && typeof blogForm.cover_image !== 'string') {
        formData.append('cover_image', blogForm.cover_image);
      }

      // Build meta object
      const meta = {};
      if (blogForm.tags) {
        meta.tags = blogForm.tags.split(',').map(t => t.trim()).filter(t => t);
      }
      if (blogForm.hashtags) {
        meta.hashtags = blogForm.hashtags.split(',').map(h => h.trim()).filter(h => h);
      }
      if (blogForm.meta_title) meta.meta_title = blogForm.meta_title;
      if (blogForm.meta_description) meta.meta_description = blogForm.meta_description;

      formData.append('meta', JSON.stringify(meta));

      if (selectedBlog) {
        // Update existing blog
        await axios.patch(`http://127.0.0.1:8000/api/blog/blogs/${selectedBlog.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showAlert('success', 'Blog updated successfully');
      } else {
        // Create new blog
        await axios.post('http://127.0.0.1:8000/api/blog/blogs/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showAlert('success', 'Blog created successfully');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      showAlert('danger', 'Failed to save blog');
    }
  };

  // Handle Edit Blog
  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    const meta = blog.meta || {};
    setBlogForm({
      title: blog.title,
      summary: blog.summary,
      tags: (meta.tags || []).join(', '),
      hashtags: (meta.hashtags || []).join(', '),
      meta_title: meta.meta_title || '',
      meta_description: meta.meta_description || '',
      cover_image: blog.cover_image,
      status: blog.status,
    });
    setShowEditModal(true);
  };

  // Handle Delete Blog
  const handleDeleteBlog = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/blog/blogs/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlert('success', 'Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        console.error('Error deleting blog:', error);
        showAlert('danger', 'Failed to delete blog');
      }
    }
  };

  // Handle View Blog
  const handleViewBlog = (blog) => {
    setSelectedBlog(blog);
    setShowViewModal(true);
  };

  // Handle Open Builder
  const handleOpenBuilder = (blog) => {
    setSelectedBlog(blog);
    setShowBuilderModal(true);
  };

  // Change Blog Status
  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/blog/blogs/${id}/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('success', `Blog status changed to ${newStatus}`);
      fetchBlogs();
    } catch (error) {
      console.error('Error changing status:', error);
      showAlert('danger', 'Failed to change status');
    }
  };

  // Filtered Blogs
  const filteredBlogs = blogs.filter(b => {
    if (filters.status && b.status !== filters.status) return false;
    if (filters.search && !b.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tag) {
      const tags = (b.meta?.tags || []);
      if (!tags.includes(filters.tag)) return false;
    }
    return true;
  });

  // Calculate statistics
  const stats = {
    total_blogs: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft: blogs.filter(b => b.status === 'draft').length,
    total_views: blogs.reduce((sum, b) => sum + (b.meta?.views || 0), 0)
  };

  // Get all unique tags
  const allTags = [...new Set(blogs.flatMap(b => b.meta?.tags || []))];

  return (
    <div className="d-flex">
      <Sidebar />
      <Container fluid className="p-0">
        <Header title="Blog Management" />

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
                  <h2 className="mb-1">Blog Management System</h2>
                  <p className="text-muted mb-0">Create, edit, and manage blog posts</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleAddBlog}>
                  <Plus size={18} className="me-2" />
                  New Blog
                </Button>
              </div>
            </Col>
          </Row>

          {/* Navigation Tabs */}
          <Row className="mb-4">
            <Col>
              <div className="blog-tabs">
                <button
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <BookOpen size={18} className="me-2" />
                  All Blogs
                </button>
                <button
                  className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
                  onClick={() => setActiveTab('published')}
                >
                  <Eye size={18} className="me-2" />
                  Published
                </button>
                <button
                  className={`tab-btn ${activeTab === 'pages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pages')}
                >
                  <Layers size={18} className="me-2" />
                  Auto Pages
                </button>
              </div>
            </Col>
          </Row>

          {/* Loading Spinner */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading blogs...</p>
            </div>
          ) : (
            <>
              {/* ==================== LIST TAB ==================== */}
              {activeTab === 'list' && (
                <>
                  {/* Stats */}
                  <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                      <StatsCard icon={BookOpen} title="Total Blogs" value={stats.total_blogs} color="primary" />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <StatsCard icon={Eye} title="Published" value={stats.published} color="success" />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <StatsCard icon={Tag} title="Drafts" value={stats.draft} color="warning" />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <StatsCard icon={Calendar} title="Total Views" value={stats.total_views.toLocaleString()} color="info" />
                    </Col>
                  </Row>

                  {/* Filters */}
                  <Card className="blog-card mb-4">
                    <Card.Header>
                      <Card.Title className="mb-0">Filters</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                              value={filters.status}
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              size="sm"
                            >
                              <option value="">All Status</option>
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Group>
                            <Form.Label>Search Blog</Form.Label>
                            <Form.Control
                              type="text"
                              value={filters.search}
                              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                              placeholder="Search blog title..."
                              size="sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>Tag</Form.Label>
                            <Form.Select
                              value={filters.tag}
                              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                              size="sm"
                            >
                              <option value="">All Tags</option>
                              {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={2} className="mb-3">
                          <Form.Group>
                            <Form.Label>&nbsp;</Form.Label>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setFilters({ status: '', search: '', tag: '' })}
                              className="w-100"
                            >
                              Clear
                            </Button>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Blogs Table */}
                  <Card className="blog-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <Card.Title className="mb-0">Blog Posts ({filteredBlogs.length})</Card.Title>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {filteredBlogs.length === 0 ? (
                        <div className="text-center py-5">
                          <p className="text-muted">No blogs found</p>
                        </div>
                      ) : (
                        <Table hover responsive className="mb-0">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Slug / URL</th>
                              <th>Status</th>
                              <th>Tags</th>
                              <th>Engagement</th>
                              <th>Published</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBlogs.map(blog => (
                              <tr key={blog.id}>
                                <td>
                                  <strong>{blog.title}</strong>
                                  <br />
                                  <small className="text-muted">{blog.summary?.substring(0, 50)}...</small>
                                </td>
                                <td>
                                  <code className="text-primary">{blog.slug}</code>
                                  <br />
                                  <small className="text-muted">/blogs/{blog.slug}/</small>
                                </td>
                                <td>
                                  <Badge bg={getStatusBadge(blog.status).bg}>
                                    {getStatusBadge(blog.status).label}
                                  </Badge>
                                </td>
                                <td>
                                  {(blog.meta?.tags || []).slice(0, 2).map(tag => (
                                    <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                                  ))}
                                  {(blog.meta?.tags || []).length > 2 && <Badge bg="secondary">+{(blog.meta?.tags || []).length - 2}</Badge>}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark">{blog.likes_count || 0} likes</span>
                                  <br />
                                  <small>{blog.comments_count || 0} comments</small>
                                </td>
                                <td><small>{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'N/A'}</small></td>
                                <td>
                                  <div className="action-buttons">
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      onClick={() => window.location.href = `/blog-view/${blog.slug}`}
                                      title="View Public Page"
                                      className="me-1"
                                    >
                                      <Eye size={16} />
                                    </Button>
                                    <Button
                                      variant="outline-warning"
                                      size="sm"
                                      onClick={() => window.location.href = `/blog-builder/${blog.id}`}
                                      title="Edit Content"
                                      className="me-1"
                                    >
                                      <Edit2 size={16} />
                                    </Button>
                                    <Button variant="outline-info" size="sm" onClick={() => handleViewBlog(blog)} title="View Details" className="me-1">
                                      <Eye size={16} />
                                    </Button>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEditBlog(blog)} title="Edit Metadata" className="me-1">
                                      <Edit2 size={16} />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteBlog(blog.id)} title="Delete">
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </>
              )}

              {/* ==================== PUBLISHED TAB ==================== */}
              {activeTab === 'published' && (
                <Card className="blog-card">
                  <Card.Header>
                    <Card.Title className="mb-0">Published Blogs ({blogs.filter(b => b.status === 'published').length})</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {blogs.filter(b => b.status === 'published').length > 0 ? (
                      <Row>
                        {blogs.filter(b => b.status === 'published').map(blog => (
                          <Col md={6} lg={4} key={blog.id} className="mb-4">
                            <Card className="blog-card h-100">
                              {blog.cover_image && (
                                <Card.Img variant="top" src={blog.cover_image} style={{ height: '150px', objectFit: 'cover' }} />
                              )}
                              <Card.Body>
                                <Card.Title className="fs-6">{blog.title}</Card.Title>
                                <p className="text-muted small">{blog.summary}</p>
                                <div className="mb-2">
                                  {(blog.meta?.tags || []).slice(0, 2).map(tag => (
                                    <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                                  ))}
                                </div>
                                <small className="text-secondary">
                                  👍 {blog.likes_count || 0} likes | 💬 {blog.comments_count || 0} comments
                                </small>
                                <div className="mt-3">
                                  <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleViewBlog(blog)}>
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline-secondary" onClick={() => handleEditBlog(blog)}>
                                    Edit
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <p className="text-muted text-center py-5">No published blogs yet</p>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* ==================== PAGES TAB ==================== */}
              {activeTab === 'pages' && (
                <Card className="blog-card">
                  <Card.Header>
                    <Card.Title className="mb-0">Auto-Generated Blog Pages ({blogs.length})</Card.Title>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Blog Title</th>
                          <th>Page URL</th>
                          <th>Slug</th>
                          <th>Page Status</th>
                          <th>Meta Title</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogs.map(blog => (
                          <tr key={blog.id}>
                            <td><strong>{blog.title}</strong></td>
                            <td>
                              <code className="text-success">/blogs/{blog.slug}/</code>
                            </td>
                            <td><code>{blog.slug}</code></td>
                            <td>
                              <Badge bg={blog.status === 'archived' ? 'danger' : 'success'}>
                                {blog.status === 'archived' ? 'Inactive' : 'Active'}
                              </Badge>
                            </td>
                            <td><small>{blog.meta?.meta_title || blog.title}</small></td>
                            <td>
                              <Button size="sm" variant="outline-primary" href={`/blogs/${blog.slug}/`} target="_blank">
                                Visit Page
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {/* ==================== MODALS ==================== */}

          {/* Add Blog Modal */}
          <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Create New Blog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Blog Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    placeholder="e.g., Best Umrah Packages 2025"
                  />
                  {blogForm.title && (
                    <small className="text-muted mt-2 d-block">
                      Auto Slug: <code>{generateSlug(blogForm.title)}</code>
                      <br />
                      Auto URL: <code>{generatePageUrl(generateSlug(blogForm.title))}</code>
                    </small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Summary *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.summary}
                    onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                    placeholder="Brief description of the blog post"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        placeholder="Umrah, Packages, Travel"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hashtags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.hashtags}
                        onChange={(e) => setBlogForm({ ...blogForm, hashtags: e.target.value })}
                        placeholder="#UmrahTips, #Travel"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Title (SEO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.meta_title}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                    placeholder="SEO title for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Description (SEO)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.meta_description}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                    placeholder="SEO description for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Cover Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBlogForm({ ...blogForm, cover_image: e.target.files[0] })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={blogForm.status}
                    onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveBlog}>
                Create Blog
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Edit Blog Modal */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Edit Blog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Blog Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Summary *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.summary}
                    onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hashtags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.hashtags}
                        onChange={(e) => setBlogForm({ ...blogForm, hashtags: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Title (SEO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.meta_title}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Description (SEO)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.meta_description}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Cover Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBlogForm({ ...blogForm, cover_image: e.target.files[0] })}
                  />
                  {typeof blogForm.cover_image === 'string' && blogForm.cover_image && (
                    <small className="text-muted d-block mt-1">Current: {blogForm.cover_image}</small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={blogForm.status}
                    onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveBlog}>
                Update Blog
              </Button>
            </Modal.Footer>
          </Modal>

          {/* View Blog Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Blog Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedBlog && (
                <div>
                  <h4>{selectedBlog.title}</h4>
                  <p className="text-muted">{selectedBlog.summary}</p>

                  {selectedBlog.cover_image && (
                    <img src={selectedBlog.cover_image} alt={selectedBlog.title} className="img-fluid mb-3" />
                  )}

                  <div className="mb-3">
                    <strong>Status:</strong> <Badge bg={getStatusBadge(selectedBlog.status).bg}>{getStatusBadge(selectedBlog.status).label}</Badge>
                  </div>

                  <div className="mb-3">
                    <strong>Slug:</strong> <code>{selectedBlog.slug}</code>
                  </div>

                  <div className="mb-3">
                    <strong>Tags:</strong> {(selectedBlog.meta?.tags || []).map(tag => (
                      <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                    ))}
                  </div>

                  <div className="mb-3">
                    <strong>Engagement:</strong> {selectedBlog.likes_count || 0} likes, {selectedBlog.comments_count || 0} comments
                  </div>

                  <div className="mb-3">
                    <strong>Created:</strong> {new Date(selectedBlog.created_at).toLocaleString()}
                  </div>

                  {selectedBlog.published_at && (
                    <div className="mb-3">
                      <strong>Published:</strong> {new Date(selectedBlog.published_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                setShowViewModal(false);
                handleEditBlog(selectedBlog);
              }}>
                Edit Blog
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </div>
  );
};

export default BlogManagement;
