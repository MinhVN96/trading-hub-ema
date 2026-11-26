# Lộ trình xây hệ thống giao dịch CFD tự động

Chỉ báo → tín hiệu → AI → quản lý rủi ro → lệnh MT5, kèm 3 hệ thống test độc lập.
Tài liệu này là **checklist theo dõi tiến độ**: mỗi việc một ô `[ ]`, xong thì đánh `[x]`. Được cập nhật mỗi khi xong một mục. Duyệt ngày 15/11/2026.

Ký hiệu người làm: **(B)** = bạn, **(C)** = Claude, **(B+C)** = Claude làm, bạn duyệt.

---

## 1. Context

Hiện `trading hub/` mới có **chỉ báo để nhìn**, chưa có gì để **đặt lệnh**:

- `Trading Hub 3 - EMA_v1.1/Trading_Hub_3_v1.11_LuxAlgo.pine` (~2.400 dòng): cấu trúc SMC, vùng OF/POI, module OF Entry (Entry/SL/TP, R:R ≥ 2, lọc trend 4H). Là `indicator()`, không có `alert()`/`strategy()`.
- `pine-tests/`: Playwright E2E trên TradingView, golden, oracle TypeScript tính lại CHoCH/BOS từ nến thô, unit test, mutation test.
- `Document/`: tài liệu BankTrap SMC, Trading Hub 3 — nguồn luật giao dịch.

Ba vướng mắc quyết định kiến trúc:

1. TradingView gói Basic không có webhook, và v1.11 từng lỗi RE10110 → không dựa vào TradingView để bắn lệnh.
2. Nến TradingView và nến broker không giống hệt nhau → tín hiệu phải tính trên chính nến của broker.
3. Thư viện Python `MetaTrader5` **chỉ chạy trên Windows và phải nằm cùng máy với terminal MT5** → phần lõi không đưa lên cloud dạng Linux/serverless được; "cloud" ở đây nghĩa là một máy Windows thuê (VPS).

### Đã chốt (15/11/2026)

| Quyết định | Lựa chọn |
|---|---|
| Nguồn tín hiệu | Python tính trên nến MT5; Pine để nhìn và đối chiếu |
| Mức tự động | Hệ thống **tự đặt lệnh, tự quản lý lệnh, tự ghi lịch sử** trên tài khoản demo, không cần bạn bấm duyệt. Chạy demo bao lâu và khi nào sang live **do bạn quyết định** |
| Tài khoản demo (26/11/2026) | Dùng **tài khoản broker thật** (đăng ký thật ở IC Markets), bên trong tạo **tài khoản MT5 con loại demo**. Sau này tài khoản MT5 live được tạo dưới cùng tài khoản broker đó |
| Quyền AI (cập nhật 26/11/2026) | **Tạm thời không dùng AI**, để không tốn phí Claude API. Bot vào lệnh đúng theo chỉ báo, qua bộ lọc cứng và bộ quản lý rủi ro. Nhật ký và báo cáo do code tạo từ dữ liệu. Module AI vẫn được thiết kế sẵn dưới dạng bật/tắt; GĐ 8 làm khi có kinh phí, lúc đó bắt đầu bằng chế độ bóng |
| Sản phẩm | Crypto CFD, Forex, Vàng/kim loại (không làm chỉ số) |
| Truy cập (25/11/2026) | Bảo vệ bằng **đăng nhập + 2FA và phân quyền**, không chỉ dựa vào mạng riêng: ai đăng nhập thì chỉ thấy tài khoản broker và tài khoản MT5 của chính mình. Nhờ vậy web đưa ra Internet công khai được. Khi chỉ có bạn dùng thì vẫn có thể chỉ mở qua Tailscale cho tiết kiệm và an toàn hơn (mục 2.5.2) |
| Mô hình tài khoản (26/11/2026) | Ba tầng: **tài khoản hệ thống** (đăng nhập web) → **tài khoản broker** (hồ sơ khách hàng ở IC Markets, Exness…) → **tài khoản MT5 con** (nơi đặt lệnh thật). Một tài khoản hệ thống được liên kết nhiều broker; mỗi broker là một khu tách biệt (terminal, worker, dữ liệu, cấu hình, dừng khẩn riêng). Hệ thống không lưu mật khẩu khu vực khách hàng của broker. Chi tiết: [security.md](security.md) mục 2 |
| Đánh giá AI (25/11/2026) | Khi bật AI: không cần người duyệt từng quyết định; hệ thống ghi lại để truy vết và tự chấm theo kết quả thật |
| Báo cáo (25/11/2026) | Báo cáo là chức năng **thống kê theo từng loại** (theo lệnh, ngày/tuần/tháng, symbol, chiến lược, broker…), tính từ dữ liệu lệnh/deal trong DB. Danh sách loại báo cáo và nội dung từng loại **thiết kế chi tiết sau** (GĐ 7, file `docs/reports.md`) |
| Hạ tầng (25/11/2026) | Mọi thứ chạy trên một máy Windows. Cấu hình và chi phí: mục 2.5 |
| Máy chạy (26/11/2026, tạm thời) | **PC hiện tại làm máy chủ, chạy 24/7** cho phát triển và demo, vì chưa có kinh phí thuê VPS. Xem lại trước khi chạy live |
| Hướng sản phẩm (25/11/2026) | **Hiện tại chỉ một người dùng (bạn).** Kiến trúc được thiết kế sẵn để sau này mở rộng thành nền tảng nhiều người dùng: nhiều chỉ báo Pine chuyển sang Python thành các *chiến lược*, mỗi người dùng chọn chiến lược cho tài khoản MT5 và symbol của mình. Trading Hub 3 là chiến lược đầu tiên. Kiến trúc: mục 2.9. Việc mở cho người khác (GĐ 11) chưa nằm trong kế hoạch, chỉ làm khi bạn quyết định |

**Về giờ giao dịch:** Forex và Vàng nghỉ từ cuối thứ Sáu tới đầu thứ Hai (giờ server) và có khoảng trống giá khi mở lại. Crypto CFD gần như chạy 24/7, nhưng **đây là CFD của broker chứ không phải sàn crypto**: broker có thể có khung bảo trì ngắn và spread giãn cuối tuần. Vì vậy bot **không ghi cứng lịch**: nó đọc phiên giao dịch của từng symbol từ MT5 (`symbol_info`) và việc đầu tiên ở Giai đoạn 3 là in ra lịch thật của từng symbol để bạn xem.

---

## 2. Kiến trúc hệ thống

### 2.1 Sơ đồ triển khai

```
┌──────────────── MÁY WINDOWS (PC của bạn khi phát triển → VPS Windows khi chạy liên tục) ───────────────┐
│                                                                                                        │
│  ┌───────────────┐  IPC nội bộ   ┌──────────────────────── trading-bot (Python) ───────────────────┐   │
│  │ MT5 Terminal  │◄────────────►│  ① trader-core   : data → signal → AI → risk → execution        │   │
│  │ (mỗi tài khoản│  thư viện     │  ② web-app       : KÊNH CHÍNH - xem và điều khiển hệ thống      │   │
│  │ một terminal) │  MetaTrader5  │  ③ telegram-bot  : kênh phụ - thông báo, lệnh xem/điều khiển    │   │
│  └──────┬────────┘               │  ④ jobs          : việc nền - báo cáo, đối soát, sao lưu, test  │   │
│         │                        └───────────┬──────────────────────────────────────────────────────┘   │
│         │                                    │ đọc/ghi                                                  │
│         │                        ┌───────────▼───────────┐                                              │
│         │                        │ SQLite (người dùng,    │  Parquet (nến lịch sử)   logs/ (file log)   │
│         │                        │ lệnh, sự kiện, quyết   │                                              │
│         │                        │ định AI, lệnh điều     │                                              │
│         │                        │ khiển) - mục 2.8       │                                              │
│         │                        └────────────────────────┘                                              │
└─────────┼────────────────────────────────────┬───────────────────────────────────────────────────────────┘
          │ giao thức MT5                      │ HTTPS đi ra (không mở cổng vào)
          ▼                                    ▼
   Máy chủ broker   ┌──────────────┬───────────────┬──────────────┬──────────────┬─────────────────────────┐
   (IC Markets)     │ Telegram API │ Claude API    │ Kho sao lưu  │ Heartbeat    │ Cloudflare Tunnel       │
                    │ (thông báo,  │ (AI advisor,  │ (bản sao đã  │ ngoài (báo   │ (đưa web-app ra Internet│
                    │  lệnh)       │  báo cáo)     │ mã hoá)      │ khi máy chết)│ qua tên miền HTTPS)     │
                    └──────────────┴───────────────┴──────────────┴──────────────┴────────────┬────────────┘
                                                                                              ▼
                                                                Người dùng: trình duyệt máy tính / điện thoại
                                                                (đăng nhập + 2FA, chỉ thấy tài khoản của mình)
```

### 2.2 Thành phần

| # | Thành phần | Nhiệm vụ | Công nghệ |
|---|---|---|---|
| ① | trader-core | Vòng lặp chính: mỗi khi đóng nến, tải nến → chạy các chiến lược tài khoản đã chọn → bộ lọc cứng → (hỏi AI, nếu bật) → kiểm rủi ro → đặt/sửa/huỷ lệnh → ghi nhật ký. **Tiến trình duy nhất được phép gửi lệnh tới MT5.** | Python 3.11+, `MetaTrader5`, pandas, pydantic |
| ② | web-app (**kênh chính**) | Xem và điều khiển toàn bộ hệ thống: lệnh, tín hiệu trên chart, quyết định AI, cấu hình rủi ro, bộ luật AI, kết quả test, quản lý người dùng và liên kết tài khoản | Backend FastAPI (REST + WebSocket đẩy cập nhật trực tiếp); giao diện web render phía server + thư viện chart `lightweight-charts` (vẽ nến MT5 và tín hiệu của engine Python); đăng nhập + 2FA, phân quyền theo tài khoản — xem [security.md](security.md) |
| ③ | telegram-bot (kênh phụ) | Đẩy thông báo; lệnh xem và điều khiển cơ bản khi không mở được web — chi tiết ở [telegram-bot.md](telegram-bot.md) | `python-telegram-bot`, long polling |
| ④ | jobs (tác vụ nền) | Những việc hệ thống **tự làm mà không ai bấm**, và không phải việc đặt lệnh. Danh sách ở bảng ngay dưới | Chạy ngay trong ứng dụng Python bằng thư viện APScheduler. Không dùng Windows Task Scheduler |
| — | Kho dữ liệu | SQLite (chế độ WAL) khi phát triển và chạy demo một người. Trước khi mở cho người dùng khác (GĐ 11) chuyển sang PostgreSQL cài ngay trên cùng VPS Windows, vì lúc đó có nhiều worker cùng ghi. Code chỉ đi qua lớp `store/` (SQLAlchemy) nên đổi được. Parquet cho nến; file log xoay vòng. Danh sách bảng: mục 2.8 | SQLAlchemy, Alembic (migration) |
| — | Test đối chiếu | EA mỏng MQL5 cho Strategy Tester; chỉ báo MQL5 hiển thị (đọc file tín hiệu Python, vẽ lên chart MT5); `pine-tests` TypeScript hiện có | MQL5, Playwright |

