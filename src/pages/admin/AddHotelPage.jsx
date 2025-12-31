import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import HotelsTabs from "../../components/HotelsTabs";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, BedDouble } from "lucide-react";
import api from "../../utils/Api";

const AddHotelPage = () => {
  const navigate = useNavigate();

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Form states
  const [hotelForm, setHotelForm] = useState({
    city: "",
    name: "",
    address: "",
    google_location: "",
    contact_number: "",
    category: "",
    bed_type: "",
    distance: "",
    walking_time: "",
    walking_distance: "",
    is_active: true,
    available_start_date: "",
    available_end_date: ""
  });

  // Additional hotel creation fields
  const [contactDetails, setContactDetails] = useState([
    { contact_person: "", contact_number: "" }
  ]);
  const [priceSections, setPriceSections] = useState([
    { start_date: "", end_date: "", room_type: "room", price: "", purchase_price: "", bed_prices: [] }
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [resellingAllowed, setResellingAllowed] = useState(false);
  const [hotelStatus, setHotelStatus] = useState("active");

  // Categories and bed types
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', slug: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [bedTypesList, setBedTypesList] = useState([]);
  const [bedTypeLoading, setBedTypeLoading] = useState(false);
  const [showBedTypeModal, setShowBedTypeModal] = useState(false);
  const [bedTypeForm, setBedTypeForm] = useState({ id: null, name: '', slug: '', capacity: 1 });
  const [editingBedType, setEditingBedType] = useState(null);

  // Cities list
  const [cities, setCities] = useState([]);
  const [dedupedCities, setDedupedCities] = useState([]);

  // Tab state
  const [addHotelTab, setAddHotelTab] = useState("hotel");

  // Get organization ID
  const _orgRaw = localStorage.getItem("selectedOrganization") || localStorage.getItem("organization") || localStorage.getItem("selected_org");
  let parsedOrg = null;
  try {
    parsedOrg = _orgRaw ? JSON.parse(_orgRaw) : null;
  } catch (e) {
    parsedOrg = null;
  }
  const defaultOrgFromEnv = import.meta.env.VITE_DEFAULT_ORG_ID ? Number(import.meta.env.VITE_DEFAULT_ORG_ID) : null;
  const organizationId = parsedOrg?.id ?? defaultOrgFromEnv ?? null;

  // Helper function to parse distance
  const parseDistanceRaw = (input) => {
    if (input === undefined || input === null) return "";
    const s = String(input).trim();
    if (!s) return "";
    const mMatch = s.match(/^(\d+(?:\.\d+)?)(?:\s*m(?:eters?)?)?$/i);
    if (mMatch) {
      return mMatch[1];
    }
    return s;
  };

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Fetch cities
  const fetchCities = async () => {
    try {
      let resp;
      if (organizationId) resp = await api.get(`/cities/`, { params: { organization: organizationId } });
      else resp = await api.get(`/cities/`);
      const payload = resp.data || {};
      let citiesArr = [];
      if (Array.isArray(payload)) citiesArr = payload;
      else if (payload.results && Array.isArray(payload.results)) citiesArr = payload.results;
      else if (payload.data && Array.isArray(payload.data)) citiesArr = payload.data;

      const seenByName = new Map();
      citiesArr.forEach(c => {
        const rawName = c && c.name ? String(c.name) : '';
        const nameKey = rawName.trim().toLowerCase();
        if (!seenByName.has(nameKey)) {
          seenByName.set(nameKey, { id: c.id ?? c.name, name: rawName });
        } else {
          const existing = seenByName.get(nameKey);
          if ((!existing.id || existing.id === null) && c.id) {
            seenByName.set(nameKey, { id: c.id, name: rawName });
          }
        }
      });
      const unique = Array.from(seenByName.values()).filter(x => x && (x.name || x.id));
      unique.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setCities(unique);
      setDedupedCities(unique);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const params = {};
      if (organizationId) params.organization = organizationId;
      let data = [];
      if (organizationId) {
        const [orgResp, globalResp] = await Promise.all([
          api.get(`/hotel-categories/`, { params: { organization: organizationId } }),
          api.get(`/hotel-categories/`)
        ]);
        const orgCats = Array.isArray(orgResp.data) ? orgResp.data : orgResp.data?.results ?? [];
        const globalCats = Array.isArray(globalResp.data) ? globalResp.data : globalResp.data?.results ?? [];
        const map = new Map();
        (globalCats || []).forEach(c => { if (c && c.slug) map.set(String(c.slug), c); else if (c && c.id) map.set(String(c.id), c); });
        (orgCats || []).forEach(c => { if (c && c.slug) map.set(String(c.slug), c); else if (c && c.id) map.set(String(c.id), c); });
        data = Array.from(map.values());
      } else {
        const resp = await api.get(`/hotel-categories/`, { params });
        data = Array.isArray(resp.data) ? resp.data : resp.data?.results ?? [];
      }
      setCategoriesList(data);
      return data;
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategoriesList([]);
      return [];
    } finally {
      setCategoryLoading(false);
    }
  };

  // Fetch bed types
  const fetchBedTypes = async () => {
    try {
      setBedTypeLoading(true);
      const params = {};
      if (organizationId) params.organization = organizationId;

      const resp = await api.get(`/bed-types/`, { params });
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.results ?? [];
      setBedTypesList(data);
      return data;
    } catch (err) {
      console.error('Failed to load bed types', err);
      setBedTypesList([]);
      return [];
    } finally {
      setBedTypeLoading(false);
    }
  };

  // Open bed type modal for creating new
  const openAddBedType = () => {
    setEditingBedType(null);
    setBedTypeForm({ id: null, name: '', slug: '', capacity: 1 });
    setShowBedTypeModal(true);
  };

  useEffect(() => {
    fetchCities();
    fetchCategories();
    fetchBedTypes();
  }, [organizationId]);

  // Handle add hotel
  const handleAddHotel = async () => {
    try {
      const normalizedCity = hotelForm.city ? Number(hotelForm.city) : null;

      let orgToUse = organizationId;
      if (!orgToUse) {
        try {
          const adminDataRaw = localStorage.getItem('adminOrganizationData') || localStorage.getItem('selectedOrganization') || localStorage.getItem('organization');
          if (adminDataRaw) {
            const parsedAdmin = JSON.parse(adminDataRaw);
            orgToUse = parsedAdmin?.id ?? parsedAdmin?.ids?.[0] ?? null;
          }
        } catch (e) {
          orgToUse = orgToUse;
        }
      }

      if (!orgToUse) {
        try {
          const orgsResp = await api.get(`/organizations/`);
          const orgs = orgsResp?.data || [];
          if (Array.isArray(orgs) && orgs.length > 0) {
            const first = orgs[0];
            orgToUse = first?.id || first?.pk || null;
          }
        } catch (e) {
          // Ignore
        }
      }

      let mappedCategory = hotelForm.category || null;
      let mappedCategoryId = null;
      try {
        if (mappedCategory && Array.isArray(categoriesList) && categoriesList.length > 0) {
          const found = categoriesList.find(c => String(c.id) === String(mappedCategory) || String(c.slug) === String(mappedCategory) || String(c.name) === String(mappedCategory));
          if (found) {
            mappedCategory = found.slug ?? String(found.id);
            mappedCategoryId = found.id ?? null;
          } else if ((String(mappedCategory) || '').match(/^\d+$/)) {
            mappedCategoryId = Number(mappedCategory);
          }
        } else if (mappedCategory && (String(mappedCategory) || '').match(/^\d+$/)) {
          mappedCategoryId = Number(mappedCategory);
        }
      } catch (e) {
        // ignore
      }

      const distanceRaw = parseDistanceRaw(hotelForm.distance);
      const walkingTime = hotelForm.walking_time !== undefined && hotelForm.walking_time !== null && hotelForm.walking_time !== "" ? Number(hotelForm.walking_time) : null;
      const walkingDistance = hotelForm.walking_distance !== undefined && hotelForm.walking_distance !== null && hotelForm.walking_distance !== "" ? parseDistanceRaw(hotelForm.walking_distance) : null;

      if (!priceSections || priceSections.length === 0) {
        showAlert("error", "Please add at least one price section before creating a hotel.");
        return;
      }

      const hasAnyPrice = priceSections.some(p => {
        const basePricePresent = (p.price !== undefined && p.price !== "") || (p.purchase_price !== undefined && p.purchase_price !== "");
        const bedPricesPresent = Array.isArray(p.bed_prices) && p.bed_prices.some(bp => bp.price !== undefined && bp.price !== "");
        return basePricePresent || bedPricesPresent;
      });
      if (!hasAnyPrice) {
        showAlert("error", "Please provide at least one price (base or bed-specific) in the price sections.");
        return;
      }

      const { walking_time, walking_distance, ...hotelFormRest } = hotelForm;
      const plainPayload = {
        ...hotelFormRest,
        distance: distanceRaw,
        walking_time: walkingTime,
        walking_distance: walkingDistance,
        city: normalizedCity,
        category: mappedCategory,
        category_id: mappedCategoryId,
        organization: orgToUse,
        contact_details: contactDetails.filter(c => c.contact_person || c.contact_number),
        prices: priceSections.map(p => {
          const basePrice = {
            start_date: p.start_date,
            end_date: p.end_date,
            room_type: "room",
            price: p.price !== "" ? Number(p.price) : null,
            purchase_price: p.purchase_price !== "" ? Number(p.purchase_price) : null,
          };
          const bedPrices = (p.bed_prices || []).filter(bp => bp.type && (bp.price || bp.purchase_price)).map(bp => ({
            start_date: p.start_date,
            end_date: p.end_date,
            room_type: bp.type,
            price: bp.price !== "" ? Number(bp.price) : null,
            purchase_price: bp.purchase_price !== "" ? Number(bp.purchase_price) : null,
          }));
          return [basePrice, ...bedPrices];
        }).flat(),
        reselling_allowed: resellingAllowed,
        status: hotelStatus,
      };

      let res;
      if ((photoFiles && photoFiles.length > 0) || videoFile) {
        const form = new FormData();
        Object.keys(plainPayload).forEach(k => {
          const val = plainPayload[k];
          if (k === 'prices' || k === 'contact_details') {
            form.append(k, JSON.stringify(val));
          } else if (val !== null && val !== undefined) {
            form.append(k, val);
          }
        });

        if (photoFiles && photoFiles.length > 0) {
          photoFiles.forEach((f) => form.append('photo_files', f));
        }

        if (videoFile) {
          form.append('video', videoFile);
        }

        console.debug('Posting hotel as FormData (files present)', { meta: plainPayload, photoFiles, videoFile });
        res = await api.post(`/hotels/`, form);
      } else {
        console.debug("Adding hotel with payload:", plainPayload);
        res = await api.post(`/hotels/`, plainPayload);
      }

      const created = res?.data || null;
      showAlert("success", "Hotel added successfully!");

      // Navigate back to availability page after 1 second
      setTimeout(() => {
        navigate('/hotel-availability-manager');
      }, 1000);

    } catch (error) {
      console.error("Add hotel error:", JSON.stringify(error?.response?.data || error?.response || error));
      const serverMessage = error?.response?.data?.detail || error?.response?.data || null;
      if (serverMessage) {
        showAlert("error", `Failed to add hotel: ${JSON.stringify(serverMessage)}`);
      } else {
        showAlert("error", "Failed to add hotel. Check console/network for details.");
      }
    }
  };

  return (
    <>
      <div className="page-container" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Sidebar />
        <div className="content-wrapper" style={{ flex: 1, overflow: "auto" }}>
          <Header />
          <HotelsTabs />
          <Container fluid className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                  Add New Hotel
                </h2>
                <p className="text-muted mb-0">Fill in the details to add a new hotel</p>
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/hotel-availability-manager')}
              >
                <ArrowLeft size={20} className="me-2" />
                Back to Hotels
              </Button>
            </div>

            {/* Alert */}
            {alert.show && (
              <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, type: "", message: "" })}>
                {alert.message}
              </Alert>
            )}

            {/* Main Form Card */}
            <Card>
              <Card.Body>
                <Tabs activeKey={addHotelTab} onSelect={(k) => setAddHotelTab(k)} className="mb-3">
                  <Tab eventKey="hotel" title="Hotel">
                    <Form>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">City <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              value={hotelForm.city}
                              onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                            >
                              <option value="">Select City</option>
                              {dedupedCities.map(city => (
                                <option key={city.id ?? city.name} value={city.id}>{city.name}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Hotel Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              value={hotelForm.name}
                              onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                              placeholder="Enter hotel name"
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Address <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={hotelForm.address}
                              onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                              placeholder="Enter full address"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Category</Form.Label>
                            <Form.Select
                              value={hotelForm.category}
                              onChange={(e) => setHotelForm({ ...hotelForm, category: e.target.value })}
                            >
                              <option value="">Select Category</option>
                              {Array.isArray(categoriesList) && categoriesList.length > 0 ? (
                                categoriesList.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))
                              ) : (
                                <option value="" disabled>-- No categories --</option>
                              )}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-medium">
                              <BedDouble size={18} className="me-2" />
                              Bed Type
                            </Form.Label>
                            <Form.Select
                              value={hotelForm.bed_type}
                              onChange={(e) => setHotelForm({ ...hotelForm, bed_type: e.target.value })}
                              disabled={bedTypeLoading}
                            >
                              <option value="">Select Bed Type</option>
                              {bedTypesList.map((bt) => (
                                <option key={bt.id} value={bt.id}>
                                  {bt.name} (Capacity: {bt.capacity})
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Distance (m)</Form.Label>
                            <Form.Control
                              type="text"
                              value={hotelForm.distance}
                              onChange={(e) => setHotelForm({ ...hotelForm, distance: e.target.value })}
                              placeholder="e.g., 500"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Walking Time (min)</Form.Label>
                            <Form.Control
                              type="text"
                              value={hotelForm.walking_time}
                              onChange={(e) => setHotelForm({ ...hotelForm, walking_time: e.target.value })}
                              placeholder="e.g., 10"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Walking Distance (m)</Form.Label>
                            <Form.Control
                              type="text"
                              value={hotelForm.walking_distance}
                              onChange={(e) => setHotelForm({ ...hotelForm, walking_distance: e.target.value })}
                              placeholder="e.g., 400"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Contact Number</Form.Label>
                            <Form.Control
                              type="tel"
                              value={hotelForm.contact_number}
                              onChange={(e) => setHotelForm({ ...hotelForm, contact_number: e.target.value })}
                              placeholder="+92 XXX XXXXXXX"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Google Location Link</Form.Label>
                            <Form.Control
                              type="url"
                              value={hotelForm.google_location}
                              onChange={(e) => setHotelForm({ ...hotelForm, google_location: e.target.value })}
                              placeholder="https://maps.google.com/..."
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Available From</Form.Label>
                            <Form.Control
                              type="date"
                              value={hotelForm.available_start_date}
                              onChange={(e) => setHotelForm({ ...hotelForm, available_start_date: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Available Until</Form.Label>
                            <Form.Control
                              type="date"
                              value={hotelForm.available_end_date}
                              onChange={(e) => setHotelForm({ ...hotelForm, available_end_date: e.target.value })}
                            />
                          </Form.Group>
                        </Col>

                        {/* Contact Details */}
                        <Col xs={12}>
                          <Form.Label className="fw-medium">Contact Details</Form.Label>
                          {contactDetails.map((c, idx) => (
                            <Row className="g-2 mb-2" key={idx}>
                              <Col md={5}>
                                <Form.Control
                                  placeholder="Contact Person"
                                  value={c.contact_person}
                                  onChange={(e) => {
                                    const copy = [...contactDetails];
                                    copy[idx].contact_person = e.target.value;
                                    setContactDetails(copy);
                                  }}
                                />
                              </Col>
                              <Col md={5}>
                                <Form.Control
                                  placeholder="Contact Number"
                                  value={c.contact_number}
                                  onChange={(e) => {
                                    const copy = [...contactDetails];
                                    copy[idx].contact_number = e.target.value;
                                    setContactDetails(copy);
                                  }}
                                />
                              </Col>
                              <Col md={2} className="d-flex align-items-center">
                                <Button variant="danger" size="sm" onClick={() => {
                                  if (contactDetails.length === 1) return;
                                  const copy = contactDetails.filter((_, i) => i !== idx);
                                  setContactDetails(copy);
                                }}>Remove</Button>
                              </Col>
                            </Row>
                          ))}
                          <Button size="sm" onClick={() => setContactDetails([...contactDetails, { contact_person: "", contact_number: "" }])}>Add Contact</Button>
                        </Col>

                        {/* Price Sections */}
                        <Col xs={12}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="fw-medium mb-0">Hotel Prices</Form.Label>
                            <Button size="sm" onClick={() => setPriceSections([...priceSections, { start_date: "", end_date: "", room_type: "room", price: "", purchase_price: "", bed_prices: [] }])} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }} title="Add another hotel price">+ Add Hotel Price</Button>
                          </div>

                          {priceSections.map((p, idx) => (
                            <div key={idx} className="mb-3 p-2 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #eee' }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong>Hotel Price {idx + 1}</strong>
                                <Button size="sm" variant="outline-danger" onClick={() => { if (priceSections.length === 1) return; setPriceSections(priceSections.filter((_, i) => i !== idx)); }}>Remove</Button>
                              </div>

                              <Row className="g-2 align-items-center">
                                <Col md={6}><Form.Control type="date" value={p.start_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].start_date = e.target.value; setPriceSections(copy); }} /></Col>
                                <Col md={6}><Form.Control type="date" value={p.end_date} onChange={(e) => { const copy = [...priceSections]; copy[idx].end_date = e.target.value; setPriceSections(copy); }} /></Col>
                              </Row>
                              <Row className="g-2 mt-2">
                                <Col xs={12} className="mb-2"><strong>Only-Room Price</strong></Col>
                                <Col md={4}><Form.Select value={""} disabled><option value="">Room price</option></Form.Select></Col>
                                <Col md={4}><Form.Control type="number" placeholder="Selling Price (SAR)" value={p.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].price = e.target.value; setPriceSections(copy); }} /></Col>
                                <Col md={4}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={p.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                              </Row>

                              {/* Bed-specific prices within this price section */}
                              {(p.bed_prices || []).map((bp, bidx) => (
                                <Row key={bidx} className="g-2 align-items-center mt-2">
                                  <Col md={4}>
                                    <Form.Select value={bp.type || p.room_type || ""} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].type = e.target.value; setPriceSections(copy); }}>
                                      <option value="">Select Bed Type</option>
                                      {bedTypesList.map((bt) => (
                                        <option key={bt.id} value={bt.slug || bt.name.toLowerCase().replace(/\s+/g, '-')}>
                                          {bt.name} (Capacity: {bt.capacity})
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Col>
                                  <Col md={4}><Form.Control type="number" placeholder="Selling Price (SAR)" value={bp.price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].price = e.target.value; setPriceSections(copy); }} /></Col>
                                  <Col md={3}><Form.Control type="number" placeholder="Purchase Price (SAR)" value={bp.purchase_price} onChange={(e) => { const copy = [...priceSections]; copy[idx].bed_prices[bidx].purchase_price = e.target.value; setPriceSections(copy); }} /></Col>
                                  <Col md={1} className="d-flex">
                                    <Button size="sm" variant="danger" onClick={() => { const copy = [...priceSections]; copy[idx].bed_prices = copy[idx].bed_prices.filter((_, i) => i !== bidx); setPriceSections(copy); }}>Remove</Button>
                                  </Col>
                                </Row>
                              ))}

                              <div className="d-flex gap-3 mt-2">
                                <Button size="sm" className="" onClick={() => {
                                  const copy = [...priceSections];
                                  const defaultType = (copy[idx] && copy[idx].room_type) ? copy[idx].room_type : 'sharing';
                                  copy[idx].bed_prices = copy[idx].bed_prices ? [...copy[idx].bed_prices, { type: defaultType, price: '', purchase_price: '' }] : [{ type: defaultType, price: '', purchase_price: '' }];
                                  setPriceSections(copy);
                                }} style={{ backgroundColor: '#1B78CE', border: 'none', color: '#fff' }}>+ Add Bed Type</Button>
                              </div>
                            </div>
                          ))}
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Photos</Form.Label>
                            <Form.Control type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files))} />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Video</Form.Label>
                            <Form.Control type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                          </Form.Group>
                        </Col>

                        <Col md={6} className="d-flex align-items-center">
                          <Form.Check type="checkbox" label={<span className="fw-medium">Allow Reselling</span>} checked={resellingAllowed} onChange={(e) => setResellingAllowed(e.target.checked)} />
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">Status</Form.Label>
                            <Form.Select value={hotelStatus} onChange={(e) => setHotelStatus(e.target.value)}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                              <option value="maintenance">Maintenance</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Tab>
                </Tabs>

                {/* Footer Actions */}
                <div className="d-flex w-100 justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div className="text-muted small">Fields marked <span className="text-danger">*</span> are required</div>
                  <div>
                    <Button variant="outline-secondary" onClick={() => navigate('/hotel-availability-manager')} className="me-2">Cancel</Button>
                    <Button onClick={handleAddHotel} style={{ backgroundColor: '#1B78CE', border: 'none' }} disabled={!hotelForm.city || !hotelForm.name || !hotelForm.address}>
                      <Save size={16} className="me-1" /> Save Hotel
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </>
  );
};

export default AddHotelPage;
