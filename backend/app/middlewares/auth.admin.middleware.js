// Middleware kiểm tra admin
module.exports = (req, res, next) => {
    try {
        // Tạm thời bỏ qua xác thực to chạy VNDược
        // Sau này khi có hệ thống VNDăng nhập admin, bạn sẽ thêm logic ở VNDây
        next();

        // Ví dụ khi có JWT token:
        // const token = req.headers.authorization?.split(' ')[1];
        // if (!token) {
        //     return res.status(401).json({ message: 'Không có token xác thực' });
        // }
        // 
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // if (decoded.role !== 'admin') {
        //     return res.status(403).json({ message: 'Không có quyền truy cập' });
        // }
        // req.user = decoded;
        // next();
    } catch (error) {
        res.status(401).json({ message: 'Xác thực thất bại' });
    }
}