**Các tác vụ nền (④ jobs).** Tách khỏi trader-core để vòng lặp đặt lệnh luôn gọn và nhanh; các việc dưới đây chạy chậm hay lỗi cũng không làm trễ lệnh.

| Tác vụ | Khi nào chạy | Làm gì |
|---|---|---|
| Nhật ký lệnh | Ngay khi một lệnh đóng | Ghi lại toàn bộ dòng đời lệnh: tín hiệu gốc, giá vào/ra, R đạt được, lý do đóng |
| Báo cáo thống kê | Cuối ngày, cuối tuần, cuối tháng | Tính số liệu từ `deals`/`positions` theo từng loại báo cáo, lưu vào `reports`, gửi tóm tắt qua Telegram |
| Đối soát với MT5 | Mỗi 5–15 phút | So "ý định lệnh" trong DB với lệnh/deal thật trên MT5; lệch thì cảnh báo. Bắt được lệnh mất, lệnh thiếu SL, lệnh lạ |
| Nạp lịch kinh tế | Mỗi ngày | Đọc file service MQL5 xuất ra, nạp vào `economic_events` |
| Ping heartbeat | Mỗi phút | Báo "còn sống" cho dịch vụ ngoài; máy chết thì bạn nhận cảnh báo |
| Sao lưu | Mỗi đêm | Nén DB + log, mã hoá, đẩy lên kho lưu trữ |
| Test đêm | Mỗi đêm | Chạy lại PP1/PP2 trên dữ liệu mới, lưu gói bằng chứng |
| Dọn dẹp | Mỗi tuần | Xoay vòng log, xoá file tạm, kiểm dung lượng ổ đĩa |
| Giữ tài khoản demo sống | Mỗi ngày | Cảnh báo khi một tài khoản demo sắp quá hạn không hoạt động (IC Markets xoá demo sau khoảng 20–30 ngày không mở lệnh) |

Mỗi tiến trình chạy như một Windows service (NSSM), tự khởi động lại khi sập và khi máy khởi động. Thư viện `MetaTrader5` mỗi lần chỉ gắn với một terminal, nên **mỗi tài khoản MT5 có một terminal riêng và một worker trader-core riêng**.

### 2.3 Các kênh liên lạc

| Từ → Đến | Cách kết nối | Ghi chú |
|---|---|---|
| trader-core ↔ MT5 Terminal | Gọi hàm thư viện `MetaTrader5` (IPC cùng máy) | Terminal phải đang mở và đăng nhập |
| MT5 Terminal → trader-core (lịch kinh tế) | Một service MQL5 nhỏ chạy trong terminal, đọc lịch kinh tế có sẵn của MT5 và ghi ra file; trader-core nạp vào DB | Thư viện Python `MetaTrader5` không có hàm đọc lịch kinh tế, nên phải đi đường này. Miễn phí, cùng giờ server với nến |
| MT5 Terminal ↔ Broker | Giao thức riêng của MT5 | SL/TP luôn gửi kèm lệnh và **nằm trên máy chủ broker**, nên bot chết thì lệnh vẫn có SL |
| telegram-bot ↔ Telegram | HTTPS, bot chủ động hỏi Telegram (long polling) | Không cần IP tĩnh hay mở cổng. Bot chỉ phục vụ người đã liên kết Telegram với tài khoản web |
| Trình duyệt người dùng ↔ web-app | HTTPS qua tên miền riêng, đi qua **Cloudflare Tunnel** (VPS không mở cổng vào nào); WebSocket để trang tự cập nhật | **Công khai trên Internet**, nhưng mọi trang/API đều cần đăng nhập + 2FA, và mỗi người chỉ thấy tài khoản MT5 được gán cho mình. Khi phát triển: `http://localhost:8000` |
| Quản trị viên ↔ máy VPS | Remote Desktop qua mạng riêng Tailscale | Chỉ để quản trị máy (cài đặt, xem terminal MT5). Không mở Remote Desktop ra Internet |
| web-app → trader-core | Ghi một dòng vào bảng `commands` trong SQLite (ai, lúc nào, lệnh gì); trader-core đọc mỗi vài giây, thực hiện, ghi kết quả lại | web-app **không tự chạm vào MT5**. Mọi thao tác đều để lại dấu vết kiểm tra được |
| telegram-bot → trader-core | Cũng qua bảng `commands` | Cùng một đường với web, nên hai kênh không thể làm lệch trạng thái nhau |
| trader-core → web-app / telegram-bot | Ghi vào bảng `events`/`outbox`; web đẩy lên trình duyệt, telegram-bot gửi đi | Mất mạng thì thông báo chờ, không mất |
| trader-core → Claude API | HTTPS, có giới hạn thời gian chờ | Quá hạn/lỗi → xử lý theo luật mặc định, ghi lại |
| jobs → Heartbeat ngoài | HTTPS ping mỗi phút | Ngừng ping → dịch vụ đó nhắn Telegram/email cho bạn. Đây là thứ duy nhất báo được khi cả máy chết |
| jobs → Sao lưu | Nén SQLite + log, **mã hoá** rồi mới đẩy lên kho lưu trữ đám mây | Mã nguồn nằm ở GitHub |

### 2.3.1 Đường đi của một lệnh

Ở broker có hai thứ khác nhau:

| | Khu vực khách hàng (IC Markets Secure Client Area, Exness Personal Area) | Tài khoản giao dịch MT5 |
|---|---|---|
| Dùng để | Mở tài khoản MT5, nạp/rút tiền, giấy tờ | **Đặt lệnh**, xem lệnh, xem số dư |
| Đăng nhập bằng | Email + mật khẩu khu vực khách hàng | Số tài khoản + mật khẩu MT5 + tên server |
| Hệ thống có dùng không | Không | **Có**, đây là đường đặt lệnh duy nhất |

Vì vậy "không kết nối được thẳng với tài khoản broker" không làm mất gì cho việc giao dịch. Chính bạn khi giao dịch tay cũng chỉ đăng nhập MT5 chứ không đăng nhập khu vực khách hàng.

Còn một lợi ích bảo mật: mật khẩu MT5 **không rút được tiền**, vì rút tiền chỉ làm được trong khu vực khách hàng. Kể cả lộ mật khẩu MT5 lưu trong hệ thống thì kẻ gian cũng không lấy được tiền ra (dù vẫn có thể đặt lệnh xấu, nên mật khẩu MT5 vẫn được mã hoá).

**Bot đặt một lệnh:**

```
① Đóng nến 15m
② trader-core tải nến từ terminal MT5 của tài khoản con
③ Chiến lược tính ra tín hiệu: XAUUSD BUY LIMIT 2381.40, SL 2374.90, TP 2394.40
④ Bộ lọc cứng: né tin, spread trần, phiên giao dịch (AI tạm thời tắt; khi bật thì AI xét ở bước này)
⑤ Bộ quản lý rủi ro tính khối lượng theo số dư của đúng tài khoản con đó, kiểm giới hạn
⑥ Ghi "ý định lệnh" vào DB (phòng sập giữa chừng)
⑦ Gọi mt5.order_send(...) qua thư viện MetaTrader5
      → terminal MT5 (đã đăng nhập tài khoản con)
      → máy chủ giao dịch của broker
⑧ Broker trả kết quả: số ticket, hoặc mã lỗi (requote, hết tiền ký quỹ, thị trường đóng…)
⑨ Ghi kết quả vào DB → web cập nhật, Telegram báo
⑩ Từ đây SL/TP nằm trên máy chủ broker; bot chỉ theo dõi và quản lý tiếp
```

**Bạn đặt / can thiệp lệnh bằng tay:**
- Trên **MT5** (máy tính hoặc điện thoại), đăng nhập cùng tài khoản con: đặt, đóng, sửa như bình thường. Bot nhận ra lệnh của mình qua *magic number* gắn vào mỗi lệnh, nên phân biệt được lệnh bot và lệnh tay. Lệnh tay thì bot có tiếp quản không: chốt ở GĐ 7.
- Trên **web / Telegram**: đóng lệnh, huỷ lệnh chờ, dời SL/TP, dừng khẩn. Các thao tác này đi qua bảng `commands` → trader-core → cùng đường ⑦ ở trên. Có cho đặt lệnh mới bằng tay từ web không: chốt ở GĐ 7.

### 2.4 Bạn truy cập và điều khiển hệ thống ở đâu

**Web (kênh chính)** — mở bằng trình duyệt trên máy tính hoặc điện thoại, đăng nhập + 2FA. Mỗi người chỉ thấy và thao tác trên các tài khoản MT5 mình có quyền.

| Trang | Xem | Thao tác |
|---|---|---|
| Tổng quan | Cây tài khoản: broker → các tài khoản MT5 con. Cho từng tài khoản con và cộng theo từng broker: số dư, đường vốn, lãi/lỗ ngày, lệnh đang mở, trạng thái bot | Tạm ngừng / tiếp tục mở lệnh mới; **Dừng khẩn** (một tài khoản con, cả một broker, hoặc tất cả) |
| Lệnh | Lệnh chờ, lệnh đang chạy, lịch sử; mỗi lệnh có dòng thời gian đầy đủ | Huỷ lệnh chờ; đóng lệnh; dời SL/TP (không cho nới SL quá giới hạn rủi ro) |
| Thư viện chiến lược | Các chiến lược đã phát hành: mô tả, chỉ báo Pine gốc, khung thời gian, nhóm sản phẩm phù hợp, kết quả backtest và kết quả test đối chiếu của từng phiên bản | Chọn chiến lược cho từng tài khoản MT5 và symbol; chỉnh tham số trong khoảng cho phép; chuyển sang phiên bản mới (có xác nhận) |
| Chart & tín hiệu | Chart **trên trang web** (không phải trong terminal MT5): nến lấy từ MT5, vẽ chồng CHoCH/BOS, vùng OF, Entry/SL/TP do engine Python tính, giống cách chỉ báo hiện trên TradingView; cả tín hiệu bị loại và lý do. Chế độ so sánh: vẽ thêm sự kiện của Pine, chỗ lệch tô đỏ | Bật/tắt từng symbol |
| Quyết định AI *(khi bật AI)* | Từng quyết định: mã luật, bằng chứng, kết quả thật của lệnh, và **hệ thống tự chấm** quyết định đó đúng hay sai theo kết quả thật | Chỉ xem để truy vết. Không cần người duyệt; có thể thêm ghi chú nếu muốn |
| Bộ luật AI *(khi bật AI)* | Danh sách luật, thống kê theo từng luật, lịch sử phiên bản | Sửa / bật-tắt / thêm luật; chạy thử trên tín hiệu cũ trước khi áp dụng |
| Cấu hình rủi ro | % rủi ro, giới hạn lỗ ngày/tuần, số lệnh tối đa, spread trần | Sửa (có xác nhận, có lịch sử thay đổi) |
| Backtest & test | Báo cáo backtest; kết quả 3 phương pháp test chạy đêm | Chạy backtest theo yêu cầu |
| Hệ thống | Kết nối MT5, heartbeat, log, hàng đợi lệnh điều khiển, nhật ký thao tác | Khởi động lại từng tiến trình (chỉ admin) |
| Tài khoản của tôi | Thông tin đăng nhập, 2FA, phiên đang mở, các tài khoản broker và tài khoản MT5 con, Telegram đã liên kết | Đổi mật khẩu, bật 2FA, đăng xuất phiên khác; thêm / xoá tài khoản broker; thêm / xoá tài khoản MT5 con trong từng broker; liên kết / huỷ liên kết Telegram |
| Người dùng (chỉ admin) | Danh sách người dùng, ai có quyền trên tài khoản MT5 nào | Mời người dùng, gán quyền, khoá tài khoản |

