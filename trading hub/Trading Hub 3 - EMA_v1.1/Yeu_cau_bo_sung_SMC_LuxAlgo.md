# Yêu cầu bổ sung / sửa đổi cho Trading Hub 3 (v1.1) — **BIẾN THỂ LUXALGO**

Tài liệu này là **bản song song** của `Yeu_cau_bo_sung_SMC.md`, không thay thế nó.

| | `Yeu_cau_bo_sung_SMC.md` (bản gốc) | `Yeu_cau_bo_sung_SMC_LuxAlgo.md` (bản này) |
|---|---|---|
| Engine cấu trúc | Giữ nguyên của Trading Hub 3 | Thay bằng `Document/smc_structure_luxalgo` |
| CHoCH / BOS / IDM | Theo `857464368-banktrap-SMC.pdf` | Theo LuxAlgo *"Market Structure with Inducements & Sweeps"* |
| Mục tiêu | Trung thành tuyệt đối với tài liệu BankTrap | CHoCH/BOS vẽ theo phong cách SMC phổ thông |

Các số thứ tự (#1, #2, ...) **giữ nguyên** theo bảng đối chiếu đã thống nhất để so sánh chéo được giữa
hai tài liệu. Các mục mới **chỉ phát sinh trong biến thể này** được đánh dấu `#L1`–`#L5`.

Các mục **không** được chọn đưa vào backlog: #12 (IFC), #13 (Retail Liquidity), #14 (SMT),
#15 (Session Liquidity), #19 (Flip entry) — giống bản gốc.

⚠️ **Lưu ý nền tảng:** file là `indicator(...)`, không phải `strategy(...)`. Mọi mục nói về "vào lệnh",
R:R, SL/TP chỉ nên hiểu là **hiển thị nhãn/tín hiệu trên chart**.

---

## Phạm vi thay thế

**Bị gỡ bỏ khỏi `Trading_Hub_3_v1.1.pine`:**

| Khối | Dòng | Nội dung |
|---|---|---|
| update IDM | 356-371 | `idmLow/idmHigh` neo theo pullback |
| structure mapping | 373-496 | IDM → CHoCH → BOS state machine |
| ratchet cực trị | 500-506 | `lastH/lastL` nâng theo râu quét |
| hàm hỗ trợ | 179-194, 196-205, 207-219 | `fixStrcAfterBos/Choch`, `drawIDM`, `drawStructure` |
| input | 10 | `structure_type` (mất ý nghĩa) |

**Được đưa vào từ `smc_structure_luxalgo`:**

| Khối | Dòng nguồn | Nội dung |
|---|---|---|
| `swings(len)` | 33-49 | Fractal zigzag, 2 độ phân giải |
| CHoCH | 75-104 | `close` vượt swing 50 nến |
| IDM | 113-118, 132-137 | `low/high` vượt fractal 3 nến |
| BOS | 121-126, 140-145 | `close` vượt cực trị chạy, có cổng IDM |
| Sweeps | 150-156 | Nhãn `x` khi quét râu mốc BOS |
| Trailing max/min | 159-165 | Cực trị chạy từ lần lật bias |

**Giữ nguyên không đụng tới:** Inside Bar (119-129), Pullback (301-354), POI/OB (509-548),
SCOB (289-298), `processZones`, `handleZone`.

---

## Bảng tổng hợp

| # | Mục | Trạng thái sau khi thay engine | Việc cần làm |
|---|---|---|---|
| L1 | Port engine LuxAlgo | 🔴 Chưa có | Việc nền tảng, phải làm trước mọi mục khác |
| L2 | Tham số `len` / `shortLen` | 🔴 Chưa có | Dò theo khung thời gian; xử lý warm-up 50 bar |
| L3 | Sweep tại mốc CHoCH | 🔴 Thiếu | LuxAlgo chỉ sweep mốc BOS — cần bù, là tiền đề của #18 |
| L4 | Hạ tầng lưu handle vẽ | 🔴 Thiếu | LuxAlgo vẽ `line.new` trần — cần mảng handle cho #6 |
| L5 | Lịch sử IDM & Pullback | 🔴 Chưa có | Cần cho #9, #16 — **giống hệt bản gốc** |
| 1 | Pullback | 🟡 Mất khách hàng | Giữ lại, đổi vai trò: từ nguồn IDM → nguồn OF/SCOB |
| 2 | IDM | 🔄 **Bị thay thế** | Fractal 3 nến thay cho "đáy PB đầu tiên" |
| 3 | BOS | 🔄 **Bị thay thế** | Cực trị chạy + cổng IDM fractal |
| 4 | CHOCH cơ bản | 🔄 **Bị thay thế** | Swing fractal 50 nến |
| 5 | CHOCH có/không HTF POI | ⚫ **Mất định nghĩa** | Phải định nghĩa lại hoặc loại bỏ |
| 6 | CHOCH có thể fail | 🔴 Khó hơn bản gốc | Cần L4 trước; mốc fractal không "dời" được |
| 7 | Imbalance (IMB) | 🟢 Không đổi | Giống hệt bản gốc |
| 8 | Extreme IMB | 🟡 Suy giảm chất lượng | Điều kiện "phá IDM" nay là mốc vi mô |
| 9 | Order Flow (OF) | 🟢 Không đổi — **ưu tiên tăng** | Nay là khách hàng chính của pullback |
| 10 | Order Block (OB) | 🟢 Không đổi | Giống hệt bản gốc |
| 11 | Entry OB thanh khoản | 🟡 Nhiều tín hiệu hơn | Cổng "BOS + IDM mới" nay lỏng hơn nhiều |
| 16 | SCOB — định nghĩa | 🟡 Case "tại IDM quá khứ" yếu đi | Cần L5 |
| 17 | SCOB — cách vào lệnh | 🔴 **Suy giảm nặng** | 3 case đều dựa "rút râu qua IDM" |
| 18 | CHOCH entry R:R cao | 🔴 Cần L3 trước | Phân loại Nhóm A/B cần sweep tại mốc CHoCH |

---

## Chi tiết các mục mới (chỉ có trong biến thể này)

### #L1 — Port engine LuxAlgo 🔴
**Nguồn:** `Document/smc_structure_luxalgo` toàn bộ dòng 33-165.
**Việc cần làm:**
- Chuyển `xloc.bar_index` (LuxAlgo) sang `xloc.bar_time` (Trading Hub đang dùng) cho mọi `line.new`/`label.new`.
  Pine cho phép trộn hai hệ toạ độ nên đây **không phải lỗi hiển thị**, nhưng cần thống nhất để: (a) nhất quán
  với POI/OB, và (b) dùng được cơ chế chiếu đường ra tương lai kiểu `time + (time - time[1]) * length`
  (`drawLiveStrc` của Trading Hub 3.0) — cơ chế này bắt buộc phải có `bar_time`.
- Giữ nguyên guard `sbtmy != btmy` (dòng 113) và `stopy != topy` (dòng 132) — ngăn IDM trùng mốc CHoCH.
- Giữ nguyên thứ tự: khối check BOS/CHoCH phải chạy **trước** khối trailing `max/min` (dòng 159-165),
  vì đó là cơ chế "râu quét nâng mốc".
- Biến `os` (bias) thay cho cặp `isCocUp/isCocDn`; `sbtm_crossed/stop_crossed` thay cho `findIDM`.
**Phụ thuộc:** không. Đây là gốc của mọi mục còn lại.

### #L2 — Tham số `len` / `shortLen` 🔴
**Nguồn:** dòng 9-10 (`len = 50`, `shortLen = 3`).
**Vấn đề:** đây là **thay đổi triết lý** — Trading Hub hiện tại có **0 tham số cấu trúc**, engine LuxAlgo có 2.
- Swing chỉ được xác nhận **sau `len` nến** (`high[len] > ta.highest(len)`), nên mốc CHoCH luôn trễ tới 50 bar.
  Trên khung 4H, 50 bar ≈ **8,3 ngày**.
- `len` nến đầu chart **không có mốc CHoCH nào**.
**Việc cần làm:**
- Đưa `len`/`shortLen` thành input, nhóm "Structure".
- Quyết định hành vi giai đoạn warm-up: không vẽ gì (đề xuất) hay tạm dùng cực trị chạy.
- Ghi lại giá trị `len` phù hợp cho từng khung đã test (M15 / H1 / H4) vào chính tài liệu này.
**Phụ thuộc:** #L1.

### #L3 — Sweep tại mốc CHoCH 🔴
**Vấn đề:** LuxAlgo chỉ đánh dấu sweep trên `max`/`min` — tức **mốc BOS** (dòng 150-156).
`topy`/`btmy` (mốc CHoCH) **không ratchet theo râu quét**, chỉ có cờ `top_crossed` bật một lần.
Trading Hub bản gốc thì có xử lý này ở cả hai loại mốc (`drawSweep` gọi từ nhánh `else` của mọi khối check).
**Việc cần làm:**
- Thêm nhánh: `high > topy and close < topy` → vẽ sweep, và nâng `topy` lên mức râu (đối xứng cho `btmy`).
- Tái dùng bộ lọc `n - x1 > 1` của LuxAlgo để tránh nhiễu.
**Phụ thuộc:** #L1. **Là tiền đề bắt buộc của #18.**

### #L4 — Hạ tầng lưu handle line/label 🔴
**Vấn đề:** LuxAlgo vẽ bằng `line.new()`/`label.new()` trần, **không giữ tham chiếu**
(dòng 100-104, 123-124, 142-143) → không thể xoá hay sửa về sau.
Trading Hub bản gốc có `arrBCLine`/`arrBCLabel`/`arrIdmLine`/`arrIdmLabel` + bộ hàm `removeLastLabel`/
`removeLastLine` chính là để làm việc này.
**Việc cần làm:** port lại các mảng handle + hàm remove từ `Trading_Hub_3_v1.1.pine` dòng 157-194,
đấu vào các điểm vẽ của engine LuxAlgo.
**Phụ thuộc:** #L1. **Là tiền đề bắt buộc của #6.**

### #L5 — Lịch sử IDM & Pullback 🔴
**Vấn đề (giống hệt bản gốc, vẫn tồn tại sau khi thay engine):**
1. IDM là **biến vô hướng bị ghi đè** — không có danh sách IDM quá khứ.
2. Mảng pullback bị `array.clear()` sau mỗi lần dùng (dòng 204-205 bản gốc) — là hàng đợi ứng viên,
   không phải sổ lưu trữ.
**Việc cần làm:** thêm 2 mảng lưu trữ lâu dài, tách khỏi mảng ứng viên đang có.
**Phụ thuộc:** không. Có thể làm song song #L1. **Tiền đề của #9 và #16.**

---

## Chi tiết các mục theo số cũ

### #1 — Pullback 🟡
**Code:** dòng 301-354. **Trạng thái:** thuật toán vẫn đúng, nhưng **mất khách hàng duy nhất**.
Sau khi thay engine, không còn gì đọc `puHigh/puLow` (trước đây chỉ IDM đọc, ở dòng 361-369).
**Việc cần làm:**
- **Giữ lại** — không xoá. Nó vẫn cần cho #9 (Order Flow) và #16 (SCOB tại pullback).
- Đổi vai trò trong đầu: từ "xương sống cấu trúc" → "nguồn dữ liệu cho module POI".
- Cần #L5 để pullback không bị xoá lịch sử.
**Lưu ý:** đây là chi phí ẩn của biến thể này — bạn **không tiết kiệm được** engine pullback,
chỉ khiến nó phục vụ ít mục hơn.

### #2 — IDM 🔄
**Thay bằng:** `swings(shortLen=3)` + dòng 113-118 / 132-137.
**Khác biệt so với bản gốc:**

| | Bản gốc (BankTrap) | Biến thể này (LuxAlgo) |
|---|---|---|
| Định nghĩa | Đáy của **pullback đầu tiên** tính từ đỉnh cao nhất | Đáy **fractal 3 nến** gần nhất |
| Neo lại khi nào | Mỗi khi tạo đỉnh/đáy mới | Mỗi khi có fractal mới |
| Xác nhận | Râu nến (`low < idmLow`) | Râu nến (`low < sbtmy`) — **giống nhau** |
| Tần suất | Thưa | **Dày hơn nhiều** |
| Ý nghĩa | Bẫy thanh khoản có cấu trúc | Nhiễu vi mô |

**Việc cần làm:** port + chọn `shortLen` (#L2).
**⚠️ Đây là mục gây ra toàn bộ hiệu ứng dây chuyền xuống #5, #8, #17, #18.**

### #3 — BOS 🔄
**Thay bằng:** dòng 121-126 (tăng) / 140-145 (giảm).
```
BOS = close vượt cực trị chạy (max/min) VÀ đã có IDM VÀ đúng chiều bias
```
**Khác biệt:** mốc BOS của bản gốc là `lastH` (neo tại IDM rồi ratchet); của LuxAlgo là `max`
(reset tại lần lật bias rồi ratchet). Gần giống nhau về hành vi.
**Cổng IDM vẫn tồn tại** (`sbtm_crossed`) — nhưng vì IDM nay lỏng hơn nhiều, BOS sẽ bắn dày hơn hẳn.
**Việc cần làm:** port. Không có vướng mắc.

### #4 — CHOCH cơ bản 🔄
**Thay bằng:** dòng 75-104.
```
CHoCH = close vượt swing fractal `len` nến, ngược chiều bias → lật bias
```
**Khác biệt cốt lõi so với bản gốc:** CHoCH **hoàn toàn không bị IDM chi phối** (bản gốc cũng vậy),
nhưng mốc nay là swing 50 nến thay vì `lastH/lastL` → **thô hơn nhiều, ít CHoCH hơn nhiều**.
Đây chính là hiệu quả mong muốn của biến thể này.
**Việc cần làm:** port. Lưu ý dòng 91-97: khi bias lật, phải reset `max/min/max_x1/min_x1` và
**cả hai cờ IDM** (`stop_crossed`, `sbtm_crossed`).

### #5 — CHOCH có/không HTF POI ⚫ **MẤT ĐỊNH NGHĨA**
**Tài liệu:** Phần 2, trang 6.
**Vấn đề:** case 1 của tài liệu được định nghĩa bằng đúng câu *"giá chạm POI của HTF rồi quay đầu
**vượt qua đáy của PB1**"* — tức CHoCH được sinh ra **tại chính mốc IDM**, và IDM ở đây bắt buộc
là "đáy pullback đầu tiên".

Trong engine LuxAlgo, CHoCH **theo định nghĩa** là phá `topy`/`btmy` (swing 50 nến). Không tồn tại
đường nào để một cú phá mốc IDM trở thành CHoCH. Và IDM nay là fractal 3 nến — **không còn là "PB1"**.

**Ba lựa chọn, cần quyết trước khi code:**
1. **Loại bỏ mục này** khỏi biến thể. Chấp nhận biến thể LuxAlgo không hỗ trợ case 1.
2. **Module phủ riêng:** giữ engine pullback (#1) chạy song song chỉ để tính "PB1", khi giá chạm HTF POI
   và phá PB1 thì vẽ **một nhãn CHoCH thứ hai** từ module này, phân biệt màu với CHoCH của engine chính.
   → Chart sẽ có 2 nguồn CHoCH, cần quy ước đọc rõ ràng.
3. **Chỉ vẽ cảnh báo:** không gọi là CHoCH, chỉ đánh dấu "HTF POI + PB1 broken" như một tín hiệu phụ.
**Đề xuất:** (3) — rẻ nhất, không gây mâu thuẫn khái niệm trên chart.
**Phụ thuộc:** #L1, #1, và cơ chế đọc POI khung lớn (`request.security`).

### #6 — CHOCH có thể fail 🔴
**Tài liệu:** Phần 2, trang 7.
**Khó hơn bản gốc vì 2 lý do:**
1. **Không xoá được nhãn** → cần #L4 trước.
2. **Không "dời LH" được.** Bản gốc chỉ cần `lastH := H` (một phép gán). Ở đây `topy` là **output của
   `ta.highest()`**, không phải biến trạng thái tự do — không thể gán tuỳ ý.
**Việc cần làm:**
- Sau #L4, thêm state "CHoCH tạm/provisional".
- Khi fail: xoá line+label, `os` quay về giá trị cũ, và **thay mốc bằng cực trị chạy** (`max`/`min`)
  thay vì cố dời `topy` — đây là cách diễn đạt lại luật "dời LH" cho engine fractal.
**Ghi chú:** vì mốc CHoCH ở biến thể này thô hơn nhiều (50 nến), **CHoCH fail sẽ hiếm hơn hẳn**.
Cân nhắc đo tần suất trước khi bỏ công làm — có thể không đáng.
**Phụ thuộc:** #L4, #L1.

### #7 — Imbalance (IMB) — xử lý inside bar 🟢
**Không đổi so với bản gốc.** Thuần hình học nến, không đọc cấu trúc.
Nguyên văn yêu cầu: sửa quy tắc bất đối xứng cho inside bar (chỉ thay **1 phía** theo hướng xu hướng,
không thay cả high lẫn low), và cân nhắc bật mặc định (`poi_type` đang mặc định `"---"`).
**Phụ thuộc:** #10.

### #8 — Extreme IMB / vào lệnh bằng IMB 🟡
**Không đổi về phần IMB**, nhưng **điều kiện vào lệnh suy giảm**:
tài liệu yêu cầu *"(1) giá phá qua IDM, và (2) giá quay về khai thác Extreme IMB"*.
Với IDM = fractal 3 nến, điều kiện (1) trở nên **gần như luôn đúng** → mất tác dụng lọc.
**Việc cần làm:**
- Phần track/thu hẹp Extreme IMB: làm y bản gốc.
- Phần tín hiệu vào lệnh: cân nhắc thêm điều kiện bù (vd. yêu cầu IDM phải nằm trong cùng leg với IMB),
  hoặc chấp nhận nhiều tín hiệu hơn.
**Phụ thuộc:** #7.

### #9 — Order Flow (OF) 🟢 — **ưu tiên tăng**
**Không đổi về nội dung** so với bản gốc: OF = chuyển động hồi cuối cùng trước khi tiếp diễn xu hướng;
điều kiện (1) giá phá khỏi đáy/đỉnh của chính OF, (2) OF không nằm trong OF trước đó. Không dùng IMB.
**Thay đổi về vị thế:** sau khi thay engine, **pullback không còn phục vụ IDM nữa** — #9 trở thành
khách hàng chính của nó. Nên làm sớm để engine pullback có lý do tồn tại rõ ràng.
**Phụ thuộc:** #1, #L5.

### #10 — Order Block (OB) — xác định cực trị 🟢
**Không đổi so với bản gốc.** Vấn đề vẫn là cửa sổ tìm cực trị quá hẹp
(`high_MOBS > high[4] and high_MOBS > high[2]`, dòng 514/534 — chỉ so 1 nến mỗi bên).
Thay bằng cơ chế theo dõi cực trị liên tục bằng biến `var`.
**Phụ thuộc:** #7.

### #11 — Entry OB dựa trên thanh khoản 🟡
**Không đổi về phân loại OB** (rút râu / quét TK lớn / rút râu quét TK gần).
**Thay đổi:** luật case 1/3 là *"chỉ hiện tín hiệu sau khi có BOS + IDM mới"*. Cả BOS lẫn IDM ở biến thể
này đều bắn dày hơn → cổng này **lỏng hơn đáng kể** → nhiều tín hiệu hơn, chọn lọc kém hơn.
**Việc cần làm:** giữ nguyên thiết kế; ghi nhận và đo lại tỉ lệ tín hiệu sau khi có dữ liệu thật.
**Phụ thuộc:** #10.

### #16 — SCOB — định nghĩa đầy đủ 🟡
**Không đổi phần lớn.** Vẫn phải: nhận diện đủ 3 case (Tại POI / Tại pullback / Tại IDM của quá khứ),
mở rộng cửa sổ xác nhận, vẽ thành box tồn tại lâu dài thay vì chỉ `barcolor`.
**Thay đổi:** case *"Tại IDM của quá khứ"* nay nghĩa là "tại fractal 3 nến của quá khứ" — **yếu hơn hẳn
về ý nghĩa**. Cân nhắc bỏ case này trong biến thể, hoặc dùng lịch sử pullback (#L5) thay cho lịch sử IDM.
**Phụ thuộc:** #10, #L5, #1.

### #17 — SCOB — cách vào lệnh 🔴 **SUY GIẢM NẶNG**
**Tài liệu:** Phần 11-1/11-2, trang 75-91.
**Vấn đề:** cả 3 case của tài liệu đều xoay quanh cụm *"nến rút râu qua IDM"*, và phân biệt nhau bằng
việc **có quét thanh khoản của nến ngay trước đó hay không** (SCOB mạnh = lấy thanh khoản 2 lần).

Logic này chỉ có ý nghĩa khi IDM là **một vùng thanh khoản thật** — tức đáy pullback nơi nhà đầu tư nhỏ lẻ
đặt SL. Với IDM = fractal 3 nến, "rút râu qua IDM" xảy ra liên tục ở mọi mức giá vi mô →
**phân loại case 1/2/3 mất ý nghĩa**.
**Ba lựa chọn:**
1. Bỏ mục #17 khỏi biến thể này.
2. Giữ engine pullback tính "IDM cấu trúc" song song, chỉ dùng riêng cho #17 (và #8, #18).
3. Định nghĩa lại 3 case theo mốc khác (vd. mốc BOS `max`/`min` thay cho IDM).
**Đề xuất:** (2) nếu bạn muốn giữ giá trị của mục này — nhưng lưu ý đó chính là việc **giữ lại IDM cũ**,
tức biến thể này không còn thuần LuxAlgo nữa.
**Phụ thuộc:** #16, #10, #2.

### #18 — CHOCH entry với IDM cho R:R cao 🔴
**Tài liệu:** Phần 12, trang 92-109.
**Hai nửa của mục này chịu ảnh hưởng khác nhau:**

**Nửa A — phân loại Nhóm A/B:** cần biết đỉnh/đáy tạo CHoCH có **quét râu qua cực trị quá khứ** hay không.
→ Engine LuxAlgo **không theo dõi sweep tại mốc CHoCH**. → **Bắt buộc làm #L3 trước.**
Sau khi có #L3 thì mục này khả thi bình thường.

**Nửa B — "đợi giá phá IDM mới":** dùng IDM fractal → cổng lỏng, giá trị lọc giảm (giống #8, #11).

**Việc cần làm:**
- Làm #L3 trước.
- Phân loại mỗi CHoCH: có sweep trước đó (Nhóm B, không cần IDM) / đóng nến hẳn (Nhóm A, cần IDM).
- Thêm kiểm tra "còn POI khác bên dưới hay không" để quyết định chờ SCOB xác nhận hay vào trực tiếp.
**Phụ thuộc:** #L3, #16, #17, #2, #4.

---

## Gợi ý thứ tự triển khai

```
#L1 (port engine)  ──┬──▶ #L2 (tham số, warm-up)
                     ├──▶ #L3 (sweep mốc CHoCH) ──▶ #18
                     ├──▶ #L4 (handle vẽ) ────────▶ #6
                     ├──▶ #3, #4 (tự động xong khi port)
                     └──▶ #5  (cần quyết định hướng xử lý trước)

#L5 (lịch sử) ──┬──▶ #9 (Order Flow) ◀── #1 (pullback, giữ lại)
                └──▶ #16 (SCOB) ──▶ #17 (cần quyết định trước)

#7 (IMB) ──▶ #10 (OB) ──┬──▶ #11
                        ├──▶ #16
                        └──▶ #8
```

**Nhánh POI (#7 → #10 → #11/#16/#8) hoàn toàn độc lập với việc thay engine** — có thể làm song song
ngay từ đầu, không cần chờ #L1.

---

## Ba quyết định cần chốt trước khi viết dòng code đầu tiên

| Quyết định | Ảnh hưởng tới | Ghi chú |
|---|---|---|
| **#5 xử lý thế nào** (bỏ / module phủ / chỉ cảnh báo) | #5, #6 | Đề xuất: chỉ cảnh báo |
| **#17 xử lý thế nào** (bỏ / giữ IDM cũ song song / định nghĩa lại) | #17, #8, #18 | Nếu chọn "giữ IDM cũ" thì biến thể này thành bản lai |
| **`len` / `shortLen` bao nhiêu** cho khung đang dùng | Toàn bộ | Cần test thực tế, chưa quyết được trên giấy |

---

## Đối chiếu tổng thể hai biến thể

| | Bản gốc (BankTrap) | Biến thể LuxAlgo |
|---|---|---|
| Mục chạy được ngay, không vướng | #1, #2, #3, #4, #7, #9, #10 (7) | #7, #9, #10 (3) |
| Mục cần làm thêm hạ tầng | #16 (lịch sử IDM) | #6, #9, #16, #18 + toàn bộ #L1-L5 |
| Mục mất/suy giảm định nghĩa | không có | **#5 (mất), #17 (nặng), #8/#11 (nhẹ)** |
| Tham số cấu trúc | 0 | 2 (`len`, `shortLen`) |
| CHoCH trong sideway | dày, nhiễu | **thưa, sạch** ✅ |
| BOS | thưa (cổng IDM chặt) | **dày hơn** ✅ |
| Độ trễ mốc CHoCH | ~tức thì | **tới `len` nến** ❌ |
| Chính xác mốc entry theo IDM | cao | **thấp** ❌ |

**Điểm đánh đổi trung tâm:** biến thể này đổi **độ chính xác của mốc entry** (nhóm #5, #8, #17, #18 —
những mục dùng IDM như một *mức giá* chứ không phải một *tín hiệu*) để lấy **cấu trúc CHoCH/BOS sạch
và giống SMC phổ thông**.

Nếu sau khi thử nghiệm bạn thấy cần cả hai, hướng đi thứ ba là **giữ engine LuxAlgo cho CHoCH/BOS
nhưng giữ IDM cũ của Trading Hub** (không dùng nó làm cổng BOS) — khi đó bảng trên gần như toàn 🟢,
nhưng đó là một tài liệu thứ ba, không phải bản này.
