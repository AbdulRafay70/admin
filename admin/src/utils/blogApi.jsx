import api from "./Api";

// Blog API helper functions
// Note: backend mounts blog app under /api/blog/ so endpoints include the extra "blog" prefix

export const listBlogs = (params = {}) => {
  // params: { page, page_size, q, tag, status, ordering }
  // Backend blog app is mounted under /api/blog/, and the resource is 'blogs'
  return api.get("/blog/blogs/", { params });
};

export const getBlog = (id) => {
  return api.get(`/blog/blogs/${id}/`);
};

export const createBlog = (payload) => {
  // if FormData is provided (file upload), let axios send multipart/form-data
  if (payload instanceof FormData) {
    return api.post(`/blog/blogs/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.post(`/blog/blogs/`, payload);
};

export const updateBlog = (id, payload) => {
  return api.put(`/blog/blogs/${id}/`, payload);
};

export const patchBlog = (id, payload) => {
  if (payload instanceof FormData) {
    return api.patch(`/blog/blogs/${id}/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.patch(`/blog/blogs/${id}/`, payload);
};

export const deleteBlog = (id) => {
  return api.delete(`/blog/blogs/${id}/`);
};

export const postComment = (blogId, data) => {
  return api.post(`/blog/blogs/${blogId}/comments/`, data);
};

export const toggleLike = (blogId) => {
  return api.post(`/blog/blogs/${blogId}/like/`);
};

// Lead forms & submissions
export const listLeadForms = (params = {}) => api.get(`/blog/forms/`, { params });
export const getLeadForm = (id) => api.get(`/blog/forms/${id}/`);
export const submitLeadForm = (id, payload) => api.post(`/blog/forms/${id}/submit/`, payload);

export default {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  patchBlog,
  deleteBlog,
  postComment,
  toggleLike,
  listLeadForms,
  getLeadForm,
  submitLeadForm,
};