Thao tác nguy hiểm (dừng khẩn, đóng lệnh, sửa rủi ro, chuyển chế độ live, liên kết tài khoản MT5) đều hỏi xác nhận lại, yêu cầu nhập lại mã 2FA, và được ghi vào nhật ký thao tác.

**Telegram (kênh phụ)** — nhận thông báo trên điện thoại, xem nhanh và điều khiển cơ bản khi không mở được web. Mỗi người tự liên kết Telegram của mình từ trang "Tài khoản của tôi" (mã dùng một lần), bot chỉ trả lời người đã liên kết và chỉ về tài khoản họ có quyền. Danh sách lệnh, quyền, luồng xác nhận và loại thông báo: [telegram-bot.md](telegram-bot.md). Các việc phức tạp (sửa SL/TP, sửa rủi ro, sửa bộ luật AI, bật live) chỉ làm trên web.

**MT5 Terminal / MT5 trên điện thoại** — đăng nhập cùng tài khoản để nhìn lệnh thật, độc lập với bot. Trên chart của terminal MT5 có thể gắn chỉ báo MQL5 hiển thị để thấy tín hiệu Python vẽ ngay trên nến broker.

**TradingView** — vẫn dùng chỉ báo Pine để nhìn chart và làm mốc đối chiếu.

### 2.5 Hạ tầng theo giai đoạn

| Giai đoạn | Máy chạy | Chi phí định kỳ |
|---|---|---|
| Phát triển, backtest (GĐ 0–8) | PC Windows 10 hiện tại | 0 |
| Chạy demo liên tục (GĐ 9) — **đã chốt tạm thời** | **PC hiện tại làm máy chủ, chạy 24/7** (phương án 1, mục 2.5.2). Demo không mất tiền thật nên chấp nhận được rủi ro tắt máy | Chỉ tiền điện |
| Live (GĐ 10) | Xem lại lúc đó: tiếp tục PC nếu chạy ổn định, hoặc chuyển VPS (dùng thử ForexVPS 3 tháng / VPS giá rẻ, mục 2.5.2). Tài khoản MT5 live tạo dưới cùng tài khoản broker | Tiền điện, hoặc phí VPS |
| Mở cho nhiều người dùng (GĐ 11) | Nâng VPS lên gói M / L theo số tài khoản MT5 | Xem bảng chi phí |

Dịch vụ ngoài dùng tới: GitHub (mã nguồn, CI chạy test offline), Telegram, Claude API, heartbeat, kho sao lưu, dịch vụ gửi email (lời mời, cảnh báo bảo mật), **một tên miền + Cloudflare** để đưa web ra Internet. Không cần cơ sở dữ liệu đám mây.

**Vì sao chạy trên Windows.** MT5 Terminal là phần mềm Windows, còn thư viện Python `MetaTrader5` chỉ có bản Windows và nói chuyện với terminal qua IPC cùng máy. Vì vậy mọi thành phần chạy chung trên một máy Windows như sơ đồ 2.1. Các phương án đã cân nhắc và không chọn: lai Windows + Linux Docker, và toàn bộ Linux với MT5 chạy trong Wine (không chính thức, dễ vỡ khi MT5 tự cập nhật). Code vẫn giữ nguyên tắc web/telegram/jobs không gọi MT5 mà chỉ đọc/ghi DB, nên sau này muốn tách máy thì không phải viết lại.

Lưu ý: dịch vụ VPS có sẵn trong MT5 (MQL5 Virtual Hosting) **không dùng được**, vì nó chỉ chạy EA/chỉ báo MQL5, không chạy Python.

**Dùng PC hiện tại làm máy chủ — được, với các điều kiện sau** (làm ở GĐ 9):

| Việc | Vì sao |
|---|---|
| BIOS: bật "Restore on AC power loss" (tự bật máy khi có điện lại) | Mất điện xong máy tự chạy lại, không cần người bấm |
| Windows: tắt chế độ ngủ / ngủ đông; tự đăng nhập user chạy bot | Máy ngủ thì terminal MT5 mất kết nối |
| Windows Update: đặt giờ hoạt động, chỉ cho khởi động lại vào cuối tuần (Forex/Vàng nghỉ) | Tránh máy tự khởi động lại giữa phiên |
| Bot, terminal MT5 chạy dạng service tự khởi động (NSSM) | Khởi động lại máy là bot tự chạy |
| Heartbeat ngoài (Healthchecks.io, miễn phí) | Máy chết hay mất mạng thì Telegram/email báo bạn |
| Nên có bộ lưu điện (UPS) | Mất điện ngắn không làm tắt máy |
| Web chỉ mở qua Tailscale, không mở cổng modem | Máy ở nhà không lộ ra Internet |

Hạn chế cần chấp nhận: mất điện hay mất mạng ở nhà lâu thì bot dừng (lệnh đang mở vẫn có SL/TP trên máy chủ broker); PC vừa làm việc vừa chạy bot nên tránh tắt máy hoặc chạy việc quá nặng.

#### 2.5.1 Cấu hình máy và chi phí dự trù

**Ước lượng tài nguyên** (sẽ đo lại thật ở GĐ 9):
- Windows Server + web-app + telegram-bot + jobs + DB: khoảng 3–4 GB RAM.
- Mỗi tài khoản MT5 = một terminal + một worker Python: khoảng 0,5–0,8 GB RAM, CPU thấp, vì chiến lược chạy trên nến 15m chứ không phải từng tick.

**Đặt máy ở đâu:** máy chủ MT5 của IC Markets nằm ở Equinix NY4 (New York). Chiến lược khung 15m không cần độ trễ vài mili-giây, nên chỉ cần VPS ở New York / bờ Đông Mỹ. Không cần trả thêm tiền cho gói đặt cùng tòa nhà NY4.

**Gói VPS Windows** (giá đã gồm bản quyền Windows Server; tham khảo tháng 11/2026, phải kiểm lại khi mua):

| Gói | Cấu hình | Phục vụ được | Giá tham khảo / tháng |
|---|---|---|---|
| S | 4 vCPU, 8 GB RAM, SSD 80–100 GB | GĐ 9–10: 1 người dùng, 1–5 tài khoản MT5 | 15–45 USD |
| M | 6–8 vCPU, 16 GB RAM, SSD 160 GB | Khoảng 10–15 tài khoản MT5 | 40–90 USD |
| L | 8–12 vCPU, 32 GB RAM, SSD 250 GB | Khoảng 25–30 tài khoản MT5 | 80–170 USD |

Vượt khoảng 30 tài khoản thì một máy không còn đủ: phải xem lại kiến trúc (nhiều máy Windows chạy worker, dùng chung một PostgreSQL). Việc này để sau GĐ 11.

**Mua VPS ở đâu:**

| Loại nhà cung cấp | Ví dụ | Gói S khoảng / tháng | Ưu | Nhược |
|---|---|---|---|---|
| VPS chuyên forex | ForexVPS.net, Beeks, CNS (Beeks và CNS là đối tác IC Markets giới thiệu) | 30–45 USD | Đặt sẵn gần máy chủ broker, cài sẵn cho MT5, hỗ trợ hiểu về trading | Ít công cụ quản trị, sao lưu |
| VPS phổ thông | Contabo, Vultr… | 15–30 USD | Rẻ nhất | Tự lo mọi thứ; máy giá rẻ đôi khi bị chia CPU, chậm lúc cao điểm |
| Đám mây lớn | **Azure**, AWS, Google Cloud | ~80 USD (Azure) | Ổn định, có cam kết SLA, chụp ảnh ổ đĩa và sao lưu bằng một nút, giám sát, hoá đơn công ty, dùng được tín dụng Azure | Đắt nhất nếu tự trả |

**Azure dùng được.** Tạo một máy ảo Windows Server, chọn vùng **East US** (Virginia, cách New York vài mili-giây). Chi phí gói S (giá trả theo giờ, tham khảo tháng 11/2026; kiểm lại trên Azure Pricing Calculator):

| Thành phần | Lựa chọn | ~ USD / tháng |
|---|---|---|
| Máy ảo | `Standard_B2ms`: 2 vCPU, 8 GB RAM, đã gồm bản quyền Windows. Đủ cho 1–3 tài khoản MT5 vì bot dùng ít CPU (backtest nặng thì chạy trên PC) | ~67 |
| Ổ đĩa hệ điều hành | Standard SSD 128 GB | ~10 |
| IP công khai | Để máy đi ra Internet; dùng nhóm bảo mật mạng (NSG) chặn mọi cổng vào | ~4 |
| **Cộng** | | **~80** |

Cách giảm chi phí trên Azure:
- Đặt trước 1 năm (reserved instance) giảm phần tiền máy.
- Nếu bạn hoặc công ty có gói Visual Studio, tín dụng Azure hằng tháng, hoặc bản quyền Windows Server sẵn (Azure Hybrid Benefit), chi phí thực có thể thấp hơn nhiều, thậm chí gần 0.
- Tài khoản Azure mới thường có tín dụng dùng thử: đủ để chạy thử GĐ 9 trước khi quyết định.

Gói M trên Azure (`Standard_B4ms`, 4 vCPU, 16 GB) khoảng gấp đôi.

**Đề xuất:** nếu có tín dụng Azure hoặc muốn hoá đơn công ty thì dùng Azure. Nếu tự trả và muốn rẻ thì dùng VPS chuyên forex. Code và cách cài đặt giống hệt nhau, đổi nhà cung cấp sau cũng không sao.

**Claude API** — hiện **tạm không dùng** (mục 1 "Quyền AI"). Phần dưới để dự trù khi bật lại.

Lưu ý: **gói Claude Pro không dùng được cho bot.** Pro là gói của claude.ai (chat) và dùng được cho Claude Code khi phát triển, nhưng **không gồm Claude API**. Bot gọi AI phải dùng API key tạo trên Claude Console, nạp tiền và tính phí riêng theo token. (Theo trang hỗ trợ của Anthropic, gói Max và Team có kèm một ít tín dụng API hằng tháng; Pro thì không.)

Bảng giá Anthropic tháng 11/2026, USD cho 1 triệu token:

| Model | Vào | Ra |
|---|---|---|
| Claude Opus 5.5 | 4 | 20 |
| Claude Sonnet 5.5 | 2 | 10 |
| Claude Haiku 5.5 | 0,10 | 0,50 |

Giả định: mỗi lần AI xét một tín hiệu dùng khoảng 4.000 token vào (bộ luật + ngữ cảnh) và 1.500 token ra (gồm cả phần suy luận). Mỗi chiến lược sinh 20–60 tín hiệu mỗi ngày (cộng mọi symbol), tức 600–1.800 lần gọi mỗi tháng. **Một tín hiệu chỉ hỏi AI một lần** dù có bao nhiêu tài khoản dùng chung chiến lược đó (mục 2.9), nên phần này tăng theo số chiến lược × symbol, không tăng theo số người dùng. Báo cáo thì tính riêng cho từng tài khoản: nhật ký lệnh + báo cáo ngày/tuần chạy qua Batch API (giảm 50%, vì không cần gấp).

