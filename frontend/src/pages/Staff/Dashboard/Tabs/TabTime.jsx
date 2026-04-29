import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

const daysOfWeek = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TabTime({ hourlyHeatmap, revenueTrend }) {
  
  // Format heatmap data for ScatterChart
  const formattedHeatmap = hourlyHeatmap.map(item => ({
    dayOfWeek: item.dayOfWeek,
    dayName: daysOfWeek[item.dayOfWeek],
    hour: item.hour,
    count: item.count
  }));

  return (
    <div>
      <Row className="g-3">
        <Col md={12}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Daily Trend (Current Month)</h5>
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
      </Row>

      <Row className="mt-4 g-3">
        <Col md={12}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-3">Hourly Heatmap (Orders Activity)</h5>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="hour" name="Hour" unit=":00" tickCount={24} domain={[0, 23]} />
                    <YAxis type="number" dataKey="dayOfWeek" name="Day" tickFormatter={(tick) => daysOfWeek[tick]} tickCount={7} domain={[1, 7]} />
                    <ZAxis type="number" dataKey="count" range={[50, 400]} name="Orders" />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Orders" data={formattedHeatmap} fill="#1ac073" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TabTime;
