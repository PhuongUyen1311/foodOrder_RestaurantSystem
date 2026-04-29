import React, { useState, useEffect, useRef, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Button, Table, Modal, Form, InputGroup } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaRegEdit, FaSearch, FaUtensils, FaPlus, FaEye, FaEyeSlash, FaTimesCircle, FaSortAmountDownAlt, FaSortAmountUp, FaRegIdCard, FaCalendarAlt, FaCrown, FaLink, FaLayerGroup, FaCircle, FaMoneyBillWave } from 'react-icons/fa';
import { MdDelete, MdCancel } from 'react-icons/md';
import { IoMdClose } from"react-icons/io";
import { socket } from '../../../socket.js';
import './table.scss';
import { completeReservation, cancelReservation, mergeTable, unmergeTable, unmergeAllSlaves } from '../../../actions/table.js';
import { Table as AntTable, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';



const TableManagement = () => {
 const navigate = useNavigate();
 const [tables, setTables] = useState([]);
 const accessToken = sessionStorage.getItem("accessToken");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [selectedTable, setSelectedTable] = useState(null);
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [newTable, setNewTable] = useState({
 tableNumber: '',
 seatingCapacity: 1,
 location: 'Floor 1 Indoor',
 isAvailable: true
 });
 const [currentPage, setCurrentPage] = useState(1);
 const [sortOrder, setSortOrder] = useState('desc');
 const itemsPerPage = 7;

 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedSearch(searchTerm);
 }, 300);
 return () => clearTimeout(handler);
 }, [searchTerm]);

 const filteredTables = useMemo(() => {
 return tables.filter(table => {
 // Filter theo trạng thái trước tiên
 if (statusFilter !== 'All') {
 if (statusFilter === 'Empty' && table.status !== 'Empty') return false;
 if (statusFilter === 'Reserved' && table.status !== 'Reserved') return false;
 if (statusFilter === 'In Use' && table.status !== 'In Use') return false;
 }

 // Nếu không có từ khóa tìm kiếm, hiển thị tất cả (VNDã qua bộ lọc trạng thái)
 if (!debouncedSearch) return true;

 const lowerSearch = debouncedSearch.toLowerCase().trim();
 const isNumeric = /^\d+$/.test(lowerSearch);

 if (isNumeric) {
 return String(table.tableNumber).includes(lowerSearch) ||
 String(table.seatingCapacity).includes(lowerSearch);
 } else {
 // Tìm trong danh sách tất cả mã VNDặt bàn của bàn này từ aggregate
 const codes = (table.reservationList || []).map(r => (r.confirmationCode || '').toLowerCase());

 // Nếu backend chưa trả code ở list, fall-back sang code hiện tại
 if (table.confirmationCode) {
 codes.push(table.confirmationCode.toLowerCase());
 }

 return codes.some(code => code.includes(lowerSearch));
 }
 });
 }, [tables, debouncedSearch, statusFilter]);

 useEffect(() => {
 // Debugging log VNDể check field reservationList
 if (tables.length > 0) {
 console.log("Check data Backend gửi:", tables[0]);
 }
 setCurrentPage(1);
 }, [debouncedSearch]);

 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 const currentTables = filteredTables.slice(indexOfFirstItem, indexOfLastItem);

 const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
 const [showViewModal, setShowViewModal] = useState(false);
 const [showScheduleModal, setShowScheduleModal] = useState(false);
 const [viewTable, setViewTable] = useState(null);
 const [showMergeModal, setShowMergeModal] = useState(false);
 const [mergeToTable, setMergeToTable] = useState('');
 const [showPaymentMergeModal, setShowPaymentMergeModal] = useState(false);
 const [reservationInfo, setReservationInfo] = useState(null);
 const [allReservations, setAllReservations] = useState([]);
 const [paymentMergeOrders, setPaymentMergeOrders] = useState([]);

 const [showMergeBillsModal, setShowMergeBillsModal] = useState(false);
 const [selectedMergeBillsTable, setSelectedMergeBillsTable] = useState(null);
 const [slaveTablesToMerge, setSlaveTablesToMerge] = useState([]);

 // New state for multi-payment
 const [selectedMultiPayTables, setSelectedMultiPayTables] = useState([]);
 const [isMultiPayMode, setIsMultiPayMode] = useState(false);
 const [showMoveModal, setShowMoveModal] = useState(false);
 const [moveToTable, setMoveToTable] = useState('');
 const [showPinModal, setShowPinModal] = useState(false);
 const [pinModalData, setPinModalData] = useState({ tableNumber: '', session_pin: '', issuedAt: '' });
 const [showPrintPinView, setShowPrintPinView] = useState(false);
 const [socketTables, setSocketTables] = useState([]);
 const socketRef = useRef(socket);
 const user = JSON.parse(sessionStorage.getItem("user"));
 const [now, setNow] = useState(new Date());

 const CLIENT_URL = window.location.origin;

 useEffect(() => {
 const timer = setInterval(() => setNow(new Date()), 1000);
 return () => clearInterval(timer);
 }, []);

 const handleClearSearch = () => {
 setSearchTerm('');
 setDebouncedSearch('');
 };

 useEffect(() => {
 if (user && user.id) {
 socketRef.current.emit('adminConnect', user.id);
 }

 const handleTableUpdated = (updatedTables) => {
 setSocketTables(updatedTables);
 };
 const handleTableMerged = () => {
 fetchTables();
 };

 socketRef.current.on('tableUpdated', handleTableUpdated);
 socketRef.current.on('tableMerged', handleTableMerged);

 return () => {
 socketRef.current.off('tableUpdated', handleTableUpdated);
 socketRef.current.off('tableMerged', handleTableMerged);
 };
 }, []);

 useEffect(() => {
 fetchTables(sortOrder);
 }, [socketTables, sortOrder]);


 const fetchTables = async (order = sortOrder) => {
 setLoading(true);
 try {
 const queryParams = new URLSearchParams();
 if (order) {
 queryParams.append('sortBy', 'seatingCapacity');
 queryParams.append('order', order);
 }
 const response = await fetch(`/api/tables?${queryParams.toString()}`);
 if (!response.ok) {
 throw new Error(`HTTP error! status: ${response.status}`);
 }
 const data = await response.json();
 setTables(data);
 } catch (error) {
 setError('Error loading table list: ' + error.message);
 console.error("Error fetching tables:", error);
 } finally {
 setLoading(false);
 }
 };

 const emitTableChange = () => {
 if (socketRef.current) {
 socketRef.current.emit('tableStatusChanged');
 }
 };

 const handleCloseAddModal = () => setShowAddModal(false);
 const handleShowAddModal = () => setShowAddModal(true);


 const handleShowEditModal = (table) => {
 setSelectedTable(table);
 setShowEditModal(true);
 }

 const handleCloseEditModal = () => {
 setShowEditModal(false);
 setSelectedTable(null);
 }

 const handleEditTable = async () => {
 try {
 const response = await fetch(`/api/tables/${selectedTable._id}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(selectedTable),
 });

 if (!response.ok) {
 throw new Error('Error updating table');
 }

 handleCloseEditModal();
 fetchTables(sortOrder);
 toast.success('Table updated successfully!');
 } catch (error) {
 toast.error('Error updating table: ' + error.message);
 console.error("Error editing table:", error);
 }
 }

 const handleAddTable = async () => {
 try {
 const response = await fetch('/api/tables', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(newTable),
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
 }

 handleCloseAddModal();
 setNewTable({
 tableNumber: '',
 seatingCapacity: '',
 location: 'Floor 1 Indoor',
 isAvailable: true
 });
 fetchTables(sortOrder);
 emitTableChange();
 toast.success('New table added successfully!');

 } catch (error) {
 toast.error('Error adding table: ' + error.message);
 console.error("Error adding table:", error);
 }
 };

 const fetchReservationInfo = async (tableId) => {
 try {
 const response = await fetch(`/api/reservations/${tableId}`);
 if (!response.ok) {
 throw new Error('Could not fetch reservation info');
 }
 const data = await response.json();

 const tzoffset = (new Date()).getTimezoneOffset() * 60000;
 const localISO = new Date(Date.now() - tzoffset).toISOString().split('T')[0];

 let todayRes = null;
 if (Array.isArray(data)) {
 setAllReservations(data);
 todayRes = data.find(r => r.use_date.startsWith(localISO) && r.status !== 'Cancelled' && r.status !== 'Completed');
 } else {
 setAllReservations([]);
 todayRes = data;
 }
 setReservationInfo(todayRes);
 } catch (error) {
 console.error("Error fetching reservation:", error);
 setReservationInfo(null);
 }
 };

 const handleShowViewModal = (table) => {
 setViewTable(table);
 setShowViewModal(true);
 fetchReservationInfo(table._id);
 };

 const handleCloseViewModal = () => {
 setShowViewModal(false);
 setViewTable(null);
 };

 const handleShowScheduleModal = (table) => {
 setViewTable(table);
 setShowScheduleModal(true);
 };

 const handleCloseScheduleModal = () => {
 setShowScheduleModal(false);
 setViewTable(null);
 };

 const handleCompleteReservation = async (tableId) => {
 if (window.confirm('Are you sure you want to mark this table as completed?')) {
 try {
 await completeReservation(accessToken, tableId);

 fetchTables(sortOrder);
 emitTableChange();
 toast.success('Table status updated successfully!');
 } catch (error) {
 toast.error('Error updating table status: ' + error.message);
 console.error("Error completing reservation:", error);
 }
 }
 };


 const getSlaveTablesForMaster = (masterNumber) => {
 return tables.filter(t => String(t.merged_into) === String(masterNumber)).map(t => t.tableNumber);
 };

 const handleUnmergeTable = async (tableNumber) => {
 if (!window.confirm(`Confirm splitting Table ${tableNumber} to independent?`)) return;
 try {
 await unmergeTable(accessToken, tableNumber);
 toast.success(`Split Table ${tableNumber} successfully!`);
 fetchTables();
 emitTableChange();
 } catch (error) {
 toast.error(error.message || 'Error splitting table');
 console.error("Error unmerging table:", error);
 }
 };

 const handleUnmergeAllSlaves = async (masterTableNumber) => {
 if (!window.confirm(`Confirm unmerging all sub-tables of Table ${masterTableNumber}? All sub-tables will return to Empty status.`)) return;
 try {
 const result = await unmergeAllSlaves(accessToken, masterTableNumber);
 toast.success(result.message);
 fetchTables();
 emitTableChange();
 } catch (error) {
 toast.error(error.message || 'Error unmerging tables');
 console.error("Error unmerging all slaves:", error);
 }
 };

 const handleCancelReservation = async (reservationId) => {
 if (!reservationId) return;
 if (window.confirm('Are you sure you want to cancel this reservation? The table will be freed immediately.')) {
 try {
 await cancelReservation(accessToken, reservationId);
 fetchTables(sortOrder);
 emitTableChange();
 toast.success('Reservation cancelled and table freed successfully!');

 // Update lại viewTable nếu VNDang mở modal
 if (showViewModal && viewTable) {
 fetchReservationInfo(viewTable._id);
 // Cần fetch lại tables list to update status bàn trong viewTable
 const updatedTables = await (await fetch('/api/tables')).json();
 const currentView = updatedTables.find(t => t._id === viewTable._id);
 if (currentView) setViewTable(currentView);
 }
 } catch (error) {
 toast.error('Error cancelling reservation: ' + error.message);
 console.error("Error cancelling reservation:", error);
 }
 }
 };

 const handleStartUsingTable = async (table) => {
 const tableId = table._id;
 let confirmMessage = 'Confirm changing table status to In Use?';
 let isReservationMatch = false;

 // Nếu bàn có lịch VNDặt trong vòng 1 tiếng tới hoặc khách to trễ (VNDã qua giờ VNDặt)
 if (table.nextReservationTime) {
 const now = new Date();
 const resTime = new Date(table.nextReservationTime);
 const diffMs = resTime - now;

 // <= 45 phút (2700000 ms) hoặc VNDã qua giờ
 if (diffMs <= 2700000) {
 isReservationMatch = true;
 const cusName = table.customerName || 'Customer';
 confirmMessage = `"${cusName}" is starting to use the table, correct?`;
 }
 }

 // Dự phòng cho trường hợp trạng thái Reserved mà không bắt VNDược nextReservationTime rõ ràng
 if (!isReservationMatch && table.status === 'Reserved' && table.note === 'Table VNDang giữ chỗ') {
 confirmMessage = 'This table is being reserved for a guest arriving soon. Are you sure you want to start using it?';
 }

 if (window.confirm(confirmMessage)) {
 try {
 const response = await fetch(`/api/tables/${tableId}/start-using`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 }
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.message || 'Error updating table status');
 }

 const updatedTable = await response.json();

 fetchTables(sortOrder);
 emitTableChange();

 // Hiển thị modal thông báo mã PIN mới
 setPinModalData({
 tableNumber: updatedTable.tableNumber,
 session_pin: updatedTable.session_pin || '----',
 issuedAt: new Date().toLocaleString('en-US')
 });
 setShowPinModal(true);
 } catch (error) {
 toast.error('Error updating status: ' + error.message);
 }
 }
 };

 const getStatusColorClass = (status) => {
 switch (status) {
 case 'Empty':
 case 'Empty':
 return 'text-success';
 case 'Reserved':
 case 'Reserved':
 return 'text-warning';
 case 'In Use':
 case 'In Use':
 return 'text-danger';
 default:
 return 'text-secondary';
 }
 };

 const handleMergeBillsSubmit = async () => {
 if (!selectedMergeBillsTable || slaveTablesToMerge.length === 0) {
 toast.warning('Please select at least one table to merge bills!');
 return;
 }
 try {
 const resp = await fetch('/api/payment/merge-bills', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${accessToken}`
 },
 body: JSON.stringify({
 mainTableNumber: selectedMergeBillsTable,
 slaveTableNumbers: slaveTablesToMerge
 })
 });
 const data = await resp.json();
 if (data.success) {
 toast.success('Bills merged successfully!');
 setShowMergeBillsModal(false);
 setSlaveTablesToMerge([]);
 fetchTables();
 } else {
 toast.error(data.message || 'Error merging bills');
 }
 } catch (error) {
 console.error(error);
 toast.error('Connection error while merging bills');
 }
 };

 const handlePaymentRedirect = async (tableNumber) => {
 try {
 const response = await fetch(`/api/order/guest/table/${tableNumber}`);
 const data = await response.json();
 if (response.ok && data && data.length > 0) {
 if (data.length === 1) {
 // Nếu chỉ có 1 khách (1 order), chuyển thẳng to chi tiết order
 navigate(`/staff/order/detail/${data[0].order.id || data[0].order._id}`);
 } else {
 setPaymentMergeOrders(data.map(d => d.order));
 setShowPaymentMergeModal(true);
 }
 } else {
 toast.warning('No unpaid orders found for this table!');
 }
 } catch (e) {
 console.error(e);
 toast.error('Error occurred while fetching order info');
 }
 };

 const handleMergePayments = async () => {
 try {
 const orderIds = paymentMergeOrders.map(o => o._id || o.id);
 const response = await fetch('/api/order/merge', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ orderIds })
 });
 const data = await response.json();
 if (response.ok && data.success) {
 setShowPaymentMergeModal(false);
 navigate(`/staff/order/detail/${data.newOrderId}`);
 } else {
 toast.error(data.message || 'Error merging orders');
 }
 } catch (e) {
 toast.error('Connection error merging orders');
 }
 }

 const renderCountdown = (targetTime) => {
 const diff = new Date(targetTime) - now;
 if (diff <= 0) return <span className="text-danger fw-bold">Time&apos;s up!</span>;
 const hours = Math.floor(diff / 3600000);
 const minutes = Math.floor((diff % 3600000) / 60000);
 const seconds = Math.floor((diff % 60000) / 1000);
 return (
 <span className="countdown-timer text-danger fw-bold">
 {hours > 0 ? `${hours}:` : ''}{minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
 </span>
 );
 };

 const highlight = (text) => {
 if (!debouncedSearch) return text;
 const lowerSearch = debouncedSearch.toLowerCase().trim();
 const strText = String(text);
 if (!strText.toLowerCase().includes(lowerSearch)) return text;

 const parts = strText.split(new RegExp(`(${lowerSearch})`, 'gi'));
 return parts.map((part, index) =>
 part.toLowerCase() === lowerSearch ? (
 <mark key={index} style={{ backgroundColor: '#ffef9ad1', padding: '0 2px', borderRadius: '2px' }}>{part}</mark>
 ) : part
 );
 };

 if (error) {
 return <div className="alert alert-danger">{error}</div>;
 }

 return (
 <div className="staff-management block-category ps-0 pt-0">
 <div className="staff-management__header d-flex justify-content-between align-items-center mb-4 px-0">
 <h2 className="title-admin mb-0" style={{ fontSize: '24px', fontWeight: '700', color: '#c5a059', marginLeft: '0', paddingLeft: '0' }}>Table Management
 <style>{`.title-admin::after { display: none !important; }`}</style> </h2>
 <div className="d-flex align-items-center gap-2">
 <Form.Select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 style={{ width: '160px' }}
 className="bg-dark text-white border-secondary-subtle shadow-none"
 >
 <option value="All">All Status</option>
 <option value="Empty">Empty</option>
 <option value="Reserved">Reserved</option>
 <option value="In Use">In Use</option>
 </Form.Select>

 <div className="search-container" style={{ width: '350px' }}>
 <InputGroup className="shadow-sm rounded">
 <InputGroup.Text className="bg-dark text-white border-end-0 border-secondary-subtle">
 <FaSearch className="text-muted" />
 </InputGroup.Text>
 <Form.Control
 type="text"
 placeholder="Search table, booking code..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="border-start-0 border-secondary-subtle ps-1 shadow-none"
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 setDebouncedSearch(searchTerm);
 const lowerSearch = searchTerm.toLowerCase().trim();
 if (!lowerSearch) return;
 const instantMatch = tables.filter(table => {
 if (statusFilter !== 'All' && table.status !== statusFilter) return false;
 if (/^\d+$/.test(lowerSearch)) return String(table.tableNumber).includes(lowerSearch);
 const codes = (table.reservationList || []).map(r => (r.confirmationCode || '').toLowerCase());
 return codes.some(code => code.includes(lowerSearch));
 });
 if (instantMatch.length > 0) handleShowViewModal(instantMatch[0]);
 }
 }}
 />
 {searchTerm && (
 <InputGroup.Text
 className="bg-dark text-white border-start-0 cursor-pointer border-secondary-subtle"
 onClick={handleClearSearch}
 >
 <IoMdClose className="text-secondary" />
 </InputGroup.Text>
 )}
 </InputGroup>
 </div>
 <button
 className="btn btn-outline-secondary d-flex align-items-center gap-2"
 onClick={() => {
 const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
 setSortOrder(nextOrder);
 fetchTables(nextOrder);
 }}
 style={{ height: '40px', borderRadius: '8px', border: '1px solid #dee2e6' }}
 title={sortOrder === 'desc' ?"Sort: Capacity High -> Low" :"Sort: Capacity Low -> High"}
 >
 {sortOrder === 'asc' ? <FaSortAmountUp className="text-success" /> : <FaSortAmountDownAlt className="text-success" />}
 Capacity ({sortOrder === 'desc' ?"High → Low" :"Low → High"})
 </button>
 <Button
 className="btn-add d-flex align-items-center gap-2 ms-2"
 onClick={handleShowAddModal}
 style={{ backgroundColor: '#c5a059', border: 'none', padding: '10px 22px', fontWeight: '700', color: '#000' }}
 >
 <FaPlus /> Add New Table
 </Button>
 </div>
 </div>

 <ToastContainer position="top-right" autoClose={1000} />

 {/* Modal Add */}
 <Modal show={showAddModal} onHide={handleCloseAddModal}>
 <Modal.Header closeButton>
 <Modal.Title>Add Table</Modal.Title>
 </Modal.Header>
 <Modal.Body>
 <Form>
 <Form.Group className="mb-3">
 <Form.Label>Table No.</Form.Label>
 <Form.Control
 type="text"
 value={newTable.tableNumber}
 onChange={e => setNewTable({
 ...newTable,
 tableNumber: e.target.value
 })}
 required
 />
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Label>Capacity</Form.Label>
 <Form.Control
 type="number"
 min="1"
 value={newTable.seatingCapacity}
 onChange={e => setNewTable({
 ...newTable,
 seatingCapacity: Math.max(1, parseInt(e.target.value) || 1)
 })}
 required
 />
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Label>Location</Form.Label>
 <Form.Select
 value={newTable.location}
 onChange={e => setNewTable({
 ...newTable,
 location: e.target.value
 })}
 required
 >
 <option value="1st Floor Indoor">1st Floor Indoor</option>
 <option value="2nd Floor Indoor">2nd Floor Indoor</option>
 <option value="1st Floor Outdoor">1st Floor Outdoor</option>
 <option value="2nd Floor Outdoor">2nd Floor Outdoor</option>
 </Form.Select>
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Check
 type="checkbox"
 label="Available"
 checked={newTable.isAvailable}
 onChange={e => setNewTable({
 ...newTable,
 isAvailable: e.target.checked
 })}
 />
 </Form.Group>
 </Form>
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={handleCloseAddModal}>
 Close
 </Button>
 <Button
 variant="primary"
 onClick={handleAddTable}
 disabled={!newTable.tableNumber || !newTable.seatingCapacity}
 >
 Save
 </Button>
 </Modal.Footer>
 </Modal>

 {loading ? (
 <div className="text-center mt-4">
 <div className="spinner-border text-primary" role="status">
 <span className="visually-hidden">Loading...</span>
 </div>
 </div>
 ) : filteredTables.length === 0 ? (
 <div className="alert alert-info text-center mt-4">
 No data found
 </div>
 ) : (
 <>
 <Table variant="dark" striped bordered hover className="mt-3 text-center align-middle">
 <thead className="table-dark">
 <tr>
 <th style={{ width: '100px' }}>Table No.</th>
 <th style={{ width: '150px' }}>Status</th>
 <th style={{ width: '100px' }}>Capacity</th>
 <th style={{ width: '100px' }}>Config</th>
 <th style={{ width: '100px' }}>Schedule</th>
 <th style={{ width: '400px' }}>Actions</th>
 <th style={{ width: '90px' }}>PIN</th>
 <th style={{ width: '200px' }}>Note</th>
 </tr>
 </thead>
 <tbody>
 {currentTables.map((table) => (
 <tr key={table._id}>
 <td>
 <div className="d-flex align-items-center justify-content-center gap-2">
 {isMultiPayMode && table.status === 'In Use' && table.hasOrders && !table.isPaid && !table.merged_into && (
 <Form.Check
 type="checkbox"
 checked={selectedMultiPayTables.includes(table.tableNumber)}
 onChange={(e) => {
 if (e.target.checked) {
 setSelectedMultiPayTables([...selectedMultiPayTables, table.tableNumber]);
 } else {
 setSelectedMultiPayTables(selectedMultiPayTables.filter(t => t !== table.tableNumber));
 }
 }}
 title="Select for multi-payment"
 style={{ transform: 'scale(1.2)' }}
 />
 )}
 <div className="fw-300" style={{ fontSize: '1.1rem' }}>
 Table {highlight(table.tableNumber, true)}
 </div>
 </div>
 {table.reservationNote && !table.merged_into && (
 <div className="mt-1 text-muted" style={{ fontSize: '13px', fontStyle: 'italic' }}>
 (Note: {table.reservationNote})
 </div>
 )}
 {table.merged_into && (
 <div className="mt-1 d-flex justify-content-center">
 <span className="badge rounded-pill bg-secondary text-secondary border d-flex align-items-center gap-1 shadow-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>
 <FaLink style={{ fontSize: '10px' }} /> Merged → Table {table.merged_into}
 </span>
 </div>
 )}
 {getSlaveTablesForMaster(table.tableNumber).length > 0 && (
 <div className="mt-1 d-flex justify-content-center">
 <span className="badge rounded-pill d-flex align-items-center gap-1 shadow-sm" style={{ backgroundColor: '#1a1a1a', color: '#c5a059', border: '1px solid #c5a059', padding: '4px 10px', fontSize: '11px' }}>
 <FaCrown style={{ color: '#ffd700', fontSize: '13px' }} /> MASTER
 <small className="ms-1" style={{ opacity: 1, fontSize: '13px' }}>({getSlaveTablesForMaster(table.tableNumber).join(', ')})</small>
 </span>
 </div>
 )}
 </td>
 <td className="text-start ps-4">
 <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '14px' }}>
 <FaCircle className={getStatusColorClass(table.status)} style={{ fontSize: '8px' }} />
 <span className={getStatusColorClass(table.status)}>
 {table.status === 'Empty' ? 'Empty' : 
 table.status === 'Reserved' ? 'Reserved' : 
 table.status === 'In Use' ? 'In Use' : table.status}
 </span>
 </div>
 </td>
 <td>{highlight(table.seatingCapacity, true)}</td>
 <td>
 <div className="d-flex align-items-center justify-content-center gap-1">
 <button className="btn btn-sm btn-link p-1" title="Table config & QR" onClick={() => handleShowViewModal(table)}>
 <FaRegIdCard className='icon-view fs-5 text-info' />
 </button>
 <button className="btn btn-sm btn-link p-1" title="Edit stats" onClick={() => handleShowEditModal(table)}>
 <FaRegEdit className='icon-update fs-5 text-success' />
 </button>
 </div>
 </td>
 <td>
 <div className="d-flex align-items-center justify-content-center">
 <button className="btn btn-sm btn-link p-1" title="Booking Schedule" onClick={() => handleShowScheduleModal(table)}>
 <FaCalendarAlt className='fs-5 text-primary' />
 </button>
 </div>
 </td>
 <td className="text-start">
 <div className="d-flex align-items-center justify-content-start gap-2">
 {table.merged_into && (
 <Button
 variant="secondary"
 size="sm"
 onClick={() => handleUnmergeTable(table.tableNumber)}
 className="fw-500 text-white"
 style={{ fontSize: '11px', borderRadius: '20px', minWidth: '90px' }}
 >
 Split Table
 </Button>
 )}

 {!table.merged_into && (
 <Button
 variant="info"
 size="sm"
 onClick={() => {
 setSelectedTable(table);
 setShowMergeModal(true);
 setMergeToTable('');
 }}
 className="fw-500 text-white"
 style={{ fontSize: '11px', borderRadius: '20px', minWidth: '90px' }}
 >
 Merge Table
 </Button>
 )}

 {table.status === 'In Use' && !table.merged_into && (
 <>
 {getSlaveTablesForMaster(table.tableNumber).length > 0 ? (
 <Button
 variant="danger"
 size="sm"
 onClick={() => handleUnmergeAllSlaves(table.tableNumber)}
 className="fw-500 text-white"
 style={{ fontSize: '11px', borderRadius: '20px', minWidth: '90px' }}
 title="Free all sub-tables merged into this table"
 >
 Unmerge All
 </Button>
 ) : (
 <Button
 variant="dark"
 size="sm"
 onClick={() => { setSelectedTable(table); setShowMoveModal(true); setMoveToTable(''); }}
 className="fw-500 text-white"
 style={{ fontSize: '11px', borderRadius: '20px', minWidth: '90px' }}
 >
 Move Table
 </Button>
 )}
 </>
 )}

 {(table.status === 'In Use') && !table.merged_into && table.hasOrders && !table.isPaid && (
 <>
 <Button
 variant="primary"
 size="sm"
 onClick={() => handlePaymentRedirect(table.tableNumber)}
 className="fw-bold text-white mb-1"
 style={{ fontSize: '11px', borderRadius: '20px', padding: '4px 10px', minWidth: '90px' }}
 >
 Payment
 </Button>
 </>
 )}

 {(table.status === 'Empty' || table.status === 'Reserved' || table.status === 'Completed') && !table.merged_into && getSlaveTablesForMaster(table.tableNumber).length === 0 && (
 <Button
 variant="warning"
 size="sm"
 onClick={() => handleStartUsingTable(table)}
 className="fw-500"
 style={{ fontSize: '12px', borderRadius: '20px', minWidth: '90px' }}
 >
 Use
 </Button>
 )}

 {table.status === 'In Use' && !table.merged_into && (
 <Button
 variant="success"
 size="sm"
 onClick={() => handleCompleteReservation(table._id)}
 className={`fw-500 ${table.isPaid ? 'pulse-button' : ''}`}
 style={{ fontSize: '12px', borderRadius: '20px', minWidth: '90px' }}
 title={table.isPaid ?"Payment done, clear table for new guests" :"Confirm guest is done, clear table and reset PIN"}
 >
 Clear Table
 </Button>
 )}

 {table.status === 'Reserved' && (
 <Button
 variant="outline-danger"
 size="sm"
 onClick={() => handleCancelReservation(table.activeReservationId)}
 className="fw-500"
 style={{ fontSize: '11px', borderRadius: '20px', minWidth: '90px' }}
 >
 Cancel Res
 </Button>
 )}
 </div>
 </td>
 <td>
 {table.status === 'In Use' && table.session_pin ? (
 <span
 className="badge bg-dark text-white p-1 border"
 style={{ letterSpacing: '2px', fontSize: '1rem', cursor: 'pointer' }}
 title="Click to print PIN receipt"
 onClick={() => {
 setPinModalData({
 tableNumber: table.tableNumber,
 session_pin: table.session_pin,
 issuedAt: new Date().toLocaleString('en-US')
 });
 setShowPrintPinView(true);
 }}
 >
 {table.session_pin}
 </span>
 ) : (
 <span className="text-muted">---</span>
 )}
 </td>
 <td className="text-start">
 <div className="d-flex flex-column">
 <span style={{ color: table.isPaid ? '#d2b48c' : '#a0a0a0', fontSize: '13px', fontWeight: table.isPaid ? '700' : 'normal' }}>
 {table.note}
 {table.confirmationCode && (
 <span className="d-block mt-1">
 Booking Code: <strong>{highlight(table.confirmationCode, false)}</strong>
 </span>
 )}
 </span>
 {table.nextReservationTime && (
 <div className="mt-1" style={{ fontSize: '14px' }}>
 {renderCountdown(table.note === 'Table VNDang giữ chỗ' ? table.holdExpiryTime : table.nextReservationTime)}
 </div>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </Table>

 <div className="d-flex justify-content-end mb-3 mt-3">
 {!isMultiPayMode ? (
 <Button
 variant="outline-primary"
 className="fw-bold px-4 rounded-pill shadow-sm"
 onClick={() => setIsMultiPayMode(true)}
 style={{ border: '2px solid #0d6efd' }}
 >
 Payment nhiều bàn
 </Button>
 ) : (
 <div className="bg-dark text-white p-2 px-3 rounded shadow-sm border border-primary d-flex align-items-center gap-3">
 <div className="fw-bold text-primary">Đã chọn {selectedMultiPayTables.length} bàn</div>
 <Button
 variant="primary"
 size="sm"
 className="fw-bold px-3 rounded-pill"
 disabled={selectedMultiPayTables.length < 2}
 onClick={() => {
 navigate(`/staff/order/multi-payment?tables=${selectedMultiPayTables.join(',')}`);
 }}
 >
 Payment chung
 </Button>
 <Button
 variant="outline-secondary"
 size="sm"
 className="rounded-circle p-1"
 onClick={() => {
 setSelectedMultiPayTables([]);
 setIsMultiPayMode(false);
 }}
 style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
 >
 <IoMdClose size={14} />
 </Button>
 </div>
 )}
 </div>

 {totalPages > 1 && (
 <div className="admin-pagination">
 <button
 disabled={currentPage === 1}
 onClick={() => setCurrentPage(currentPage - 1)}
 >
 Prev
 </button>

 {(() => {
 const maxVisiblePages = 5;
 const currentGroup = Math.ceil(currentPage / maxVisiblePages);
 const startPage = (currentGroup - 1) * maxVisiblePages + 1;
 const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
 const pageNumbers = [];
 for (let i = startPage; i <= endPage; i++) {
 pageNumbers.push(
 <button
 key={i}
 className={currentPage === i ? 'active' : ''}
 onClick={() => setCurrentPage(i)}
 >
 {i}
 </button>
 );
 }
 return pageNumbers;
 })()}

 <button
 disabled={currentPage === totalPages}
 onClick={() => setCurrentPage(currentPage + 1)}
 >
 Next
 </button>
 </div>
 )}
 </>
 )}

 {/* Modal Select Payment */}
 <Modal show={showPaymentMergeModal} onHide={() => setShowPaymentMergeModal(false)} centered size="lg">
 <Modal.Header closeButton className="bg-primary text-white">
 <Modal.Title>Payment Table {paymentMergeOrders[0]?.table_number}</Modal.Title>
 </Modal.Header>
 <Modal.Body>
 <div className="alert alert-info">
 This table has <strong>{paymentMergeOrders.length}</strong> active order sessions. Please select a customer to pay or merge all.
 </div>

 <Table variant="dark" hover responsive className="mt-3 align-middle">
 <thead className="table-dark">
 <tr>
 <th>Customers</th>
 <th>Số món</th>
 <th>Total tiền</th>
 <th className="text-center">Actions</th>
 </tr>
 </thead>
 <tbody>
 {paymentMergeOrders.map((order, idx) => (
 <tr key={idx}>
 <td className="fw-bold">{order.guest_name || 'Guest walk-in'}</td>
 <td>{order.total_item}</td>
 <td className="text-danger fw-bold">{order.total_price.toLocaleString()} VND</td>
 <td className="text-center">
 <Button
 variant="success"
 size="sm"
 onClick={() => navigate(`/staff/order/detail/${order._id || order.id}`)}
 >
 Pay separately
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </Table>
 </Modal.Body>
 <Modal.Footer className="justify-content-between">
 <Button variant="outline-secondary" onClick={() => setShowPaymentMergeModal(false)}>
 Close
 </Button>
 <Button variant="primary" onClick={handleMergePayments} disabled={paymentMergeOrders.length < 2}>
 Merge all & Pay together
 </Button>
 </Modal.Footer>
 </Modal>

 {/* Modal Edit */}
 <Modal show={showEditModal} onHide={handleCloseEditModal}>
 <Modal.Header closeButton>
 <h4 style={{ color: '#c5a059', fontFamily:"'Playfair Display', serif" }}>Edit bàn {selectedTable?.tableNumber}</h4>
 </Modal.Header>
 <Modal.Body>
 {selectedTable && (
 <Form>
 <Form.Group className="mb-3">
 <Form.Label>Table No.</Form.Label>
 <Form.Control
 type="text"
 value={selectedTable.tableNumber}
 onChange={e => setSelectedTable({
 ...selectedTable,
 tableNumber: e.target.value
 })}
 required
 />
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Label>Capacity</Form.Label>
 <Form.Control
 type="number"
 min="1"
 value={selectedTable.seatingCapacity}
 onChange={e => setSelectedTable({
 ...selectedTable,
 seatingCapacity: Math.max(1, parseInt(e.target.value) || 1)
 })}
 required
 />
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Label>Location</Form.Label>
 <Form.Select
 value={selectedTable.location}
 onChange={e => setSelectedTable({
 ...selectedTable,
 location: e.target.value
 })}
 required
 >
 <option value="1st Floor Indoor">1st Floor Indoor</option>
 <option value="2nd Floor Indoor">2nd Floor Indoor</option>
 <option value="1st Floor Outdoor">1st Floor Outdoor</option>
 <option value="2nd Floor Outdoor">2nd Floor Outdoor</option>
 </Form.Select>
 </Form.Group>
 <Form.Group className="mb-3">
 <Form.Check
 type="checkbox"
 label="Available"
 checked={selectedTable.isAvailable}
 onChange={e => setSelectedTable({
 ...selectedTable,
 isAvailable: e.target.checked
 })}
 />
 </Form.Group>
 </Form>
 )}
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={handleCloseEditModal}>
 Close
 </Button>
 <Button variant="primary" onClick={handleEditTable}>
 Save
 </Button>
 </Modal.Footer>
 </Modal>

 <Modal show={showMergeModal} onHide={() => setShowMergeModal(false)} centered>
 <Modal.Header closeButton style={{ backgroundColor: '#f8fafc' }}>
 <Modal.Title className="fw-bold" style={{ color: '#c5a059', fontSize: '18px' }}>
 Gộp thêm bàn vào Table {selectedTable?.tableNumber}
 </Modal.Title>
 </Modal.Header>
 <Modal.Body>
 {selectedTable && (
 <div className="master-table-info bg-secondary p-3 rounded mb-4 border">
 <h6 className="fw-bold text-secondary mb-3"><FaUtensils className="me-2" />Thông tin bàn chính (Master)</h6>
 <div className="d-flex justify-content-between mb-2">
 <span>Table No.:</span>
 <span className="fw-bold">Table {selectedTable.tableNumber}</span>
 </div>
 <div className="d-flex justify-content-between mb-2">
 <span>Capacity:</span>
 <span>{selectedTable.seatingCapacity} người</span>
 </div>
 <div className="d-flex justify-content-between">
 <span>Location:</span>
 <span>{selectedTable.location}</span>
 </div>
 </div>
 )}

 <Form.Group>
 <Form.Label className="fw-500"><FaPlus className="me-2 text-success" />Select bàn phụ cần gộp vào (Slave)</Form.Label>
 <Form.Select
 value={mergeToTable}
 onChange={(e) => setMergeToTable(e.target.value)}
 className="shadow-sm"
 style={{ borderRadius: '10px', padding: '10px' }}
 >
 <option value="">-- Select bàn trống --</option>
 {tables.filter(t =>
 t.status === 'Empty' &&
 !t.merged_into &&
 t.tableNumber !== selectedTable?.tableNumber
 ).map(t => (
 <option key={t._id} value={t.tableNumber}>
 Table {t.tableNumber} - Capacity: {t.seatingCapacity} - {t.location}
 </option>
 ))}
 </Form.Select>
 <Form.Text className="text-muted mt-2 d-block">
 * Chỉ những bàn VNDang <strong>Empty</strong> mới có thể gộp vào bàn in use.
 </Form.Text>
 </Form.Group>
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={() => setShowMergeModal(false)}>Close</Button>
 <Button variant="primary" onClick={async () => {
 if (!mergeToTable) return toast.error('Please select bàn VNDích!');
 try {
 const response = await fetch('/api/tables/merge', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${accessToken}`
 },
 body: JSON.stringify({
 fromTable: mergeToTable, // Table Slave (chọn từ list)
 toTable: selectedTable.tableNumber // Table Master (bàn click nút)
 })
 });
 const data = await response.json();
 if (data.success) {
 toast.success(data.message);
 setShowMergeModal(false);
 fetchTables();
 emitTableChange();
 } else {
 toast.error(data.message || 'Error gộp bàn');
 }
 } catch (e) {
 toast.error('Error kết nối server');
 }
 }}>Thực hiện gộp</Button>
 </Modal.Footer>
 </Modal>

 {/* Modal Configuration bàn & QR */}
 <Modal show={showViewModal} onHide={handleCloseViewModal} centered size="md">
 <Modal.Header closeButton>
 <Modal.Title className="title-admin text-info">
 Configuration bàn {viewTable?.tableNumber}
 </Modal.Title>
 </Modal.Header>
 <Modal.Body>
 {viewTable && (
 <div className="table-details text-center">
 <div className="bg-secondary p-3 rounded mb-4 text-start">
 <div className="mb-2"><strong>Table No.:</strong> Table {viewTable.tableNumber}</div>
 <div className="mb-2"><strong>Status:</strong>
 <span className={`ms-2 fw-bold ${getStatusColorClass(viewTable.status)}`}>
 <FaCircle className="me-1" style={{ fontSize: '8px' }} />
 {viewTable.status}
 </span>
 </div>
 <div className="mb-2"><strong>Capacity:</strong> {viewTable.seatingCapacity} người</div>
 <div className="mb-0"><strong>Location:</strong> {viewTable.location}</div>
 </div>

 <div className="qr-container bg-dark text-white p-4 rounded shadow-sm d-inline-block">
 <h6 className="fw-bold mb-3 text-secondary">Mã QR Gọi món</h6>
 <QRCodeSVG
 value={`${CLIENT_URL}/menu?table=${viewTable.tableNumber}`}
 size={200}
 level="H"
 includeMargin={true}
 />
 <p className="mt-2 text-muted small">Guest quét mã to truy cập menu</p>
 <Button
 variant="outline-primary"
 size="sm"
 className="mt-2"
 onClick={() => window.print()}
 >
 In mã QR
 </Button>
 </div>
 </div>
 )}
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={handleCloseViewModal}>Close</Button>
 </Modal.Footer>
 </Modal>

 {/* Modal Booking Schedule */}
 <Modal show={showScheduleModal} onHide={handleCloseScheduleModal} size="lg" centered>
 <Modal.Header closeButton className="bg-primary text-white">
 <Modal.Title>
 Booking Schedule {viewTable?.tableNumber}
 </Modal.Title>
 </Modal.Header>
 <Modal.Body>
 {viewTable && (
 <div className="reservation-scroll-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
 <AntTable
 dataSource={[...(viewTable.reservationList || [])].sort((a, b) => {
 const statusOrder = { 'In Use': 1, 'Reserved': 2, 'Completed': 3, 'Cancelled': 4 };
 if (statusOrder[a.status] !== statusOrder[b.status]) {
 return statusOrder[a.status] - statusOrder[b.status];
 }
 // Cùng trạng thái thì sắp xếp theo thời gian (gần hiện tại nhất lên VNDầu)
 return new Date(a.reservationTime) - new Date(b.reservationTime);
 })}
 pagination={false}
 rowKey="_id"
 sticky={true}
 columns={[
 {
 title: 'Booking Code',
 dataIndex: 'confirmationCode',
 key: 'confirmationCode',
 render: (text) => <span className="fw-bold text-primary">{text}</span>
 },
 {
 title: 'Customers',
 dataIndex: 'customerName',
 key: 'customerName',
 render: (text) => <span className="fw-bold">{text || 'Guest walk-in'}</span>
 },
 {
 title: 'Phone Number',
 dataIndex: 'phoneNumber',
 key: 'phoneNumber',
 },
 {
 title: 'Thời gian',
 key: 'time',
 render: (_, record) => (
 <div>
 <div className="fw-bold">{new Date(record.use_date).toLocaleDateString('vi-VN')}</div>
 <div className="text-muted small">{new Date(record.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
 </div>
 )
 },
 {
 title: 'Status',
 dataIndex: 'status',
 key: 'status',
 render: (status) => {
 let color = 'blue';
 if (status === 'Reserved') color = 'orange';
 if (status === 'In Use') color = 'red';
 if (status === 'Completed') color = 'green';
 if (status === 'Cancelled') color = 'default';
 return <Tag color={color}>{status}</Tag>
 }
 }
 ]}
 />
 </div>
 )}
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={handleCloseScheduleModal}>Close</Button>
 </Modal.Footer>
 </Modal>

 {/* Modal Chuyển Table */}
 <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)}>
 <Modal.Header closeButton>
 <h4 style={{ color: '#007bff' }}>Transfer Table {selectedTable?.tableNumber}</h4>
 </Modal.Header>
 <Modal.Body>
 <div className="alert alert-warning">
 Order data and sessions will be moved to the new table.
 </div>
 <Form.Group>
 <Form.Label>Select an empty table to move to</Form.Label>
 <Form.Select
 value={moveToTable}
 onChange={(e) => setMoveToTable(e.target.value)}
 >
 <option value="">-- Select bàn trống --</option>
 {tables.filter(t =>
 t.status === 'Empty' &&
 !t.merged_into &&
 t.tableNumber !== selectedTable?.tableNumber
 ).map(t => (
 <option key={t._id} value={t.tableNumber}>
 Table {t.tableNumber} - {t.location}
 </option>
 ))}
 </Form.Select>
 </Form.Group>
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={() => setShowMoveModal(false)}>Close</Button>
 <Button variant="success" onClick={async () => {
 if (!moveToTable) return toast.error('Please select bàn VNDích!');
 try {
 const response = await fetch('/api/tables/move-table', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${accessToken}`
 },
 body: JSON.stringify({
 fromTable: selectedTable.tableNumber,
 toTable: moveToTable
 })
 });
 const data = await response.json();
 if (data.success) {
 toast.success(data.message);
 setShowMoveModal(false);
 fetchTables();
 emitTableChange();
 } else {
 toast.error(data.message || 'Error khi chuyển bàn');
 }
 } catch (e) {
 toast.error('Error kết nối server');
 }
 }}>Confirm chuyển</Button>
 </Modal.Footer>
 </Modal>
 <Modal show={showMergeBillsModal} onHide={() => { setShowMergeBillsModal(false); setSlaveTablesToMerge([]); }}>
 <Modal.Header closeButton>
 <Modal.Title>Gộp Hóa Đơn - Table {selectedMergeBillsTable}</Modal.Title>
 </Modal.Header>
 <Modal.Body>
 <div className="alert alert-info">
 Select các bàn khác to gộp chung hóa order. (Sẽ thanh toán một lần tại Table {selectedMergeBillsTable})
 </div>
 <Form.Group>
 <Form.Label>Select các bàn cần gộp</Form.Label>
 <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
 {tables.filter(t =>
 t.status === 'In Use' &&
 !t.merged_into &&
 t.hasOrders &&
 !t.isPaid &&
 t.tableNumber !== selectedMergeBillsTable
 ).map(t => (
 <Form.Check
 key={t._id}
 type="checkbox"
 id={`merge-bill-${t.tableNumber}`}
 label={`Table ${t.tableNumber} - ${t.location}`}
 checked={slaveTablesToMerge.includes(t.tableNumber)}
 onChange={(e) => {
 if (e.target.checked) {
 setSlaveTablesToMerge([...slaveTablesToMerge, t.tableNumber]);
 } else {
 setSlaveTablesToMerge(slaveTablesToMerge.filter(tb => tb !== t.tableNumber));
 }
 }}
 />
 ))}
 {tables.filter(t =>
 t.status === 'In Use' &&
 !t.merged_into &&
 t.hasOrders &&
 !t.isPaid &&
 t.tableNumber !== selectedMergeBillsTable
 ).length === 0 && (
 <div className="text-muted fst-italic">No other tables in use can be merged.</div>
 )}
 </div>
 </Form.Group>
 </Modal.Body>
 <Modal.Footer>
 <Button variant="secondary" onClick={() => { setShowMergeBillsModal(false); setSlaveTablesToMerge([]); }}>Close</Button>
 <Button variant="primary" onClick={handleMergeBillsSubmit}>Confirm Gộp Bill</Button>
 </Modal.Footer>
 </Modal>
 {/* Modal Notification PIN Code */}
 <Modal show={showPinModal} onHide={() => setShowPinModal(false)} centered backdrop="static">
 <Modal.Header closeButton className="bg-dark text-white text-primary">
 <Modal.Title className="fs-5 bg-dark text-white text-primary">Notification PIN Code</Modal.Title>
 </Modal.Header>
 <Modal.Body className="text-center pt-0 pb-0">
 <h5 className="mb-3">Table {pinModalData.tableNumber} VNDã sẵn sàng!</h5>
 <div className="p-3 bg-secondary rounded border mb-3">
 <span className="fs-1 fw-bold text-primary" style={{ letterSpacing: '4px' }}>
 {pinModalData.session_pin}
 </span>
 </div>
 </Modal.Body>
 <Modal.Footer className="justify-content-center">
 <Button variant="outline-secondary" onClick={() => setShowPinModal(false)} style={{ minWidth: '120px' }}>
 Close
 </Button>
 <Button
 variant="primary"
 onClick={() => {
 setShowPinModal(false);
 setShowPrintPinView(true);
 }}
 style={{ minWidth: '120px' }}
 >
 Cấp mã PIN
 </Button>
 </Modal.Footer>
 </Modal>

 {/* Modal In PIN Code */}
 <Modal show={showPrintPinView} onHide={() => setShowPrintPinView(false)} size="md-2" centered>
 <Modal.Header closeButton className="border-0 pb-0">
 </Modal.Header>
 <Modal.Body className="pt-0" id="printable-pin">
 <div className="text-center pt-0" style={{ fontFamily: 'monospace' }}>
 <h5 className="fw-bold mb-1">MÃ TRUY CẬP BÀN {pinModalData.tableNumber} </h5>
 <div className="mb-3" style={{ fontSize: '0.85rem' }}>
 <span>Time cấp: {pinModalData.issuedAt}</span>
 </div>
 <hr className="my-2" />
 <span className="fs-1 fw-bold p-4 px-4 rounded" style={{ letterSpacing: '4px' }}>
 {pinModalData.session_pin}
 </span>
 </div>
 <hr className="my-2" />
 <div className="text-muted text-center" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
 * Note: Không cung cấp mã PIN bàn cho người lạ
 </div>
 </Modal.Body>
 <Modal.Footer className="border-0 pt-0 justify-content-center">
 <Button variant="dark" size="sm" onClick={() => {
 const printContent = document.getElementById('printable-pin').innerHTML;
 const printWindow = window.open('', '_blank');
 printWindow.document.write(`
 <html>
 <head>
 <title>In mã PIN - Table ${pinModalData.tableNumber}</title>
 <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
 <style>
 @page { size: 80mm auto; margin: 0; }
 body { 
 padding: 5mm; 
 width: 80mm; 
 margin: 0; 
 font-family: 'Courier New', Courier, monospace;
 }
 .fs-3 { font-size: 1.5rem !important; }
 .fs-1 { font-size: 2.2rem !important; }
 hr { border-top: 1px dashed #000; opacity: 1; }
 @media print {
 .no-print { display: none; }
 }
 </style>
 </head>
 <body onload="window.print(); window.close();">
 <div style="width: 100%; overflow: hidden;">
 ${printContent}
 </div>
 </body>
 </html>
 `);
 printWindow.document.close();
 }}>
 In phiếu PIN
 </Button>
 </Modal.Footer>
 </Modal>
 </div >
 );
};

export default TableManagement;