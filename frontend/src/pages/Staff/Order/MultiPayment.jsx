import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Table, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FaMoneyBillWave, FaArrowLeft, FaTimes, FaCircle, FaCheckCircle } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

import { socket } from '../../../socket';
import '../../../scss/admin/admin-theme.scss';
import './order.scss';

function MultiPayment() {
 const location = useLocation();
 const navigate = useNavigate();
 const query = new URLSearchParams(location.search);
 const initialTablesStr = query.get('tables');

 const [tables, setTables] = useState(initialTablesStr ? initialTablesStr.split(',').map(t => t.trim()) : []);
 const [orders, setOrders] = useState([]);
 const [groupedItems, setGroupedItems] = useState([]);
 const [totalAmount, setTotalAmount] = useState(0);
 const [paymentMethod, setPaymentMethod] = useState('Cash');
 const [loading, setLoading] = useState(false);
 const [isPaid, setIsPaid] = useState(false);

 const accessToken = sessionStorage.getItem("accessToken");

 useEffect(() => {
 if (tables.length > 0) {
 fetchMultiOrders();
 } else {
 toast.error("No tables selected");
 setTimeout(() => navigate('/staff/table'), 2000);
 }
 }, [tables.join(',')]);

 const fetchMultiOrders = async () => {
 try {
 setLoading(true);
 const response = await fetch(`/api/order/multi-tables?tables=${tables.join(',')}`, {
 method: 'GET',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json'
 }
 });
 const data = await response.json();
 if (data.success) {
 setOrders(data.orders);
 setGroupedItems(data.groupedItems);
 setTotalAmount(data.totalAmount);
 } else {
 toast.error(data.message ||"Could not get order info");
 }
 } catch (error) {
 toast.error("Error connecting to server");
 } finally {
 setLoading(false);
 }
 };

 const handleRemoveTable = (tableNumber) => {
 if (tables.length <= 1) {
 toast.warning("Must have at least 1 table to pay");
 return;
 }
 setTables(tables.filter(t => t !== String(tableNumber)));
 };

 const handlePayment = async () => {
 if (!window.confirm(`Bạn có chắc chắn muốn thanh toán chung cho ${tables.length} bàn này không?`)) {
 return;
 }

 try {
 setLoading(true);
 const orderIds = orders.map(o => o._id || o.id);

 const response = await fetch('/api/payment/multi-pay', {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 orderIds: orderIds,
 paymentMethod: paymentMethod
 })
 });

 const data = await response.json();
 if (data.success) {
 toast.success("Payment gộp thành công!");
 setIsPaid(true);
 setTimeout(() => {
 navigate('/staff/table');
 }, 2000);
 } else {
 toast.error(data.message ||"Error thanh toán");
 }
 } catch (error) {
 toast.error("Error kết nối khi thanh toán");
 } finally {
 setLoading(false);
 }
 };

 if (tables.length === 0) return null;

 return (
 <div className="order__detail">
 <ToastContainer autoClose={2000} />
 <div className="d-flex justify-content-between align-items-center mb-4">
 <div>
 <h2 className="title-admin mb-0" style={{ fontSize: '24px', fontWeight: '600', color: '#2d3748' }}>
 Thanh Toán Chung
 </h2>
 </div>
 <Button variant="outline-secondary" onClick={() => navigate('/staff/table')} className="d-flex align-items-center gap-2 rounded-pill px-4">
 <FaArrowLeft /> Back
 </Button>
 </div>

 <Row className="g-4 align-items-start">
 <Col lg={7}>
 <div className="order__detail-container background-radius shadow-sm bg-dark text-white p-4 mt-0 border-0">
 <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
 <FaCircle className="text-primary" style={{ fontSize: '10px' }} />
 <h4 className="fw-bold mb-0">Table List gộp</h4>
 </div>

 <div className="d-flex flex-wrap gap-2 mb-4">
 {tables.map((tableNum, idx) => (
 <div key={idx} className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm transition-all"
 style={{
 backgroundColor: '#ebf8ff',
 border: '1px solid #90cdf4',
 color: '#2b6cb0',
 fontWeight: '600',
 fontSize: '14px'
 }}>
 <span>Table {tableNum}</span>
 {!isPaid && (
 <FaTimes
 className="cursor-pointer hover-danger"
 style={{ fontSize: '12px', transition: 'color 0.2s' }}
 onClick={() => handleRemoveTable(tableNum)}
 title="Bỏ gộp bàn này"
 />
 )}
 </div>
 ))}
 </div>

 <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2 mt-2">
 <FaCircle className="text-primary" style={{ fontSize: '10px' }} />
 <h4 className="fw-bold mb-0">Details món ăn</h4>
 </div>
 {loading ? (
 <div className="text-center py-5">
 <div className="spinner-border text-primary" role="status"></div>
 <div className="mt-2 text-muted">Loading data...</div>
 </div>
 ) : (
 <div className="table-responsive rounded-3 overflow-hidden border">
 <Table variant="dark" hover className="align-middle text-center mb-0 custom-table">
 <thead className="table-dark">
 <tr>
 <th className="text-start ps-3 py-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '12px' }}>Name món</th>
 <th className="py-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '12px' }}>Quantity</th>
 <th className="py-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '12px' }}>Đơn giá</th>
 <th className="py-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '12px' }}>Amount</th>
 <th className="text-start py-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '12px', width: '180px' }}>Phân bổ bàn</th>
 </tr>
 </thead>
 <tbody>
 {groupedItems.length > 0 ? (
 groupedItems.map((item, idx) => (
 <tr key={idx} style={{ transition: 'background-color 0.2s' }}>
 <td className="text-start ps-3 fw-bold" style={{ fontSize: '15px' }}>{item.product_name}</td>
 <td>
 <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2 fw-bold" style={{ fontSize: '14px' }}>
 {item.total_qty}
 </span>
 </td>
 <td className="text-muted" style={{ fontSize: '14px' }}>{item.unit_price?.toLocaleString()} VND</td>
 <td className="fw-bold" style={{ fontSize: '15px' }}>{(item.unit_price * item.total_qty)?.toLocaleString()} VND</td>
 <td className="text-start">
 <div className="d-flex flex-column gap-1">
 {Object.keys(item.byTable).map(tNum => (
 <div key={tNum} className="small text-muted d-flex justify-content-between border-bottom border-light pb-1">
 <span>Table {tNum}:</span>
 <span className="fw-bold text-primary">{item.byTable[tNum]}</span>
 </div>
 ))}
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan="5" className="text-center text-muted py-5 fs-5 italic">
 Không có món nào chưa thanh toán
 </td>
 </tr>
 )}
 </tbody>
 </Table>
 </div>
 )}
 </div>
 </Col>

 <Col lg={5}>
 <div className="border-0 rounded-4 bg-dark text-white shadow-sm p-4 d-flex flex-column" style={{ border: '1px solid #edf2f7 !important' }}>
 <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-2">
 <FaCircle className="text-success" style={{ fontSize: '10px' }} />
 <h4 className="fw-bold mb-0">Total kết hóa order</h4>
 </div>

 <div className="flex-grow-1">
 <div className="bg-secondary rounded-3 p-4 mb-4 border border-dashed">
 <div className="d-flex justify-content-between mb-3 text-secondary fw-500">
 <span>Total số lượng món:</span>
 <span className="fw-bold">{groupedItems.reduce((acc, curr) => acc + curr.total_qty, 0)} món</span>
 </div>
 <div className="d-flex justify-content-between mb-3 text-secondary fw-500">
 <span>Quantity bàn gộp:</span>
 <span className="fw-bold">{tables.length} bàn</span>
 </div>
 <div className="d-flex justify-content-between mb-3 text-secondary fw-500">
 <span>Quantity hóa order:</span>
 <span className="fw-bold">{orders.length} hóa order</span>
 </div>
 <hr className="my-3 opacity-10" />
 <div className="d-flex justify-content-between align-items-end">
 <span className="text-secondary fw-bold">TỔNG TIỀN THANH TOÁN:</span>
 <div className="text-end">
 <div className="text-danger fw-black" style={{ fontSize: '2.2rem', lineHeight: '1' }}>
 {totalAmount.toLocaleString()}
 <span style={{ fontSize: '1rem', marginLeft: '4px' }}>VND</span>
 </div>
 </div>
 </div>
 </div>

 {!isPaid ? (
 <div className="payment-options p-1">
 <Form.Group className="mb-4">
 <Form.Label className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
 <FaCircle className="text-success" style={{ fontSize: '10px' }} />
 <h4 className="fw-bold mb-0">Payment Method</h4>
 </Form.Label>
 <div className="d-flex flex-column gap-2">
 {['Cash', 'Transfer'].map((method) => (
 <div
 key={method}
 onClick={() => setPaymentMethod(method)}
 className={`p-3 rounded-3 border cursor-pointer d-flex justify-content-between align-items-center transition-all ${paymentMethod === method ? 'border-primary bg-primary-subtle text-primary fw-bold' : 'border-light bg-dark text-muted hover-light'}`}
 style={{ cursor: 'pointer' }}
 >
 <span>{method === 'Cash' ? 'Cash' : 'Bank Transfer / Quẹt thẻ'}</span>
 {paymentMethod === method && <FaCheckCircle />}
 </div>
 ))}
 </div>
 </Form.Group>
 </div>
 ) : (
 <div className="text-center py-5 animate-bounce">
 <div className="display-1 text-success mb-3">
 <FaCheckCircle />
 </div>
 <h3 className="fw-bold text-success">THANH TOÁN XONG!</h3>
 <p className="text-muted mt-2">Dữ liệu has been cập nhật, VNDang quay lại...</p>
 </div>
 )}
 </div>

 {!isPaid && (
 <Button
 variant="primary"
 size="lg"
 className="w-100 fw-bold py-3 mt-4 d-flex justify-content-center align-items-center gap-2 fs-5 rounded-3 shadow-sm btn-pay-animation"
 onClick={handlePayment}
 disabled={loading || groupedItems.length === 0}
 style={{
 background: 'linear-gradient(45deg, #2b6cb0, #4299e1)',
 border: 'none',
 height: '60px'
 }}
 >
 <FaMoneyBillWave /> XÁC NHẬN THANH TOÁN
 </Button>
 )}
 </div>
 </Col>
 </Row>
 </div>
 );
}

export default MultiPayment;
