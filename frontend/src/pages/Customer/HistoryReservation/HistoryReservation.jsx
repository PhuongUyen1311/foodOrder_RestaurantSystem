import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import moment from "moment";
import "./HistoryReservation.scss";
import Cart from "../../../components/Customer/Cart/Cart";
import { socket } from '../../../socket.js';

function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const accessToken = sessionStorage.getItem('accessToken');
  useEffect(() => {
    if (!accessToken) return;
    const fetchReservations = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/reservations/history",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        const sortedData = data.sort((a, b) => new Date(a.reservationTime) - new Date(b.reservationTime));
        setReservations(sortedData);

      } catch (error) {
        console.error("Error when get reservation history:", error);
      }
    };

    if (accessToken) {
      fetchReservations();
      const handleTableUpdated = () => {
        fetchReservations();
      };

      socket.on('tableUpdated', handleTableUpdated);

      return () => {
        socket.off('tableUpdated', handleTableUpdated);
      };
    }
  }, [accessToken]);

  const handleCancelReservation = async (reservationId) => {
    const isConfirm = window.confirm("Are you sure you want to cancel this reservation?");
    if (!isConfirm) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/reservations/${reservationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      alert("Cancel reservation successfully");

      setReservations(prev =>
        prev.map(r => r._id === reservationId ? { ...r, status: "Cancelled" } : r)
      );

    } catch (error) {
      console.error("Error when cancel reservation:", error);
      alert(error.message || "Error when cancel reservation");
    }
  };

  return (
    <>
      {accessToken && <Cart accessToken={accessToken} />}

      <div className="block__history-reservation">
        <Container>

          <h2>Reservation History</h2>

          <div className="reservation-list">

            {reservations.length === 0 && (
              <p>No Reservation History</p>
            )}

            {reservations.map((items) => {

              const {
                _id,
                customerName,
                confirmationCode,
                phoneNumber,
                email,
                tableId,
                status,
                specialRequests,
                createdAt,
                reservationTime
              } = items;

              return (
                <div className="reservation-item" key={_id}>

                  <div className="reservation-head">
                    <label>
                      Mã xác nhận: <span>#{confirmationCode}</span>
                    </label>

                    <label>
                      Date VNDặt:
                      <span className="reservation-time">
                        {moment(createdAt).format("DD-MM-YYYY HH:mm")}
                      </span>
                    </label>
                  </div>

                  <div className="info">
                    <div className="reservation-info">

                      <Row>

                        <Col md={4}>
                          <label>
                            Customer Name: <span>{customerName}</span>
                          </label>
                        </Col>

                        <Col md={4}>
                          <label>
                            Phone Number: <span>{phoneNumber}</span>
                          </label>
                        </Col>

                        <Col md={4}>
                          <label>
                            Email: <span>{email}</span>
                          </label>
                        </Col>

                        <Col md={4}>
                          <label>
                            Table Reserved:
                            <span>
                              {tableId?.tableNumber || "No Table"}
                            </span>
                          </label>
                        </Col>

                        <Col md={4}>
                          <label>
                            Date:
                            <span>
                              {reservationTime
                                ? moment(reservationTime).format("DD-MM-YYYY HH:mm")
                                : "No Date"}
                            </span>
                          </label>
                        </Col>

                      </Row>

                    </div>
                  </div>

                  <div className="reservation-request">
                    <label>
                      (*) Request special:
                      <span>{specialRequests || "Không có"}</span>
                    </label>
                  </div>

                  <div className="reservation-footer">

                    <span className={`reservation-status ${status === "Cancelled" ? "cancelled" : status === "In Use" ? "in-use" : "confirmed"}`}>
                      {status === "Cancelled" ? (
                        <i className="fa-solid fa-times-circle"></i>
                      ) : status === "In Use" ? (
                        <i className="fa-solid fa-utensils"></i>
                      ) : (
                        <i className="fa-solid fa-check-circle"></i>
                      )}
                      <span>{status}</span>
                    </span>

                    {status === "Reserved" && (
                      <button
                        className="btn-cancel"
                        onClick={() => handleCancelReservation(_id)}
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                </div>
              );

            })}

          </div>

        </Container>
      </div>
    </>
  );

}

export default ReservationHistory;