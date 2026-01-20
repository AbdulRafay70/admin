import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { usePermission } from "../../contexts/EnhancedPermissionContext";
import { Bed, MapPin, Truck, Plane, Coffee, User as UserIcon } from "lucide-react";
import HotelSection from "../../components/HotelSection";
import ZiyaratSection from "../../components/ZiyaratSection";
import TransportSection from "../../components/TransportSection";
import AirportSection from "../../components/AirportSection";
import FoodSection from "../../components/FoodSection";
import PaxSection from "../../components/PaxSection";

const DailyOperations = () => {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState("");

  // Define all tabs with their permission requirements
  const allTabs = [
    {
      key: "hotel",
      label: "Hotel Check-in/Check-out",
      icon: <Bed size={14} className="me-1" />,
      viewPermission: "view_hotel_checkin_admin",
      updatePermission: "update_hotel_checkin_admin"
    },
    {
      key: "ziyarat",
      label: "Ziyarat",
      icon: <MapPin size={14} className="me-1" />,
      viewPermission: "view_ziyarat_operations_admin",
      updatePermission: "update_ziyarat_operations_admin"
    },
    {
      key: "transport",
      label: "Transport",
      icon: <Truck size={14} className="me-1" />,
      viewPermission: "view_transport_operations_admin",
      updatePermission: "update_transport_operations_admin"
    },
    {
      key: "airport",
      label: "Airport",
      icon: <Plane size={14} className="me-1" />,
      viewPermission: "view_airport_operations_admin",
      updatePermission: "update_airport_operations_admin"
    },
    {
      key: "food",
      label: "Food",
      icon: <Coffee size={14} className="me-1" />,
      viewPermission: "view_food_operations_admin",
      updatePermission: "update_food_operations_admin"
    },
    {
      key: "pax",
      label: "Pax Details",
      icon: <UserIcon size={14} className="me-1" />,
      viewPermission: "view_pax_details_admin",
      updatePermission: "update_pax_details_admin"
    },
  ];

  // Filter tabs based on permissions (show if user has view OR update permission)
  const tabs = allTabs.filter(tab =>
    hasPermission(tab.viewPermission) || hasPermission(tab.updatePermission)
  );

  // Set initial active tab to first available tab
  React.useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  // If user has no permissions, show message
  if (tabs.length === 0) {
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
                <div className="bg-white rounded shadow-sm p-5 text-center">
                  <h4 className="text-muted">No Daily Operations Access</h4>
                  <p className="text-muted">You don't have permission to access any daily operations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <div className="bg-white rounded shadow-sm p-3">
                <h4 className="mb-4">Daily Operations</h4>

                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  {tabs.map((t) => (
                    <Nav.Item key={t.key}>
                      <Nav.Link eventKey={t.key}>
                        {t.icon}
                        {t.label}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                {/* Render the appropriate section component based on active tab */}
                {activeTab === "hotel" && <HotelSection canUpdate={hasPermission("update_hotel_checkin_admin")} />}
                {activeTab === "ziyarat" && <ZiyaratSection canUpdate={hasPermission("update_ziyarat_operations_admin")} />}
                {activeTab === "transport" && <TransportSection canUpdate={hasPermission("update_transport_operations_admin")} />}
                {activeTab === "airport" && <AirportSection canUpdate={hasPermission("update_airport_operations_admin")} />}
                {activeTab === "food" && <FoodSection canUpdate={hasPermission("update_food_operations_admin")} />}
                {activeTab === "pax" && <PaxSection canUpdate={hasPermission("update_pax_details_admin")} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyOperations;
