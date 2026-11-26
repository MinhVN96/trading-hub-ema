# Môi trường và bảo mật

Tài liệu này mô tả chi tiết cho mục 2.6 của [ROADMAP.md](ROADMAP.md): ai được vào hệ thống, mỗi người thấy được gì, tài khoản chính liên kết với tài khoản MT5 và Telegram ra sao, bí mật được cất và mã hoá thế nào. Bản nháp, chốt ở GĐ 2 và làm ở GĐ 7.

---

## 1. Môi trường

| Môi trường | Broker | DB | Mục đích |
|---|---|---|---|
| `backtest` | `SimBroker` (giả lập) | file DB riêng | Chạy lại lịch sử, test |
| `production` | `Mt5Broker` | DB chính | Chạy thật trên các tài khoản MT5 con, cả **demo** lẫn **live** |
| `dev` | `Mt5Broker`, chỉ tài khoản demo | DB riêng | Thử code mới trước khi đưa vào `production` |

Demo hay live **gắn với từng tài khoản MT5 con**, không gắn với cả hệ thống. Lý do: một tài khoản broker thật (ví dụ IC Markets) chứa cả tài khoản MT5 demo lẫn tài khoản MT5 live, và GĐ 10 cần chạy song song hai loại để so sánh. Môi trường `dev` không bao giờ được phép chạy tài khoản live.

**Cổng an toàn của tài khoản live.** Worker của một tài khoản MT5 con chỉ gửi lệnh thật khi đủ ba điều kiện:

1. Công tắc chung `allow_live` trong cấu hình `production` đang bật. Mặc định tắt.
2. MT5 báo tài khoản đang đăng nhập là tài khoản thật (`account_info().trade_mode`), và số tài khoản + server khớp với tài khoản đã đăng ký.
3. Admin đã bật "cho phép live" cho đúng tài khoản con đó trên web (nhập lại 2FA, ghi nhật ký).

Lệch một trong ba điều kiện thì worker từ chối khởi động và gửi cảnh báo. Điều ngược lại cũng được kiểm: tài khoản con đăng ký là demo mà MT5 báo là tài khoản thật thì cũng dừng. Giao diện web hiện dải màu đỏ "LIVE" trên mọi trang của tài khoản thật, và Telegram gắn 🔴 trước mọi tin của tài khoản thật.

---

## 2. Mô hình tài khoản

Ba tầng: **tài khoản hệ thống → tài khoản broker → tài khoản giao dịch MT5 (tài khoản con)**. Chỉ tài khoản MT5 mới là nơi đặt lệnh thật.

```
 ┌─────────────────────────────────────┐            ┌──────────────────┐
 │ TẦNG 1 · Tài khoản hệ thống          │  0..1      │ Telegram user id │
 │ (người dùng, đăng nhập web)          ├───────────►│ (telegram_links) │
 │ email · mật khẩu · 2FA · vai trò     │            └──────────────────┘
 └──────────────────┬──────────────────┘
                    │ 1..n
                    ▼
 ┌─────────────────────────────────────┐
 │ TẦNG 2 · Tài khoản broker            │
 │ (hồ sơ khách hàng tại một broker:    │
 │  IC Markets, Exness…)                │
 │ broker · mã khách hàng / email ở     │
 │ broker (chỉ để nhận diện) · tên gợi  │
 │ nhớ · giới hạn rủi ro chung (tuỳ     │
 │ chọn)                                │
 │ KHÔNG lưu mật khẩu khu vực khách hàng│
 └──────────────────┬──────────────────┘
                    │ 1..n
                    ▼
 ┌─────────────────────────────────────┐
 │ TẦNG 3 · Tài khoản giao dịch MT5     │
 │ (tài khoản con - nơi đặt lệnh thật)  │
 │ số TK · server · demo/thật · loại TK │
 │ (Raw, Standard, Pro…) · đơn vị tiền  │
 │ · đòn bẩy · loại mật khẩu · mật khẩu │
 │ (mã hoá) · chiến lược đang chạy ·    │
 │ cấu hình rủi ro · bật live?          │
 └─────────────────────────────────────┘
```

