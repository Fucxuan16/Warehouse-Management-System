    # Đặc tả hệ thống quản lý kho

    ## 1. Thông tin chung

    | Thuộc tính | Mô tả |
    |---|---|
    | Tên hệ thống | Kho Hàng - Quản lý kho |
    | Phiên bản đặc tả | 1.0 |
    | Trạng thái | Mô tả chức năng hiện có trong mã nguồn |
    | Ngôn ngữ giao diện | Tiếng Việt |
    | Loại ứng dụng | Ứng dụng web tĩnh chạy trên trình duyệt |
    | Người dùng mục tiêu | Cá nhân hoặc nhân viên cần theo dõi nhập, xuất và tồn kho đơn giản |

    ## 2. Mục tiêu và phạm vi

    Hệ thống hỗ trợ quản lý danh sách mặt hàng trong một kho trên một trình duyệt, ghi nhận giao dịch nhập/xuất, tra cứu hàng hóa và theo dõi số lượng tồn.

    Phiên bản hiện tại bao gồm:

    - Trang tổng quan với các chỉ số tồn kho.
    - Danh sách mặt hàng, tìm kiếm và lọc theo trạng thái tồn.
    - Ghi nhận nhập hàng và bổ sung số lượng cho mặt hàng đã có.
    - Ghi nhận xuất hàng có kiểm tra tồn kho.
    - Lịch sử các giao dịch nhập/xuất gần đây.
    - Lưu dữ liệu bằng `localStorage` của trình duyệt.

    Phiên bản hiện tại không bao gồm tài khoản, phân quyền, nhiều kho, đồng bộ dữ liệu giữa người dùng/thiết bị, máy chủ ứng dụng, cơ sở dữ liệu tập trung, xuất báo cáo hoặc quản lý nhà cung cấp/đơn hàng.

    ## 3. Người dùng và môi trường vận hành

    - **Người sử dụng:** người mở ứng dụng bằng trình duyệt và trực tiếp cập nhật dữ liệu kho.
    - **Môi trường:** trình duyệt web hiện đại có hỗ trợ JavaScript, HTML Dialog và `localStorage`.
    - **Triển khai:** các tệp tĩnh `index.html`, `app.js` và `style.css` có thể được phục vụ từ máy chủ web tĩnh, ví dụ GitHub Pages. Ứng dụng không cần máy chủ backend để thực hiện các chức năng hiện có.
    - **Kết nối mạng:** không cần kết nối mạng cho logic ứng dụng sau khi tải trang; tài nguyên phông chữ trực tuyến (nếu có) có thể cần Internet.

    ## 4. Chức năng hệ thống

    ### 4.1. Tổng quan kho

    Hệ thống hiển thị:

    - Tổng số mặt hàng đang được quản lý.
    - Tổng số lượng sản phẩm còn trong kho.
    - Số mặt hàng sắp hết.
    - Số mặt hàng đã hết.

    Các chỉ số được tính từ danh sách hàng hóa hiện tại và cập nhật sau khi giao dịch nhập hoặc xuất được lưu thành công.

    ### 4.2. Danh sách và tra cứu mặt hàng

    Danh sách mặt hàng hiển thị các trường:

    - Mã hàng.
    - Tên hàng.
    - Ngày nhập gần nhất.
    - Giá mua.
    - Giá bán.
    - Số lượng tồn.
    - Trạng thái tồn kho.
    - Thao tác xuất hàng.

    Danh sách được sắp xếp theo tên hàng. Người dùng có thể:

    - Tìm theo mã hàng hoặc tên hàng; tìm kiếm không phân biệt chữ hoa/chữ thường.
    - Lọc theo tất cả, còn hàng, sắp hết hoặc hết hàng.
    - Dùng phím `/` để đưa tiêu điểm vào ô tìm kiếm khi không đang thao tác trong trường nhập liệu và không có hộp thoại giao dịch mở.
    - Mở luồng xuất hàng trực tiếp từ một mặt hàng còn tồn.

    Khi không có mặt hàng, hệ thống hiển thị hướng dẫn nhập hàng đầu tiên. Khi tìm kiếm/lọc không có kết quả, hệ thống hiển thị thông báo không tìm thấy mặt hàng.

    ### 4.3. Nhập hàng

    Người dùng mở hộp thoại nhập hàng và cung cấp:

    | Trường | Bắt buộc | Quy tắc |
    |---|---:|---|
    | Mã hàng | Có | Văn bản, tối đa 40 ký tự sau giới hạn giao diện |
    | Tên hàng | Có | Văn bản, tối đa 100 ký tự sau giới hạn giao diện |
    | Ngày nhập | Có | Ngày do người dùng chọn; mặc định là ngày hiện tại |
    | Số lượng nhập | Có | Số nguyên lớn hơn 0 |
    | Giá mua | Có | Số không âm |
    | Giá bán | Có | Số không âm |

    Kết quả xử lý:

    1. Hệ thống loại bỏ khoảng trắng ở đầu/cuối mã và tên hàng.
    2. Mã hàng được đối chiếu không phân biệt chữ hoa/chữ thường.
    3. Nếu là mã hàng mới, hệ thống tạo mặt hàng với số lượng bằng số lượng nhập.
    4. Nếu mã hàng đã tồn tại, hệ thống cộng số lượng nhập vào tồn hiện tại và cập nhật tên, ngày nhập, giá mua, giá bán theo thông tin vừa nhập. Mã hàng đang lưu giữ nguyên cách viết ban đầu.
    5. Hệ thống tạo một giao dịch nhập chứa mã hàng, tên hàng, số lượng giao dịch và thời điểm ghi nhận.
    6. Chỉ cập nhật giao diện và trạng thái trong bộ nhớ sau khi lưu dữ liệu thành công vào trình duyệt.

    Hệ thống từ chối dữ liệu không hợp lệ hoặc tổng tồn vượt giới hạn số nguyên an toàn của JavaScript, đồng thời hiển thị lỗi trong hộp thoại.

    ### 4.4. Xuất hàng

    Người dùng mở hộp thoại xuất hàng từ nút trên trang hoặc từ dòng mặt hàng. Hộp thoại cho phép chọn mặt hàng còn tồn, hiển thị tồn hiện tại và nhập số lượng xuất.

    Quy tắc:

    - Mặt hàng hết tồn không xuất hiện trong danh sách chọn.
    - Số lượng xuất phải là số nguyên lớn hơn 0.
    - Số lượng xuất không được vượt tồn hiện tại.
    - Sau khi hợp lệ, hệ thống trừ tồn và tạo giao dịch xuất có mã hàng, tên hàng, số lượng và thời điểm ghi nhận.
    - Khi tồn về 0, trạng thái mặt hàng chuyển thành hết hàng.

    ### 4.5. Trạng thái tồn kho

    | Điều kiện số lượng tồn | Trạng thái |
    |---|---|
    | Bằng 0 | Hết hàng |
    | Từ 1 đến 5 | Sắp hết |
    | Lớn hơn 5 | Còn hàng |

    Ngưỡng sắp hết hiện được đặt cố định là 5 sản phẩm.

    ### 4.6. Lịch sử nhập xuất

    - Mỗi lần nhập/xuất thành công tạo một bản ghi giao dịch.
    - Lịch sử hiển thị tối đa 8 giao dịch mới nhất, theo thứ tự mới nhất trước.
    - Bản ghi hiển thị loại giao dịch, mã hàng, tên hàng, số lượng tăng/giảm và thời gian.
    - Dữ liệu giao dịch được lưu cùng dữ liệu kho trên trình duyệt. Giao diện chỉ trình bày 8 giao dịch gần nhất.

    ## 5. Quy tắc nghiệp vụ

    1. Mã hàng là khóa nhận diện mặt hàng trong kho; việc so sánh mã không phân biệt chữ hoa/chữ thường.
    2. Số lượng tồn không được âm.
    3. Số lượng của một giao dịch nhập/xuất phải là số nguyên dương.
    4. Không cho phép xuất vượt số lượng tồn tại thời điểm thao tác.
    5. Giá mua và giá bán được phép bằng 0 nhưng không được âm.
    6. Khi nhập lại mã hàng đã có, hệ thống cập nhật thông tin hàng theo lần nhập mới nhất, không duy trì các mức giá cũ trong bản ghi mặt hàng.
    7. Số liệu tiền tệ được hiển thị theo định dạng tiền Việt Nam đồng (VND), không có chữ số thập phân.
    8. Ngày nhập trong danh sách là ngày nhập gần nhất được ghi trên mặt hàng; lịch sử giao dịch giữ thời điểm ghi nhận riêng.

    ## 6. Dữ liệu

    ### 6.1. Mặt hàng

    | Thuộc tính | Kiểu dữ liệu | Ý nghĩa |
    |---|---|---|
    | `id` | Chuỗi | Mã hàng |
    | `name` | Chuỗi | Tên hàng |
    | `importDate` | Chuỗi ngày `YYYY-MM-DD` | Ngày nhập gần nhất |
    | `purchasePrice` | Số hữu hạn, không âm | Giá mua |
    | `salePrice` | Số hữu hạn, không âm | Giá bán |
    | `quantity` | Số nguyên an toàn, không âm | Số lượng tồn hiện tại |

    ### 6.2. Giao dịch

    | Thuộc tính | Kiểu dữ liệu | Ý nghĩa |
    |---|---|---|
    | `type` | `in` hoặc `out` | Loại giao dịch |
    | `id` | Chuỗi | Mã hàng tại thời điểm giao dịch |
    | `name` | Chuỗi | Tên hàng tại thời điểm giao dịch |
    | `quantity` | Số nguyên dương | Số lượng nhập hoặc xuất |
    | `timestamp` | Chuỗi thời gian ISO 8601 | Thời điểm giao dịch |

    ### 6.3. Lưu trữ và khôi phục

    - Khóa lưu trữ trong `localStorage`: `khohang.data.v1`.
    - Dữ liệu gồm hai danh sách `inventory` và `activity`.
    - Khi mở ứng dụng, hệ thống đọc và kiểm tra định dạng dữ liệu đã lưu.
    - Nếu dữ liệu không đọc được hoặc không thể ghi, hệ thống hiển thị thông báo lỗi trên giao diện.
    - Dữ liệu thuộc phạm vi trình duyệt và nguồn web hiện tại; không tự đồng bộ sang trình duyệt, thiết bị hoặc người dùng khác.
    - Xóa dữ liệu trang web/bộ nhớ trình duyệt có thể làm mất dữ liệu kho.

    ## 7. Yêu cầu giao diện và khả năng sử dụng

    - Giao diện và thông báo dành cho người dùng sử dụng tiếng Việt.
    - Các biểu mẫu nhập/xuất có kiểm tra dữ liệu và thông báo lỗi tại biểu mẫu.
    - Kết quả thao tác thành công hoặc lỗi lưu dữ liệu được thông báo trên giao diện.
    - Các bảng và chỉ số phải được cập nhật sau giao dịch thành công.
    - Các thao tác chính gồm tổng quan, tra cứu kho, nhập hàng, xuất hàng và xem lịch sử.

    ## 8. Yêu cầu phi chức năng và giới hạn

    - **Tính sẵn sàng:** ứng dụng có thể được lưu trữ dưới dạng website tĩnh; không phụ thuộc dịch vụ backend.
    - **Tính riêng tư:** dữ liệu kho hiện được lưu cục bộ trong trình duyệt, không gửi tới máy chủ ứng dụng.
    - **Tính nhất quán:** tồn kho và lịch sử chỉ được cập nhật sau khi ghi `localStorage` thành công.
    - **Bảo toàn dữ liệu:** phiên bản hiện tại không có sao lưu/khôi phục tích hợp; người dùng chịu rủi ro mất dữ liệu nếu xóa dữ liệu trình duyệt hoặc gặp sự cố thiết bị.
    - **Đồng thời:** không có cơ chế khóa hoặc hợp nhất cập nhật từ nhiều cửa sổ/người dùng.
    - **Bảo mật tài khoản:** không có đăng nhập, phân quyền hoặc quản lý phiên người dùng.
    - **Dung lượng:** giới hạn lưu trữ phụ thuộc trình duyệt; ứng dụng chưa quy định chính sách giới hạn/xóa lịch sử giao dịch.

    ## 9. Ngoài phạm vi hiện tại

    Các chức năng sau không được cung cấp trong phiên bản đang mô tả:

    - Đăng nhập, vai trò và phân quyền người dùng.
    - Cơ sở dữ liệu dùng chung, đồng bộ nhiều thiết bị hoặc nhiều người dùng.
    - Quản lý nhiều kho, vị trí/kệ hàng hoặc chuyển kho.
    - Quản lý nhà cung cấp, khách hàng, đơn mua hoặc đơn bán.
    - Xóa/sửa mặt hàng độc lập với luồng nhập hàng.
    - Sửa/hủy giao dịch đã ghi nhận.
    - Xuất/nhập dữ liệu bằng Excel/CSV hoặc sao lưu dữ liệu.
    - Báo cáo doanh thu, lợi nhuận, giá trị tồn kho hoặc lịch sử đầy đủ có phân trang.
    - Nhật ký kiểm toán và phân quyền duyệt giao dịch.

    ## 10. Tiêu chí nghiệm thu chức năng hiện tại

    1. Khi mở ứng dụng, các mặt hàng đã lưu trên cùng trình duyệt được khôi phục và các chỉ số tổng quan khớp với dữ liệu.
    2. Nhập một mã hàng mới với dữ liệu hợp lệ tạo mặt hàng, tăng tổng tồn và thêm giao dịch nhập.
    3. Nhập lại cùng mã hàng với khác biệt chữ hoa/chữ thường cộng tồn vào đúng mặt hàng và cập nhật thông tin hàng theo lần nhập mới.
    4. Dữ liệu nhập thiếu hoặc không hợp lệ không làm thay đổi tồn kho và hiển thị lỗi.
    5. Xuất số lượng hợp lệ làm giảm tồn và tạo giao dịch xuất.
    6. Xuất nhiều hơn tồn hoặc số lượng không hợp lệ không làm thay đổi tồn kho và hiển thị lỗi.
    7. Mặt hàng tồn 0, từ 1 đến 5, và lớn hơn 5 lần lượt hiển thị trạng thái hết hàng, sắp hết, và còn hàng.
    8. Tìm kiếm theo mã/tên và lọc trạng thái hiển thị đúng tập mặt hàng phù hợp.
    9. Lịch sử giao dịch hiển thị tối đa 8 giao dịch mới nhất.
    10. Tải lại trang trên cùng trình duyệt vẫn giữ dữ liệu đã lưu; mở trên trình duyệt/thiết bị khác không tự có dữ liệu đó.
