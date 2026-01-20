import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Table, Spinner, Badge, Button } from "react-bootstrap";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AdminFooter from "../../components/AdminFooter";

const AgencyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [agency, setAgency] = useState(null);
    const [agents, setAgents] = useState([]);
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const accessToken = localStorage.getItem("accessToken");
    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    useEffect(() => {
        fetchAgencyDetails();
    }, [id]);

    const fetchAgencyDetails = async () => {
        setLoading(true);
        try {
            // Fetch agency details
            const agencyResponse = await axios.get(
                `https://b2bapi.saer.pk/api/agencies/${id}/`,
                axiosConfig
            );
            setAgency(agencyResponse.data);

            // Fetch branch details if agency has a branch
            if (agencyResponse.data.branch) {
                const branchResponse = await axios.get(
                    `https://b2bapi.saer.pk/api/branches/${agencyResponse.data.branch}/`,
                    axiosConfig
                );
                setBranch(branchResponse.data);
            }

            // Fetch all users and filter agents linked to this agency
            const usersResponse = await axios.get(
                `https://b2bapi.saer.pk/api/users/`,
                axiosConfig
            );

            // Filter users who have this agency in their agencies array or agency_details
            const agencyId = parseInt(id);
            const agencyAgents = usersResponse.data.filter(user => {
                // Check agency_details array (new format)
                if (user.agency_details && Array.isArray(user.agency_details)) {
                    const hasAgency = user.agency_details.some(agency => agency.id === agencyId);
                    if (hasAgency) return true;
                }
                // Check agencies array (old format - array of IDs)
                if (user.agencies && Array.isArray(user.agencies)) {
                    return user.agencies.includes(agencyId);
                }
                return false;
            });

            console.log('Total users:', usersResponse.data.length);
            console.log('Filtered agents for agency', agencyId, ':', agencyAgents);
            setAgents(agencyAgents);

        } catch (err) {
            console.error("Error fetching agency details:", err);
            setError(err.response?.data?.detail || "Failed to load agency details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
                <div className="row g-0">
                    <div className="col-12 col-lg-2">
                        <Sidebar />
                    </div>
                    <div className="col-12 col-lg-10">
                        <div className="container">
                            <Header />
                            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                                <Spinner animation="border" variant="primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
                <div className="row g-0">
                    <div className="col-12 col-lg-2">
                        <Sidebar />
                    </div>
                    <div className="col-12 col-lg-10">
                        <div className="container">
                            <Header />
                            <div className="alert alert-danger m-4" role="alert">
                                {error}
                            </div>
                            <Button variant="primary" onClick={() => navigate("/partners/agencies")}>
                                Back to Agencies
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
            <div className="row g-0">
                <div className="col-12 col-lg-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-lg-10">
                    <div className="container">
                        <Header />
                        <div className="px-3 px-lg-4 my-3">
                            {/* Back Button */}
                            <div className="mb-3">
                                <Link to="/partners/agencies" className="btn btn-outline-primary">
                                    <ArrowLeft size={18} className="me-2" />
                                    Back to Agencies
                                </Link>
                            </div>

                            {/* Agency Information Card */}
                            <Card className="mb-4 shadow-sm">
                                <Card.Header className="bg-primary text-white">
                                    <h4 className="mb-0">Agency Details</h4>
                                </Card.Header>
                                <Card.Body>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>ID:</strong> {agency?.id}</p>
                                            <p><strong>Name:</strong> {agency?.name || "N/A"}</p>
                                            <p><strong>Agency Name:</strong> {agency?.ageny_name || "N/A"}</p>
                                            <p><strong>Email:</strong> {agency?.email || "N/A"}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Phone:</strong> {agency?.phone_number || "N/A"}</p>
                                            <p><strong>Address:</strong> {agency?.address || "N/A"}</p>
                                            <p><strong>Branch:</strong> {branch?.name || "N/A"} ({branch?.branch_code || "N/A"})</p>
                                            <p>
                                                <strong>Agreement Status:</strong>{" "}
                                                <Badge bg={agency?.agreement_status ? "success" : "danger"}>
                                                    {agency?.agreement_status ? "Active" : "Inactive"}
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Agents Table */}
                            <Card className="shadow-sm">
                                <Card.Header className="bg-secondary text-white">
                                    <h5 className="mb-0">Agents Linked to This Agency ({agents.length})</h5>
                                </Card.Header>
                                <Card.Body>
                                    {agents.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-muted">No agents linked to this agency</p>
                                        </div>
                                    ) : (
                                        <Table hover responsive className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agents.map((agent) => (
                                                    <tr key={agent.id}>
                                                        <td>{agent.id}</td>
                                                        <td>{agent.username || "N/A"}</td>
                                                        <td>
                                                            {agent.first_name && agent.last_name
                                                                ? `${agent.first_name} ${agent.last_name}`
                                                                : agent.first_name || agent.last_name || "N/A"}
                                                        </td>
                                                        <td>{agent.email || "N/A"}</td>
                                                        <td>
                                                            <Badge bg="info">
                                                                {agent.profile?.type
                                                                    ? agent.profile.type.charAt(0).toUpperCase() +
                                                                    agent.profile.type.slice(1).replace("-", " ")
                                                                    : "Agent"}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge bg={agent.is_active ? "success" : "danger"}>
                                                                {agent.is_active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Contacts Section (if available) */}
                            {agency?.contacts && agency.contacts.length > 0 && (
                                <Card className="mt-4 shadow-sm">
                                    <Card.Header className="bg-info text-white">
                                        <h5 className="mb-0">Agency Contacts</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table hover responsive className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>Email</th>
                                                    <th>Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agency.contacts.map((contact, index) => (
                                                    <tr key={index}>
                                                        <td>{contact.name || "N/A"}</td>
                                                        <td>{contact.phone_number || "N/A"}</td>
                                                        <td>{contact.email || "N/A"}</td>
                                                        <td>{contact.remarks || "N/A"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            )}

                            <div className="mt-4">
                                <AdminFooter />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyDetail;
