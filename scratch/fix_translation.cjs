const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dirs = [
    path.join(projectRoot, 'frontend', 'src'),
    path.join(projectRoot, 'backend', 'app')
];

const fixMap = {
    "VNDang": "đang",
    "VNDã": "đã",
    "VNDược": "được",
    "VNDến": "đến",
    "VNDầu": "đầu",
    "VNDặt": "đặt",
    "VNDại": "đại",
    "VNDơn": "đơn",
    "VNDiện": "điện",
    "VNDể": "để",
    "VNDặc": "đặc",
    "VNDồng": "đồng",
    "VNDộ": "độ",
    "VNDuổi": "đuổi",
    "VNDối": "đối",
    "VNDiểm": "điểm",
    "VNDịch": "dịch",
    "VNDừng": "dừng",
    "VNDáp": "đáp",
    "VNDài": "dài",
    "VNDỏ": "đỏ",
    "VNDất": "đất",
    "VNDông": "đông",
    "VNDầy": "đầy"
};

// Also adding more common translations that were missed
const finalTranslationMap = {
    "đang hoạt động": "active",
    "đang sử dụng": "in use",
    "đang xử lý": "processing",
    "đang tải": "loading",
    "đã nhận đơn": "order received",
    "đã thanh toán": "paid",
    "đã xong": "ready",
    "đã hủy": "cancelled",
    "đã được": "has been",
    "đến": "to",
    "đầu tiên": "first",
    "đặt bàn": "book table",
    "đơn hàng": "order",
    "đơn": "order",
    "điện thoại": "phone",
    "để": "to",
    "đại diện": "representative/avatar",
    "đặc biệt": "special",
    "đồng": "VND",
    "đối với": "for",
    "điểm": "point",
    "dịch vụ": "service",
    "dừng": "stop",
    "đỏ": "red",
    "đất": "land",
    "đầy": "full",
    "Trống": "Empty",
    "Tất cả": "All",
    "Chào mừng bạn đến trở lại": "Welcome back",
    "Nhập số điện thoại": "Enter phone number",
    "Nhấn vào ảnh để thay đổi": "Click image to change",
    "Dữ liệu đơn hàng và phiên gọi món sẽ được chuyển sang bàn mới.": "Order data and sessions will be moved to the new table.",
    "Chọn bàn trống để chuyển đến": "Select an empty table to move to",
    "Không có bàn nào khác đang sử dụng có thể gộp.": "No other tables in use can be merged.",
    "Table này có": "This table has",
    "phiên gọi món đang hoạt động": "active order sessions",
    "Bạn hãy chọn khách hàng muốn thanh toán hoặc gộp tất cả.": "Please select a customer to pay or merge all.",
    "Tính tiền riêng": "Pay separately",
    "Gộp tất cả & Payment chung": "Merge all & Pay together",
    "VNDã sẵn sàng": "is ready",
    "Status hoạt động": "Active Status",
    "Tạm khóa": "Locked",
    "Ảnh hiện tại đang sử dụng": "Current image in use",
    "Không có bàn nào được chọn": "No tables selected",
    "Không thể lấy thông tin đơn hàng": "Could not get order info",
    "Error kết nối đến server": "Error connecting to server",
    "Phải có ít nhất 1 bàn để thanh toán": "Must have at least 1 table to pay",
    "Dữ liệu VNDơn hàng và phiên gọi món sẽ VNDược chuyển sang bàn mới.": "Order data and sessions will be moved to the new table.",
    "Bàn đang giữ chỗ": "Table being reserved"
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const extensions = ['.jsx', '.js', '.scss', '.css'];

dirs.forEach(dir => {
    walkDir(dir, (filePath) => {
        if (extensions.includes(path.extname(filePath))) {
            let content = fs.readFileSync(filePath, 'utf8');
            let original = content;

            // 1. Fix corrupted VND strings
            for (let [corrupted, fixed] of Object.entries(fixMap)) {
                content = content.replace(new RegExp(corrupted, 'g'), fixed);
            }

            // 2. Final translation pass
            const sortedKeys = Object.keys(finalTranslationMap).sort((a, b) => b.length - a.length);
            for (let key of sortedKeys) {
                content = content.replace(new RegExp(key, 'g'), finalTranslationMap[key]);
            }

            if (content !== original) {
                fs.writeFileSync(filePath, content);
                console.log(`Fixed/Translated: ${path.relative(projectRoot, filePath)}`);
            }
        }
    });
});