**Tầng 1 — Tài khoản hệ thống.** Đây là tài khoản đăng nhập web. Mọi thứ khác (broker, MT5, Telegram) đều treo dưới nó.
- Không có đăng ký tự do: admin gửi lời mời (đường dẫn dùng một lần, hết hạn sau 48 giờ).
- Người được mời tự đặt mật khẩu và bật 2FA ngay ở lần đăng nhập đầu.

**Tầng 2 — Tài khoản broker.** Đại diện cho hồ sơ khách hàng của người dùng tại một broker, ví dụ IC Markets Secure Client Area hay Exness Personal Area. Một người dùng có thể có nhiều tài khoản broker, ví dụ một ở IC Markets và một ở Exness.
- **Tầng này chỉ dùng để gom nhóm và nhận diện.** Theo những gì đã biết, IC Markets và Exness không có API công khai để ứng dụng bên ngoài đăng nhập vào khu vực khách hàng hay tự liệt kê tài khoản MT5, nên hệ thống không "kết nối" được với tầng này. Mọi kết nối kỹ thuật đều đi qua từng tài khoản MT5. (Kiểm lại ở GĐ 7 phòng khi broker có ra API.)
- **Hệ thống không bao giờ lưu mật khẩu khu vực khách hàng của broker.** Mật khẩu này điều khiển nạp/rút tiền; lưu nó là rủi ro lớn nhất có thể có mà không đem lại lợi ích gì.
- Giới hạn rủi ro chung (tuỳ chọn) đặt ở tầng này, ví dụ tổng lỗ trong ngày của mọi tài khoản con ở broker này không vượt X%.

**Tầng 3 — Tài khoản giao dịch MT5 (tài khoản con).** Mỗi tài khoản MT5 thuộc đúng một tài khoản broker.
- Bot đăng nhập, đặt lệnh, chạy chiến lược ở đây. Mỗi tài khoản con có cấu hình rủi ro, chiến lược, symbol riêng.
- Mỗi tài khoản con có terminal và worker riêng.
- Một cặp (số tài khoản, server) chỉ được liên kết **một lần** trong toàn hệ thống. Người thứ hai thêm cùng tài khoản sẽ bị từ chối, và chủ sở hữu được báo.

**Danh mục broker** (bảng `brokers`, admin quản lý): tên broker, danh sách tên server MT5 của broker (ví dụ `ICMarketsSC-Demo`, `ICMarketsSC-MT5-2`, `Exness-MT5Trial…`, `Exness-MT5Real…`), bảng đổi tên symbol, ghi chú múi giờ server. Danh mục này dùng để:
- kiểm tài khoản MT5 con có đúng thuộc broker cha không (server và tên công ty MT5 trả về phải khớp);
- đổi tên symbol giữa các broker, vì cùng một sản phẩm mỗi broker đặt tên khác nhau, ví dụ `XAUUSD` ở IC Markets là `XAUUSDm` ở một số loại tài khoản Exness.

### 2.0 Nhiều broker trong một tài khoản hệ thống (chốt 26/11/2026)

Một tài khoản hệ thống được liên kết **nhiều tài khoản broker**. Mỗi broker là một **khu tách biệt**: lỗi, cấu hình hay dừng khẩn ở broker này không ảnh hưởng broker kia.

| Phần | Tách thế nào |
|---|---|
| Phần mềm | Mỗi broker dùng bộ cài MT5 của chính broker đó. Mỗi tài khoản con là một thư mục terminal riêng: `terminals/<broker>/<số TK>/` |
| Tiến trình | Mỗi tài khoản con một worker. Broker A mất kết nối hay worker sập thì các tài khoản của broker B vẫn chạy bình thường |
| Dữ liệu | Mọi dòng dữ liệu gắn với tài khoản broker và tài khoản con của nó. Nến, tín hiệu, lệnh không bao giờ trộn giữa các broker |
| Cấu hình | Bảng đổi tên symbol, giờ server, danh sách server riêng theo broker. Rủi ro đặt ở hai mức: cho từng tài khoản con, và (tuỳ chọn) tổng cho cả broker |
| Điều khiển | Tạm ngừng / dừng khẩn được theo ba phạm vi: một tài khoản con, cả một broker, hoặc tất cả |
| Giao diện | Web có một thẻ cho mỗi broker; Telegram nhóm danh sách tài khoản theo broker. Cộng tổng giữa các broker luôn quy đổi về USD, vì đơn vị tiền có thể khác nhau (ví dụ tài khoản cent của Exness tính bằng USC = 1/100 USD) |

