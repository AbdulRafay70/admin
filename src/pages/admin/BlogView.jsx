import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { Heart, MessageCircle, Share2, User, Calendar, Clock, ThumbsUp } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './styles/blog-view.css';

const BlogView = () => {
    const { slug } = useParams();
    const token = localStorage.getItem("accessToken");

    // Blog State
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);

    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState({
        name: '',
        email: '',
        comment: ''
    });
    const [submittingComment, setSubmittingComment] = useState(false);

    // Alert
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchBlog();
    }, [slug]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            // First try to fetch by slug using query parameter
            const listResponse = await axios.get('http://127.0.0.1:8000/api/blog/blogs/', {
                params: { slug },
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = listResponse.data;
            let blogItem = null;

            // Handle paginated response
            if (Array.isArray(data)) {
                blogItem = data[0];
            } else if (data && data.results) {
                blogItem = data.results[0];
            }

            if (blogItem) {
                // Fetch full details with sections and comments
                try {
                    const detailResponse = await axios.get(`http://127.0.0.1:8000/api/blog/blogs/${blogItem.id}/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setBlog(detailResponse.data);
                    setComments(detailResponse.data.comments || []);
                } catch (err) {
                    // Fallback to list item if detail fetch fails
                    setBlog(blogItem);
                    setComments([]);
                }
            } else {
                showAlert('danger', 'Blog not found');
            }
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

    const handleLike = async () => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/blog/blogs/${blog.id}/like/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLiked(!liked);
            setBlog({ ...blog, likes_count: liked ? blog.likes_count - 1 : blog.likes_count + 1 });
        } catch (error) {
            console.error('Error liking blog:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.name || !newComment.comment) {
            showAlert('warning', 'Please fill in name and comment');
            return;
        }

        try {
            setSubmittingComment(true);
            await axios.post(`http://127.0.0.1:8000/api/blog/blogs/${blog.id}/comments/`, {
                author_name: newComment.name,
                author_email: newComment.email,
                body: newComment.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showAlert('success', 'Comment posted successfully');
            setNewComment({ name: '', email: '', comment: '' });
            fetchBlog(); // Reload to get new comment
        } catch (error) {
            console.error('Error posting comment:', error);
            showAlert('danger', 'Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const renderComments = (commentsList, depth = 0) => {
        if (!commentsList || commentsList.length === 0) return null;

        return commentsList.map(comment => (
            <div key={comment.id} className={`comment-item ${depth > 0 ? 'ms-4' : ''}`}>
                <div className="d-flex align-items-start mb-3">
                    <div className="comment-avatar me-3">
                        <User size={32} className="text-muted" />
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong>{comment.author_name || 'Anonymous'}</strong>
                            <small className="text-muted">
                                {new Date(comment.created_at).toLocaleDateString()}
                            </small>
                        </div>
                        <p className="mb-0">{comment.body}</p>
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3">
                                {renderComments(comment.replies, depth + 1)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="d-flex">
                <Sidebar />
                <Container fluid className="p-0">
                    <Header title="Blog" />
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Loading blog...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="d-flex">
                <Sidebar />
                <Container fluid className="p-0">
                    <Header title="Blog" />
                    <div className="text-center py-5">
                        <h3>Blog not found</h3>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <Container fluid className="p-0">
                <Header title={blog.title} />

                <div className="blog-view p-4">
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
                            {alert.message}
                        </Alert>
                    )}

                    <Row className="justify-content-center">
                        <Col lg={10} xl={8}>
                            {/* Blog Header */}
                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="mb-4">
                                        {blog.meta?.tags && blog.meta.tags.map(tag => (
                                            <Badge key={tag} bg="primary" className="me-2 mb-2">{tag}</Badge>
                                        ))}
                                    </div>

                                    <h1 className="display-4 fw-bold mb-3">{blog.title}</h1>

                                    <p className="lead text-muted mb-4">{blog.summary}</p>

                                    <div className="d-flex align-items-center text-muted mb-4">
                                        {blog.author_details && (
                                            <>
                                                <User size={18} className="me-2" />
                                                <span className="me-4">{blog.author_details.name}</span>
                                            </>
                                        )}
                                        <Calendar size={18} className="me-2" />
                                        <span className="me-4">
                                            {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Not published'}
                                        </span>
                                        {blog.reading_time_minutes && (
                                            <>
                                                <Clock size={18} className="me-2" />
                                                <span>{blog.reading_time_minutes} min read</span>
                                            </>
                                        )}
                                    </div>

                                    {blog.cover_image && (
                                        <img
                                            src={blog.cover_image}
                                            alt={blog.title}
                                            className="img-fluid rounded mb-4"
                                            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                                        />
                                    )}

                                    {/* Engagement Buttons */}
                                    <div className="d-flex gap-3 mb-4">
                                        <Button
                                            variant={liked ? 'primary' : 'outline-primary'}
                                            size="sm"
                                            onClick={handleLike}
                                        >
                                            <Heart size={16} className="me-2" fill={liked ? 'currentColor' : 'none'} />
                                            {blog.likes_count || 0} Likes
                                        </Button>
                                        <Button variant="outline-secondary" size="sm">
                                            <MessageCircle size={16} className="me-2" />
                                            {blog.comments_count || 0} Comments
                                        </Button>
                                        <Button variant="outline-secondary" size="sm">
                                            <Share2 size={16} className="me-2" />
                                            Share
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Blog Content Sections */}
                            {blog.sections && blog.sections.map((section, index) => (
                                <Card key={section.id || index} className="mb-4 border-0 shadow-sm">
                                    <Card.Body
                                        className="p-4"
                                        style={{
                                            fontFamily: section.content?.styling?.font_family || 'inherit',
                                            fontSize: section.content?.styling?.font_size || 'inherit',
                                            color: section.content?.styling?.font_color || 'inherit',
                                            backgroundColor: section.content?.styling?.background_color || 'transparent'
                                        }}
                                    >
                                        {section.content?.title && (
                                            <h2 className="mb-3">{section.content.title}</h2>
                                        )}

                                        {section.content?.html_content && (
                                            <div
                                                className="blog-content"
                                                dangerouslySetInnerHTML={{ __html: section.content.html_content }}
                                            />
                                        )}

                                        {section.content?.images && section.content.images.length > 0 && (
                                            <div className="mt-3">
                                                {section.content.images.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="mb-3"
                                                        style={{
                                                            textAlign: img.position === 'center' ? 'center' : img.position === 'left' ? 'left' : 'right'
                                                        }}
                                                    >
                                                        <img
                                                            src={img.url}
                                                            alt={img.caption || ''}
                                                            className="img-fluid rounded"
                                                            style={{
                                                                maxWidth: '100%',
                                                                float: img.position === 'left' ? 'left' : img.position === 'right' ? 'right' : 'none',
                                                                marginRight: img.position === 'left' ? '1rem' : '0',
                                                                marginLeft: img.position === 'right' ? '1rem' : '0'
                                                            }}
                                                        />
                                                        {img.caption && (
                                                            <p className="text-muted small mt-2">{img.caption}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {section.content?.videos && section.content.videos.length > 0 && (
                                            <div className="mt-3">
                                                {section.content.videos.map((video, idx) => {
                                                    const videoUrl = video.url || video;
                                                    // Convert YouTube/Vimeo URLs to embed format
                                                    let embedUrl = videoUrl;
                                                    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                                                        const videoId = videoUrl.includes('v=')
                                                            ? videoUrl.split('v=')[1]?.split('&')[0]
                                                            : videoUrl.split('/').pop();
                                                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                                    } else if (videoUrl.includes('vimeo.com')) {
                                                        const videoId = videoUrl.split('/').pop();
                                                        embedUrl = `https://player.vimeo.com/video/${videoId}`;
                                                    }

                                                    return (
                                                        <div key={idx} className="ratio ratio-16x9 mb-3">
                                                            <iframe
                                                                src={embedUrl}
                                                                title={`Video ${idx + 1}`}
                                                                allowFullScreen
                                                                style={{ borderRadius: '8px' }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {section.content?.attachments && section.content.attachments.length > 0 && (
                                            <div className="mt-3">
                                                {section.content.attachments.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={file.url}
                                                        className="btn btn-outline-primary btn-sm me-2 mb-2"
                                                        download
                                                    >
                                                        📄 {file.name}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {section.content?.styling?.divider_color && (
                                            <hr style={{ borderColor: section.content.styling.divider_color }} />
                                        )}
                                    </Card.Body>
                                </Card>
                            ))}

                            {/* Comments Section */}
                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h4 className="mb-0">Comments ({blog.comments_count || 0})</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    {/* Comment Form */}
                                    <Form onSubmit={handleCommentSubmit} className="mb-4">
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Control
                                                        type="text"
                                                        value={newComment.name}
                                                        onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                                                        placeholder="Your Name *"
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Control
                                                        type="email"
                                                        value={newComment.email}
                                                        onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
                                                        placeholder="Your Email (optional)"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Form.Group className="mb-3">
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={newComment.comment}
                                                onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                                                placeholder="Write your comment... *"
                                                required
                                            />
                                        </Form.Group>
                                        <Button type="submit" variant="primary" disabled={submittingComment}>
                                            {submittingComment ? 'Posting...' : 'Post Comment'}
                                        </Button>
                                    </Form>

                                    {/* Comments List */}
                                    <div className="comments-list">
                                        {comments.length === 0 ? (
                                            <p className="text-muted text-center py-4">No comments yet. Be the first to comment!</p>
                                        ) : (
                                            renderComments(comments)
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>
        </div>
    );
};

export default BlogView;
