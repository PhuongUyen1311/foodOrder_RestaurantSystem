const db = require("../models");
const crypto = require('crypto');
const convertHelper = require("../helpers/convert.helper.js");
const listSocket = require("../socket");
const Order = db.order;
const OrderItem = db.orderItem;
const CartItem = db.cartItem;
const Admin = db.admin;
const { canDeductIngredients, deductIngredients } = require("./order.controller");
const { PayOS } = require("@payos/node");
const { refreshTableSession } = require("./table.controller");

const client_id = process.env.PAYOS_CLIENT_ID || "";
const api_key = process.env.PAYOS_API_KEY || "";
const checksum_key = process.env.PAYOS_CHECKSUM_KEY || "";

const payos = new PayOS(client_id, api_key, checksum_key);

exports.splitBill = async (req, res) => {
    try {
        const { orderId, splitType, data } = req.body;
        if (!orderId || !data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ success: false, message: "Missing data split hoặc VNDịnh dạng sai." });
        }

        let order;
        if (typeof orderId === 'string' && orderId.startsWith("TABLE_")) {
            const { sessionId } = req.body;
            const tableNum = orderId.split("_")[1];
            
            // Limit to specific session if provided
            let query = { table_number: tableNum, order_source: 'table', is_payment: false };
            if (sessionId) {
                query.session_id = sessionId;
            }

            const orders = await Order.find(query);
            if (!orders || orders.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy hóa order chưa thanh toán." });

            order = orders[0];
            if (orders.length > 1) {
                // Merge subsequent rounds for THIS SESSION into the first order
                const orderIdsToDelete = orders.slice(1).map(o => o._id);
                order.total_price += orders.slice(1).reduce((sum, curr) => sum + curr.total_price, 0);
                order.total_item += orders.slice(1).reduce((sum, curr) => sum + curr.total_item, 0);
                
                await OrderItem.updateMany({ order_id: { $in: orderIdsToDelete } }, { $set: { order_id: order._id } });
                await Order.deleteMany({ _id: { $in: orderIdsToDelete } });
                await order.save();
            }
        } else {
            order = await Order.findById(orderId);
            if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy Order." });
        }

        if (order.is_payment) return res.status(400).json({ success: false, message: "Order paid hoàn toàn." });

        let totalAmount = 0;
        data.forEach(d => {
            if (d && typeof d.amount === 'number') {
                totalAmount += d.amount;
            }
        });

        if (Math.abs(totalAmount - order.total_price) > 10) {
            return res.status(400).json({ success: false, message: "Total tiền chia bill không khớp với tổng order!" });
        }

        const splits = data.map(d => ({
            split_id: crypto.randomBytes(8).toString('hex'),
            split_type: splitType || 'custom',
            user_name: d.user || "Guest",
            items: Array.isArray(d.items) ? d.items : [],
            percent: parseFloat(d.percent) || 0,
            amount: parseInt(d.amount) || 0,
            is_payment: false,
            payment_method: '',
        }));

        order.split_bills = splits;
        await order.save();

        res.status(200).json({ success: true, message: "Chia bill thành công", splits: order.split_bills, orderId: order._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error process chia bill" });
    }
};

exports.createSplitPaymentUrl = async (req, res) => {
    try {
        const { orderId, splitId, method } = req.body;
        
        let order;
        if (typeof orderId === 'string' && orderId.startsWith("TABLE_")) {
            const tableNum = orderId.split("_")[1];
            order = await Order.findOne({ table_number: tableNum, order_source: 'table', is_payment: false });
        } else {
            order = await Order.findById(orderId);
        }

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const split = order.split_bills.find(s => s.split_id === splitId);
        if (!split) return res.status(404).json({ success: false, message: "Split bill not found" });
        if (split.is_payment) return res.status(400).json({ success: false, message: "Phần này has been thanh toán" });

        if (method === 'cash' || method === 'manual_transfer' || method === 'cash') {
            split.is_payment = true;
            split.payment_method = (method === 'cash' || method === 'cash') ? 'cash' : 'transfer';
            split.paid_at = new Date();

            // Check if all are paid
            const allPaid = order.split_bills.every(s => s.is_payment);
            if (allPaid) {
                order.is_payment = true;
                order.payment_method = 'chia bill';
                // Mark all non-canceled items as served when fully paid
                await OrderItem.updateMany(
                    { order_id: order._id, status: { $ne: 'CANCELED' } },
                    { $set: { status: 'SERVED', served_at: new Date() } }
                );
            }
            await order.save();

            const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
            const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
            for (const ad of admins) {
                listSocket.updateOrder.to(ad.socket_id).emit('notification', {
                    message: `Table ${order.table_number} vừa thanh toán một phần hóa order (${split.user_name})!`,
                    time: "Vừa xong",
                    tableNumber: order.table_number,
                    type: "payment",
                    createdAt: new Date()
                });
                listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
            }
            return res.status(200).json({ success: true, message: "Payment split (cash) thành công" });
        }

        // PAYOS
        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const body = {
            orderCode: payosOrderCode,
            amount: split.amount,
            description: `Split bill ${split.split_id.slice(-6)}`,
            returnUrl: `http://localhost:5173/checkout`,
            cancelUrl: `http://localhost:5173/checkout`,
        };

        const paymentLinkResponse = await payos.paymentRequests.create(body);
        
        split.payos_order_code = payosOrderCode;
        split.payos_checkout_url = paymentLinkResponse.checkoutUrl;
        split.payos_qr_code = paymentLinkResponse.qrCode;
        await order.save();

        res.status(200).json({ 
            success: true, 
            paymentUrl: paymentLinkResponse.checkoutUrl, 
            qrCode: paymentLinkResponse.qrCode, 
            orderCode: payosOrderCode 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create split payment URL' });
    }
};


exports.createPaymentUrl = async (req, res) => {
    try {
        if (!req.body.cartId) {
            return res.status(400).send({ message: "Not cart id" });
        }
        const { cartId, selectedItemIds } = req.body;

        // Kiểm tra tồn kho trước khi tạo order và thanh toán
        const cartItems = await CartItem.find({ cart_id: cartId });
        const itemsToCheck = selectedItemIds && selectedItemIds.length > 0
            ? cartItems.filter(i => selectedItemIds.includes(i.id))
            : cartItems;

        const check = await canDeductIngredients(itemsToCheck);
        if (!check.success) {
            return res.status(400).send({ success: false, message: check.message });
        }

        const order = await convertHelper.convertCartToOrder(cartId, "transfer", selectedItemIds);
        await deductIngredients(order.id);

        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const body = {
            orderCode: payosOrderCode,
            amount: order.total_price,
            description: `Thanh toan ${order.id.slice(-6)}`,
            returnUrl: `http://localhost:5173/checkout`,
            cancelUrl: `http://localhost:5173/checkout`,
        };

        const paymentLinkResponse = await payos.paymentRequests.create(body);
        
        order.payos_order_code = payosOrderCode;
        await order.save();
        res.status(200).json({ 
            paymentUrl: paymentLinkResponse.checkoutUrl, 
            qrCode: paymentLinkResponse.qrCode, 
            orderCode: payosOrderCode 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create payment URL' });
    }
};

exports.createGuestPaymentUrl = async (req, res) => {
    try {
        const { items, tableNumber } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).send({ message: "No items provided." });
        }

        // Kiểm tra tồn kho trước khi tạo order và thanh toán
        const check = await canDeductIngredients(items);
        if (!check.success) {
            return res.status(400).send({ message: check.message });
        }

        const order = await convertHelper.createOrderFromGuestItems(items, "transfer", tableNumber);
        await deductIngredients(order.id);

        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const body = {
            orderCode: payosOrderCode,
            amount: order.total_price,
            description: `Ban ${tableNumber}`,
            returnUrl: `http://localhost:5173/checkout`,
            cancelUrl: `http://localhost:5173/checkout`,
        };

        const paymentLinkResponse = await payos.paymentRequests.create(body);
        
        order.payos_order_code = payosOrderCode;
        await order.save();
        res.status(200).json({ 
            paymentUrl: paymentLinkResponse.checkoutUrl, 
            qrCode: paymentLinkResponse.qrCode, 
            orderCode: payosOrderCode 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create guest payment URL' });
    }
};

exports.createTablePaymentUrl = async (req, res) => {
    try {
        const { tableNumber, sessionId } = req.body;
        if (!tableNumber) {
            return res.status(400).send({ message: "No table number provided." });
        }

        let query = {
            table_number: tableNumber,
            order_source: 'table',
            is_payment: false
        };

        if (sessionId) {
            query.session_id = sessionId;
        }

        const orders = await Order.find(query);

        if (orders.length === 0) {
            return res.status(404).send({ message: "No unpaid orders found for this table." });
        }

        const totalAmount = orders.reduce((sum, order) => sum + order.total_price, 0);

        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const body = {
            orderCode: payosOrderCode,
            amount: totalAmount,
            description: sessionId ? `Ban ${tableNumber} (Sess ${sessionId.slice(-4)})` : `Gop Ban ${tableNumber}`,
            returnUrl: `http://localhost:5173/checkout`,
            cancelUrl: `http://localhost:5173/checkout`,
        };

        const paymentLinkResponse = await payos.paymentRequests.create(body);

        orders[0].payos_order_code = payosOrderCode;
        await orders[0].save();
        res.status(200).json({ 
            paymentUrl: paymentLinkResponse.checkoutUrl, 
            qrCode: paymentLinkResponse.qrCode, 
            orderCode: payosOrderCode 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create table payment URL' });
    }
};

exports.receiveWebhook = async (req, res) => {
    try {
        const webhookData = await payos.webhooks.verify(req.body);

        if (req.body.code === '00') {
            const { orderCode } = webhookData;

            // 1. Tìm và xử lý order chính
            const order = await Order.findOne({ payos_order_code: orderCode });
            if (order) {
                if (order.order_source === 'table') {
                    const updateQuery = { table_number: order.table_number, order_source: 'table', is_payment: false };
                    if (order.session_id) {
                        updateQuery.session_id = order.session_id;
                    }

                    // Get IDs of orders being updated to update their items too
                    const ordersToUpdate = await Order.find(updateQuery).select('_id');
                    const orderIds = ordersToUpdate.map(o => o._id);

                    await Order.updateMany(
                        updateQuery,
                        { $set: { is_payment: true, payment_method: "transfer (PayOS)" } }
                    );

                    await OrderItem.updateMany(
                        { order_id: { $in: orderIds }, status: { $ne: 'CANCELED' } },
                        { $set: { status: 'SERVED', served_at: new Date() } }
                    );
                } else {
                    order.is_payment = true;
                    order.payment_method = "transfer (PayOS)";
                    await order.save();

                    await OrderItem.updateMany(
                        { order_id: order._id, status: { $ne: 'CANCELED' } },
                        { $set: { status: 'SERVED', served_at: new Date() } }
                    );
                }

                // Notify payment success
                if (listSocket.io) {
                    const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
                    for (const ad of admins) {
                        listSocket.updateOrder.to(ad.socket_id).emit('notification', {
                            message: `Table ${order.table_number} paid thành công qua PayOS!`,
                            time: "Vừa xong",
                            tableNumber: order.table_number,
                            type: "payment",
                            createdAt: new Date()
                        });
                    }
                }
            } else {
                // 2. Nếu không thấy order chính, tìm order chia bill (split_bills)
                const splitOrder = await Order.findOne({ "split_bills.payos_order_code": orderCode });
                if (splitOrder) {
                    const split = splitOrder.split_bills.find(s => s.payos_order_code === orderCode);
                    if (split && !split.is_payment) {
                        split.is_payment = true;
                        split.payment_method = 'transfer (PayOS)';
                        split.paid_at = new Date();
                    }
                    const allPaid = splitOrder.split_bills.every(s => s.is_payment);
                    if (allPaid) {
                        splitOrder.is_payment = true;
                        splitOrder.payment_method = 'chia bill (PayOS)';
                        
                        // Mark all non-canceled items as served
                        await OrderItem.updateMany(
                            { order_id: splitOrder._id, status: { $ne: 'CANCELED' } },
                            { $set: { status: 'SERVED', served_at: new Date() } }
                        );
                    }
                    await splitOrder.save();

                    // Notify split payment success
                    if (listSocket.io) {
                        const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
                        for (const ad of admins) {
                            listSocket.updateOrder.to(ad.socket_id).emit('notification', {
                                message: `Một phần hóa order bàn ${splitOrder.table_number} (${split.user_name}) has been thanh toán qua PayOS!`,
                                time: "Vừa xong",
                                tableNumber: splitOrder.table_number,
                                type: "payment",
                                createdAt: new Date()
                            });
                        }
                    }
                }
            }

            // Send sự kiện paymentSuccess và cập nhật cho Admin
            if (listSocket.io) {
                listSocket.io.emit('paymentSuccess', { orderCode });
                
                const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
                const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
                for (const ad of admins) {
                    listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
                }
            }
        }
        res.status(200).json({ success: true, message: "Webhook accepted" });
    } catch (error) {
        console.error("Webhook error: ", error);
        res.status(400).json({ success: false, message: "Invalid signature" });
    }
};

exports.getOrderStatus = async (req, res) => {
    try {
        const { payosOrderCode } = req.params;
        if (!payosOrderCode) return res.status(400).json({ success: false, message: "Thiếu orderCode" });

        const paymentData = await payos.paymentRequests.get(Number(payosOrderCode));
        
        if (paymentData && paymentData.status === 'PAID') {
            const orderCodeNum = Number(payosOrderCode);
            // 1. Tìm và xử lý order chính
            const order = await Order.findOne({ payos_order_code: orderCodeNum });
            if (order && !order.is_payment) {
                if (order.order_source === 'table') {
                    const updateQuery = { table_number: order.table_number, order_source: 'table', is_payment: false };
                    if (order.session_id) {
                        updateQuery.session_id = order.session_id;
                    }
                    
                    const ordersToUpdate = await Order.find(updateQuery).select('_id');
                    const orderIds = ordersToUpdate.map(o => o._id);

                    await Order.updateMany(
                        updateQuery,
                        { $set: { is_payment: true, payment_method: "transfer (PayOS)" } }
                    );

                    await OrderItem.updateMany(
                        { order_id: { $in: orderIds }, status: { $ne: 'CANCELED' } },
                        { $set: { status: 'SERVED', served_at: new Date() } }
                    );
                } else {
                    order.is_payment = true;
                    order.payment_method = "transfer (PayOS)";
                    await order.save();

                    await OrderItem.updateMany(
                        { order_id: order._id, status: { $ne: 'CANCELED' } },
                        { $set: { status: 'SERVED', served_at: new Date() } }
                    );
                }
                
                if (listSocket.io) {
                    listSocket.io.emit('paymentSuccess', { orderCode: orderCodeNum });
                    
                    const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
                    const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
                    for (const ad of admins) {
                        listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
                    }
                }
            } else {
                // 2. Tìm order chia bill
                const splitOrder = await Order.findOne({ "split_bills.payos_order_code": orderCodeNum });
                if (splitOrder) {
                    const split = splitOrder.split_bills.find(s => s.payos_order_code === orderCodeNum);
                    let changed = false;
                    if (split && !split.is_payment) {
                        split.is_payment = true;
                        split.payment_method = 'transfer (PayOS)';
                        split.paid_at = new Date();
                        changed = true;
                    }
                        if (changed) {
                            const allPaid = splitOrder.split_bills.every(s => s.is_payment);
                            if (allPaid) {
                                splitOrder.is_payment = true;
                                splitOrder.payment_method = 'chia bill (PayOS)';

                                await OrderItem.updateMany(
                                    { order_id: splitOrder._id, status: { $ne: 'CANCELED' } },
                                    { $set: { status: 'SERVED', served_at: new Date() } }
                                );
                            }
                            await splitOrder.save();

                            if (listSocket.io) {
                                listSocket.io.emit('paymentSuccess', { orderCode: orderCodeNum });
                                
                                const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
                                const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
                                for (const ad of admins) {
                                    listSocket.updateOrder.to(ad.socket_id).emit('notification', {
                                        message: `Table ${splitOrder.table_number} vừa có một phần thanh toán hoàn tất!`,
                                        time: "Vừa xong",
                                        tableNumber: splitOrder.table_number,
                                        type: "payment",
                                        createdAt: new Date()
                                    });
                                    listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
                                }
                            }
                        }
                }
            }
        }

        res.status(200).json({ success: true, data: paymentData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error Call PayOS" });
    }
};

exports.undoSplit = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Thiếu orderId." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hóa order." });
        }

        // Kiểm tra xem VNDã có phần nào VNDược thanh toán chưa
        const hasPaidSplit = order.split_bills && order.split_bills.some(sb => sb.is_payment);
        if (hasPaidSplit) {
            return res.status(400).json({ success: false, message: "Không thể hủy chia hóa order vì VNDã có khách thanh toán một phần." });
        }

        order.split_bills = [];
        await order.save();

        res.status(200).json({ success: true, message: "Cancelled chia hóa order thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error khi hủy chia hóa order." });
    }
};

exports.mergeBills = async (req, res) => {
    try {
        const { mainTableNumber, slaveTableNumbers } = req.body;
        if (!mainTableNumber || !slaveTableNumbers || !Array.isArray(slaveTableNumbers) || slaveTableNumbers.length === 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
        }

        // Tìm order chính (active) của bàn main
        const mainOrder = await Order.findOne({ table_number: mainTableNumber, order_source: 'table', is_payment: false });
        if (!mainOrder) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hóa order chưa thanh toán của bàn chính." });
        }

        // Tìm các orders active của các bàn slave
        const slaveOrders = await Order.find({ table_number: { $in: slaveTableNumbers }, order_source: 'table', is_payment: false });
        if (!slaveOrders || slaveOrders.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hóa order chưa thanh toán của các bàn phụ." });
        }

        // Tính tổng tiền và tổng món
        const addedPrice = slaveOrders.reduce((sum, curr) => sum + curr.total_price, 0);
        const addedItems = slaveOrders.reduce((sum, curr) => sum + curr.total_item, 0);

        mainOrder.total_price += addedPrice;
        mainOrder.total_item += addedItems;

        // Save linked_tables to xử lý khi thanh toán
        const newLinkedTables = new Set(mainOrder.linked_tables || []);
        slaveTableNumbers.forEach(t => newLinkedTables.add(String(t)));
        mainOrder.linked_tables = Array.from(newLinkedTables);

        const slaveOrderIds = slaveOrders.map(o => o._id);

        // Chuyển OrderItems từ slave sang main
        await OrderItem.updateMany({ order_id: { $in: slaveOrderIds } }, { $set: { order_id: mainOrder._id } });

        // Delete các slave orders
        await Order.deleteMany({ _id: { $in: slaveOrderIds } });

        await mainOrder.save();

        if (listSocket.io) {
            const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
            const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
            for (const ad of admins) {
                listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
            }
        }

        res.status(200).json({ success: true, message: "Đã gộp hóa order thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error server khi gộp hóa order." });
    }
};

exports.multiPay = async (req, res) => {
    try {
        const { orderIds, paymentMethod } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ success: false, message: "Thiếu danh sách orderIds" });
        }
        
        const orders = await Order.find({ _id: { $in: orderIds }, is_payment: false });
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hóa order chưa thanh toán hợp lệ." });
        }
        
        // Update tất cả các order thành paid
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { is_payment: true, status: 'COMPLETED', payment_method: paymentMethod || 'cash' } }
        );

        // Update items thành SERVED
        await OrderItem.updateMany(
            { order_id: { $in: orderIds }, status: { $ne: 'CANCELED' } },
            { $set: { status: 'SERVED', served_at: new Date() } }
        );
        
        // Trích xuất danh sách các bàn cần giải phóng
        const tableNumbers = [...new Set(orders.map(o => String(o.table_number)))];
        
        // Send socket update
        if (listSocket.io) {
            const activeOrders = await Order.find({ status: { $ne: 'COMPLETED' }, is_payment: false });
            const admins = await Admin.find({ socket_id: { $exists: true, $ne: null } });
            for (const ad of admins) {
                listSocket.updateOrder.to(ad.socket_id).emit('sendListOrder', activeOrders);
                listSocket.updateOrder.to(ad.socket_id).emit('notification', {
                    message: `Đã thanh toán chung cho bàn: ${tableNumbers.join(', ')}`,
                    time: "Vừa xong",
                    type: "payment",
                    status: 'COMPLETED',
                    createdAt: new Date()
                });
            }
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Payment chung thành công", 
            tableNumbers: tableNumbers 
        });
    } catch (error) {
        console.error("Error multiPay:", error);
        res.status(500).json({ success: false, message: "Error server khi thanh toán chung." });
    }
};