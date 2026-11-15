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
| Quyền AI | Chế độ bóng trước: AI chấm và ghi lại, chưa ảnh hưởng lệnh. AI vẫn viết nhật ký, báo cáo |
| Sản phẩm | Crypto CFD, Forex, Vàng/kim loại (không làm chỉ số) |

**Về giờ giao dịch:** Forex và Vàng nghỉ từ cuối thứ Sáu tới đầu thứ Hai (giờ server) và có khoảng trống giá khi mở lại. Crypto CFD gần như chạy 24/7, nhưng **đây là CFD của broker chứ không phải sàn crypto**: broker có thể có khung bảo trì ngắn và spread giãn cuối tuần. Vì vậy bot **không ghi cứng lịch**: nó đọc phiên giao dịch của từng symbol từ MT5 (`symbol_info`) và việc đầu tiên ở Giai đoạn 3 là in ra lịch thật của từng symbol để bạn xem.

---

## 2. Kiến trúc hệ thống

### 2.1 Sơ đồ triển khai

```
┌──────────────── MÁY WINDOWS (PC của bạn khi phát triển → VPS Windows khi chạy liên tục) ───────────────┐
│                                                                                                        │
│  ┌───────────────┐  IPC nội bộ   ┌──────────────────────── trading-bot (Python) ───────────────────┐   │
│  │ MT5 Terminal  │◄────────────►│  ① trader-core   : data → signal → AI → risk → execution        │   │
│  │ (đăng nhập    │  thư viện     │  ② web-app       : KÊNH CHÍNH - xem và điều khiển hệ thống      │   │
│  │  demo/live)   │  MetaTrader5  │  ③ telegram-bot  : kênh phụ - thông báo, vài lệnh cơ bản        │   │
│  └──────┬────────┘               │  ④ scheduler     : báo cáo ngày, đối soát, sao lưu, test đêm    │   │
│         │                        └───────────┬──────────────────────────────────────────────────────┘   │
│         │                                    │ đọc/ghi                                                  │
│         │                        ┌───────────▼───────────┐                                              │
│         │                        │ SQLite (lệnh, sự kiện, │  Parquet (nến lịch sử)   logs/ (file log)   │
│         │                        │ quyết định AI, lệnh    │                                              │
│         │                        │ điều khiển)            │                                              │
│         │                        └────────────────────────┘                                              │
└─────────┼────────────────────────────────────┬───────────────────────────────────────────────────────────┘
          │ giao thức MT5                      │ HTTPS đi ra (không mở cổng vào)
          ▼                                    ▼
   Máy chủ broker              ┌───────────────┬────────────────┬───────────────────┬──────────────────┐
   (IC Markets)                │ Telegram API  │ Claude API     │ Lịch tin kinh tế  │ Heartbeat ngoài  │
                               │ (bạn chat với │ (AI advisor,   │ (né tin Forex/    │ (báo khi máy/bot │
                               │  bot)         │  báo cáo)      │  Vàng)            │  chết)           │
                               └───────────────┴────────────────┴───────────────────┴──────────────────┘
```

### 2.2 Thành phần

| # | Thành phần | Nhiệm vụ | Công nghệ |
|---|---|---|---|
| ① | trader-core | Vòng lặp chính: mỗi khi đóng nến 15m, tải nến → tính tín hiệu → hỏi AI → kiểm rủi ro → đặt/sửa/huỷ lệnh → ghi nhật ký. **Tiến trình duy nhất được phép gửi lệnh tới MT5.** | Python 3.11+, `MetaTrader5`, pandas, pydantic |
| ② | web-app (**kênh chính**) | Xem và điều khiển toàn bộ hệ thống: lệnh, tín hiệu trên chart, quyết định AI, cấu hình rủi ro, bộ luật AI, kết quả test | Backend FastAPI (REST + WebSocket đẩy cập nhật trực tiếp); giao diện web render phía server + thư viện chart `lightweight-charts`; có đăng nhập |
| ③ | telegram-bot (kênh phụ) | Đẩy thông báo; vài lệnh điều khiển cơ bản khi bạn không mở được web | `python-telegram-bot`, long polling |
| ④ | scheduler | Việc định kỳ: báo cáo, đối soát với MT5, sao lưu, chạy test đêm | APScheduler hoặc Windows Task Scheduler |
| — | Kho dữ liệu | SQLite (chế độ WAL) cho trạng thái; Parquet cho nến; file log xoay vòng | — |
| — | Test đối chiếu | EA mỏng MQL5 cho Strategy Tester; `pine-tests` TypeScript hiện có | MQL5, Playwright |

