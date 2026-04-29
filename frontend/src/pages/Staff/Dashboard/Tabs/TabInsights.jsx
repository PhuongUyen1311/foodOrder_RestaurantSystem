import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { FaLightbulb, FaCheckCircle } from "react-icons/fa";

function TabInsights({ insightsData }) {
  
  const insights = insightsData?.insights || [];
  const recommendations = insightsData?.recommendations || [];

  return (
    <div>
      <Row className="g-3">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-4 d-flex align-items-center" style={{ color: '#c5a059' }}>
                <FaLightbulb className="me-2" /> Data Insights
              </h5>
              {insights.length > 0 ? (
                <ul className="insights-list">
                  {insights.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Not enough data to generate insights.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h5 className="mt-0 mb-4 d-flex align-items-center" style={{ color: '#1ac073' }}>
                <FaCheckCircle className="me-2" /> Recommendations
              </h5>
              {recommendations.length > 0 ? (
                <ul className="recommendations-list">
                  {recommendations.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Not enough data to generate recommendations.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TabInsights;
