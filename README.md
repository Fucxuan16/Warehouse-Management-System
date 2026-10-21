# Hướng dẫn sử dụng ứng dụng quản lý kho

Ứng dụng giúp theo dõi hàng hóa trong kho, ghi nhận các lần nhập và xuất, tra cứu mặt hàng theo mã hoặc tên. Ứng dụng chạy trực tiếp trên trình duyệt, không cần cài đặt hoặc tạo tài khoản.

## Mở ứng dụng

1. Tải hoặc sao chép các tệp của ứng dụng vào cùng một thư mục.
2. Mở tệp `index.html` bằng trình duyệt web như Microsoft Edge, Google Chrome hoặc Firefox.
3. Ứng dụng sẽ mở tại trang **Tổng quan**.

Để ứng dụng hoạt động, hãy giữ `index.html`, `app.js` và `styles.css` trong cùng thư mục.

## Nhập hàng

1. Chọn **Nhập hàng**.
2. Điền mã hàng, tên hàng, ngày nhập, số lượng nhập, giá mua và giá bán.
3. Chọn **Lưu phiếu nhập**.

Các trường có dấu `*` là bắt buộc. Số lượng nhập phải là số nguyên lớn hơn 0; giá mua và giá bán phải từ 0 trở lên.

Nếu nhập một mã hàng đã có trong kho, ứng dụng sẽ cộng số lượng vào tồn hiện tại và cập nhật tên hàng, ngày nhập cùng giá mua, giá bán theo thông tin vừa nhập. Mã hàng được đối chiếu không phân biệt chữ hoa và chữ thường.

## Xuất hàng

1. Chọn **Xuất hàng** ở đầu trang hoặc chọn **Xuất hàng** ngay trên dòng mặt hàng cần xuất.
2. Chọn mặt hàng và nhập số lượng xuất.
3. Chọn **Lưu phiếu xuất**.

Ứng dụng hiển thị số lượng đang có và không cho phép xuất nhiều hơn tồn kho. Sau khi xuất, tồn kho và lịch sử giao dịch sẽ được cập nhật.

## Tra cứu và kiểm tra tồn kho

- Nhập mã hàng hoặc tên hàng vào ô tìm kiếm để lọc danh sách. Có thể bấm phím `/` để chuyển nhanh đến ô tìm kiếm.
- Dùng bộ lọc trạng thái để xem tất cả mặt hàng, hàng còn, sắp hết hoặc hết hàng.
- Trang tổng quan hiển thị số mặt hàng, tổng số lượng tồn, số mặt hàng sắp hết và số mặt hàng đã hết.
- Mặt hàng có từ 1 đến 5 sản phẩm được đánh dấu **Sắp hết**. Mặt hàng có số lượng tồn bằng 0 được đánh dấu **Hết hàng**.
- Phần **Lịch sử nhập xuất** hiển thị tối đa 8 giao dịch gần nhất.

## Lưu ý về dữ liệu

- Dữ liệu được lưu trong bộ nhớ của trình duyệt trên thiết bị hiện tại, không được đồng bộ giữa các máy hoặc trình duyệt.
- Hãy tiếp tục dùng đúng trình duyệt và thiết bị đã nhập dữ liệu. Xóa dữ liệu trang web, bộ nhớ trình duyệt hoặc chuyển sang thiết bị khác có thể khiến dữ liệu không còn truy cập được.
- Các tệp ứng dụng không chứa dữ liệu kho. Sao chép riêng các tệp ứng dụng sang máy khác không chuyển dữ liệu hàng hóa.
- Ứng dụng không yêu cầu kết nối đến cơ sở dữ liệu hoặc máy chủ. Phông chữ trực tuyến có thể cần kết nối Internet; nếu không có mạng, trình duyệt sẽ dùng phông chữ dự phòng.
