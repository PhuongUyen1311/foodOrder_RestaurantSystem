import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

function TabOverview({ stats, revenueTrend, topProducts }) {
  return (
    <div>
      <Row className="g-3">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h5>Total Products</h5>
              <h2>{stats.totalProducts}</h2>
              <div className="text-muted small mt-1">Available items</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h5>New Customers</h5>
              <h2>{stats.newCustomersMonth}</h2>
              <div className="text-muted small mt-1">This month</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h5>Completed Orders</h5>
              <h2>{stats.paidOrdersCount}</h2>
              <div className="text-muted small mt-1">Total paid orders</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h5>Revenue</h5>
              <h2>{stats.totalRevenuePaid?.toLocaleString()} VND</h2>
              <div className="text-muted small mt-1">Total actual revenue</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 g-3">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Revenue Trend (Current Month)</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="_id" tickFormatter={(tick) => `Day ${tick}`} />
                    <YAxis tickFormatter={(tick) => `${tick / 1000}k`} />
                    <RechartsTooltip formatter={(value) => [`${value.toLocaleString()} VND`, 'Revenue']} labelFormatter={(label) => `Day ${label}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#c5a059" strokeWidth={3} dot={{ r: 4, fill: "#c5a059" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Top 5 Products</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 5)} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="totalSold" fill="#39a28fa1" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TabOverview;
