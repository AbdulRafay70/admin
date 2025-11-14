import { useState, useEffect, useCallback } from "react";
import blogApi from "../utils/blogApi";

export function useBlog(id) {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (blogId) => {
    if (!blogId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await blogApi.getBlog(blogId);
      setBlog(res.data);
    } catch (err) {
      setError(err?.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(id);
  }, [id, fetch]);

  return { blog, loading, error, refresh: () => fetch(id) };
}
