# Thiết kế telegram-bot

Kênh phụ của hệ thống (xem [ROADMAP.md](ROADMAP.md) mục 2.4). Web là kênh chính; Telegram dùng để **nhận thông báo**, **xem nhanh** và **điều khiển khẩn** khi không mở được web. Quy tắc bảo mật chung ở [security.md](security.md). Bản nháp, chốt và làm ở GĐ 7.

---

## 1. Nguyên tắc

1. **Chỉ người đã liên kết mới dùng được.** Bot nhận diện người dùng bằng Telegram user id đã liên kết với tài khoản web. Người lạ nhắn gì cũng chỉ nhận một câu trả lời cố định "Bot riêng, chưa liên kết", và lần nhắn được ghi lại.
2. **Chỉ chat riêng.** Bot không hoạt động trong nhóm; bị thêm vào nhóm thì tự rời.
3. **Cùng quyền như trên web.** Người có quyền `viewer` trên một tài khoản MT5 chỉ xem được; `trader` mới điều khiển được (bảng quyền ở [security.md](security.md) mục 2.1).
4. **Không chạm MT5.** Mọi lệnh điều khiển được ghi vào bảng `commands` với nguồn `telegram`; trader-core kiểm quyền + rủi ro rồi mới làm, sau đó bot báo kết quả.
5. **Thao tác có hậu quả phải bấm nút xác nhận**, nút hết hạn sau 60 giây và chỉ bấm được một lần.
6. **Việc phức tạp làm trên web.** Sửa SL/TP, sửa rủi ro, sửa bộ luật AI, bật live, thêm tài khoản MT5, đổi mật khẩu, quản lý người dùng: bot chỉ gửi đường dẫn tới trang web tương ứng.

---

## 2. Liên kết và huỷ liên kết

**Tạo bot (admin, một lần):** tạo bot qua `@BotFather` → lấy token → nhập token trên trang Hệ thống (được mã hoá khi lưu) → đặt tên, ảnh, tắt quyền vào nhóm (`/setjoingroups` → Disable).

**Mỗi người dùng tự liên kết:**

1. Đăng nhập web → "Tài khoản của tôi → Liên kết Telegram" → nhập mã 2FA.
2. Web tạo **mã dùng một lần**, hết hạn sau 10 phút, và hiện nút / mã QR mở `https://t.me/<tên_bot>?start=<mã>`.
3. Người dùng bấm → Telegram mở bot và tự gửi `/start <mã>`.
4. Bot kiểm mã (đúng, chưa dùng, chưa hết hạn) → lưu Telegram user id + chat id vào `telegram_links` → trả lời "Đã liên kết với <email đã che một phần>" → nhắn thêm qua web/email cho chính người đó: "Telegram @… vừa được liên kết".
5. Mã bị đánh dấu đã dùng. Một người dùng chỉ liên kết một Telegram; liên kết mới thay thế liên kết cũ (và báo cho liên kết cũ).

**Huỷ liên kết:** trên web (nút "Huỷ liên kết") hoặc `/unlink` trong bot (có xác nhận). Admin khoá người dùng thì liên kết Telegram cũng bị vô hiệu ngay.

---

## 3. Tài khoản đang chọn

Một người có thể có nhiều tài khoản broker, mỗi broker có nhiều tài khoản MT5 con (mô hình ba tầng ở [security.md](security.md) mục 2). Lệnh luôn nhắm vào **một tài khoản MT5 con**. Bot nhớ **tài khoản đang chọn** của mỗi người:

- Chỉ có một tài khoản MT5 con → tự chọn.
- Nhiều tài khoản → các lệnh xem/điều khiển áp dụng cho tài khoản đang chọn; đổi bằng `/use`.
- Mỗi câu trả lời đều ghi rõ ở dòng đầu đang nói về tài khoản nào: `[DEMO · <tên broker> · <số TK>]`, ví dụ `[DEMO · IC chính · 5123]` hoặc `🔴 [LIVE · Exness · 8899]`.
- Thông báo tự gửi luôn ghi tài khoản, không phụ thuộc tài khoản đang chọn.

---

## 4. Danh sách lệnh

Ký hiệu quyền: **V** = `viewer` trở lên, **T** = `trader` trở lên, **—** = chỉ cần đã liên kết. Cột "Xác nhận" là có phải bấm nút xác nhận không.

### 4.1 Chung

| Lệnh | Quyền | Xác nhận | Làm gì |
|---|:-:|:-:|---|
| `/start <mã>` | — | | Liên kết Telegram với tài khoản web (mục 2) |
| `/help` | — | | Danh sách lệnh người này được dùng (ẩn lệnh không có quyền) |
| `/whoami` | — | | Email (che một phần), vai trò, danh sách tài khoản MT5 và quyền trên từng cái |
| `/unlink` | — | ✔ | Huỷ liên kết Telegram này |

### 4.2 Chọn tài khoản