| Hạng mục | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| Một lần xét tín hiệu | ~0,046 USD | ~0,023 USD | ~0,001 USD |
| Xét tín hiệu / tháng (600–1.800 lần) | 28–83 USD | 14–41 USD | 1–2 USD |
| Báo cáo / tháng cho **mỗi** tài khoản | ~7 USD | ~3,5 USD | < 0,5 USD |

Prompt caching (lưu đệm phần bộ luật cố định) còn giảm được thêm phần token vào. Chọn model nào được chốt ở GĐ 8, sau khi so chất lượng quyết định trên cùng một bộ tín hiệu cũ. Đặt hạn mức chi tiêu trên Anthropic Console để không bao giờ vượt ngân sách.

**Dịch vụ khác:**

| Dịch vụ | Chi phí |
|---|---|
| Tên miền | ~10–15 USD/năm (~1 USD/tháng) |
| Cloudflare Tunnel, Tailscale (quản trị), Healthchecks.io (heartbeat), Telegram, GitHub (repo riêng, CI gói miễn phí) | 0 USD ở quy mô này |
| Kho sao lưu (Cloudflare R2 / Backblaze B2, vài GB) | 0–1 USD/tháng |
| Email gửi lời mời, cảnh báo (Brevo / Resend, gói miễn phí) | 0 USD |
| Lịch kinh tế | 0 USD: dùng lịch có sẵn trong MT5 (xem bên dưới) |

**Lịch kinh tế: dùng để làm gì, có cần không, vì sao không tốn tiền.**
- *Dùng để làm gì:* những tin lớn như CPI, bảng lương phi nông nghiệp (NFP), quyết định lãi suất FED/ECB làm Forex và Vàng giật mạnh trong vài phút. Spread giãn rộng, lệnh khớp lệch giá, SL dễ bị quét. Bộ lọc "né tin" không cho vào lệnh trong khoảng X phút trước/sau tin đỏ của đồng tiền trong cặp. Crypto CFD gần như không bị ảnh hưởng.
- *Có cần không:* không bắt buộc để hệ thống chạy. Đây là một bộ lọc rủi ro, và bộ lọc spread trần cũng đã che được một phần. Cách quyết định: ở GĐ 5 chạy backtest **có và không có** bộ lọc né tin, rồi giữ hay bỏ theo số liệu.
- *Vì sao không tốn tiền:* con số 0–50 USD trước đây là giá các API thương mại bán dữ liệu lịch tin. Không cần đến chúng, vì MT5 có sẵn lịch kinh tế của MetaQuotes: miễn phí, có mức độ quan trọng của từng tin, có lịch sử để backtest, và dùng cùng giờ server với nến. Thư viện Python không đọc được lịch này, nên cần một service MQL5 nhỏ chạy trong terminal để xuất ra file (mục 2.3). Các nguồn miễn phí khác như ForexFactory không có API chính thức, nên không dùng.

**Tổng dự trù mỗi tháng** (USD; khoảng rộng vì còn tuỳ nhà cung cấp VPS và model AI):

| Kịch bản | VPS | Claude API (Opus 5.5 / Sonnet 5.5) | Khác | **Tổng** |
|---|---|---|---|---|
| GĐ 0–8: phát triển trên PC | 0 | 5–30 (chỉ khi thử AI ở GĐ 8) | ~1 | **~5–30** |
| **GĐ 9–10: hiện tại — 1 người (bạn), 1–3 tài khoản, 1 chiến lược** | 15–45 (S); ~80 nếu Azure | 35–105 / 18–52 | ~1 | **~35–150**; **~100–185 nếu Azure** |
| *Tham khảo khi mở rộng:* ~10 tài khoản, 2 chiến lược | 40–90 (M) | 125–235 / 63–117 | ~1 | **~105–325** |
| *Tham khảo khi mở rộng:* ~25 tài khoản, 3 chiến lược | 80–170 (L) | 260–425 / 130–210 | ~1 | **~210–595** |

Ngân sách cần lo bây giờ chỉ là dòng GĐ 9–10. Hai dòng cuối để biết hệ thống tốn bao nhiêu nếu sau này mở rộng. Chưa tính: tiền ký quỹ tài khoản live, thời gian người vận hành.

#### 2.5.2 Phương án tiết kiệm chi phí (đã chốt tạm thời 26/11/2026: phương án 1 — PC hiện tại 24/7; tạm không dùng Claude API)

Hai khoản lớn nhất là **máy chủ** và **Claude API**. Các khoản còn lại đều có cách miễn phí.

**A. Máy chủ — tận dụng việc demo không mất tiền thật**

Lý do ban đầu phải thuê VPS từ GĐ 9 là PC nhà có thể tắt máy hoặc mất điện, để hở lệnh. Nhưng trên tài khoản **demo**, mất kết nối không làm mất tiền thật. SL/TP lại nằm trên máy chủ broker, nên lệnh vẫn được bảo vệ khi bot tắt. Thiệt hại duy nhất là thiếu một ít dữ liệu demo. Vì vậy chỉ thật sự cần VPS khi chạy **live**.

| Phương án | Chi phí | Dùng khi | Ghi chú |
|---|---|---|---|
| 1. PC hiện tại chạy 24/7 | 0 USD + tiền điện ~150–200 nghìn đồng/tháng (máy ~80 W) | GĐ 9 demo | Cấu hình: BIOS tự bật lại khi có điện; Windows Update chỉ cài theo khung giờ cuối tuần; bot chạy dạng service tự khởi động; heartbeat báo khi máy chết. Nên có thêm bộ lưu điện (UPS) mua một lần |
| 2. Mini PC riêng (Intel N100, 16 GB RAM) | Mua một lần ~3–4 triệu đồng; điện ~10–15 W, ~30 nghìn đồng/tháng | GĐ 9 demo, chạy lâu dài | Không chiếm PC làm việc. Hoà vốn so với VPS 30 USD/tháng sau khoảng 5 tháng. Vẫn phụ thuộc điện và mạng ở nhà |
| 3. VPS Windows giá rẻ (ví dụ Contabo Cloud VPS 4: 4 vCPU, 8 GB, đã gồm Windows) | ~15–16 USD/tháng | GĐ 10 live | Giá tốt nhất cho 8 GB. CPU có thể bị chia sẻ, nhưng bot dùng ít CPU nên ổn. Gói 4 GB rẻ hơn (~10–12 USD) cũng đủ cho 1 tài khoản nếu giảm số nến hiển thị và đóng chart thừa trong MT5 |
| 4. VPS miễn phí từ IC Markets | 0 USD | GĐ 10 live, khi đủ điều kiện | Điều kiện: giao dịch Forex + kim loại từ **15 lot/tháng**, không đạt thì có thể bị cắt. Với tài khoản live nhỏ thì khó đạt. IC Markets còn có chương trình **dùng thử ForexVPS 3 tháng miễn phí**: dùng được cho 3 tháng live đầu tiên |
| 5. Azure | ~80 USD, hoặc ~0 nếu có tín dụng | Chỉ khi có tín dụng Azure | Máy ảo miễn phí của Azure (B1s, 1 GB RAM) quá nhỏ cho Windows + MT5, không dùng được. Tín dụng dùng thử 200 USD trong 30 ngày đủ để thử cài đặt |

Không dùng: Linux + Wine (đã loại ở phương án hạ tầng); VPS của MetaQuotes (không chạy Python).

**B. Claude API — giảm số lần gọi trước, rồi mới chọn model rẻ**

| Cách | Tiết kiệm | Ghi chú |
|---|---|---|
| Luật kiểm được bằng code thì kiểm bằng code: né tin (so với `economic_events`), spread trần, phiên giao dịch, giới hạn lỗ | Bỏ hẳn các lần gọi AI cho những luật này | Kết quả chính xác hơn và truy vết dễ hơn. AI chỉ xét những luật cần phán đoán, ví dụ "phá yếu", "cấu trúc xấu" |
| Chỉ hỏi AI khi tín hiệu đã qua mọi bộ lọc cứng | Số lần gọi giảm, ước lượng còn 5–20 lần/ngày thay vì 20–60 | Tín hiệu bị loại sẵn thì không cần AI |
| Model Haiku 5.5 cho xét từng tín hiệu | ~0,001 USD/lần, rẻ hơn Opus khoảng 40 lần | Chỉ chọn nếu ở GĐ 8 nó cho quyết định tốt ngang model lớn trên cùng bộ tín hiệu cũ |
| Lưu đệm phần bộ luật cố định (prompt caching) | Phần token đọc từ bộ đệm chỉ tính ~5% giá | Bộ luật + hướng dẫn chiếm phần lớn token vào |
| Báo cáo: code tính số liệu, AI chỉ viết nhận xét **hằng tuần**, chạy qua Batch API | Giảm 50% giá báo cáo, và số lần gọi giảm 7 lần | Báo cáo ngày dùng mẫu cố định do code điền, không cần AI |
| Đặt mức suy nghĩ (effort) thấp cho việc xét tín hiệu | Giảm token ra | Đây là việc gần với phân loại, không cần suy luận dài |
| Đặt hạn mức chi tiêu tháng trên Anthropic Console | Chặn vượt ngân sách | Bắt buộc dù chọn cách nào |

Ước lượng sau khi áp dụng: Haiku 5.5 xét tín hiệu + Sonnet 5.5 viết nhận xét tuần ≈ **1–3 USD/tháng**. Nếu GĐ 8 cho thấy cần Opus 5.5 để xét tín hiệu thì khoảng 6–25 USD/tháng.

**C. Các khoản khác — dùng gói miễn phí**

| Khoản | Cách miễn phí |
|---|---|
| Tên miền + Cloudflare | Lúc chỉ có một mình bạn dùng: vào web qua **Tailscale** (miễn phí, an toàn hơn vì không công khai). Cần đường dẫn công khai thì dùng **Tailscale Funnel** (địa chỉ `*.ts.net`, có HTTPS, không cần mua tên miền). Chỉ mua tên miền khi mở cho người khác dùng |
| Email | Chưa cần: một người dùng thì Telegram lo hết cảnh báo. Lời mời người dùng chỉ cần khi mở rộng |
| Sao lưu | Cloudflare R2 hoặc Backblaze B2 (gói miễn phí 10 GB), hoặc OneDrive/Google Drive sẵn có |
| CI GitHub | Chạy test offline trên máy Linux của GitHub Actions (máy Windows tốn gấp đôi số phút miễn phí); test cần MT5 thì chạy trên máy của bạn |
| Heartbeat | Healthchecks.io gói miễn phí |
| Lịch kinh tế, MT5, tài khoản demo | Miễn phí |

**Tổng sau khi tiết kiệm** (mỗi tháng):

| Giai đoạn | Máy chủ | Claude API | Khác | **Tổng** |
|---|---|---|---|---|
| GĐ 0–8 | 0 | 0–5 (thử ở GĐ 8) | 0 | **0–5 USD** |
| **GĐ 9 demo trên PC hiện tại, không AI (đã chốt tạm thời)** | 0 (+ tiền điện ~150–200 nghìn đồng) | 0 | 0 | **0 USD + tiền điện** |
| GĐ 9 nếu bật AI tiết kiệm | như trên | 1–3 | 0 | ~1–3 USD + tiền điện |
| GĐ 10 live trên VPS giá rẻ | 0 (ForexVPS dùng thử 3 tháng / VPS IC Markets) → 15 sau đó | 0 (không AI) / 1–3 | 0 | **~0–20 USD** |

