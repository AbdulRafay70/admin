import api from "../utils/Api";

// Service helper for agency-related API calls
export const getAgencies = (params = {}) => {
  // params can include pagination, filters, search, etc.
  // Return the response data directly so callers receive the JSON payload
  return api.get("/agencies/", { params }).then((res) => res.data);
};

export const getAgencyProfile = (agencyId) => {
  if (!agencyId) return Promise.reject(new Error("agencyId is required"));
  return api.get(`/agencies/${agencyId}/`).then((res) => res.data);
};

export const createAgency = (data) => {
  // data should be an object representing the agency payload
  return api.post("/agencies/", data).then((res) => res.data);
};

export default {
  getAgencies,
  getAgencyProfile,
  createAgency,
};
