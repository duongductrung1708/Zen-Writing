## AuraScribe – Câu hỏi & gợi ý trả lời khi phỏng vấn

### 1. Bạn có thể mô tả ngắn gọn dự án này không?

**Gợi ý trả lời:**  
AuraScribe là một ứng dụng web hỗ trợ viết với giao diện “thiền”, tự động hiển thị hình ảnh từ Unsplash dựa trên nội dung người dùng đang gõ. Khi người dùng viết, ứng dụng trích xuất từ khóa, gửi lên backend và lấy về bộ ảnh liên quan để tạo một không gian trực quan phản chiếu ý tưởng của họ.

---

### 2. Bạn dùng tech stack nào cho dự án này? Vì sao chọn các công nghệ đó?

**Gợi ý trả lời:**  
Ở frontend, em dùng **JavaScript (ES6+), React.js, React Router, Tailwind CSS, Framer Motion, Lucide React, Axios và Lodash**. React + React Router giúp xây SPA rõ ràng, dễ quản lý; Tailwind giúp em code giao diện nhanh và đồng nhất; Framer Motion tạo animation mượt, phù hợp trải nghiệm “zen”. Ở backend, em dùng **Node.js và Express.js** để xây một REST API proxy nhẹ, đứng giữa frontend và Unsplash, giúp bảo vệ API key. Em dùng **Axios** để gọi HTTP và **dotenv** để quản lý biến môi trường, giữ cấu hình tách biệt với mã nguồn.

---

### 3. Hệ thống hoạt động end‑to‑end như thế nào?

**Gợi ý trả lời:**  
Người dùng gõ nội dung trong trình soạn thảo React ở panel bên trái. Sau một khoảng dừng ngắn, em dùng một hàm đã được debounce để trích xuất các từ khóa “có nghĩa” từ đoạn text. Danh sách từ khóa này được gửi bằng Axios tới backend Node/Express qua endpoint `/api/images`. Backend gọi Unsplash Search API với các tham số như từ khóa, orientation, content filter, xử lý và rút gọn dữ liệu rồi trả về cho frontend. Frontend nhận dữ liệu, tính toán layout dạng masonry và hiển thị gallery ảnh với hiệu ứng fade‑in, scale‑up cho ảnh mới và fade‑out mờ cho ảnh cũ.

---

### 4. Tại sao bạn cần backend, sao không gọi Unsplash trực tiếp từ frontend?

**Gợi ý trả lời:**  
Backend đóng vai trò proxy bảo mật. Nếu gọi Unsplash trực tiếp từ frontend, em sẽ phải lộ Unsplash Access Key lên trình duyệt, rất dễ bị lạm dụng và không đúng best practice. Với Express, em lưu key trong biến môi trường trên server, validate request đầu vào, chuẩn hóa tham số gửi lên Unsplash và tập trung xử lý lỗi, rate‑limit ở một chỗ. Cách này cũng giúp sau này nếu muốn đổi hoặc thêm nhà cung cấp ảnh khác thì chỉ cần sửa backend, frontend hầu như không phải đổi.

---

### 5. Bạn xử lý hiệu năng như thế nào để không gọi API quá nhiều khi người dùng gõ liên tục?

**Gợi ý trả lời:**  
Em dùng **`debounce` của Lodash** cho hàm search. Thay vì mỗi lần gõ một ký tự là gọi API, em đợi khoảng 800ms sau khi người dùng dừng gõ rồi mới gửi request. Điều này giảm rất nhiều số lần gọi backend và Unsplash, giúp trải nghiệm mượt hơn và hạn chế vượt quá rate limit. Ngoài ra, em hủy (cancel) hàm debounce khi component unmount để tránh memory leak hoặc request cũ trả về muộn.

---

### 6. Vì sao bạn chọn Tailwind CSS và Framer Motion cho UI?

**Gợi ý trả lời:**  
Tailwind CSS là thư viện utility‑first nên em có thể xây layout responsive rất nhanh chỉ bằng class, không phải duy trì một file CSS thủ công quá lớn. Nó giúp giữ giao diện tối giản, đồng bộ. Framer Motion thì cho phép em khai báo animation trực tiếp trong JSX, gắn chặt với vòng đời component React, nên dễ kiểm soát hiệu ứng khi mount/unmount hoặc hover/focus và mang lại cảm giác chuyển động mượt cho người dùng.

