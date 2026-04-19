export const getAllTables = async () => {
  try {
    const response = await fetch("/api/tables", { method: "get" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bàn:", error);
    throw error;
  }
};

export const createReservation = async (accessToken, data) => {
  try {
    const response = await fetch("/api/reservations", {
      method: "post",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Đặt bàn thất bại");
    return result;
  } catch (error) {
    console.error("Lỗi khi đặt bàn:", error);
    throw error;
  }
};

export const getTableByQRCode = async (qrCode) => {
  try {
    const response = await fetch(`/api/tables/qr/${qrCode}`, { method: "get" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi quét mã QR:", error);
    throw error;
  }
};

export const getReservationByTableId = async (accessToken, tableId) => {
  try {
    const response = await fetch(`/api/reservations/${tableId}`, {
      method: "get",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đặt bàn:", error);
    throw error;
  }
};

export const completeReservation = async (accessToken, tableId) => {
  try {
    const response = await fetch(`/api/reservations/${tableId}/complete`, {
      method: "put",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi hoàn tất đặt bàn:", error);
    throw error;
  }
};

export const addTable = async (accessToken, tableData) => {
  try {
    const response = await fetch("/api/tables", {
      method: "post",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tableData)
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi thêm bàn mới:", error);
    throw error;
  }
};

export const updateTable = async (accessToken, tableId, tableData) => {
  try {
    const response = await fetch(`/api/tables/${tableId}`, {
      method: "put",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tableData)
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin bàn:", error);
    throw error;
  }
};

export const deleteTable = async (accessToken, tableId) => {
  try {
    const response = await fetch(`/api/tables/${tableId}`, {
      method: "delete",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi xóa bàn:", error);
    throw error;
  }
};

export const getUserReservations = async (accessToken) => {
  try {
    const response = await fetch("/api/reservations/user", {
      method: "get",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đặt bàn:", error);
    throw error;
  }
};

export const checkinReservation = async (tableId, confirmationCode) => {
  try {
    const response = await fetch(`/api/reservations/checkin/${tableId}`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationCode })
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi checkin bàn:", error);
    throw error;
  }
};

export const checkTableAvailability = async (tableId) => {
  try {
    const response = await fetch(`/api/tables/${tableId}/availability`, { method: "get" });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái bàn:", error);
    throw error;
  }
};

export const cancelReservation = async (accessToken, reservationId) => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "delete",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Hủy đặt bàn thất bại");
    return data;
  } catch (error) {
    console.error("Lỗi khi hủy đặt bàn:", error);
    throw error;
  }
};

export const mergeTable = async (accessToken, data) => {
  try {
    const response = await fetch("/api/tables/merge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gộp bàn thất bại");
    return result;
  } catch (error) {
    console.error("Lỗi khi gộp bàn:", error);
    throw error;
  }
};

export const getAvailableTables = async () => {
  try {
    const response = await fetch("/api/tables/available", { method: "get" });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bàn trống:", error);
    throw error;
  }
};

export const unmergeTable = async (accessToken, tableNumber) => {
  try {
    const response = await fetch("/api/tables/unmerge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tableNumber })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Tách bàn thất bại");
    return result;
  } catch (error) {
    console.error("Lỗi khi tách bàn:", error);
    throw error;
  }
};

export const unmergeAllSlaves = async (accessToken, masterTableNumber) => {
  try {
    const response = await fetch("/api/tables/unmerge-all", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ masterTableNumber })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Phân rã bàn thất bại");
    return result;
  } catch (error) {
    console.error("Lỗi khi phân rã bàn:", error);
    throw error;
  }
};
