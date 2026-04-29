import React, { useEffect, useState, useRef } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import moment from 'moment';
import { socket } from '../../../socket.js';
const host = "http://localhost:3000";
import { toast } from "react-toastify";
import './history-order.scss';
import { fetchUpdateStatusOrder } from '../../../actions/order';
import { statusOrder } from '../../../config/statusOrder';
import Cart from '../../../components/Customer/Cart/Cart';

function HistoryOrder(props) {
    const [orderList, setOrderList] = useState(null);
    const [orderSocket, setOrderSocket] = useState([]);
    const socketRef = useRef(socket);
    const accessToken = sessionStorage.getItem("accessToken");
    const user = JSON.parse(sessionStorage.getItem("user"));
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (user && user.id) {
            socketRef.current.emit('userConnect', user.id);
        }
        
        const handleSendStatusOrder = dataOrder => {
            console.log(dataOrder);
            setOrderSocket(dataOrder);
        };
        
        socketRef.current.on('sendStatusOrder', handleSendStatusOrder);
        
        return () => {
            socketRef.current.off('sendStatusOrder', handleSendStatusOrder);
        };
    }, []);

    const fetchOrderUser = async (accessToken) => {
        let url = 'api/order';
        const guestSession = sessionStorage.getItem("guest_session");
        
        if (guestSession) {
            try {
                const parsed = JSON.parse(guestSession);
                if (parsed.username && parsed.table) {
                    url += `?guestName=${encodeURIComponent(parsed.username)}&tableNumber=${encodeURIComponent(parsed.table)}`;
                }
            } catch (e) {
                console.error("Error parsing guest session:", e);
            }
        }

        const response = await fetch(url, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });
        const data = await response.json();

        if (data) {
            setOrderList(data);
            return;
        }
    }

    useEffect(() => {
        if (accessToken) fetchOrderUser(accessToken);
    }, [accessToken, orderSocket]);

    const handleCancelOrder = async (orderId) => {
        const isConfirm = window.confirm("Bạn có chắc chắn muốn hủy order này không?");
        if (!isConfirm) return;

        if (orderId && accessToken) {

            try {

                const result = await fetchUpdateStatusOrder(
                    orderId,
                    accessToken,
                    statusOrder.CANCELED
                );

                if (result) {

                    toast.success("Cancelled order thành công");

                    await fetchOrderUser(accessToken);

                }

            } catch (error) {

                console.error(error);
                toast.error("Cancel order thất bại");

            }

        }
    };
    return (
        <>
            <Cart accessToken={accessToken} />
            <div className='block__history-order'>
                <Container>
                    <h2>Lịch sử order</h2>
                    <div className='history-order-list'>
                        {
                            orderList && (
                                orderList.map((items, index) => {
                                    const { id, total_item, total_price, type_order, updatedAt } = items.order;
                                    let status = items.order.status;

                                    if (orderSocket && orderSocket.cart_id === id) {
                                        status = orderSocket.status;
                                    }

                                    return (
                                        <div className="history-order-item completed" key={index}>
                                            <div className="history-order-head">
                                                <label>Mã order: <span>#{id}</span> </label>
                                                <label>Date VNDặt hàng: <span className='order-time'>{moment(updatedAt).format('DD-MM-YYYY')}</span> </label>
                                            </div>
                                            <div className="history-order-processing">
                                                <div className="row">
                                                    <div className={`col-3 ${status === statusOrder.NEW ? 'active' :
                                                        (status === statusOrder.CONFIRMED || status === statusOrder.PROCESSING || status === statusOrder.COMPLETED) ?
                                                            'step-success' : ''}`}>
                                                        <span>
                                                            <span className="number">1</span>
                                                        </span>
                                                        <span>Chờ nhận order</span>
                                                    </div>
                                                    <div className={`col-3 ${status === statusOrder.CONFIRMED ? 'active' :
                                                        (status === statusOrder.PROCESSING || status === statusOrder.COMPLETED) ?
                                                            'step-success' : ''}`}>
                                                        <span>
                                                            <span className="number">2</span>
                                                        </span>
                                                        <span>Đã nhận order</span>
                                                    </div>
                                                    <div className={`col-3 ${status === statusOrder.PROCESSING ? 'active' :
                                                        (status === statusOrder.COMPLETED) ? 'step-success'
                                                            : ''}`}>
                                                        <span>
                                                            <span className="number">3</span>
                                                        </span>
                                                        <span>Orders VNDã hoàn tất</span>
                                                    </div>
                                                    <div className={`col-3 ${status === statusOrder.COMPLETED ? 'active' : ''}`}>
                                                        <span>
                                                            <span className="number">4</span>
                                                        </span>
                                                        <span>Completed</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="history-order-product">
                                                <Row>
                                                    {items && (
                                                        items.orderItems.map((orderItem, index) => {
                                                            const { product_image, product_name, price, qty, status: itemStatus } = orderItem;

                                                            return (
                                                                <Col xs={12} md={6} key={index}>
                                                                    <div className="product-item compact-item">
                                                                        <img
                                                                            src={
                                                                                product_image
                                                                                    ? `${API_URL}${product_image}`
                                                                                    : "/images/no-image.png"}
                                                                            alt={product_name}
                                                                            onError={(e) => {
                                                                                e.target.onerror = null;
                                                                                e.target.src = "/images/no-image.png";
                                                                            }} />
                                                                        <div className="product-item-info">
                                                                            <div className="d-flex justify-content-between align-items-start">
                                                                                <span className="product-name fw-bold">{product_name}</span>
                                                                                <span className={`item-status-badge ${itemStatus?.toLowerCase() || 'new'}`}>
                                                                                    {itemStatus === 'SERVED' ? 'Đã lên món' : itemStatus === 'CANCELED' ? 'Cancelled' : itemStatus === 'CONFIRMED' ? 'Đã nhận' : 'Đang chờ'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="product-item-details d-flex justify-content-between mt-1">
                                                                                <span className="text-muted">SL: <span className="text-dark fw-500">{qty}</span></span>
                                                                                <span className="product-subtotal text-success fw-bold">
                                                                                    {(price * qty).toLocaleString('vi', { style: 'currency', currency: 'VND' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            )
                                                        })
                                                    )}

                                                </Row>
                                            </div>
                                            <div className="history-order-footer">
                                                <div className="footer-left-info">
                                                    <label>Total: <span>
                                                        {total_price.toLocaleString('vi', { style: 'currency', currency: 'VND' })}
                                                    </span></label>
                                                    <label className="mt-2 d-block" style={{ fontSize: '15px' }}>
                                                        <span style={{ color: items.order.is_payment ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                                                            {items.order.is_payment ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className="history-order-status">
                                                    {status === statusOrder.NEW && (
                                                        <button onClick={() => handleCancelOrder(id)} className='btn btn-cancel'>Cancel order</button>
                                                    )}
                                                    <span className={`order-status ${status === statusOrder.CANCELED ? 'canceled' :
                                                        (status === statusOrder.CONFIRMED) ? 'confirmed' :
                                                            (status === statusOrder.COMPLETED) ? 'completed' :
                                                                (status === statusOrder.PROCESSING) ? 'processing' : 'new'}`}>

                                                        {status === statusOrder.CANCELED ? 'Đơn cancelled' : (status === statusOrder.CONFIRMED) ? 'Đã nhận order' :
                                                            (status === statusOrder.COMPLETED ? 'Completed' :
                                                                (status === statusOrder.PROCESSING) ? 'Orders VNDã hoàn tất' : 'Chờ nhận order')}

                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )
                        }
                    </div>
                </Container>
            </div>
        </>
    );
}

export default HistoryOrder;