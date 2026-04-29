import React from "react";
import { Row, Col, Card, Table } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#c5a059', '#39a28fa1', '#fb8c09', '#0088FE', '#FFBB28', '#FF8042'];

function TabSales({ categorySales, topProducts }) {
  return (
    <div>
      <Row className="g-3">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Revenue by Category</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySales}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="totalSold" fill="#ab9150a1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Contribution %</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="totalSold"
                      nameKey="name"
                      label
                    >
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 g-3">
        <Col md={12}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Product Performance</h5>
              <Table responsive hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Total Sold (Qty)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td className="fw-bold">{product.name}</td>
                      <td>{product.totalSold}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TabSales;
