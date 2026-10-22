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
| BUG-07 | Xuất hàng | Khi tồn từ 8 sản phẩm trở lên, hệ thống vẫn chấp nhận yêu cầu xuất nhiều hơn tồn thực tế tối đa 2 sản phẩm. Ví dụ: tồn 8, yêu cầu xuất 10 được báo thành công; tồn kho chỉ giảm về 0 nhưng lịch sử ghi nhận xuất 10. |
| BUG-08 | Xuất hàng | Khi tồn từ 5 đến 7 sản phẩm, hệ thống chấp nhận yêu cầu vượt tồn đúng 1 sản phẩm. Ví dụ: tồn 6, yêu cầu xuất 7 được báo thành công; tồn kho giảm về 0 nhưng lịch sử ghi nhận xuất 7. |
| BUG-09 | Xuất hàng | Hệ thống báo lỗi sai nếu tồn đúng 4 và người dùng yêu cầu xuất 3 sản phẩm, dù số lượng yêu cầu nhỏ hơn tồn. |
| BUG-10 | Giao diện | Bấm **Làm mới dữ liệu** ở thanh công cụ kho sẽ phủ trang bằng trạng thái **Đang tải dữ liệu kho...** và vòng quay không kết thúc. |

## Cách kiểm tra

1. Đăng nhập bằng tài khoản đã được cấp và tạo mặt hàng có tồn lần lượt là 4, 5, 6 và 8.
2. Với tồn 8, thử xuất 10; sau đó kiểm tra thông báo, số lượng tồn và lịch sử giao dịch.
3. Với tồn 6, thử xuất 7; sau đó kiểm tra thông báo, số lượng tồn và lịch sử giao dịch.
4. Với tồn 4, thử xuất 3 và kiểm tra thông báo lỗi.
5. Bấm **Làm mới dữ liệu** và xác nhận lớp phủ loading không tự biến mất.
6. Kiểm tra các lỗi tìm kiếm, lọc tồn kho và chỉ số tổng quan ở BUG-01 đến BUG-06.

## Giới hạn an toàn

Các lỗi trong danh sách không thay đổi cơ chế đăng nhập, xác thực API hoặc giao dịch PostgreSQL. Tuy nhiên, BUG-07 và BUG-08 cố ý làm cho số lượng trong lịch sử có thể lớn hơn số lượng thực tế bị trừ tồn; BUG-10 che giao diện cho đến khi tải lại trang. Chỉ dùng phiên bản này để trình diễn bài tập, tuyệt đối không dùng cho dữ liệu kho thật.