| Lệnh | Quyền | Xác nhận | Làm gì |
|---|:-:|:-:|---|
| `/accounts` | V | | Cây tài khoản có quyền, nhóm theo broker: mỗi tài khoản MT5 con ghi số TK, demo/live, trạng thái bot (chạy / tạm ngừng / dừng khẩn / mất kết nối), lãi/lỗ hôm nay; cuối mỗi broker có dòng cộng |
| `/use` | V | | Hiện nút chọn: chọn broker trước, rồi chọn tài khoản MT5 con. `/use <số TK>` chọn thẳng |

### 4.3 Xem

| Lệnh | Quyền | Làm gì |
|---|:-:|---|
| `/status` | V | Trạng thái bot, kết nối MT5, số dư, vốn, lãi/lỗ hôm nay, số lệnh đang mở / đang chờ, đã chạm giới hạn lỗ chưa |
| `/positions` | V | Lệnh đang mở: mã lệnh, symbol, hướng, khối lượng, giá vào, SL, TP, lãi/lỗ hiện tại (tiền và R) |
| `/orders` | V | Lệnh chờ: mã lệnh, symbol, giá đặt, SL, TP, còn hiệu lực tới khi nào |
| `/trade <mã lệnh>` | V | Dòng thời gian của một lệnh: tín hiệu gốc, quyết định AI, lúc đặt, lúc khớp, các lần dời SL, lúc đóng, kết quả |
| `/pnl [today\|week\|month]` | V | Lãi/lỗ theo kỳ, số lệnh, tỉ lệ thắng, R trung bình, drawdown — tính từ `deals`/`positions` |
| `/report [day\|week]` | V | Gửi lại báo cáo gần nhất của kỳ đó (bản tóm tắt + đường dẫn bản đầy đủ trên web) |
| `/strategies` | V | Chiến lược đang chạy trên tài khoản: tên, phiên bản, symbol, bật/tắt, lãi/lỗ tháng này theo từng chiến lược. Đổi chiến lược chỉ làm trên web |
| `/signals [symbol]` | V | 10 tín hiệu gần nhất (ghi rõ chiến lược nào sinh ra), gồm cả tín hiệu bị loại và lý do |
| `/ai <mã lệnh>` | V | Quyết định AI của lệnh/tín hiệu: quyết định, mã luật, bằng chứng, kết quả tự chấm |
| `/health` | V | Tình trạng hệ thống: các tiến trình, lần đóng nến gần nhất đã xử lý, lần đối soát gần nhất, hàng đợi `commands`/`outbox` |

### 4.4 Điều khiển

| Lệnh | Quyền | Xác nhận | Làm gì |
|---|:-:|:-:|---|
| `/pause` | T | | Ngừng mở lệnh mới trên tài khoản đang chọn. Lệnh đang có vẫn được quản lý bình thường |
| `/resume` | T | ✔ | Cho mở lệnh mới trở lại. Từ chối nếu đang chạm giới hạn lỗ ngày/tuần (phải gỡ trên web) |
| `/symbol <SYMBOL> on\|off` | T | | Bật/tắt giao dịch một symbol |
| `/close <mã lệnh>` | T | ✔ | Đóng một lệnh đang mở / huỷ một lệnh chờ. Nút xác nhận ghi rõ symbol, khối lượng, lãi/lỗ hiện tại |
| `/closeall` | T | ✔ | Đóng mọi lệnh đang mở và huỷ mọi lệnh chờ của tài khoản đang chọn |
| `/kill` | T | ✔ | Dừng khẩn. Bước 1 chọn phạm vi: **tài khoản đang chọn** / **cả broker của nó** / **tất cả tài khoản của tôi**. Chỉ tính các tài khoản mà người gửi có quyền `trader` trở lên. Bước 2 chọn cách: **"Chỉ dừng"** (ngừng mở lệnh, huỷ lệnh chờ, giữ lệnh đang mở có SL) / **"Dừng + đóng hết"**. Muốn chạy lại phải vào web |

`/pause` không cần xác nhận vì nó chỉ làm hệ thống an toàn hơn. Mọi lệnh điều khiển trả về hai tin: "Đã nhận yêu cầu #123" ngay lập tức, rồi "Đã thực hiện #123" hoặc "Từ chối #123: <lý do>" khi trader-core xử lý xong.

### 4.5 Thông báo

| Lệnh | Làm gì |
|---|---|
| `/notify` | Hiện các nhóm thông báo (mục 5) kèm nút bật/tắt cho từng nhóm |
| `/mute <thời gian>` | Tắt thông báo mức "Thường" trong một khoảng, ví dụ `/mute 2h`. Mức "Khẩn" vẫn gửi |
| `/unmute` | Bật lại |
| `/quiet <giờ bắt đầu>-<giờ kết thúc>` | Giờ yên lặng hằng ngày, ví dụ `/quiet 23-07`. Mức "Khẩn" vẫn gửi; tin mức "Thường" được gộp gửi sau |
| `/hidemoney on\|off` | Ẩn số tiền trong mọi tin nhắn, chỉ ghi R và % |

Danh sách lệnh được đăng ký với Telegram (`setMyCommands`) **theo từng người**: người chỉ có quyền `viewer` không thấy lệnh điều khiển trong menu.

---

## 5. Thông báo tự gửi

