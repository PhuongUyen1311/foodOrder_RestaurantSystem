import React, { useEffect, useState } from "react";
import { Container, Spinner, Tabs, Tab } from "react-bootstrap";
import axios from "axios";

import "./dashboard.scss";

import TabOverview from "./Tabs/TabOverview";
import TabSales from "./Tabs/TabSales";
import TabTime from "./Tabs/TabTime";
import TabCustomer from "./Tabs/TabCustomer";
import TabInsights from "./Tabs/TabInsights";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [hourlyHeatmap, setHourlyHeatmap] = useState([]);
  const [returningRate, setReturningRate] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        resStats,
        resTop,
        resCategory,
        resRevenue,
        resHourly,
        resReturn,
        resInsights
      ] = await Promise.all([
        axios.get("/api/dashboard/stats"),
        axios.get("/api/dashboard/top-products"),
        axios.get("/api/dashboard/category-sales"),
        axios.get("/api/dashboard/revenue-trend"),
        axios.get("/api/dashboard/hourly-heatmap"),
        axios.get("/api/dashboard/returning-rate"),
        axios.get("/api/dashboard/insights")
      ]);

      setStats(resStats.data);
      setTopProducts(resTop.data);
      setCategorySales(resCategory.data);
      setRevenueTrend(resRevenue.data);
      setHourlyHeatmap(resHourly.data);
      setReturningRate(resReturn.data);
      setInsights(resInsights.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Hide global scrollbar for the dashboard
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.add('show-staff-scrollbar');
    document.body.classList.add('hide-scrollbar');
    return () => {
      if (mainContent) mainContent.classList.remove('show-staff-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <Container fluid className="dashboard-container">
      <h2 className="title-admin mb-4" style={{ fontSize: '24px', fontWeight: '600', color: '#fff' }}>
        Data-Driven Dashboard
      </h2>

      <Tabs defaultActiveKey="overview" id="dashboard-tabs" className="dashboard-tabs mb-4">
        <Tab eventKey="overview" title="🟦 Overview">
          <TabOverview stats={stats} revenueTrend={revenueTrend} topProducts={topProducts} />
        </Tab>
        <Tab eventKey="sales" title="🟩 Sales">
          <TabSales categorySales={categorySales} topProducts={topProducts} />
        </Tab>
        <Tab eventKey="time" title="🟨 Time">
          <TabTime hourlyHeatmap={hourlyHeatmap} revenueTrend={revenueTrend} />
        </Tab>
        <Tab eventKey="customer" title="🟥 Customer">
          <TabCustomer returningRate={returningRate} stats={stats} />
        </Tab>
        <Tab eventKey="insights" title="🧠 Insights">
          <TabInsights insightsData={insights} />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Dashboard;
