import React, { useState } from 'react';
// Giả định bạn đã cài đặt và cấu hình Shadcn UI
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { ScrollArea } from "@/components/ui/scroll-area"

interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
}

export default function SplitInvoiceBoard() {
  const [originalItems, setOriginalItems] = useState<OrderItem[]>([
    { id: '1', productName: 'Cà phê sữa đá', qty: 3, price: 35000 },
    { id: '2', productName: 'Bạc xỉu', qty: 2, price: 40000 },
    { id: '3', productName: 'Trà đào cam sả', qty: 1, price: 45000 },
  ]);

  const [splitItems, setSplitItems] = useState<OrderItem[]>([]);

  // Hàm chuyển món ăn sang Hóa đơn mới
  const handleMoveToSplit = (item: OrderItem) => {
    // Để đơn giản (trong mockup này), ta chuyển luôn cả món (chưa xử lý chọn qty)
    // Thực tế sẽ dùng Dialog của ShadcnUI để điền số lượng muốn chuyển nếu qty > 1
    
    // Nếu qty > 1, có thể dùng prompt JS (mockup nhanh)
    let moveQty = 1;
    if (item.qty > 1) {
      const input = prompt(`Nhập số lượng muốn chuyển (Tối đa: ${item.qty})`, '1');
      if (!input) return;
      moveQty = parseInt(input, 10);
      if (isNaN(moveQty) || moveQty <= 0 || moveQty > item.qty) {
        alert("Số lượng không hợp lệ!");
        return;
      }
    }

    // Giảm số lượng ở bên gốc
    setOriginalItems((prev) => {
      return prev.map(i => {
        if (i.id === item.id) {
          return { ...i, qty: i.qty - moveQty };
        }
        return i;
      }).filter(i => i.qty > 0);
    });

    // Thêm bên hóa đơn mới
    setSplitItems((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + moveQty } : i);
      }
      return [...prev, { ...item, qty: moveQty }];
    });
  };

  const handleRevert = (item: OrderItem) => {
    // Trả lại toàn bộ số lượng item này về bên gốc
    setSplitItems((prev) => prev.filter(i => i.id !== item.id));

    setOriginalItems((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i);
      }
      return [...prev, { ...item, qty: item.qty }];
    });
  };

  const handleConfirmSplit = async () => {
    if (splitItems.length === 0) {
      alert("Hóa đơn tách chưa có món nào!");
      return;
    }

    const payload = {
      orderId: 'ORDER_GOC_123',
      itemsToSplit: splitItems.map(i => ({ orderItemId: i.id, qtyToSplit: i.qty }))
    };

    console.log("Gọi API Tách Bill:", payload);
    // await fetch('/api/invoices/split', { method: 'POST', body: JSON.stringify(payload) })
    alert("Tách bill thành công! Kiểm tra Console log.");
  };

  const totalOriginal = originalItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const totalSplit = splitItems.reduce((acc, i) => acc + (i.price * i.qty), 0);

  return (
    <div className="flex w-full gap-4 p-4 min-h-screen bg-gray-50">
      {/* Cột 1: Hóa đơn gốc */}
      <div className="w-1/2 bg-white shadow-xl rounded-xl border p-4 flex flex-col">
        <div className="pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Hóa Đơn Cũ <span className="text-sm font-normal text-gray-500">(Bàn số 5)</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-3">
            {originalItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:shadow cursor-pointer transition-all">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{item.productName}</span>
                  <span className="text-sm text-gray-500">Giá: {item.price.toLocaleString('vi-VN')} VND</span>
                  <span className="text-sm text-blue-600 font-medium">SL: {item.qty}</span>
                </div>
                <button 
                  onClick={() => handleMoveToSplit(item)}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Tách
                </button>
              </div>
            ))}
            {originalItems.length === 0 && <div className="text-gray-400 text-center py-10">Không còn món nào.</div>}
          </div>
        </div>

        <div className="pt-4 border-t flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <span className="text-lg font-bold">Tổng tiền</span>
          <span className="text-xl font-bold text-red-600">
            {totalOriginal.toLocaleString('vi-VN')} VND
          </span>
        </div>
      </div>

      {/* Cột 2: Hóa đơn mới */}
      <div className="w-1/2 bg-white shadow-xl rounded-xl border border-blue-200 p-4 flex flex-col relative overflow-hidden">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

        <div className="pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
            Hóa Đơn Mới 
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
              Split Invoice
            </span>
          </h2>
        </div>

        <div className="flex-1 overflow-auto py-4 border-2 border-dashed border-gray-200 rounded-lg m-2 bg-gray-50/50">
          <div className="flex flex-col gap-3 p-2">
            {splitItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{item.productName}</span>
                  <span className="text-sm text-gray-500">SL tách: {item.qty}</span>
                </div>
                <button 
                  onClick={() => handleRevert(item)}
                  className="bg-red-50 text-red-500 px-3 py-1 text-sm rounded hover:bg-red-100 transition-colors"
                >
                  Hoàn lại
                </button>
              </div>
            ))}
            {splitItems.length === 0 && (
              <div className="text-gray-400 text-center h-full flex items-center justify-center py-20 flex-col gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p>Kéo món sang đây để bắt đầu tách hóa đơn</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t flex flex-col gap-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-lg font-bold">Tổng tạm tính</span>
            <span className="text-xl font-bold text-red-600">
              {totalSplit.toLocaleString('vi-VN')} VND
            </span>
          </div>
          <button 
            onClick={handleConfirmSplit}
            disabled={splitItems.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-[0.98]"
          >
            Xác Nhận Tách Hóa Đơn
          </button>
        </div>
      </div>
    </div>
  );
}
