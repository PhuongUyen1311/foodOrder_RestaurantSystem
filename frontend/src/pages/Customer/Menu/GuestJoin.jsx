import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function GuestJoin({ show, tableNumber, onJoined }) {
    const [guests, setGuests] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [selectedGuest, setSelectedGuest] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [pin, setPin] = useState('');
    const [step, setStep] = useState(1); // 1: PIN, 2: Info
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    useEffect(() => {
        if (show && tableNumber) {
            // Load user profile if logged in
            if (user && user.first_name) {
                setNewUsername(user.first_name + ' ' + user.last_name);
                setPhoneCode(user.phone || '');
            }

            fetch(`/api/order/guest/table/${tableNumber}/active-guests`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.guests) {
                        setGuests(data.guests);
                    }
                });
            const savedSession = sessionStorage.getItem('guest_session');
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    if (parsed.table === tableNumber && parsed.username && parsed.code) {
                        onJoined(parsed.username, parsed.code, parsed.sessionId);
                    }
                } catch (e) { }
            }
        }
    }, [show, tableNumber]);

    const handleNextStep = async () => {
        if (!pin || pin.length < 4) {
            alert('Please enter VNDủ 4 số PIN');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/tables/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableNumber, pin })
            });
            const data = await response.json();
            if (data.success) {
                setStep(2);
            } else {
                alert(data.message || 'PIN Code không chính xác');
            }
        } catch (error) {
            alert('Error kết nối xác thực PIN');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        // Validate phone number (Vietnamese format: 10 digits starting with 0)
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (!phoneCode || !phoneRegex.test(phoneCode)) {
            alert('Please enter số phone hợp lệ (10 chữ số, ví dụ: 0912345678)');
            return;
        }

        let username = selectedGuest || newUsername;

        setLoading(true);
        try {
            const payload = {
                tableNumber: tableNumber,
                username: username,
                phoneCode: phoneCode,
                pin: pin
            };

            const response = await fetch('/api/order/guest/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                if (data.needName) {
                    // Cần nhập tên vì số phone này mới toanh
                    setStep(2);
                    setLoading(false);
                    return;
                }

                if (data.suggestedName && !username) {
                    // Tìm thấy tên cũ, hỏi khách có muốn dùng không
                    if (window.confirm(`Chào mừng bạn quay lại! Bạn có phải là ${data.suggestedName} không?`)) {
                        setNewUsername(data.suggestedName);
                        // Gọi lại handleJoin với tên VNDã chọn
                        setLoading(false);
                        // Trigger join lại với tên vừa confirm
                        const retryPayload = { ...payload, username: data.suggestedName };
                        const retryRes = await fetch('/api/order/guest/join', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(retryPayload)
                        });
                        const retryData = await retryRes.json();
                        if (retryData.success) {
                            finalizeJoin(retryData);
                        }
                        return;
                    } else {
                        // Guest muốn dùng tên khác
                        setStep(2);
                        setLoading(false);
                        return;
                    }
                }

                finalizeJoin(data);
            } else {
                alert(data.message || 'Error xác thực');
            }
        } catch (error) {
            console.error(error);
            alert('Error kết nối !');
        } finally {
            setLoading(false);
        }
    };

    const finalizeJoin = (data) => {
        const sessionObj = {
            table: tableNumber,
            username: data.username,
            code: data.code,
            sessionId: data.sessionId
        };

        // Nếu backend trả về tên khác với tên khách vừa nhập (do trùng số phone)
        let nameToUse = selectedGuest || newUsername;
        if (nameToUse && data.username !== nameToUse) {
            alert(`Phone Number này has been VNDăng ký với tên "${data.username}". System sẽ tiếp tục dùng tên này.`);
        }

        sessionStorage.setItem('guest_session', JSON.stringify(sessionObj));
        onJoined(data.username, data.code, data.sessionId);
    };

    const handleLogin = () => {
        navigate('/login');
    }

    return (
        <Modal show={show} backdrop="static" keyboard={false} centered className="guest-join-modal">
            <style>
                {`
                    .guest-join-modal .modal-content {
                        border-radius: 20px;
                        border: none;
                        overflow: hidden;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                        min-height: 400px;
                    }
                    .guest-join-modal .modal-body {
                        padding: 1.5rem 2rem;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .guest-join-modal .brand-header {
                        text-align: center;
                        margin-bottom: 2rem;
                    }
                    .guest-join-modal .brand-header h4 {
                        color: #198754;
                        font-weight: 800;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .guest-join-modal .table-badge {
                        background: #198754;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 50px;
                        font-size: 0.85rem;
                        font-weight: 600;
                    }
                    .guest-join-modal .form-label {
                        font-weight: 600;
                        color: #495057;
                        font-size: 0.9rem;
                    }
                    .guest-join-modal .form-control, .guest-join-modal .form-select {
                        border-radius: 10px;
                        padding: 0.75rem;
                        border: 1.5px solid #e9ecef;
                        transition: all 0.2s;
                    }
                    .guest-join-modal .form-control:focus, .guest-join-modal .form-select:focus {
                        border-color: #198754;
                        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.1);
                    }
                    .guest-join-modal .btn-join {
                        background: linear-gradient(135deg, #198754 0%, #146c43 100%);
                        border: none;
                        border-radius: 12px;
                        padding: 1rem;
                        font-size: 1.1rem;
                        transition: transform 0.2s;
                    }
                    .guest-join-modal .btn-join:hover {
                        background: linear-gradient(135deg, #146c43 0%, #0f5132 100%);
                        transform: translateY(-2px);
                    }
                    .guest-join-modal .pin-input {
                        letter-spacing: 15px;
                        text-align: center;
                        font-size: 2rem;
                        font-weight: 800;
                        color: #198754;
                        width: 100%;
                        margin: 0 auto;
                        max-width: 250px;
                    }
                    .step-container {
                        transition: all 0.3s ease-in-out;
                    }
                    .animate-fade {
                        animation: fadeIn 0.4s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
            <Modal.Body>
                <div className="brand-header">
                    <h4>VietNam Cuisine</h4>
                    <span className="table-badge">Table số {tableNumber}</span>
                </div>

                {step === 1 ? (
                    <div className="step-container animate-fade">
                        <Form.Group className="mb-4 text-center">
                            <Form.Label className="d-block mb-3" style={{ fontSize: '1.1rem' }}>Enter PIN Code của bàn</Form.Label>
                            <Form.Control
                                type="text"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="----"
                                className="pin-input mb-2"
                                autoFocus
                            />
                            <div className="mt-3">
                                <small className="text-muted">Staff sẽ cung cấp mã PIN khi bạn vào bàn.</small>
                            </div>
                        </Form.Group>

                        <Button
                            variant="success"
                            onClick={handleNextStep}
                            disabled={pin.length < 4 || loading}
                            className="w-100 fw-bold btn-join shadow"
                        >
                            {loading ? 'Đang xác thực...' : 'Continue'}
                        </Button>
                    </div>
                ) : (
                    <div className="step-container animate-fade">
                        {guests.length > 0 ? (
                            <Form.Group className="mb-3">
                                <Form.Label>Bạn là ai trong nhóm?</Form.Label>
                                <Form.Select value={selectedGuest} onChange={(e) => { setSelectedGuest(e.target.value); setNewUsername(''); }}>
                                    <option value="">-- Tham gia mới --</option>
                                    {guests.map((g, idx) => (
                                        <option key={idx} value={g}>{g}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        ) : null}

                        {!selectedGuest && (
                            <Form.Group className="mb-3 animate__animated animate__fadeInDown">
                                <Form.Label>Name của bạn là gì?</Form.Label>
                                <Form.Control type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter tên của bạn..." />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-4">
                            <Form.Label>{selectedGuest ? 'Phone Number của bạn (to xác thực):' : 'Phone Number'}</Form.Label>
                            <Form.Control type="text" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} placeholder="09xxxxxxx" />
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={() => setStep(1)} className="w-50 px-4" style={{ borderRadius: '12px' }}>
                                Back
                            </Button>
                            <Button variant="success" onClick={handleJoin} disabled={loading} className="w-100 fw-bold btn-join shadow">
                                {loading ? 'Đang xử lý...' : 'Bắt VNDầu gọi món'}
                            </Button>
                        </div>
                    </div>
                )}

                {!user && step === 1 && (
                    <div className="text-center mt-4">
                        <small className="text-muted">Chào mừng bạn to với không gian ẩm thực lành mạnh!</small>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default GuestJoin;