Mỗi tiến trình chạy như một Windows service (NSSM), tự khởi động lại khi sập và khi máy khởi động.

### 2.3 Các kênh liên lạc

| Từ → Đến | Cách kết nối | Ghi chú |
|---|---|---|
| trader-core ↔ MT5 Terminal | Gọi hàm thư viện `MetaTrader5` (IPC cùng máy) | Terminal phải đang mở và đăng nhập |
| MT5 Terminal ↔ Broker | Giao thức riêng của MT5 | SL/TP luôn gửi kèm lệnh và **nằm trên máy chủ broker**, nên bot chết thì lệnh vẫn có SL |
| telegram-bot ↔ Telegram | HTTPS, bot chủ động hỏi Telegram (long polling) | Không cần IP tĩnh, tên miền hay mở cổng |
| Trình duyệt của bạn ↔ web-app | HTTP(S) cho thao tác; WebSocket để trang tự cập nhật khi có lệnh/tín hiệu mới | Khi ở máy đó: `http://localhost:8000`. Khi dùng VPS: qua mạng riêng **Tailscale** từ điện thoại/laptop. Không công khai ra Internet |
| web-app → trader-core | Ghi một dòng vào bảng `commands` trong SQLite (ai, lúc nào, lệnh gì); trader-core đọc mỗi vài giây, thực hiện, ghi kết quả lại | web-app **không tự chạm vào MT5**. Mọi thao tác đều để lại dấu vết kiểm tra được |
| telegram-bot → trader-core | Cũng qua bảng `commands` | Cùng một đường với web, nên hai kênh không thể làm lệch trạng thái nhau |
| trader-core → web-app / telegram-bot | Ghi vào bảng `events`/`outbox`; web đẩy lên trình duyệt, telegram-bot gửi đi | Mất mạng thì thông báo chờ, không mất |
| trader-core → Claude API | HTTPS, có giới hạn thời gian chờ | Quá hạn/lỗi → xử lý theo luật mặc định, ghi lại |
| scheduler → Heartbeat ngoài | HTTPS ping mỗi phút | Ngừng ping → dịch vụ đó nhắn Telegram/email cho bạn. Đây là thứ duy nhất báo được khi cả máy chết |
| scheduler → Sao lưu | Nén SQLite + log, đẩy lên kho lưu trữ đám mây | Mã nguồn nằm ở GitHub |

### 2.4 Bạn truy cập và điều khiển hệ thống ở đâu

**Web (kênh chính)** — mở bằng trình duyệt trên máy tính hoặc điện thoại, có đăng nhập.

