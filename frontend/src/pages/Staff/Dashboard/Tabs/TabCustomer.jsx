import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = ['#1ac073', '#c5a059'];

function TabCustomer({ returningRate, stats }) {
  
  // Format returning rate for PieChart
  const totalCustomers = returningRate.reduce((acc, curr) => acc + curr.count, 0);
  const formattedRate = returningRate.map(item => ({
    name: item._id,
    value: item.count
  }));

  const avgSpend = stats?.totalRevenuePaid && stats?.paidOrdersCount 
    ? Math.round(stats.totalRevenuePaid / stats.paidOrdersCount) 
    : 0;

  return (
    <div>
      <Row className="g-3">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Returning vs New Customers</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedRate}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {formattedRate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Customers`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="chart-card d-flex flex-column justify-content-center align-items-center">
            <Card.Body className="p-4 text-center d-flex flex-column justify-content-center align-items-center w-100">
              <h5 className="mt-0 mb-4 text-uppercase text-muted fw-bold">Average Spend per Order</h5>
              <h1 style={{ color: '#c5a059', fontSize: '3rem', fontWeight: 'bold' }}>
                {avgSpend.toLocaleString()} VND
              </h1>
              <p className="text-muted mt-3">
                Based on {stats?.paidOrdersCount || 0} total completed orders and {stats?.totalRevenuePaid?.toLocaleString() || 0} VND total revenue.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TabCustomer;
