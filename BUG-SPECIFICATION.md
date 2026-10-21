# Đặc tả 10 lỗi chức năng

Tài liệu này ghi lại 10 lỗi chức năng được đưa vào phiên bản hiện tại theo yêu cầu bài tập. Đây là lỗi giao diện/nghiệp vụ có thể quan sát được, không phải lỗ hổng bảo mật.

## Danh sách lỗi

| Mã | Khu vực | Mô tả lỗi |
|---|---|---|
| BUG-01 | Tìm kiếm | Ô tìm kiếm chỉ đối chiếu mã hàng, không tìm trong tên hàng. |
| BUG-02 | Tìm kiếm | Tìm theo mã phân biệt chữ hoa/chữ thường; ví dụ nhập `sp-01` không tìm thấy mã `SP-01`. |
| BUG-03 | Lọc tồn kho | Bộ lọc **Còn hàng** vẫn đưa mặt hàng có tồn đúng 5 vào kết quả, dù mặt hàng đó được phân loại **Sắp hết**. |
| BUG-04 | Lọc tồn kho | Bộ lọc **Sắp hết hàng** cũng đưa mặt hàng tồn 0 vào kết quả, khiến hàng hết xuất hiện ở cả hai bộ lọc. |
| BUG-05 | Tổng quan | Chỉ số **Sắp hết hàng** không đếm mặt hàng có tồn đúng 5; trong khi quy tắc trạng thái xếp tồn từ 1 đến 5 vào nhóm này. |
| BUG-06 | Tổng quan | **Tổng số lượng tồn** chỉ cộng mặt hàng có số lượng lớn hơn 5, bỏ qua lượng tồn của các mặt hàng còn 5 sản phẩm trở xuống. |
| BUG-07 | Danh sách kho | Danh sách được sắp tên theo thứ tự giảm dần thay vì tăng dần theo tiếng Việt. |
| BUG-08 | Ngày nhập | Ngày nhập hiển thị theo thứ tự tháng/ngày/năm thay vì ngày/tháng/năm. |
| BUG-09 | Lịch sử | Tám giao dịch gần nhất hiển thị theo thứ tự cũ đến mới, giao dịch mới nhất nằm cuối bảng. |
| BUG-10 | Chọn hàng xuất | Danh sách chọn mặt hàng xuất được sắp tên giảm dần thay vì tăng dần. |

## Cách kiểm tra

1. Đăng nhập bằng tài khoản đã được cấp và tạo một số mặt hàng có mã/tên khác nhau.
2. Nhập các mặt hàng với số tồn lần lượt là 0, 1, 5 và 6 để so sánh trạng thái, bộ lọc và các chỉ số tổng quan.
3. Thử tìm một phần tên hàng, sau đó thử mã có chữ hoa và chữ thường khác với cách viết lưu trong kho.
4. So sánh thứ tự tên trong bảng kho và trong danh sách chọn xuất.
5. Nhập ngày có ngày/tháng khác nhau, ví dụ `2026-10-21`, rồi kiểm tra cách hiển thị.
6. Tạo ít nhất hai giao dịch liên tiếp và kiểm tra thứ tự lịch sử.

## Giới hạn an toàn

Các lỗi trong danh sách không thay đổi cơ chế đăng nhập, phân quyền phía máy chủ, kiểm tra dữ liệu API, giao dịch PostgreSQL hoặc bảo vệ tồn kho khi có thao tác đồng thời. Lỗi hiển thị/tìm kiếm không cho phép truy cập dữ liệu trái phép hay bỏ qua xác thực.