| Trang | Xem | Thao tác |
|---|---|---|
| Tổng quan | Số dư, đường vốn, lãi/lỗ ngày, lệnh đang mở, trạng thái bot | Tạm ngừng / tiếp tục mở lệnh mới; **Dừng khẩn** |
| Lệnh | Lệnh chờ, lệnh đang chạy, lịch sử; mỗi lệnh có dòng thời gian đầy đủ | Huỷ lệnh chờ; đóng lệnh; dời SL/TP (không cho nới SL quá giới hạn rủi ro) |
| Chart & tín hiệu | Nến MT5 kèm CHoCH/BOS, vùng OF, Entry/SL/TP do engine Python tính; cả tín hiệu bị loại và lý do | Bật/tắt từng symbol |
| Quyết định AI | Từng quyết định: mã luật, bằng chứng, kết quả thật của lệnh | Đánh dấu đồng ý / không đồng ý, ghi chú |
| Bộ luật AI | Danh sách luật, thống kê theo từng luật, lịch sử phiên bản | Sửa / bật-tắt / thêm luật; chạy thử trên tín hiệu cũ trước khi áp dụng |
| Cấu hình rủi ro | % rủi ro, giới hạn lỗ ngày/tuần, số lệnh tối đa, spread trần | Sửa (có xác nhận, có lịch sử thay đổi) |
| Backtest & test | Báo cáo backtest; kết quả 3 phương pháp test chạy đêm | Chạy backtest theo yêu cầu |
| Hệ thống | Kết nối MT5, heartbeat, log, hàng đợi lệnh điều khiển, nhật ký thao tác | Khởi động lại từng tiến trình |

Thao tác nguy hiểm (dừng khẩn, đóng lệnh, sửa rủi ro, chuyển chế độ live) đều hỏi xác nhận lại và được ghi vào nhật ký thao tác.

**Telegram (kênh phụ)** — nhận thông báo trên điện thoại, và điều khiển cơ bản khi không mở được web.

Thiết lập: tạo bot qua `@BotFather` lấy token → nhắn bot một tin → lấy `chat_id` của bạn → điền cả hai vào `.env`. Bot **chỉ trả lời đúng `chat_id` đó**, người khác nhắn bị bỏ qua.

| Bot tự gửi | Lệnh cơ bản |
|---|---|
| Lệnh được đặt, khớp, chạm SL/TP, bị huỷ (kèm lý do) | `/status` — tình trạng hệ thống, số dư, lệnh đang mở |
| Quyết định AI kèm mã luật | `/pause` `/resume` — tạm ngừng / tiếp tục mở lệnh mới |
| Chạm giới hạn lỗ ngày, mất kết nối MT5, lệch đối soát | `/kill` — dừng khẩn (hỏi xác nhận) |
| Báo cáo cuối ngày / cuối tuần | `/close <mã lệnh>` — đóng một lệnh (hỏi xác nhận) |

Mỗi tin nhắn có đường dẫn mở thẳng trang tương ứng trên web. Các việc phức tạp (sửa SL/TP, sửa rủi ro, sửa bộ luật AI) chỉ làm trên web.

**MT5 trên điện thoại** — vẫn đăng nhập cùng tài khoản để nhìn lệnh thật, độc lập với bot.

**TradingView** — vẫn dùng chỉ báo Pine để nhìn chart.

### 2.5 Hạ tầng theo giai đoạn

| Giai đoạn | Máy chạy | Chi phí định kỳ |
|---|---|---|
| Phát triển, backtest (GĐ 0–8) | PC Windows 10 hiện tại | Chỉ có phí Claude API khi tới GĐ 8 |
| Chạy demo liên tục (GĐ 9) | **VPS Windows** (2 vCPU, 4 GB RAM, đặt gần máy chủ broker). Lý do: PC nhà tắt máy, mất điện, Windows tự cập nhật → hở lệnh | Phí VPS hằng tháng + Claude API |
| Live (GĐ 10) | Cùng VPS, terminal MT5 thứ hai đăng nhập tài khoản thật | Như trên |

Dịch vụ ngoài dùng tới: GitHub (mã nguồn, CI chạy test offline), Telegram, Claude API, nguồn lịch kinh tế, heartbeat, kho sao lưu. Không cần máy chủ web, tên miền, hay cơ sở dữ liệu đám mây.

### 2.6 Môi trường và bảo mật

