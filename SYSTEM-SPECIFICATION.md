    # Đặc tả hệ thống quản lý kho

    ## 1. Thông tin chung

    | Thuộc tính | Mô tả |
    |---|---|
    | Tên hệ thống | Kho Hàng - Quản lý kho |
    | Phiên bản đặc tả | 2.0 |
    | Trạng thái | Mô tả chức năng hiện có trong mã nguồn |
    | Ngôn ngữ giao diện | Tiếng Việt |
    | Loại ứng dụng | Ứng dụng web động Node.js/Express với cơ sở dữ liệu PostgreSQL |
    | Người dùng mục tiêu | Cá nhân hoặc nhân viên cần theo dõi nhập, xuất và tồn kho đơn giản |

    ## 2. Mục tiêu và phạm vi

    Hệ thống hỗ trợ nhiều tài khoản cùng truy cập một kho dữ liệu tập trung, ghi nhận giao dịch nhập/xuất, tra cứu hàng hóa và theo dõi số lượng tồn.

    Phiên bản hiện tại bao gồm:

    - Trang tổng quan với các chỉ số tồn kho.
    - Danh sách mặt hàng, tìm kiếm và lọc theo trạng thái tồn.
    - Ghi nhận nhập hàng và bổ sung số lượng cho mặt hàng đã có.
    - Ghi nhận xuất hàng có kiểm tra tồn kho.
    - Lịch sử các giao dịch nhập/xuất gần đây.
    - Lưu hàng hóa, lịch sử và phiên đăng nhập trong PostgreSQL.
    - Đăng nhập bằng tài khoản do quản trị viên tạo.
    - Đồng bộ dữ liệu kho giữa các trình duyệt/thiết bị đã đăng nhập thông qua máy chủ.

    Phiên bản hiện tại chưa bao gồm phân quyền chi tiết, đăng ký công khai, nhiều kho, xuất báo cáo hoặc quản lý nhà cung cấp/đơn hàng.

    ## 3. Người dùng và môi trường vận hành

    - **Người sử dụng:** người có tài khoản được quản trị viên cấp, đăng nhập bằng trình duyệt.
    - **Môi trường:** trình duyệt web hiện đại có hỗ trợ JavaScript và HTML Dialog; máy chủ chạy Node.js 20 trở lên.
    - **Triển khai:** Node.js/Express phục vụ giao diện và API; PostgreSQL lưu dữ liệu. Cấu hình Render mẫu nằm trong `render.yaml`.
    - **Kết nối mạng:** cần kết nối tới máy chủ để đăng nhập, đọc dữ liệu và ghi giao dịch.

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
    | Giá mua | Có | Số nguyên an toàn không âm |
    | Giá bán | Có | Số nguyên an toàn không âm |

    Kết quả xử lý:

    1. Hệ thống loại bỏ khoảng trắng ở đầu/cuối mã và tên hàng.
    2. Mã hàng được đối chiếu không phân biệt chữ hoa/chữ thường.
    3. Nếu là mã hàng mới, hệ thống tạo mặt hàng với số lượng bằng số lượng nhập.
    4. Nếu mã hàng đã tồn tại, hệ thống cộng số lượng nhập vào tồn hiện tại và cập nhật tên, ngày nhập, giá mua, giá bán theo thông tin vừa nhập. Mã hàng đang lưu giữ nguyên cách viết ban đầu.
    5. Hệ thống tạo một giao dịch nhập chứa mã hàng, tên hàng, số lượng giao dịch và thời điểm ghi nhận.
    6. Máy chủ thực hiện cập nhật mặt hàng và ghi lịch sử trong cùng transaction PostgreSQL; chỉ báo thành công sau khi commit.

    Hệ thống từ chối dữ liệu không hợp lệ hoặc tổng tồn vượt giới hạn số nguyên an toàn của JavaScript, đồng thời hiển thị lỗi trong hộp thoại. Máy chủ khóa theo mã hàng trong transaction để tuần tự hóa các lần nhập đồng thời.

    ### 4.4. Xuất hàng

    Người dùng mở hộp thoại xuất hàng từ nút trên trang hoặc từ dòng mặt hàng. Hộp thoại cho phép chọn mặt hàng còn tồn, hiển thị tồn hiện tại và nhập số lượng xuất.

    Quy tắc:

    - Mặt hàng hết tồn không xuất hiện trong danh sách chọn.
    - Số lượng xuất phải là số nguyên lớn hơn 0.
    - Số lượng xuất không được vượt tồn hiện tại tại thời điểm máy chủ xử lý giao dịch.
    - Máy chủ khóa bản ghi mặt hàng trong transaction, trừ tồn và tạo giao dịch xuất nguyên tử để ngăn xuất đồng thời vượt tồn.
    - Giao dịch chứa người dùng đã thực hiện, mã hàng, tên hàng, số lượng và thời điểm ghi nhận.
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
    - Dữ liệu giao dịch được lưu đầy đủ trong PostgreSQL. Giao diện chỉ truy vấn và trình bày 8 giao dịch gần nhất.

    ### 4.7. Đăng nhập và phiên làm việc

    - Người dùng đăng nhập bằng tên tài khoản và mật khẩu do quản trị viên cấp.
    - Không có luồng tự đăng ký công khai.
    - Mật khẩu được băm bằng scrypt; không lưu mật khẩu dạng rõ.
    - Phiên có thời hạn 8 giờ, lưu trong PostgreSQL và sử dụng cookie `HttpOnly`, `SameSite=Strict`; cookie được đánh dấu `Secure` trong môi trường production.
    - API dữ liệu và ghi giao dịch yêu cầu phiên đăng nhập hợp lệ.
    - Đăng nhập bị giới hạn 10 lần trong 15 phút cho mỗi địa chỉ IP.
    - Tài khoản được tạo qua lệnh quản trị `npm run create-user`; mọi tài khoản hiện có quyền thao tác trên kho chung.

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
    | `purchasePrice` | Số nguyên, không âm | Giá mua (VND) |
    | `salePrice` | Số nguyên, không âm | Giá bán (VND) |
    | `quantity` | Số nguyên an toàn, không âm | Số lượng tồn hiện tại |

    ### 6.2. Giao dịch

    | Thuộc tính | Kiểu dữ liệu | Ý nghĩa |
    |---|---|---|
    | `type` | `in` hoặc `out` | Loại giao dịch |
    | `id` | Chuỗi | Mã hàng tại thời điểm giao dịch |
    | `name` | Chuỗi | Tên hàng tại thời điểm giao dịch |
    | `quantity` | Số nguyên dương | Số lượng nhập hoặc xuất |
    | `timestamp` | Chuỗi thời gian ISO 8601 | Thời điểm giao dịch |
    | `created_by` | Chuỗi | Tên tài khoản ghi nhận giao dịch |

    ### 6.3. Lưu trữ và khôi phục

    - PostgreSQL lưu bảng `app_users`, `inventory`, `activity` và `user_sessions`.
    - Khóa `inventory.id` không phân biệt chữ hoa/chữ thường.
    - Ghi nhận nhập/xuất và cập nhật tồn kho trong cùng transaction; lỗi sẽ rollback toàn bộ thay đổi.
    - Dữ liệu được chia sẻ giữa các tài khoản đã đăng nhập vào cùng deployment.
    - Giao diện tải lại dữ liệu định kỳ 15 giây và khi người dùng quay lại tab.
    - Dữ liệu vẫn tồn tại khi xóa cookie/trình duyệt; tuy nhiên cần backup PostgreSQL để phòng mất dữ liệu từ nhà cung cấp/hạ tầng.
    - Dữ liệu từ phiên bản cũ lưu trong `localStorage` không tự động được chuyển sang database.

    ### 6.4. Tài khoản

    | Thuộc tính | Kiểu dữ liệu | Ý nghĩa |
    |---|---|---|
    | `username` | Chuỗi duy nhất, chữ thường | Tên đăng nhập |
    | `password_hash` | Chuỗi scrypt | Mật khẩu đã băm, không lưu dạng rõ |
    | `created_at` | Thời gian | Thời điểm tạo tài khoản |

    ## 7. Yêu cầu giao diện và khả năng sử dụng

    - Giao diện và thông báo dành cho người dùng sử dụng tiếng Việt.
    - Các biểu mẫu nhập/xuất có kiểm tra dữ liệu và thông báo lỗi tại biểu mẫu.
    - Kết quả thao tác thành công hoặc lỗi lưu dữ liệu được thông báo trên giao diện.
    - Các bảng và chỉ số phải được cập nhật sau giao dịch thành công.
    - Các thao tác chính gồm tổng quan, tra cứu kho, nhập hàng, xuất hàng và xem lịch sử.

    ## 8. Yêu cầu phi chức năng và giới hạn

    - **Kiến trúc:** ứng dụng cần máy chủ Node.js và PostgreSQL; không thể triển khai chức năng động chỉ bằng GitHub Pages.
    - **Tính nhất quán:** tồn và lịch sử cập nhật nguyên tử trong cùng transaction PostgreSQL.
    - **Đồng thời:** giao dịch xuất khóa dòng mặt hàng; giao dịch nhập sử dụng advisory lock theo mã hàng.
    - **Bảo mật:** mật khẩu băm scrypt, phiên lưu phía máy chủ, cookie bảo vệ và kiểm tra cùng nguồn cho các yêu cầu ghi.
    - **Phân quyền:** mọi tài khoản hiện có cùng quyền trên một kho; chưa có vai trò quản trị viên/người xem trong ứng dụng.
    - **Bảo toàn dữ liệu:** cần cấu hình/chọn backup PostgreSQL phù hợp; ứng dụng chưa có giao diện sao lưu/khôi phục.
    - **Đồng bộ giao diện:** thiết bị đang đăng nhập cập nhật theo chu kỳ 15 giây, không phải đồng bộ tức thời.

    ## 9. Ngoài phạm vi hiện tại

    Các chức năng sau không được cung cấp trong phiên bản đang mô tả:

    - Vai trò và phân quyền chi tiết, đăng ký/tự đổi mật khẩu trong giao diện.
    - Tách dữ liệu nhiều kho hoặc nhiều tổ chức.
    - Quản lý nhiều kho, vị trí/kệ hàng hoặc chuyển kho.
    - Quản lý nhà cung cấp, khách hàng, đơn mua hoặc đơn bán.
    - Xóa/sửa mặt hàng độc lập với luồng nhập hàng.
    - Sửa/hủy giao dịch đã ghi nhận.
    - Xuất/nhập dữ liệu bằng Excel/CSV hoặc sao lưu dữ liệu.
    - Báo cáo doanh thu, lợi nhuận, giá trị tồn kho hoặc lịch sử đầy đủ có phân trang.
    - Giao diện quản trị tài khoản và nhật ký kiểm toán chi tiết.

    ## 10. Tiêu chí nghiệm thu chức năng hiện tại

    1. Truy cập API dữ liệu khi chưa đăng nhập bị từ chối; tài khoản hợp lệ đăng nhập được và nhận dữ liệu từ PostgreSQL.
    2. Nhập một mã hàng mới với dữ liệu hợp lệ tạo mặt hàng, tăng tổng tồn và thêm giao dịch nhập.
    3. Nhập lại cùng mã hàng với khác biệt chữ hoa/chữ thường cộng tồn vào đúng mặt hàng và cập nhật thông tin hàng theo lần nhập mới.
    4. Dữ liệu nhập thiếu hoặc không hợp lệ không làm thay đổi tồn kho và hiển thị lỗi.
    5. Xuất số lượng hợp lệ làm giảm tồn và tạo giao dịch xuất.
    6. Xuất nhiều hơn tồn hoặc số lượng không hợp lệ không làm thay đổi tồn kho và hiển thị lỗi.
    7. Mặt hàng tồn 0, từ 1 đến 5, và lớn hơn 5 lần lượt hiển thị trạng thái hết hàng, sắp hết, và còn hàng.
    8. Tìm kiếm theo mã/tên và lọc trạng thái hiển thị đúng tập mặt hàng phù hợp.
    9. Lịch sử giao dịch hiển thị tối đa 8 giao dịch mới nhất.
    10. Giao dịch được commit vẫn còn sau khi đăng xuất, tải lại trang hoặc đăng nhập từ thiết bị khác.
    11. Người dùng khác đang đăng nhập thấy thay đổi sau lần làm mới dữ liệu tiếp theo.
    12. Ứng dụng chỉ phục vụ giao diện qua Express; các tệp server, cấu hình và biến môi trường không được cung cấp như tài nguyên tĩnh.