So với mức dự trù trước đó (35–150 USD/tháng), khoản tiết kiệm chính đến từ ba việc: chạy demo ở nhà, đẩy luật cứng về code, và dùng model rẻ cho phần xét tín hiệu.

### 2.6 Môi trường và bảo mật

Tóm tắt dưới đây; chi tiết (mô hình tài khoản, đăng nhập, phân quyền, liên kết MT5/Telegram, mã hoá, mạng, kiểm thử bảo mật) ở [security.md](security.md).

- Môi trường: `backtest` (broker giả, DB riêng), `dev` (thử code mới, chỉ tài khoản demo), `production` (chạy thật). Demo hay live **gắn với từng tài khoản MT5 con**, vì cùng một tài khoản broker chứa cả hai loại. Một tài khoản con chỉ được gửi lệnh thật khi **đủ ba điều kiện**: công tắc chung `allow_live` bật, MT5 báo tài khoản là tài khoản thật, và admin đã bật live cho đúng tài khoản đó (có nhập 2FA). Lệch một trong ba thì worker của tài khoản đó từ chối khởi động.
- Mô hình tài khoản ba tầng: **tài khoản hệ thống** (đăng nhập web) → **tài khoản broker** (IC Markets, Exness…; chỉ để gom nhóm, không lưu mật khẩu khu vực khách hàng) → **tài khoản MT5 con** (nơi đặt lệnh; quyền chủ sở hữu / giao dịch / chỉ xem). Mỗi người dùng liên kết thêm một tài khoản Telegram. Không có đăng ký tự do: admin mời.
- Đăng nhập web: mật khẩu băm Argon2id, 2FA (TOTP) bắt buộc, phiên có hạn, khoá tạm khi nhập sai nhiều lần, nhập lại 2FA cho thao tác nguy hiểm.
- Mọi bí mật đều **mã hoá khi lưu**: mật khẩu MT5, token Telegram, API key, khoá 2FA. Mật khẩu đăng nhập web thì **băm** (không giải ngược được). Khoá giải mã nằm ngoài DB và ngoài git; `.env` không còn chứa bí mật dạng chữ thường.
- Web và Telegram không gọi MT5 trực tiếp; cả hai chỉ ghi yêu cầu vào bảng `commands`, trader-core kiểm lại quyền của người gửi và bộ quản lý rủi ro trước khi thực hiện.
- Mọi quyết định đều ghi kèm phiên bản mã nguồn, phiên bản đặc tả và phiên bản bộ luật AI; mọi thao tác của người dùng ghi vào nhật ký thao tác.

### 2.7 Cấu trúc thư mục dự kiến

```
source/
├─ trading hub/                  (giữ nguyên: Pine + pine-tests)
└─ trading-bot/
   ├─ docs/        ROADMAP.md · requirements.md · strategy-spec.md · architecture.md · runbook.md
   │               security.md · telegram-bot.md
   ├─ config/      symbols.yaml · risk.yaml · ai-rulebook.yaml · env.{backtest,dev,production}.yaml
   ├─ src/
   │  ├─ data/        tải, lưu, kiểm nến MT5
   │  ├─ strategy_kit/  khối dùng chung khi port Pine: swing, CHoCH/BOS, vùng OF/POI, giao diện Strategy
   │  ├─ strategies/  mỗi chiến lược một thư mục: trading_hub_3/ (đầu tiên) · <chiến lược sau>/
   │  │               mỗi thư mục có: code · spec.md · tham số mặc định · golden test
   │  ├─ ai/          gói ngữ cảnh, gọi Claude, kiểm định dạng trả về
   │  ├─ risk/        luật cứng, tính khối lượng
   │  ├─ execution/   giao diện Broker · Mt5Broker · SimBroker
   │  ├─ backtest/    vòng lặp mô phỏng, báo cáo
   │  ├─ store/       SQLite/PostgreSQL qua SQLAlchemy, mô hình dữ liệu, migration
   │  ├─ security/    băm mật khẩu, 2FA, mã hoá bí mật, phân quyền
   │  ├─ web/         FastAPI: api/ · ws/ · templates/ · static/
   │  ├─ notify/      telegram-bot
   │  └─ app/         trader-core, jobs
   ├─ mql5/        EA mỏng cho Strategy Tester · chỉ báo hiển thị tín hiệu Python
   ├─ evidence/    bằng chứng của từng lần chạy test (không vào git, có sao lưu)
   └─ tests/       unit · differential (PP1) · backtest_xcheck (PP2) · execution (PP3) · security
```

### 2.8 Dữ liệu lưu trữ (bản nháp, chốt ở GĐ 2)

Mọi bảng gắn với một tài khoản MT5 đều có cột `account_id`, và mọi truy vấn từ web/Telegram đều lọc theo danh sách tài khoản người dùng có quyền.

| Nhóm | Bảng | Lưu gì |
|---|---|---|
| Người dùng & truy cập | `users` | email, mật khẩu đã băm, khoá 2FA (mã hoá), vai trò (`admin`/`user`), trạng thái |
| | `sessions` | phiên đăng nhập: hạn, IP, thiết bị, đã thu hồi chưa |
| | `brokers` | danh mục broker (admin quản lý): tên, danh sách tên server MT5, tên công ty MT5 trả về, ghi chú múi giờ server |
| | `broker_symbols` | đổi tên symbol theo broker: tên chuẩn trong hệ thống ↔ tên ở broker (ví dụ `XAUUSD` ↔ `XAUUSDm`) |
| | `broker_accounts` | tài khoản broker (tầng 2): thuộc người dùng nào, broker nào, tên gợi nhớ, mã khách hàng ở broker (chỉ để nhận diện), giới hạn rủi ro chung (tuỳ chọn). Không có cột mật khẩu |
| | `mt5_accounts` | tài khoản MT5 con (tầng 3): thuộc tài khoản broker nào, số tài khoản + server (duy nhất toàn hệ thống), demo/thật, loại tài khoản, đơn vị tiền, đòn bẩy, loại mật khẩu (chính/chỉ xem), mật khẩu (mã hoá), bật/tắt, đã bật live chưa |
| | `account_members` | quyền được chia trên từng tài khoản MT5 con (`trader`/`viewer`); chủ tài khoản broker tự động là `owner` của mọi tài khoản con |
| | `telegram_links` | người dùng ↔ Telegram user id, chat id, cài đặt thông báo |
| | `link_codes` | mã liên kết dùng một lần (lưu bản băm, có hạn) |
| | `system_secrets` | token Telegram, Claude API key… (mã hoá) |
| Chiến lược | `strategies` | mỗi chiến lược: mã, tên, mô tả, chỉ báo Pine gốc, người phụ trách |
| | `strategy_versions` | từng phiên bản: commit code, phiên bản đặc tả, khuôn tham số (khoảng cho phép), trạng thái `nháp`/`đang test`/`đã phát hành`/`ngừng`, liên kết bằng chứng test và backtest |
| | `account_strategies` | tài khoản MT5 nào chạy phiên bản chiến lược nào, trên symbol nào, với tham số nào, bật/tắt |
| Cấu hình | `symbols` | symbol theo từng tài khoản: bật/tắt, tham số |
| | `economic_events` | lịch kinh tế lấy từ MT5: thời điểm (giờ server), đồng tiền, tên tin, mức quan trọng |
| | `risk_configs` | cấu hình rủi ro theo phiên bản: ai sửa, lúc nào, giá trị cũ/mới |
| | `rulebook_versions` | từng phiên bản bộ luật AI |
| Luồng giao dịch | `signals` | tín hiệu chiến lược tính: phiên bản chiến lược, broker, symbol, nến, hướng, Entry/SL/TP, R:R, được nhận hay bị loại + lý do. Một tín hiệu dùng chung cho mọi tài khoản chạy cùng chiến lược trên cùng broker/symbol |
| | `ai_decisions` | quyết định AI cho từng tín hiệu: luật dẫn, bằng chứng, độ tin cậy, phiên bản luật, model, thời gian trả lời, câu trả lời gốc, kết quả tự chấm |
| | `order_intents` | "ý định lệnh" của bot trước khi gửi MT5: loại, khối lượng, giá, SL/TP, trạng thái |
| | `orders`, `deals`, `positions` | bản sao lệnh / deal / vị thế từ MT5 (số ticket, giá khớp, phí, swap, lãi/lỗ, R) |
| | `order_events` | dòng thời gian của từng lệnh (chờ → khớp → dời SL → đóng…) |
| | `equity_snapshots` | số dư, vốn, margin theo thời gian (vẽ đường vốn) |
| Điều khiển & thông báo | `commands` | yêu cầu từ web/Telegram: ai, nguồn, tài khoản, lệnh gì, trạng thái, kết quả |
| | `events` | sự kiện hệ thống (mất kết nối, chạm giới hạn lỗ…) |
| | `outbox` | thông báo chờ gửi: kênh, người nhận, nội dung, số lần thử |
| | `audit_log` | nhật ký thao tác người dùng: ai, làm gì, lúc nào, từ IP nào, giá trị trước/sau |
| Báo cáo & vận hành | `reports` | nhật ký từng lệnh, báo cáo ngày/tuần (tính từ `deals`/`positions`, AI viết phần nhận xét) |
| | `reconciliations` | kết quả đối soát ý định lệnh ↔ MT5, các chỗ lệch |
| | `test_runs` | mỗi lần chạy PP1/PP2/PP3: chiến lược + phiên bản, commit, mã băm dữ liệu vào, kết quả, đường dẫn bằng chứng |

### 2.9 Nền tảng nhiều chiến lược

Mục tiêu dài hạn: một nền tảng mà mỗi chỉ báo Pine được chuyển sang Python thành một **chiến lược**, và người dùng chọn chiến lược để giao dịch. Trading Hub 3 là chiến lược đầu tiên. Kiến trúc được thiết kế cho nhiều chiến lược ngay từ GĐ 2, để chiến lược thứ hai không phải sửa phần lõi.

**Giao diện chung của một chiến lược.** Mọi chiến lược đều cài cùng một giao diện `Strategy` (định nghĩa ở GĐ 2):

| Thành phần | Nội dung |
|---|---|
| Thông tin | mã, phiên bản, chỉ báo Pine gốc, khung thời gian cần (ví dụ 15m + 4H), nhóm sản phẩm phù hợp |
| Tham số | khuôn tham số (pydantic): giá trị mặc định và khoảng người dùng được chỉnh |
| Hàm tính | nhận chuỗi nến đã đóng, trả danh sách sự kiện (CHoCH/BOS, vùng…) và tín hiệu (Entry/SL/TP). **Chỉ tính toán**: không gọi MT5, không gọi AI, không đọc/ghi DB, cùng đầu vào luôn ra cùng kết quả |
| Hàm vẽ | mô tả các đối tượng cần vẽ (đường, vùng, nhãn) để web chart và chỉ báo MQL5 hiển thị, không cần viết code vẽ riêng cho từng chiến lược |

Phần còn lại (dữ liệu, AI, rủi ro, đặt lệnh, báo cáo, web, Telegram) **dùng chung** cho mọi chiến lược. Các khối hay gặp trong chỉ báo SMC (swing, CHoCH/BOS, vùng OF/POI) nằm trong `strategy_kit/` để chiến lược sau dùng lại.