- Ba cấu hình tách biệt: `backtest` (broker giả), `demo`, `live`. Cùng một mã nguồn, khác file cấu hình và khác tài khoản MT5. Chế độ `live` phải bật bằng một cờ riêng, mặc định tắt.
- Bí mật (mật khẩu MT5, token Telegram, API key) nằm trong `.env`, không vào git.
- Web yêu cầu đăng nhập (mật khẩu băm, phiên có hạn) và chỉ truy cập được trong mạng riêng Tailscale. Telegram chỉ nhận lệnh từ đúng `chat_id`.
- Web và Telegram không gọi MT5 trực tiếp; cả hai chỉ ghi yêu cầu vào bảng `commands`, và trader-core kiểm lại bằng bộ quản lý rủi ro trước khi thực hiện.
- Mọi quyết định đều ghi kèm phiên bản mã nguồn, phiên bản đặc tả và phiên bản bộ luật AI.

### 2.7 Cấu trúc thư mục dự kiến

```
source/
├─ trading hub/                  (giữ nguyên: Pine + pine-tests)
└─ trading-bot/
   ├─ docs/        ROADMAP.md · requirements.md · strategy-spec.md · architecture.md · runbook.md
   ├─ config/      symbols.yaml · risk.yaml · ai-rulebook.yaml · env.{backtest,demo,live}.yaml
   ├─ src/
   │  ├─ data/        tải, lưu, kiểm nến MT5
   │  ├─ signal/      swing → CHoCH/BOS → OF → Entry/SL/TP (port từ Pine)
   │  ├─ ai/          gói ngữ cảnh, gọi Claude, kiểm định dạng trả về
   │  ├─ risk/        luật cứng, tính khối lượng
   │  ├─ execution/   giao diện Broker · Mt5Broker · SimBroker
   │  ├─ backtest/    vòng lặp mô phỏng, báo cáo
   │  ├─ store/       SQLite, mô hình dữ liệu
   │  ├─ web/         FastAPI: api/ · ws/ · templates/ · static/
   │  ├─ notify/      telegram-bot
   │  └─ app/         trader-core, scheduler
   ├─ mql5/        EA mỏng cho Strategy Tester
   └─ tests/       unit · differential (PP1) · backtest_xcheck (PP2) · execution (PP3)
```

---

## 3. Bộ luật AI — để bạn biết vì sao AI quyết định và chỉnh được

AI không được quyết định theo "cảm nhận". Nó chỉ được áp dụng các luật trong file `config/ai-rulebook.yaml` mà **bạn đọc và sửa được**.

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

1. Xem ở trang "Quyết định AI" trên web: tín hiệu, luật nào được dẫn, bằng chứng, và **kết quả thật của lệnh đó**.
2. Bạn đánh dấu từng quyết định: đồng ý / không đồng ý (kèm ghi chú).
3. Báo cáo tuần thống kê theo từng luật: kích hoạt bao nhiêu lần, nếu nghe theo thì lãi/lỗ thay đổi thế nào, bạn không đồng ý bao nhiêu lần.
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

---

## 5. Quy trình làm việc cho mỗi giai đoạn

Mỗi giai đoạn đi qua cùng một chu trình:

1. **Chốt câu hỏi** của giai đoạn (mục "Cần chốt").
2. **Thiết kế ngắn** cho giai đoạn đó, bạn duyệt.
3. **Viết code + test** trên một nhánh git riêng (`feat/<giai-đoạn>`).
4. **Chạy test**: unit + phương pháp test tương ứng. CI trên GitHub chạy lại các test offline.
5. **Trình diễn**: Claude chỉ cho bạn kết quả thật (bảng so sánh, ảnh dashboard, tin Telegram).
6. **Qua cổng**: đạt "Điều kiện xong" → đánh dấu `[x]` trong ROADMAP → bạn quyết định commit/merge.

Claude không tự commit; chỉ commit khi bạn nói rõ.

---

## 6. Checklist theo giai đoạn

