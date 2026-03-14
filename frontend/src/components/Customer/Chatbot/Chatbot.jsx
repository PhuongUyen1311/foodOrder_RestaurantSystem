import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './chatbot.scss';
import chatboxIcon from '../../../assets/img/chatbox_v4.png';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Lời chào ban đầu
    useEffect(() => {
        setMessages([
            { role: 'bot', content: 'Chào bạn! Mình là trợ lý dinh dưỡng của nhà hàng. Mình có thể giúp gì cho bạn hôm nay? (Ví dụ: Bạn muốn giảm cân hay cần hỏi calo món nào?)' }
        ]);
    }, []);

    // Scroll khi messages thay đổi
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async (text) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Lấy history (trừ lời chào ban đầu nếu muốn, ở đây đưa luôn 10 tin gần nhất)
            const historyForApi = updatedMessages.slice(-10);

            const res = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: historyForApi.slice(0, -1) }) // slice(0, -1) loại bỏ tin nhắn user vừa gửi khỏi history, vì đã gửi qua message
            });

            const data = await res.json();

            if (data.response) {
                setMessages([...updatedMessages, { role: 'bot', content: data.response }]);
            } else if (data.error) {
                setMessages([...updatedMessages, { role: 'bot', content: `Lỗi hệ thống: ${data.error}` }]);
            } else {
                setMessages([...updatedMessages, { role: 'bot', content: 'Xin lỗi, tôi đang gặp sự cố kết nối!' }]);
            }
        } catch (error) {
            console.error('Lỗi gọi API chatbot:', error);
            setMessages([...updatedMessages, { role: 'bot', content: 'Xin lỗi, hệ thống AI đang bảo trì.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend(input);
    };

    const clearHistory = () => {
        setMessages([{ role: 'bot', content: 'Lịch sử chat đã được xóa. Mình có thể tư vấn lại từ đầu nhé!' }]);
    };

    return (
        <div className="chatbot-wrapper">
            <div className={`chatbot-icon ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
                <img src={chatboxIcon} alt="Chatbot Health Advisor" />
            </div>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h4>NutriBot</h4>
                        <div className="header-actions">
                            <button className="clear-btn" onClick={clearHistory} title="Xóa lịch sử">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                            <button className="close-btn" onClick={toggleChat}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-body">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                <div className="message-content">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message bot">
                                <div className="message-content loading">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="chatbot-quick-replies">
                        <button onClick={() => handleSend('Tôi muốn giảm cân')}>Giảm cân</button>
                        <button onClick={() => handleSend('Tôi muốn tăng cơ')}>Tăng cơ</button>
                        <button onClick={() => handleSend('Salad bao nhiêu calo?')}>Hỏi calo Salad</button>
                    </div>

                    <div className="chatbot-footer">
                        <input
                            type="text"
                            placeholder="Nhắn tin cho NutriBot..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