**Chạy thế nào khi có nhiều người dùng:**
- Tín hiệu được tính **một lần** cho mỗi bộ (phiên bản chiến lược, broker, symbol, tham số), rồi dùng chung cho mọi tài khoản MT5 con chạy đúng bộ đó. AI cũng chỉ xét mỗi tín hiệu một lần. Tính theo từng broker vì nến của IC Markets và của Exness không giống hệt nhau.
- Chiến lược luôn dùng tên symbol chuẩn (ví dụ `XAUUSD`); bảng `broker_symbols` đổi sang tên thật của từng broker. Thông số hợp đồng (cỡ lot, số chữ số, phí) đọc từ MT5 của từng tài khoản, vì mỗi broker và mỗi loại tài khoản khác nhau. Thời gian lưu theo UTC, vì giờ server mỗi broker khác nhau.
- Rủi ro và khối lượng được tính **riêng cho từng tài khoản** (số dư, giới hạn lỗ, số lệnh mở của tài khoản đó).
- Hai chiến lược cùng ra tín hiệu trên một symbol của một tài khoản: bộ quản lý rủi ro quyết định theo luật cấu hình (ví dụ chỉ một lệnh mỗi symbol, ưu tiên chiến lược nào). Luật cụ thể chốt ở GĐ 11.
- Bộ luật AI gồm luật chung cho mọi chiến lược và luật riêng của từng chiến lược.

**Quy trình đưa một chỉ báo Pine thành chiến lược** (chiến lược nào cũng phải qua đủ các bước, giống GĐ 1–9 đang làm cho Trading Hub 3):

1. Đặc tả `strategies/<mã>/spec.md`: mỗi luật một mã số.
2. Thêm dòng log `EVT` vào bản Pine để đối chiếu được (như `pine-tests` đang làm).
3. Port sang Python bằng `strategy_kit/`.
4. PP1: Pine ↔ Python lệch 0 sự kiện trên bộ nến golden.
5. PP2: backtest Python ↔ MT5 Strategy Tester.
6. Chạy demo trong một khoảng thời gian.
7. Admin **phát hành** phiên bản đó, kèm gói bằng chứng test và báo cáo backtest. Chỉ phiên bản đã phát hành mới hiện trong "Thư viện chiến lược" cho người dùng chọn.

**Phiên bản:** tài khoản gắn với một phiên bản cụ thể. Phiên bản mới không tự áp vào tài khoản đang chạy; người dùng tự chuyển (có xác nhận). Phiên bản bị phát hiện lỗi được chuyển sang `ngừng`: không ai chọn mới được, và các tài khoản đang chạy nó nhận cảnh báo.

---

## 3. Bộ luật AI — để bạn biết vì sao AI quyết định và chỉnh được

> **Tạm thời tắt (26/11/2026).** Hiện bot vào lệnh đúng theo chỉ báo, qua bộ lọc cứng và bộ quản lý rủi ro, không gọi AI. Phần dưới là thiết kế cho lúc bật lại (GĐ 8). Code từ đầu đã có chỗ cắm AI và một công tắc `ai.enabled: false` trong cấu hình, nên bật lại không phải sửa phần lõi.

AI không được quyết định theo "cảm nhận". Nó chỉ được áp dụng các luật trong file `config/ai-rulebook.yaml` mà **bạn đọc và sửa được**.

Luật nào kiểm được chính xác bằng code (ví dụ né tin dựa trên `economic_events`, spread, phiên giao dịch) thì code kiểm, không gửi AI: rẻ hơn và chắc chắn hơn. Bộ luật AI chỉ giữ những luật cần phán đoán. Ví dụ `AI-NEWS-01` bên dưới minh hoạ định dạng; khi làm thật, luật này sẽ chuyển thành bộ lọc cứng trong bộ quản lý rủi ro.

**Mỗi luật có:** mã số, điều kiện bằng lời, hành động (`từ chối` / `giảm khối lượng` / `chỉ ghi chú`), mức ưu tiên, bật/tắt. Ví dụ:

```yaml
- id: AI-NEWS-01
  mo_ta: Có tin đỏ của đồng tiền trong cặp trong vòng 30 phút trước/sau thời điểm vào lệnh
  hanh_dong: tu_choi
  bat: true
- id: AI-STRUCT-02
  mo_ta: CHoCH 15m xảy ra nhưng nến phá có thân nhỏ hơn 30% biên độ nến (phá yếu)
  hanh_dong: giam_khoi_luong
  bat: true
```

**Mỗi quyết định AI trả về theo khuôn cố định và được lưu lại:**

```json
{ "quyet_dinh": "tu_choi", "luat_ap_dung": ["AI-NEWS-01"],
  "bang_chung": "CPI Mỹ lúc 19:30, tín hiệu XAUUSD lúc 19:15",
  "do_tin_cay": 0.8, "phien_ban_luat": "v3" }
```

- Quyết định không dẫn được mã luật nào → coi là không hợp lệ, hệ thống bỏ qua ý kiến AI và ghi cảnh báo.
- AI được ghi thêm mục "quan sát ngoài luật" để **đề xuất luật mới**, nhưng mục này không có hiệu lực cho tới khi bạn thêm vào bộ luật.

**Vòng điều chỉnh:**

1. AI tự quyết, không ai phải duyệt từng quyết định. Mọi quyết định được ghi lại để truy vết; trang "Quyết định AI" chỉ để xem: tín hiệu, luật được dẫn, bằng chứng, và **kết quả thật của lệnh đó**.
2. Hệ thống **tự chấm** từng quyết định khi biết kết quả: AI từ chối mà lệnh (chạy giả lập) đáng lẽ lỗ → chấm đúng; đáng lẽ lãi → chấm sai. Tương tự với "giảm khối lượng". Lệnh bị từ chối vẫn được mô phỏng tới SL/TP để có kết quả so sánh.
3. Báo cáo tuần thống kê theo từng luật: kích hoạt bao nhiêu lần, tỉ lệ chấm đúng, nếu nghe theo thì lãi/lỗ thay đổi thế nào.
4. Bạn sửa/tắt/thêm luật ngay trên trang "Bộ luật AI" → phiên bản bộ luật tăng lên → chạy lại trên các tín hiệu cũ để xem luật mới sẽ quyết định khác ra sao trước khi áp dụng.

Giới hạn cứng không đổi được bằng bộ luật: AI không tự mở lệnh, không tăng khối lượng, không nới SL, không vượt bộ quản lý rủi ro.

---

## 4. Ba hệ thống test độc lập

| | Câu hỏi nó trả lời | Cách đối chiếu | Dùng lại từ `pine-tests` |
|---|---|---|---|
| **PP1 — Ba bản cài đặt** | Tín hiệu có đúng không? | Cùng chuỗi nến, ba bản tính độc lập phải ra cùng danh sách sự kiện: Pine (dòng `EVT` trong Pine Logs) ↔ oracle TypeScript ↔ signal engine Python | `utils/oracle.ts`, `utils/parseLogs.ts`, `utils/compareGolden.ts`, định dạng `EVT/BARS/STAT` |
| **PP2 — Hai bộ backtest** | Lãi/lỗ có tính đúng không? | Backtester Python ↔ MT5 Strategy Tester chạy EA mỏng đọc cùng file tín hiệu; cộng 20–30 lệnh tính tay; cộng kiểm tính chất (SL đúng phía, R:R ≥ ngưỡng, không lồng lệnh, không nhìn trước tương lai) | — |
| **PP3 — Đối soát khớp lệnh** | Hệ thống có làm đúng điều nó định làm không? | Broker giả có tiêm lỗi (mất mạng, requote, khớp một phần, khởi động lại giữa chừng); trên demo so từng "ý định lệnh" với deal thật của MT5; chạy lại backtest đúng giai đoạn demo rồi so từng lệnh | — |

Bổ trợ: unit test offline cho từng khối, và mutation test (`config/mutants.ts`) để chứng minh bộ test bắt được lỗi cài cố ý.

### 4.1 Bằng chứng để con người kiểm chứng

Một chữ "PASS" không đủ. Mỗi lần chạy test sinh ra một **gói bằng chứng** trong `evidence/<ngày>-<PP>-<commit>/`, ghi vào bảng `test_runs` và xem được trên trang "Backtest & test":

| Thành phần | Nội dung | Con người kiểm bằng cách |
|---|---|---|
| Lý lịch lần chạy | commit git, phiên bản đặc tả, mã băm SHA-256 của file nến đầu vào, lệnh để chạy lại | Chạy lại đúng lệnh đó trên máy khác → phải ra cùng kết quả, cùng mã băm |
| Dữ liệu thô của từng bản | CSV sự kiện/lệnh của Pine, oracle, Python (PP1); danh sách lệnh Python và báo cáo HTML gốc xuất từ MT5 Strategy Tester (PP2); file lịch sử deal xuất từ MT5 (PP3) | Mở bằng Excel, đối chiếu từng dòng |
| Bảng lệch | Từng chỗ khác nhau: nến nào, bản nào nói gì | Đọc ngay; bảng rỗng mới là đạt |
| Chart chồng | Trang HTML vẽ nến + sự kiện của cả ba bản chồng lên nhau, chỗ lệch tô đỏ | Nhìn bằng mắt, không cần đọc code |
| Mẫu ngẫu nhiên để soi tay | Hệ thống bốc ngẫu nhiên 10 sự kiện / 10 lệnh, kèm thời điểm, giá, và ảnh chụp chart TradingView (Playwright chụp) tại đúng nến đó | Người kiểm mở TradingView / MT5 ở đúng thời điểm, xác nhận; kết quả soi tay được ghi lại kèm tên người kiểm |
| Lệnh "vàng" tính tay | 20–30 lệnh tính tay từ chart (GĐ 5), có ảnh chụp | So với kết quả máy, lệch là lỗi |
| Kết quả mutation | Danh sách lỗi cài cố ý và test nào bắt được | Chứng minh bộ test không "luôn xanh" |

---

## 5. Quy trình làm việc cho mỗi giai đoạn

Mỗi giai đoạn đi qua cùng một chu trình:

1. **Chốt câu hỏi** của giai đoạn (mục "Cần chốt").
2. **Thiết kế ngắn** cho giai đoạn đó, bạn duyệt.
3. **Viết code + test** trên một nhánh git riêng (`feat/<giai-đoạn>`).
4. **Chạy test**: unit + phương pháp test tương ứng. CI trên GitHub chạy lại các test offline.
5. **Trình diễn**: Claude chỉ cho bạn kết quả thật (bảng so sánh, ảnh dashboard, tin Telegram).
6. **Qua cổng**: đạt "Điều kiện xong" → đánh dấu `[x]` trong ROADMAP → bạn quyết định commit/merge.

Claude được commit trên nhánh `feat/*` (chốt 26/11/2026, để dùng Superpowers). Trên nhánh khác thì chỉ commit khi bạn nói rõ. Push, merge, mở PR luôn do bạn quyết. Cách dùng Superpowers theo chu trình này: [huong-dan-superpowers.md](huong-dan-superpowers.md).

---

## 6. Checklist theo giai đoạn

