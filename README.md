# Hệ thống quản lý kho

Ứng dụng web động cho phép nhiều tài khoản đăng nhập vào cùng một kho. Giao diện được phục vụ bởi Node.js/Express; hàng hóa, lịch sử nhập/xuất và phiên đăng nhập được lưu trong PostgreSQL.

> **Cảnh báo:** phiên bản hiện tại cố ý chứa lỗi chức năng phục vụ bài tập, bao gồm chấp nhận một số phiếu xuất vượt tồn và từ chối một số phiếu xuất hợp lệ. Không dùng với dữ liệu kho thật. Xem [BUG-SPECIFICATION.md](./BUG-SPECIFICATION.md).

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

4. Tạo tài khoản đầu tiên. Mật khẩu được nhập ẩn và phải có ít nhất 12 ký tự:

   ```powershell
   npm run create-user
   ```

5. Chạy ứng dụng:

   ```powershell
   npm run dev
   ```

6. Mở <http://localhost:3000>.

Schema được khởi tạo tự động khi máy chủ chạy. Không đưa `DATABASE_URL`, `SESSION_SECRET` hoặc mật khẩu vào Git.

## Deploy trên Render

Repository có sẵn [render.yaml](./render.yaml) để tạo web service và PostgreSQL cùng vùng Singapore.

1. Push các thay đổi lên GitHub.
2. Đăng nhập Render, chọn **New → Blueprint** và kết nối repository này.
3. Kiểm tra cấu hình trong `render.yaml`, sau đó tạo resource. Render sẽ cấp `DATABASE_URL` nội bộ và tạo `SESSION_SECRET`.
4. Chờ build/deploy thành công; kiểm tra health endpoint `/health`.
5. Mở **Shell** của web service trên Render và chạy:

   ```sh
   npm run create-user
   ```

   Nhập username và mật khẩu bằng terminal tương tác (mật khẩu không hiển thị). Tạo thêm tài khoản bằng cách chạy lại lệnh.
6. Mở URL `onrender.com` của web service và đăng nhập.

Blueprint chọn gói web `starter` và PostgreSQL `basic-256mb` để dùng dịch vụ chạy liên tục và database bền vững; đây là các gói có phí của Render. Hãy kiểm tra trang giá hiện hành của Render trước khi xác nhận. Không đổi database sang gói tạm thời nếu cần giữ dữ liệu kho.

### Tạo 30 mặt hàng demo

Sau khi deploy phiên bản mới, mở **Shell** của web service trên Render và chạy:

```sh
npm run seed-demo
```

Lệnh thêm 30 mặt hàng điện tử theo mẫu trong ảnh. Không xóa hoặc ghi đè hàng đã có; nếu mã sản phẩm đã tồn tại, mã đó được bỏ qua. Các mã để thử lỗi xuất là `SP-001` (tồn 8), `SP-004` (tồn 6), `SP-010` (tồn 4), `SP-015` (tồn 5). Có cả mặt hàng hết hàng và các mặt hàng tồn bình thường. Chạy lại lệnh an toàn và không thêm trùng mã.

## Bảo mật và lưu ý dữ liệu

- Không có màn hình đăng ký công khai; chỉ quản trị viên tạo tài khoản bằng lệnh CLI.
- Mật khẩu được băm bằng scrypt, phiên đăng nhập nằm trong PostgreSQL, cookie phiên là `HttpOnly`, `SameSite=Strict` và chỉ dùng HTTPS ở production.
- Endpoint ghi dữ liệu yêu cầu cùng nguồn; đăng nhập được giới hạn tối đa 10 lần trong 15 phút cho mỗi địa chỉ IP.
- Tài khoản đăng nhập có quyền cập nhật kho chung; hiện chưa có vai trò/phân quyền chi tiết.
- Dữ liệu cũ từng lưu trong `localStorage` của phiên bản tĩnh không tự được chuyển sang database. Trước khi chuyển đổi, hãy lưu lại dữ liệu cũ; cần nhập lại dữ liệu vào phiên bản mới.
- Cần bật và kiểm tra backup PostgreSQL định kỳ trong Render trước khi sử dụng với dữ liệu nghiệp vụ quan trọng.
- Mọi người dùng cùng một kho; hệ thống không hỗ trợ tách kho theo công ty/chi nhánh.