### GĐ 0 — Yêu cầu và chuẩn bị
- [x] (B) Chốt nguồn tín hiệu, mức tự động, quyền AI, nhóm sản phẩm
- [ ] (B) Mở tài khoản demo MT5, cài terminal, bật Algo Trading
- [ ] (B) Cài Python 3.11+; đưa Node vào PATH
- [ ] (B) Quyết định số phận các thay đổi chưa commit trên nhánh `test/e2e`
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
- [ ] (C) `docs/architecture.md`: mô hình dữ liệu SQLite, định dạng trao đổi giữa các khối, giao diện `Broker`
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
- [ ] (C) Unit test cho lớp dữ liệu

**Cần chốt:**
- [ ] Độ dài lịch sử backtest
- [ ] Mức lệch chấp nhận giữa nến MT5 và nến TradingView

**Điều kiện xong:** nến lưu trữ khớp nến xem trên terminal MT5 ở 20 điểm kiểm tra ngẫu nhiên; báo cáo chất lượng dữ liệu cho từng symbol.

### GĐ 4 — Signal engine + PP1
- [ ] (C) Port swing/leg
- [ ] (C) Port CHoCH/BOS 15m và bộ lọc trend 4H
- [ ] (C) Port vùng OF, luật rời vùng/khai thác, vòng đời vùng
- [ ] (C) Port OF Entry: Entry/SL/TP, R:R, không lồng lệnh, POI 4H
- [ ] (C) Mở rộng oracle TypeScript sang Entry/SL/TP
- [ ] (C) Bộ so sánh 3 chiều Pine ↔ oracle ↔ Python trên cùng dòng `BARS`
- [ ] (C) Thêm mutant cho engine Python
- [ ] (B) Xem bảng lệch, phân xử khi ba bản không thống nhất

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
- [ ] (C) Bảng `commands`/`events`/nhật ký thao tác; trader-core xử lý lệnh điều khiển qua bộ quản lý rủi ro
- [ ] (C) Backend FastAPI: đăng nhập, REST, WebSocket
- [ ] (B+C) Phác bố cục từng trang, bạn duyệt trước khi làm giao diện
- [ ] (C) Trang Tổng quan + Lệnh (xem, huỷ, đóng, dời SL/TP, tạm ngừng, dừng khẩn)
- [ ] (C) Trang Chart & tín hiệu (nến MT5 + cấu trúc + vùng OF + Entry/SL/TP)
- [ ] (C) Trang Cấu hình rủi ro, Backtest & test, Hệ thống
- [ ] (C) Giao diện dùng được trên điện thoại
- [ ] (C) Test web: test API, test giao diện bằng Playwright (dùng lại kinh nghiệm `pine-tests`), test phân quyền (chưa đăng nhập không làm được gì)
- [ ] (B) Tạo bot qua `@BotFather`, lấy token và `chat_id`
- [ ] (C) telegram-bot: thông báo và lệnh cơ bản ở mục 2.4, kèm đường dẫn về web
- [ ] (C) scheduler: báo cáo ngày, đối soát, sao lưu, test đêm
- [ ] (C) Heartbeat ngoài; log xoay vòng
- [ ] (C) `docs/runbook.md`: làm gì khi mất kết nối, lệch đối soát, bot sập

**Cần chốt:**
- [ ] Những thao tác nào cho phép trên web với lệnh đang chạy (đóng, dời SL/TP, đóng một phần); lệnh bạn sửa tay thì bot còn tiếp tục quản lý không
- [ ] Có cho đặt lệnh thủ công từ web không, hay web chỉ can thiệp vào lệnh của bot
- [ ] Sự kiện nào nhắn Telegram ngay, sự kiện nào gộp vào báo cáo
- [ ] Bot báo lỗi lúc bạn ngủ: tự dừng mở lệnh mới và giữ lệnh có SL, hay đóng hết