Admin có thể giới hạn số broker tối đa của mỗi người dùng bằng một cài đặt. Mặc định không giới hạn.

### 2.1 Vai trò và quyền

Vai trò hệ thống:

| Vai trò | Được làm |
|---|---|
| `admin` | Mời/khoá người dùng, gán quyền, bật live cho một tài khoản, xem trang Hệ thống, khởi động lại tiến trình, sửa bộ luật AI dùng chung, phát hành / ngừng một phiên bản chiến lược |
| `user` | Chỉ làm việc trên các tài khoản broker và tài khoản MT5 mình có quyền |

Người tạo tài khoản broker là `owner` của nó và của mọi tài khoản MT5 con bên dưới. Chủ sở hữu có thể chia quyền `trader`/`viewer` cho người khác trên **từng tài khoản MT5 con**; người được chia chỉ thấy đúng các tài khoản con đó, và chỉ thấy tên broker cha, không thấy các tài khoản con khác.

Quyền trên từng tài khoản MT5:

| Thao tác | `viewer` | `trader` | `owner` |
|---|:-:|:-:|:-:|
| Xem lệnh, tín hiệu, quyết định AI, báo cáo | ✔ | ✔ | ✔ |
| Nhận thông báo Telegram về tài khoản này | ✔ | ✔ | ✔ |
| Tạm ngừng / tiếp tục, bật/tắt symbol | | ✔ | ✔ |
| Chọn chiến lược, đổi tham số / phiên bản chiến lược | | | ✔ |
| Huỷ lệnh chờ, đóng lệnh, dời SL/TP, dừng khẩn | | ✔ | ✔ |
| Sửa cấu hình rủi ro | | | ✔ |
| Đổi mật khẩu MT5 lưu trong hệ thống, xoá liên kết | | | ✔ |
| Chia quyền cho người khác | | | ✔ |

Quyền được kiểm **hai lần**: web/telegram-bot kiểm trước khi ghi vào bảng `commands`, và trader-core kiểm lại trước khi thực hiện. Một lỗ hổng ở web không đủ để đặt lệnh trái phép.

---

## 3. Đăng nhập web

