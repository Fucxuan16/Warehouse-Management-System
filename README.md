# Hệ thống quản lý kho

Ứng dụng web động cho phép nhiều tài khoản đăng nhập vào cùng một kho. Giao diện được phục vụ bởi Node.js/Express; hàng hóa, lịch sử nhập/xuất và phiên đăng nhập được lưu trong PostgreSQL.

Web deploy: https://warehouse-management-system-gumv.onrender.com/

Tài khoản tester: User:admin; Password:quanlykhohang

## Chức năng

- Đăng nhập bằng tài khoản do quản trị viên tạo.
- Xem tổng quan, tra cứu và lọc hàng hóa theo trạng thái tồn.
- Ghi nhận nhập hàng; nhập lại mã cũ sẽ cộng tồn và cập nhật thông tin mặt hàng.
- Ghi nhận xuất hàng trong transaction PostgreSQL; phiên bản bài tập cố ý có lỗi ở một số kiểm tra số lượng xuất.
- Xem 8 giao dịch gần nhất; lịch sử đầy đủ vẫn được giữ trong cơ sở dữ liệu.
- Làm mới danh sách định kỳ để các thiết bị đã đăng nhập nhận cập nhật từ kho dùng chung.

## Chạy trên máy cá nhân

Yêu cầu Node.js 20 trở lên và một PostgreSQL đang chạy.

1. Tạo database PostgreSQL, ví dụ `warehouse`.
2. Cài dependency:

   ```powershell
   npm ci
   ```

3. Cấu hình biến môi trường PowerShell (thay giá trị bằng thông tin database và một secret ngẫu nhiên dài tối thiểu 32 ký tự):

   ```powershell
   $env:DATABASE_URL = "postgres://postgres:password@localhost:5432/warehouse"
   $env:SESSION_SECRET = "thay-bang-chuoi-ngau-nhien-dai-it-nhat-32-ky-tu"
   ```



## Bảo mật và lưu ý dữ liệu

- Không có màn hình đăng ký công khai; chỉ quản trị viên tạo tài khoản bằng lệnh CLI.
- Mật khẩu được băm bằng scrypt, phiên đăng nhập nằm trong PostgreSQL, cookie phiên là `HttpOnly`, `SameSite=Strict` và chỉ dùng HTTPS ở production.
- Endpoint ghi dữ liệu yêu cầu cùng nguồn; đăng nhập được giới hạn tối đa 10 lần trong 15 phút cho mỗi địa chỉ IP.
- Tài khoản đăng nhập có quyền cập nhật kho chung; hiện chưa có vai trò/phân quyền chi tiết.
- Dữ liệu cũ từng lưu trong `localStorage` của phiên bản tĩnh không tự được chuyển sang database. Trước khi chuyển đổi, hãy lưu lại dữ liệu cũ; cần nhập lại dữ liệu vào phiên bản mới.
- Cần bật và kiểm tra backup PostgreSQL định kỳ trong Render trước khi sử dụng với dữ liệu nghiệp vụ quan trọng.
- Mọi người dùng cùng một kho; hệ thống không hỗ trợ tách kho theo công ty/chi nhánh.