| Nhóm | Sự kiện | Mức | Gửi |
|---|---|---|---|
| Lệnh | Đặt lệnh chờ, khớp, dời SL, chạm SL, chạm TP, đóng tay, huỷ (kèm lý do) | Thường | Ngay |
| AI | Quyết định AI kèm mã luật (khi AI từ chối hoặc giảm khối lượng) | Thường | Ngay; quyết định "đồng ý" thì chỉ gộp vào báo cáo |
| Rủi ro | Chạm giới hạn lỗ ngày/tuần, bot tự tạm ngừng | **Khẩn** | Ngay |
| Hệ thống | Mất kết nối MT5 quá 2 phút, tiến trình khởi động lại, lệch đối soát, lệnh thiếu SL, lỗi gọi AI liên tiếp | **Khẩn** | Ngay |
| Bảo mật | Đăng nhập thiết bị mới, sai mật khẩu nhiều lần, liên kết Telegram mới, đổi mật khẩu MT5, bật live | **Khẩn** | Ngay, chỉ gửi cho người liên quan và admin |
| Báo cáo | Nhật ký lệnh khi lệnh đóng; báo cáo cuối ngày; báo cáo cuối tuần | Thường | Theo lịch / theo sự kiện |
| Điều khiển | Kết quả của lệnh điều khiển do người khác gửi trên cùng tài khoản (ví dụ người kia vừa `/pause`) | Thường | Ngay |

- Ai nhận: mọi người có quyền trên tài khoản đó, theo cài đặt `/notify` của từng người.
- Trùng lặp: cùng một sự kiện lặp lại trong 10 phút (ví dụ mất kết nối chập chờn) chỉ gửi một lần kèm số lần lặp.
- Không mất tin: tin nằm trong bảng `outbox` tới khi Telegram xác nhận đã nhận; mất mạng thì gửi lại sau.
- Mỗi tin có nút / đường dẫn mở thẳng trang tương ứng trên web.

**Ví dụ tin nhắn:**

```
[DEMO · IC chính · 5123]
✅ KHỚP  XAUUSD  BUY 0.10 @ 2381.40
SL 2374.90 · TP 2394.40 · R:R 2.0
Tín hiệu: OF Entry 15m, trend 4H tăng
AI: đồng ý (v3) · Rủi ro 0.5%
Mở trên web ›
```

```
🔴 [LIVE · IC chính · 8899]
⚠️ KHẨN: chạm giới hạn lỗ ngày (-2.0%)
Bot đã ngừng mở lệnh mới. 1 lệnh đang mở vẫn có SL.
Gỡ giới hạn: chỉ trên web ›
```

---

## 6. Ghi chép kỹ thuật

- Thư viện `python-telegram-bot`, chế độ **long polling** (bot chủ động hỏi Telegram, không cần mở cổng).
- Tiến trình riêng, chỉ có token Telegram; đọc/ghi DB qua lớp `store/`; không có khoá giải mã mật khẩu MT5.
- Nút xác nhận mang một mã ngẫu nhiên lưu trong DB (gắn với người dùng, lệnh, hạn 60 giây, dùng một lần). Bấm nút của người khác hoặc nút đã hết hạn → bị từ chối.
- Giới hạn tốc độ: tối đa 20 lệnh/phút mỗi người; vượt thì bỏ qua và báo một lần.
- Mọi lệnh nhận được (kể cả từ người lạ, kể cả bị từ chối) ghi vào `audit_log` với nguồn `telegram`.
- Nội dung tin nhắn lấy từ cùng hàm định dạng với web để số liệu hai bên luôn khớp.

---

## 7. Kiểm thử

| Ca | Kết quả mong đợi |
|---|---|
| Người lạ gửi `/status` | Câu trả lời cố định, không lộ thông tin, có trong nhật ký |
| `/start` với mã sai / hết hạn / đã dùng | Từ chối |
| `viewer` gửi `/close` | Từ chối, không có dòng nào vào `commands` |
| Người A `/use` tài khoản của người B | Không thấy trong danh sách; gõ tên thẳng cũng bị từ chối |
| Bấm nút xác nhận sau 60 giây / bấm hai lần | Từ chối lần sau |
| `/kill` "Chỉ dừng" | Không còn lệnh chờ, lệnh đang mở giữ nguyên SL, bot không mở lệnh mới |
| Telegram mất mạng 10 phút | Tin trong `outbox` được gửi đủ, đúng thứ tự khi có mạng lại |
| Người dùng bị khoá trên web | Bot ngừng trả lời và ngừng gửi tin cho người đó ngay |

Các ca trên chạy offline với Telegram giả (không cần mạng) trong CI.

---

## 8. Cần chốt

- [ ] `/closeall` có cần trên Telegram không, hay chỉ `/kill` là đủ
- [ ] `/resume` sau `/kill` có cho phép từ Telegram không (đề xuất: không, chỉ trên web)
- [ ] Giờ gửi báo cáo cuối ngày (đề xuất: sau giờ đóng phiên New York theo giờ server)
- [ ] Ngôn ngữ tin nhắn: tiếng Việt, tiếng Anh, hay theo cài đặt từng người