### GĐ 0 — Yêu cầu và chuẩn bị
- [x] (B) Chốt nguồn tín hiệu, mức tự động, quyền AI, nhóm sản phẩm
- [ ] (B) Đăng ký tài khoản broker thật ở IC Markets (khu vực khách hàng); trong đó tạo tài khoản MT5 con loại **demo**; cài terminal MT5 của IC Markets, bật Algo Trading — 26/11/2026: đã đăng ký; demo MT5 Standard, USD, **netting**, server `ICMarketsSC-Demo`; terminal "MetaTrader 5 IC Markets Global" build 6333 đã cài, Algo Trading đã bật. Còn: terminal đăng nhập thất bại ("Invalid account"), chạy lại `trading-bot/scripts/check_mt5.py` sau khi đăng nhập được
- [ ] (B) Ghi chú: IC Markets xoá tài khoản demo sau khoảng 20–30 ngày không mở lệnh. Bot giao dịch đều thì tài khoản vẫn sống; tạm dừng lâu thì phải tạo lại
- [x] (B) Cài Python 3.11+; đưa Node vào PATH — kiểm 26/11/2026: Python 3.14.0, Node v24.20.0 trong PATH. Môi trường ảo `%USERPROFILE%\.venvs\trading-bot` (ngoài OneDrive) đã cài `MetaTrader5` 5.0.6231
- [x] (B) Quyết định số phận các thay đổi chưa commit trên nhánh `test/e2e` — 26/11/2026: đã nằm trong commit `e50dd79` (mutation test, oracle offline, unit test); quyết mở PR `test/e2e` → `develop`. Unit test offline 32/32 đạt; E2E TradingView chưa chạy (RE10110)
- [x] (C) Tạo thư mục `trading-bot/`, chép lộ trình này thành `docs/ROADMAP.md`
- [ ] (B+C) Viết `docs/requirements.md`

**Cần chốt:**
- [ ] Vốn demo giả định; rủi ro tối đa mỗi lệnh (% vốn)
- [ ] Giới hạn lỗ ngày / tuần thì bot tự ngừng
- [ ] Số lệnh mở đồng thời tối đa (tổng, theo cặp); có cho hai cặp tương quan cao cùng lúc không
- [ ] Thước đo thành công: drawdown tối đa, profit factor, tỉ lệ thắng
- [ ] Broker, loại tài khoản, đòn bẩy, hedging hay netting
- [ ] Danh sách symbol cụ thể; bật cả ba nhóm ngay hay crypto trước (đã có golden 7 cặp) rồi mở dần

**Điều kiện xong:** `requirements.md` được duyệt; Python kết nối được MT5 demo và in ra số dư.

### GĐ 1 — Đặc tả chiến lược
- [ ] (C) Đọc toàn bộ v1.11, tách phần logic giao dịch khỏi phần vẽ
- [ ] (C) Đọc tài liệu BankTrap, lập bảng luật ↔ trang tài liệu ↔ dòng code
- [ ] (C) Viết `docs/strategy-spec.md`: mỗi luật một mã số, có ví dụ nến
- [ ] (C) Liệt kê chỗ code và tài liệu mâu thuẫn
- [ ] (B) Phân xử từng mâu thuẫn, duyệt đặc tả

**Cần chốt:**
- [ ] Bản chuẩn là v1.1 hay v1.11; bộ input nào là cấu hình giao dịch thật
- [ ] Chỉ module OF Entry, hay thêm setup khác trong tài liệu
- [ ] Lệnh limit chưa khớp thì huỷ khi nào
- [ ] Quản lý sau khi khớp: dời SL hoà vốn, chốt từng phần, trailing, đóng cuối ngày/tuần
- [ ] SL ngoài vùng OF hay ngoài Ex OF; đệm bao nhiêu
- [ ] Né tin mạnh trước/sau bao nhiêu phút (Forex, Vàng)
- [ ] Lệnh ngược trend 4H có trong phạm vi lần này không
- [ ] Tham số riêng theo nhóm sản phẩm (leg swing, R:R tối thiểu)

**Điều kiện xong:** chọn 10 vị trí bất kỳ trên chart, đặc tả giải thích được vì sao có/không có lệnh.

### GĐ 2 — Thiết kế chi tiết
- [ ] (C) `docs/architecture.md`: mô hình dữ liệu (mục 2.8, thiết kế sẵn cho nhiều người dùng / nhiều chiến lược), định dạng trao đổi giữa các khối, giao diện `Broker`
- [ ] (C) Giao diện `Strategy` và cơ chế đăng ký chiến lược (mục 2.9); thử bằng một chiến lược giả rất đơn giản (ví dụ cắt EMA) để chắc phần lõi không phụ thuộc Trading Hub 3
- [ ] (C) Định nghĩa máy trạng thái của một lệnh (chờ → khớp → đóng/huỷ) và cách khôi phục sau khi khởi động lại
- [ ] (C) Thiết lập khung dự án: môi trường Python, pytest, kiểm kiểu, CI GitHub chạy test offline
- [ ] (B) Duyệt thiết kế

**Cần chốt:**
- [ ] Quyết định chỉ trên nến đã đóng, hay cho phép trong nến
- [ ] Bot khởi động lại khi đang có lệnh: tiếp quản hay đóng hết

**Điều kiện xong:** thiết kế được duyệt; CI xanh với một test mẫu.

### GĐ 3 — Lớp dữ liệu
- [ ] (C) In lịch phiên giao dịch thật của từng symbol từ MT5 (trả lời dứt điểm câu hỏi crypto 24/7)
- [ ] (C) Tải nến 15m và 4H lịch sử, lưu Parquet
- [ ] (C) Kiểm chất lượng: nến thiếu, trùng, lệch múi giờ, khoảng trống cuối tuần
- [ ] (C) Cập nhật nến theo thời gian thực, chỉ phát nến đã đóng
- [ ] (C) `config/symbols.yaml`: pip, lot tối thiểu, bước lot, spread trần, phiên giao dịch
- [ ] (C) Service MQL5 xuất lịch kinh tế có sẵn của MT5 (thời điểm theo giờ server, đồng tiền, mức quan trọng) ra file; Python nạp vào bảng `economic_events`; xuất cả lịch sử để backtest
- [ ] (C) Unit test cho lớp dữ liệu

**Cần chốt:**
- [ ] Độ dài lịch sử backtest
- [ ] Mức lệch chấp nhận giữa nến MT5 và nến TradingView

**Điều kiện xong:** nến lưu trữ khớp nến xem trên terminal MT5 ở 20 điểm kiểm tra ngẫu nhiên; báo cáo chất lượng dữ liệu cho từng symbol.

### GĐ 4 — Chiến lược đầu tiên (Trading Hub 3) + PP1
Phần dùng chung (swing, CHoCH/BOS, vùng OF) vào `strategy_kit/`; phần riêng vào `strategies/trading_hub_3/`.
- [ ] (C) Port swing/leg
- [ ] (C) Port CHoCH/BOS 15m và bộ lọc trend 4H
- [ ] (C) Port vùng OF, luật rời vùng/khai thác, vòng đời vùng
- [ ] (C) Port OF Entry: Entry/SL/TP, R:R, không lồng lệnh, POI 4H
- [ ] (C) Mở rộng oracle TypeScript sang Entry/SL/TP
- [ ] (C) Bộ so sánh 3 chiều Pine ↔ oracle ↔ Python trên cùng dòng `BARS`
- [ ] (C) Thêm mutant cho engine Python
- [ ] (C) Gói bằng chứng PP1 (mục 4.1): CSV từng bản, bảng lệch, trang HTML chart chồng ba bản, mẫu ngẫu nhiên kèm ảnh TradingView
- [ ] (C) Chỉ báo MQL5 hiển thị: đọc file tín hiệu Python, vẽ CHoCH/BOS, vùng OF, Entry/SL/TP lên chart MT5
- [ ] (B) Xem bảng lệch, soi mẫu ngẫu nhiên, phân xử khi ba bản không thống nhất

**Cần chốt:**
- [ ] Port nguyên hành vi Pine, hay sửa theo đặc tả rồi cập nhật ngược lại Pine
- [ ] Xử lý RE10110 và chạy mutation test lần đầu: trước hay sau khi port

**Điều kiện xong:** PP1 lệch 0 sự kiện trên 7 cặp crypto; mọi mutant bị bắt.

### GĐ 5 — Backtest + PP2
- [ ] (C) `SimBroker`: lệnh limit, SL/TP, spread, phí, swap, trượt giá
- [ ] (C) Vòng lặp backtest dùng đúng code signal/risk của bản chạy thật
- [ ] (C) Báo cáo: đường vốn, drawdown, profit factor, theo cặp/phiên/setup
- [ ] (C) EA mỏng MQL5 đọc file tín hiệu, chạy trong Strategy Tester
- [ ] (C) Bộ so sánh danh sách lệnh Python ↔ Strategy Tester
- [ ] (B+C) 20–30 lệnh "vàng" tính tay từ chart
- [ ] (C) Test tính chất và test "không nhìn trước tương lai"
- [ ] (B) Xem báo cáo hiệu quả, quyết định đi tiếp hay sửa chiến lược

**Cần chốt:**
- [ ] Mô hình chi phí
- [ ] Nến chạm cả SL lẫn TP thì tính cái nào (đề xuất: SL)
- [ ] Tách in-sample / out-of-sample
- [ ] Ngưỡng tối thiểu để sang demo
- [ ] Giữ hay bỏ bộ lọc né tin: so backtest có và không có bộ lọc (Forex, Vàng)

**Điều kiện xong:** PP2 xanh (hai bộ backtest trùng danh sách lệnh, P&L lệch trong ngưỡng); có báo cáo hiệu quả cho từng nhóm sản phẩm.

### GĐ 6 — Risk + Execution + PP3
- [ ] (C) Risk manager: tính khối lượng, giới hạn lỗ ngày/tuần, số lệnh tối đa, tương quan, spread trần, né tin
- [ ] (C) `Mt5Broker`: đặt/sửa/huỷ lệnh, đọc trạng thái, xử lý mã lỗi
- [ ] (C) trader-core: vòng lặp chính, máy trạng thái lệnh, khôi phục sau khởi động lại
- [ ] (C) Đối soát định kỳ: ý định lệnh ↔ lệnh/deal MT5
- [ ] (C) Công tắc dừng khẩn
- [ ] (C) PP3: bộ ca tiêm lỗi trên broker giả
- [ ] (B) Chạy thử 1 lệnh demo khối lượng tối thiểu, đối chiếu bằng mắt trên MT5

**Cần chốt:**
- [ ] % rủi ro cố định hay lot cố định
- [ ] `/kill` có đóng lệnh đang mở không
- [ ] Giới hạn spread/trượt giá để còn cho vào lệnh

**Điều kiện xong:** mọi ca tiêm lỗi qua, không để lại lệnh mồ côi hay lệnh thiếu SL; lệnh demo đầu tiên đối soát khớp.

