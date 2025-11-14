import { useState, useEffect, useCallback } from "react";
import blogApi from "../utils/blogApi";

export function useBlogs(initialParams = {}) {
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetch = useCallback(async (p = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await blogApi.listBlogs(p);
      setData(res.data || { results: [], count: 0, next: null, previous: null });
    } catch (err) {
      setError(err?.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refresh: () => fetch(params),
  };
}