---

### 7. Lucide React là gì và bạn dùng thế nào trong dự án?

**Gợi ý trả lời:**  
Lucide React là một thư viện icon, cung cấp các icon dạng component React dùng SVG. Trong dự án, em dùng các icon như search, download, bút vẽ, loading, đóng… cho các nút thao tác. Dùng một thư viện icon thống nhất giúp giao diện đồng bộ, dễ mở rộng, và dùng dưới dạng component React nên tích hợp với code JSX rất tự nhiên.

---

### 8. Bạn xử lý lỗi và các trường hợp edge case khi gọi Unsplash API như thế nào?

**Gợi ý trả lời:**  
Ở backend, em kiểm tra input trước, ví dụ keyword trống hoặc thiếu thì trả về lỗi 400 với thông báo rõ ràng. Khi gọi Unsplash bằng Axios, em phân biệt các mã lỗi như 401, 403, 429 để biết đó là lỗi key, quyền hạn hay vượt rate limit và chuyển chúng thành message dễ hiểu cho frontend. Ở phía client, em hiển thị thông báo (notification) nhẹ nhàng, không chặn luồng viết, để người dùng hiểu là có vấn đề nhưng vẫn tiếp tục soạn thảo bình thường.

---

### 9. Bạn tuân thủ yêu cầu của Unsplash API (download tracking, attribution) ra sao?

**Gợi ý trả lời:**  
Từ response của Unsplash, em lưu lại các thông tin như tên nhiếp ảnh gia, username, link profile và `download_location`. Em cung cấp một endpoint `/api/track-download` trên backend để gọi tới `download_location` theo đúng yêu cầu tracking của Unsplash. Trong UI, em hiển thị attribution cho photographer và thêm các tham số referral vào link profile, theo guideline của Unsplash.

---

### 10. Những khó khăn chính khi làm dự án này là gì và bạn đã giải quyết như thế nào?

**Gợi ý trả lời:**  
Khó khăn đầu tiên là cân bằng giữa độ “nhạy” của ứng dụng và giới hạn API. Nếu gọi API liên tục theo từng ký tự thì vừa lag vừa dễ bị chặn, nên em dùng debounce và tối ưu logic trích xuất từ khóa để chỉ gọi khi thực sự cần. Thứ hai là việc sắp xếp ảnh nhiều kích thước khác nhau mà vẫn đẹp; em giải quyết bằng layout dạng masonry kết hợp animation để việc thay đổi bố cục diễn ra mượt mà. Cuối cùng là bảo mật API key, nên em quyết định tách một lớp Express proxy thay vì làm thuần frontend.

---

### 11. Nếu sau này mở rộng dự án, bạn muốn làm thêm gì?

**Gợi ý trả lời:**  
Em muốn thêm phần tài khoản người dùng để lưu lại các phiên viết, bộ ảnh yêu thích và lịch sử. Em cũng muốn cải thiện phần NLP, thay vì chỉ lấy từ khóa đơn lẻ thì dùng keyphrase hoặc mô hình nâng cao hơn để bắt được chủ đề chính xác hơn. Ngoài ra có thể thêm chế độ dark mode, caching offline cho ảnh đã tải, và cải thiện accessibility (hỗ trợ keyboard navigation, ARIA cho gallery).

---

### 12. Nếu nhà tuyển dụng hỏi: “Trong dự án này, bạn trực tiếp làm những phần nào?” thì bạn trả lời sao?

**Gợi ý trả lời:**  
Em tự triển khai cả frontend và backend. Ở frontend, em xây hệ thống component React cho trình soạn thảo, gallery ảnh, phần xuất PDF, các tương tác và animation, đồng thời cấu hình Tailwind cho UI. Ở backend, em thiết kế và viết API Express đóng vai trò proxy tới Unsplash, cấu hình biến môi trường, validate request, xử lý lỗi và tracking download. Em cũng tích hợp Axios, Lodash debounce và tổ chức cấu trúc thư mục sao cho dễ đọc, dễ mở rộng sau này.