| Hạng mục | Cách làm |
|---|---|
| Mật khẩu | Tối thiểu 12 ký tự, kiểm với danh sách mật khẩu phổ biến. Lưu bằng **băm Argon2id** (thư viện `argon2-cffi`), không lưu bản gốc |
| 2FA | Bắt buộc với mọi người. TOTP (ứng dụng Google Authenticator, Authy…). Khoá TOTP được **mã hoá** khi lưu. Cấp 10 mã khôi phục dùng một lần (lưu bản băm) |
| Phiên | Cookie `HttpOnly`, `Secure`, `SameSite=Strict`; không có thao tác 30 phút thì hết hạn; tối đa 12 giờ phải đăng nhập lại |
| Thao tác nguy hiểm | Nhập lại mã 2FA ("xác thực tăng cường"): dừng khẩn, đóng lệnh, sửa rủi ro, bật live, liên kết/đổi mật khẩu MT5, đổi email, tắt 2FA |
| Chống dò mật khẩu | Giới hạn số lần thử theo IP và theo tài khoản; sai 5 lần liên tiếp thì khoá tạm 15 phút và báo cho chủ tài khoản qua Telegram/email |
| Quản lý phiên | Trang "Tài khoản của tôi" liệt kê phiên đang mở (thiết bị, IP, lúc đăng nhập), đăng xuất từ xa được. Đổi mật khẩu thì mọi phiên khác bị thu hồi |
| Cảnh báo | Đăng nhập từ thiết bị mới → nhắn Telegram cho chính người đó |
| Chống giả mạo yêu cầu | Token CSRF cho mọi form; không bật CORS; header bảo mật (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`) |
| WebSocket | Kiểm phiên khi mở kết nối; chỉ đẩy dữ liệu của các tài khoản người đó có quyền |

---

## 4. Liên kết tài khoản broker và tài khoản MT5

**Bước 1 — Thêm tài khoản broker** ("Tài khoản của tôi → Thêm tài khoản broker"):
1. Chọn broker từ danh mục (IC Markets, Exness…).
2. Đặt tên gợi nhớ (ví dụ "IC chính"). Có thể nhập mã khách hàng / email ở broker để tự nhận diện; hệ thống không kiểm được thông tin này.
3. Không nhập mật khẩu khu vực khách hàng. Ô này không tồn tại.

**Bước 2 — Thêm tài khoản MT5 con** (trong trang của tài khoản broker → "Thêm tài khoản MT5"):

1. Nhập số tài khoản, chọn server từ danh sách server của broker đó, nhập mật khẩu, chọn loại mật khẩu; nhập lại mã 2FA.
2. Trình duyệt gửi qua HTTPS. web-app **mã hoá mật khẩu ngay** bằng khoá công khai của trader-core (mục 5.2) rồi mới ghi DB. web-app không giữ được bản gốc sau bước này.
3. trader-core nhận yêu cầu "kiểm tài khoản mới": giải mã, đăng nhập thử bằng một terminal riêng, rồi đọc `account_info()` để xác nhận:
   - số tài khoản;
   - server và tên công ty **khớp với broker cha**;
   - demo hay thật, loại tài khoản, đơn vị tiền, đòn bẩy.
4. Thành công → tài khoản con ở trạng thái "đã xác minh, chưa chạy". Bot chưa giao dịch cho tới khi người dùng chọn chiến lược và symbol.
5. Thất bại (sai mật khẩu, server không thuộc broker cha, tài khoản đã được liên kết ở nơi khác) → báo lỗi rõ lý do, xoá bản mã hoá vừa lưu.

Mở tài khoản MT5 mới vẫn làm trên trang của broker như bình thường. Hệ thống chỉ liên kết với tài khoản đã có.

**Hai loại mật khẩu của MT5:**

| Loại | Quyền với MT5 | Dùng khi |
|---|---|---|
| Mật khẩu chính (master) | Xem và giao dịch | Tài khoản bot được phép đặt lệnh |
| Mật khẩu chỉ xem (investor) | Chỉ xem, không đặt được lệnh | Chỉ theo dõi, báo cáo. **Khuyến nghị** cho tài khoản không cần bot giao dịch: kể cả lộ thì cũng không ai đặt lệnh được |

**Quy tắc:**

- Mật khẩu MT5 không bao giờ hiện lại trên giao diện, không trả về qua API, không vào log. Ô mật khẩu chỉ có nút "Đổi".
- Khi người dùng đổi mật khẩu ở broker, họ cập nhật trên web; trader-core thử đăng nhập lại để xác nhận.
- Xoá liên kết một tài khoản MT5 → xoá bản mã hoá, dừng worker, đăng xuất terminal; lịch sử lệnh vẫn giữ để báo cáo.
- Xoá một tài khoản broker → phải xoá liên kết hết các tài khoản MT5 con trước (có xác nhận và nhập 2FA).
- Mỗi tài khoản MT5 có một thư mục terminal riêng (chế độ portable) và một worker riêng. Không ai đăng nhập tay vào terminal đó trừ admin qua Remote Desktop.

---

## 5. Mã hoá và quản lý bí mật

### 5.1 Băm hay mã hoá

| Loại thông tin | Cách xử lý | Vì sao |
|---|---|---|
| Mật khẩu đăng nhập web | **Băm** Argon2id | Hệ thống chỉ cần kiểm "đúng hay sai", không cần biết bản gốc. Lộ DB cũng không lấy lại được mật khẩu |
| Mã khôi phục 2FA, mã liên kết Telegram, mã mời | **Băm** | Như trên |
| Mật khẩu khu vực khách hàng của broker (IC Markets, Exness…) | **Không lưu, không nhập** | Mật khẩu này điều khiển nạp/rút tiền, và hệ thống không có việc gì cần đến nó |
| Mật khẩu MT5 | **Mã hoá** (giải ngược được) | Bot cần bản gốc để đăng nhập MT5 |
| Khoá TOTP của người dùng | **Mã hoá** | Web cần bản gốc để kiểm mã 6 số |
| Token Telegram, Claude API key, khoá kho sao lưu, khoá heartbeat | **Mã hoá** | Tiến trình cần bản gốc để gọi dịch vụ |
| Lịch sử lệnh, báo cáo | Không mã hoá từng dòng; cả file DB nằm trên ổ đĩa mã hoá (BitLocker) và bản sao lưu được mã hoá | Cần truy vấn nhanh |

### 5.2 Cách mã hoá

- Thuật toán: **AES-256-GCM** (thư viện `cryptography`) cho bí mật hệ thống và khoá TOTP; **mã hoá bất đối xứng** (sealed box, X25519, thư viện `PyNaCl`) cho mật khẩu MT5.
- Vì sao mật khẩu MT5 dùng bất đối xứng: web-app chỉ có **khoá công khai** nên chỉ mã hoá được, không giải mã được. Chỉ trader-core giữ **khoá bí mật**. Kẻ chiếm được web-app cũng không đọc được mật khẩu MT5 đã lưu.
- Mỗi bản mã hoá lưu kèm `key_id` để **xoay khoá** được: tạo khoá mới, mã hoá lại dần, khoá cũ chỉ còn để giải mã cho tới khi hết dữ liệu cũ.

### 5.3 Khoá gốc nằm ở đâu

Khoá dùng để giải mã không nằm trong DB, không nằm trong git, không nằm trong `.env` dạng chữ thường.

| Nơi chạy | Nơi cất khoá |
|---|---|
| Windows (PC, VPS) | File khoá được bảo vệ bằng **Windows DPAPI** gắn với tài khoản dịch vụ chạy bot: copy file sang máy khác hoặc user khác thì không mở được |
| Sao lưu khoá | Một bản giấy / trình quản lý mật khẩu của chủ hệ thống, cất ngoại tuyến. Mất khoá = mất toàn bộ mật khẩu MT5 đã lưu (phải nhập lại), không mất dữ liệu lệnh |

Mỗi tiến trình chỉ được cấp đúng khoá nó cần: web-app có khoá công khai MT5 + khoá TOTP; trader-core có khoá bí mật MT5 + Claude API key; telegram-bot chỉ có token Telegram.

`.env` từ giờ chỉ còn cấu hình không bí mật (đường dẫn, cổng, tên môi trường). Có file `.env.example` trong git để làm mẫu.

### 5.4 Chống lộ qua đường phụ

- Bộ lọc log che mọi chuỗi giống mật khẩu/token/API key trước khi ghi.
- Thông báo lỗi trả cho người dùng không chứa chi tiết nội bộ.
- Bản sao lưu được mã hoá bằng khoá công khai (`age`) trước khi đẩy lên đám mây; khoá giải mã sao lưu cất ngoại tuyến.
- CI chạy `gitleaks` để chặn commit có bí mật, `pip-audit` để báo thư viện có lỗ hổng.
- Thông báo Telegram đi qua máy chủ Telegram (không mã hoá đầu-cuối với bot): mỗi người có thể bật "ẩn số tiền" để tin nhắn chỉ ghi R và %, không ghi số dư.

---

## 6. Mạng và máy chủ

| Hạng mục | Cách làm |
|---|---|
| Đưa web ra Internet | **Cloudflare Tunnel**: tiến trình `cloudflared` trên VPS chủ động kết nối ra Cloudflare; người dùng vào `https://<tên-miền>`. VPS không mở cổng vào nào, IP thật của VPS bị ẩn. Cloudflare lo chứng chỉ HTTPS, chặn tấn công từ chối dịch vụ cơ bản, giới hạn tốc độ |
| Lớp chặn thêm (tuỳ chọn) | Cloudflare Access: bắt đăng nhập email trước khi tới được trang đăng nhập của web-app |
| Quản trị máy | Remote Desktop / SSH **chỉ qua Tailscale**, không mở ra Internet. Tài khoản Windows quản trị có mật khẩu mạnh |
| Tường lửa | Chặn mọi kết nối vào; chỉ cho đi ra HTTPS và tới máy chủ broker |
| Tài khoản dịch vụ | Bot chạy bằng một user Windows riêng, không có quyền admin |
| Ổ đĩa | Bật BitLocker |
| Cập nhật | Windows Update đặt khung giờ cuối tuần (khi Forex/Vàng nghỉ); thư viện Python cập nhật qua nhánh riêng, chạy đủ test rồi mới triển khai |

---

## 7. Nhật ký và phát hiện bất thường

- `audit_log` ghi mọi thao tác của người dùng: ai, từ web hay Telegram, IP, lúc nào, làm gì, giá trị trước/sau. Không sửa, không xoá được từ giao diện.
- Cảnh báo ngay cho admin: đăng nhập sai nhiều lần, đăng nhập từ quốc gia mới, ai đó đổi mật khẩu MT5 lưu trong hệ thống, bật live, tắt 2FA, liên kết Telegram mới.
- Trang "Hệ thống" có mục nhật ký bảo mật cho admin.

---

## 8. Kiểm thử bảo mật

| Nhóm | Ca kiểm |
|---|---|
| Đăng nhập | Sai mật khẩu, sai 2FA, mã khôi phục dùng lại lần hai, phiên hết hạn, khoá tạm sau 5 lần sai |
| Liên kết tài khoản | Thêm tài khoản MT5 có server không thuộc broker cha → từ chối; thêm tài khoản MT5 đã được người khác liên kết → từ chối và báo chủ sở hữu; xoá tài khoản broker còn tài khoản con → từ chối |
| Phân quyền | Người được chia một tài khoản MT5 con không thấy các tài khoản con khác cùng broker; người A gọi API/WebSocket với `account_id` của người B → bị từ chối (chạy cho **mọi** endpoint, tự sinh từ danh sách route); `viewer` gọi thao tác của `trader` → bị từ chối; lệnh giả trong bảng `commands` mà người gửi không có quyền → trader-core từ chối |
| Mã hoá | Bí mật không xuất hiện trong DB dạng chữ thường, không trong log, không trong phản hồi API; giải mã với khoá sai → lỗi rõ ràng; xoay khoá không mất dữ liệu |
| Telegram | Người lạ nhắn bot → bị bỏ qua; mã liên kết hết hạn / dùng lại → bị từ chối (chi tiết ở [telegram-bot.md](telegram-bot.md)) |
| Live | Tài khoản đăng ký demo mà MT5 báo là thật → worker không khởi động; tài khoản thật khi `allow_live` tắt hoặc admin chưa bật live → không gửi lệnh; môi trường `dev` gặp tài khoản thật → dừng |

---

## 9. Khi có sự cố

Ghi đầy đủ trong `runbook.md` (GĐ 7). Tóm tắt:

| Sự cố | Làm ngay |
|---|---|
| Nghi lộ mật khẩu web của một người | Khoá người đó, thu hồi mọi phiên, buộc đặt lại mật khẩu và 2FA |
| Nghi lộ mật khẩu MT5 | Dừng khẩn tài khoản đó, đổi mật khẩu ở broker, cập nhật lại trên web |
| Nghi lộ khoá gốc / máy bị chiếm | Dừng khẩn mọi tài khoản, đổi mọi mật khẩu MT5 ở broker, thu hồi token Telegram qua `@BotFather`, tạo lại Claude API key, tạo khoá mới |
| Nghi lộ token Telegram | Thu hồi qua `@BotFather`, cập nhật token mới |

---

## 10. Cần chốt

- [x] Nhiều người dùng hay một người → **nhiều người dùng**, mỗi người chọn chiến lược cho tài khoản của mình; giai đoạn đầu chỉ một người (chốt 25/11/2026, ROADMAP mục 2.9 và GĐ 11)
- [ ] Phân quyền trên chiến lược: ai được phát hành chiến lược, người dùng được chỉnh tham số tới đâu (gắn với GĐ 11)
- [ ] Có dùng thêm Cloudflare Access làm lớp chặn trước trang đăng nhập không
- [x] Mô hình tài khoản → ba tầng: tài khoản hệ thống → tài khoản broker → tài khoản MT5 con (chốt 26/11/2026)
- [x] Một hay nhiều broker mỗi tài khoản hệ thống → **nhiều**, mỗi broker là một khu tách biệt (mục 2.0, chốt 26/11/2026)
- [ ] Có dùng giới hạn rủi ro chung ở tầng tài khoản broker không, hay chỉ giới hạn theo từng tài khoản MT5 con
- [ ] `viewer` có được nhận thông báo kèm số tiền không, hay luôn ẩn số tiền
- [ ] Người dùng `user` có được tự thêm tài khoản MT5, hay chỉ admin thêm rồi gán quyền
- [ ] Thời gian giữ nhật ký thao tác và log (đề xuất: nhật ký thao tác giữ vĩnh viễn, log 90 ngày)