**Điều kiện xong:** từ trình duyệt trên điện thoại bạn xem được lệnh, tạm ngừng bot và dời SL một lệnh demo, thay đổi hiện đúng trên MT5; thao tác đó có trong nhật ký; tắt thử trader-core thì nhận cảnh báo Telegram trong vòng vài phút.

### GĐ 8 — AI (chế độ bóng)
- [ ] (B) Tạo Anthropic API key, đặt hạn mức chi tiêu
- [ ] (B+C) Soạn `config/ai-rulebook.yaml` phiên bản 1
- [ ] (C) Gói ngữ cảnh gửi AI: tín hiệu, cấu trúc 4H/15m, lịch tin, spread, phiên
- [ ] (C) Gọi Claude với đầu ra theo khuôn; kiểm mã luật hợp lệ; xử lý quá hạn/lỗi
- [ ] (C) Lưu mọi quyết định; trang "Quyết định AI" với nút đồng ý/không đồng ý; trang "Bộ luật AI" để sửa luật
- [ ] (C) Nhật ký lệnh tự động và báo cáo ngày/tuần do AI viết
- [ ] (C) Thống kê theo từng luật; công cụ chạy lại bộ luật mới trên tín hiệu cũ
- [ ] (C) Test: AI trả sai khuôn, dẫn luật không tồn tại, không trả lời → hệ thống vẫn chạy đúng

**Cần chốt:**
- [ ] Nguồn lịch kinh tế / tin tức
- [ ] Ngân sách API mỗi tháng
- [ ] AI lỗi hoặc chậm thì mặc định vào lệnh hay bỏ lệnh
- [ ] Tiêu chí nâng AI từ chế độ bóng lên quyền phủ quyết

**Điều kiện xong:** mỗi tín hiệu có một quyết định AI truy được mã luật; bạn sửa một luật trên web và thấy kết quả chạy lại thay đổi.

### GĐ 9 — Chạy demo liên tục
- [ ] (B) Thuê VPS Windows; cài Tailscale
- [ ] (B+C) Triển khai lên VPS: MT5, bot dạng service, tự khởi động
- [ ] (C) Chạy tự động trên demo; đối soát hằng ngày
- [ ] (C) Hằng tuần: chạy lại backtest đúng giai đoạn demo, so từng lệnh
- [ ] (B) Xem báo cáo tuần, đánh dấu quyết định AI, chỉnh bộ luật
- [ ] (B) **Quyết định khi nào kết thúc demo** (thời gian do bạn chọn)

**Điều kiện xong:** do bạn quyết định, dựa trên: lệnh demo khớp backtest trong ngưỡng, không có sự cố vận hành chưa giải thích được, số liệu AI bóng đã đủ để đánh giá.

### GĐ 10 — Live nhỏ và vận hành
- [ ] (B) Quyết định có live hay không, vốn và giới hạn lỗ
- [ ] (B+C) Cấu hình `live`, tài khoản thật, khối lượng tối thiểu
- [ ] (C) Chạy song song demo và live, so lệch giá khớp
- [ ] (B+C) Quy trình thay đổi luật: sửa đặc tả → ba phương pháp test → demo → live

---

## 7. Bước tiếp theo

1. ~~(C) Tạo `trading-bot/docs/ROADMAP.md` từ tài liệu này.~~ Xong.
2. (B) Trả lời mục "Cần chốt" của GĐ 0 và GĐ 1.
3. (C) Viết `requirements.md`, rồi bắt đầu đọc v1.11 và tài liệu để soạn `strategy-spec.md`.

Chưa viết code giao dịch cho tới khi GĐ 1 được duyệt.

## 8. Cảnh báo

CFD dùng đòn bẩy, có thể mất toàn bộ vốn. Hệ thống chạy đúng kỹ thuật không có nghĩa chiến lược có lãi; GĐ 5 và GĐ 9 tồn tại để trả lời câu đó bằng số liệu trước khi dùng tiền thật.
