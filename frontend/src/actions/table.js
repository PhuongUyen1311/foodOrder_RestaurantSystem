export const getAllTables = async () => {
  try {
    const response = await fetch("/api/tables", { method: "get" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error khi lấy danh sách bàn:", error);
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
    console.error("Error khi book table:", error);
    throw error;
  }
};

export const getTableByQRCode = async (qrCode) => {
  try {
    const response = await fetch(`/api/tables/qr/${qrCode}`, { method: "get" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error khi quét mã QR:", error);
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
    console.error("Error khi lấy thông tin book table:", error);
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
    console.error("Error khi hoàn tất book table:", error);
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
    console.error("Error khi thêm bàn mới:", error);
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
    console.error("Error khi cập nhật thông tin bàn:", error);
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
    console.error("Error khi xóa bàn:", error);
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
    console.error("Error khi lấy lịch sử book table:", error);
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
    console.error("Error khi checkin bàn:", error);
    throw error;
  }
};

export const checkTableAvailability = async (tableId) => {
  try {
    const response = await fetch(`/api/tables/${tableId}/availability`, { method: "get" });
    return await response.json();
  } catch (error) {
    console.error("Error khi kiểm tra trạng thái bàn:", error);
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
    if (!response.ok) throw new Error(data.message || "Cancel book table thất bại");
    return data;
  } catch (error) {
    console.error("Error khi hủy book table:", error);
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
    if (!response.ok) throw new Error(result.message || "Merge Table thất bại");
    return result;
  } catch (error) {
    console.error("Error khi gộp bàn:", error);
    throw error;
  }
};

export const getAvailableTables = async () => {
  try {
    const response = await fetch("/api/tables/available", { method: "get" });
    return await response.json();
  } catch (error) {
    console.error("Error khi lấy danh sách bàn trống:", error);
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
    if (!response.ok) throw new Error(result.message || "Split Table thất bại");
    return result;
  } catch (error) {
    console.error("Error khi tách bàn:", error);
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
    console.error("Error khi phân rã bàn:", error);
    throw error;
  }
};