### GĐ 7 — Web (kênh chính), Telegram (kênh phụ), vận hành nền
- [ ] (C) Bảng `commands`/`events`/nhật ký thao tác; trader-core xử lý lệnh điều khiển qua kiểm quyền + bộ quản lý rủi ro
- [ ] (C) Module `security/`: băm mật khẩu Argon2id, 2FA TOTP, mã hoá bí mật, kho khoá (theo [security.md](security.md))
- [ ] (C) Backend FastAPI: đăng nhập + 2FA, phân quyền theo tài khoản, REST, WebSocket
- [ ] (C) Danh mục broker (IC Markets trước; Exness khi cần): danh sách server, tên công ty, bảng đổi tên symbol
- [ ] (C) Trang "Tài khoản của tôi" và "Người dùng": mời người dùng, thêm tài khoản broker, thêm tài khoản MT5 con (kiểm bằng cách đăng nhập thử, server phải thuộc broker cha, không trùng), liên kết Telegram
- [ ] (B+C) Phác bố cục từng trang, bạn duyệt trước khi làm giao diện
- [ ] (C) Trang Tổng quan + Lệnh (xem, huỷ, đóng, dời SL/TP, tạm ngừng, dừng khẩn)
- [ ] (C) Trang Chart & tín hiệu (nến MT5 + cấu trúc + vùng OF + Entry/SL/TP)
- [ ] (C) Trang Cấu hình rủi ro, Backtest & test, Hệ thống
- [ ] (C) Giao diện dùng được trên điện thoại
- [ ] (C) Test web: test API, test giao diện bằng Playwright (dùng lại kinh nghiệm `pine-tests`), test bảo mật (chưa đăng nhập không làm được gì; người A không xem/sửa được tài khoản của người B; khoá tạm khi sai mật khẩu nhiều lần)
- [ ] (B) Tạo bot qua `@BotFather`, lấy token (lưu mã hoá, không để trong `.env`)
- [ ] (C) telegram-bot theo [telegram-bot.md](telegram-bot.md): liên kết bằng mã dùng một lần, lệnh xem/điều khiển, xác nhận bằng nút, thông báo kèm đường dẫn về web
- [ ] (B+C) `docs/reports.md`: thiết kế chi tiết các loại báo cáo thống kê (theo lệnh, ngày/tuần/tháng, symbol, chiến lược, broker, tài khoản…): mỗi loại gồm những chỉ số nào, xem ở đâu, gửi lúc nào. Bạn duyệt trước khi làm
- [ ] (C) jobs theo bảng ở mục 2.2: nhật ký lệnh, báo cáo thống kê (code tạo, không cần AI), đối soát, nạp lịch kinh tế, heartbeat, sao lưu mã hoá, test đêm, dọn dẹp, cảnh báo demo sắp hết hạn
- [ ] (C) Heartbeat ngoài; log xoay vòng, có lọc che bí mật
- [ ] (B) Mua tên miền; tạo Cloudflare Tunnel cho web-app
- [ ] (C) `docs/runbook.md`: làm gì khi mất kết nối, lệch đối soát, bot sập, lộ mật khẩu / khoá

**Cần chốt:**
- [ ] Những thao tác nào cho phép trên web với lệnh đang chạy (đóng, dời SL/TP, đóng một phần); lệnh bạn sửa tay thì bot còn tiếp tục quản lý không
- [ ] Có cho đặt lệnh thủ công từ web không, hay web chỉ can thiệp vào lệnh của bot
- [ ] Sự kiện nào nhắn Telegram ngay, sự kiện nào gộp vào báo cáo
- [ ] Bot báo lỗi lúc bạn ngủ: tự dừng mở lệnh mới và giữ lệnh có SL, hay đóng hết
- [ ] Các mục "Cần chốt" trong [security.md](security.md) và [telegram-bot.md](telegram-bot.md)

**Điều kiện xong:** từ trình duyệt trên điện thoại, qua Internet, bạn đăng nhập (có 2FA), xem được lệnh, tạm ngừng bot và dời SL một lệnh demo, thay đổi hiện đúng trên MT5; thao tác đó có trong nhật ký; một người dùng thứ hai không thấy tài khoản của bạn; tắt thử trader-core thì nhận cảnh báo Telegram trong vòng vài phút.

### GĐ 8 — AI (chế độ bóng) — **tạm hoãn, làm khi có kinh phí Claude API**
Không chặn các giai đoạn sau: GĐ 9 chạy demo không cần AI. Khi làm, cần một API key trên Claude Console (không dùng được gói Claude Pro, xem mục 2.5.1).
- [ ] (B) Tạo Anthropic API key, đặt hạn mức chi tiêu
- [ ] (B+C) Soạn `config/ai-rulebook.yaml` phiên bản 1
- [ ] (C) Gói ngữ cảnh gửi AI: tín hiệu, cấu trúc 4H/15m, lịch tin, spread, phiên
- [ ] (C) Gọi Claude với đầu ra theo khuôn; kiểm mã luật hợp lệ; xử lý quá hạn/lỗi
- [ ] (C) Tiết kiệm chi phí AI theo mục 2.5.2: luật kiểm được bằng code không gửi AI, chỉ gọi khi tín hiệu đã qua bộ lọc cứng, lưu đệm bộ luật, báo cáo tuần qua Batch API, hạn mức chi tiêu
- [ ] (C) Lưu mọi quyết định; tự chấm đúng/sai theo kết quả thật (mô phỏng cả lệnh bị từ chối); trang "Quyết định AI" để truy vết; trang "Bộ luật AI" để sửa luật
- [ ] (C) Nhật ký lệnh tự động và báo cáo ngày/tuần do AI viết
- [ ] (C) Thống kê theo từng luật; công cụ chạy lại bộ luật mới trên tín hiệu cũ
- [ ] (C) Test: AI trả sai khuôn, dẫn luật không tồn tại, không trả lời → hệ thống vẫn chạy đúng

**Cần chốt:**
- [x] Nguồn lịch kinh tế → lịch có sẵn của MT5, miễn phí (mục 2.5.1)
- [ ] Ngân sách API mỗi tháng; model cho xét tín hiệu và cho báo cáo (Opus 5.5 / Sonnet 5.5 / Haiku 5.5 — so chất lượng trên cùng bộ tín hiệu cũ, chi phí ở mục 2.5.1)
- [ ] AI lỗi hoặc chậm thì mặc định vào lệnh hay bỏ lệnh
- [ ] Tiêu chí nâng AI từ chế độ bóng lên quyền phủ quyết

**Điều kiện xong:** mỗi tín hiệu có một quyết định AI truy được mã luật; bạn sửa một luật trên web và thấy kết quả chạy lại thay đổi.

### GĐ 9 — Chạy demo liên tục
- [ ] (B+C) Cấu hình PC hiện tại làm máy chủ 24/7 theo danh sách ở mục 2.5 (BIOS, chế độ ngủ, Windows Update, service, heartbeat); cài Tailscale
- [ ] (C) Đo RAM/CPU thực tế của mỗi terminal + worker, cập nhật lại bảng cấu hình và chi phí ở mục 2.5.1
- [ ] (B+C) Triển khai lên PC máy chủ: MT5, bot dạng service, tự khởi động; tường lửa không mở cổng vào (web chỉ qua Tailscale)
- [ ] (C) Chạy tự động trên demo; đối soát hằng ngày
- [ ] (C) Hằng tuần: chạy lại backtest đúng giai đoạn demo, so từng lệnh
- [ ] (B) Xem báo cáo tuần; nếu đã bật AI thì xem thêm thống kê tự chấm và chỉnh bộ luật
- [ ] (B) **Quyết định khi nào kết thúc demo** (thời gian do bạn chọn)

**Điều kiện xong:** do bạn quyết định, dựa trên: lệnh demo khớp backtest trong ngưỡng, không có sự cố vận hành chưa giải thích được (và nếu đã bật AI: số liệu AI bóng đủ để đánh giá).

### GĐ 10 — Live nhỏ và vận hành
- [ ] (B) Quyết định có live hay không, vốn và giới hạn lỗ
- [ ] (B+C) Tạo tài khoản MT5 live dưới cùng tài khoản broker; bật `allow_live` và bật live cho đúng tài khoản đó; khối lượng tối thiểu
- [ ] (C) Chạy song song demo và live, so lệch giá khớp
- [ ] (B+C) Quy trình thay đổi luật: sửa đặc tả → ba phương pháp test → demo → live

### GĐ 11 — Mở rộng: nhiều chiến lược, nhiều người dùng (chưa lên lịch)
Chỉ làm khi bạn quyết định. Kiến trúc từ GĐ 2 đã chuẩn bị sẵn nên giai đoạn này không phải viết lại phần lõi. Thêm chiến lược thứ hai cho chính bạn dùng có thể làm sớm hơn, không cần chờ mở cho người khác.
- [ ] (B) Nếu cho người ngoài dùng: tham vấn pháp lý trước (mục 8)
- [ ] (C) Chuyển DB sang PostgreSQL trên cùng VPS; chạy lại toàn bộ test
- [ ] (C) Trang "Thư viện chiến lược": xem, chọn chiến lược cho tài khoản/symbol, chỉnh tham số trong khoảng cho phép, chuyển phiên bản
- [ ] (C) Quy trình phát hành phiên bản chiến lược: chỉ phát hành khi đủ gói bằng chứng PP1/PP2 và báo cáo demo
- [ ] (C) Luật khi nhiều chiến lược cùng ra tín hiệu trên một symbol của một tài khoản
- [ ] (B+C) Port chỉ báo Pine thứ hai theo quy trình ở mục 2.9 (thước đo: phần lõi không phải sửa)
- [ ] (B) Mời nhóm người dùng đầu tiên (tài khoản demo), thu góp ý
- [ ] (C) Test tải: số tài khoản tối đa một VPS chịu được; cảnh báo khi gần ngưỡng

**Cần chốt:**
- [ ] Ai được thêm chiến lược mới: chỉ đội phát triển, hay sau này cho người dùng tự đưa Pine lên
- [ ] Người dùng được chỉnh tham số tới mức nào, hay chỉ chọn trong vài bộ tham số có sẵn
- [ ] Nếu cho người ngoài dùng: có thu phí không, điều khoản sử dụng
- [ ] Ngưỡng số tài khoản để nâng gói VPS / tách máy

**Điều kiện xong:** hai chiến lược cùng chạy trên demo cho ít nhất hai người dùng; mỗi người chỉ thấy tài khoản của mình; chiến lược thứ hai được thêm mà không sửa phần lõi.

---

## 7. Bước tiếp theo

1. ~~(C) Tạo `trading-bot/docs/ROADMAP.md` từ tài liệu này.~~ Xong.
2. (B) Trả lời mục "Cần chốt" của GĐ 0 và GĐ 1.
3. (C) Viết `requirements.md`, rồi bắt đầu đọc v1.11 và tài liệu để soạn `strategy-spec.md`.

Chưa viết code giao dịch cho tới khi GĐ 1 được duyệt.

## 8. Cảnh báo

CFD dùng đòn bẩy, có thể mất toàn bộ vốn. Hệ thống chạy đúng kỹ thuật không có nghĩa chiến lược có lãi; GĐ 5 và GĐ 9 tồn tại để trả lời câu đó bằng số liệu trước khi dùng tiền thật.

Hiện tại hệ thống chỉ giao dịch trên tài khoản của chính bạn, nên mục này chưa áp dụng. Ghi lại để không quên khi mở rộng: nếu sau này nền tảng tự đặt lệnh trên tài khoản của **người khác**, nhất là khi có thu phí, việc đó có thể thuộc diện quản lý pháp lý (tư vấn đầu tư, quản lý tài khoản, cung cấp tín hiệu) tuỳ quốc gia, và điều khoản của broker cũng có thể giới hạn. Lúc đó cần hỏi ý kiến luật sư trước.
