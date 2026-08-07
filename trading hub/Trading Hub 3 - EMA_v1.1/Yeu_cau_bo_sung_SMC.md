# Yêu cầu bổ sung / sửa đổi cho Trading Hub 3 (v1.1)

Đối chiếu giữa `Trading_Hub_3_v1.1.pine` và tài liệu `857464368-banktrap-SMC.pdf` (tác giả Cường Tạ Trí).
Đây là **tài liệu yêu cầu (backlog)** — liệt kê các mục cần thêm/sửa, **chưa đụng vào code**.

Các số thứ tự (#1, #2, ...) giữ nguyên theo bảng đối chiếu đã thống nhất, để tiện tra cứu về sau.
Các mục **không** được chọn đưa vào backlog này: #12 (IFC), #13 (Retail Liquidity), #14 (SMT),
#15 (Session Liquidity), #19 (Flip entry) — có thể bổ sung sau nếu cần.

⚠️ **Lưu ý nền tảng:** file này là `indicator(...)`, không phải `strategy(...)`. Mọi mục nói về
"vào lệnh", R:R, SL/TP bên dưới chỉ nên hiểu là **hiển thị nhãn/tín hiệu trên chart**, không phải đặt lệnh thật.

---

## Bảng tổng hợp

| # | Mục | Trạng thái hiện tại | Việc cần làm |
|---|---|---|---|
| 1 | Pullback | 🟢 Đã đúng | Không cần sửa |
| 2 | IDM | 🟢 Đã đúng | Không cần sửa |
| 3 | BOS | 🟢 Đã đúng | Không cần sửa |
| 4 | CHOCH cơ bản | 🟢 Đã đúng | Không cần sửa |
| 5 | CHOCH có/không HTF POI | 🔴 Sai cơ chế | Thay toggle tĩnh bằng phát hiện tự động theo giá có chạm HTF POI |
| 6 | CHOCH có thể fail (dời LH/HL) | ⚪ Chưa có | Thêm cơ chế hủy CHOCH tạm & dời mốc khi giá đi ngược lại |
| 7 | Imbalance (IMB) — inside bar | 🟡 Sai chi tiết | Sửa quy tắc bất đối xứng cho inside bar, bật mặc định |
| 8 | Extreme IMB / vào lệnh bằng IMB | ⚪ Chưa có | Track nhiều IMB trong 1 nhịp, đánh dấu Extreme IMB, thu hẹp theo thời gian |
| 9 | Order Flow (OF) | ⚪ Chưa có | Thêm track riêng biệt với OB (không cần IMB) |
| 10 | Order Block (OB) — xác định | 🟡 Còn lỗi | Mở rộng cửa sổ tìm cực trị (đang chỉ so 1 nến mỗi bên) |
| 11 | Entry OB dựa trên thanh khoản | ⚪ Chưa có | Phân loại OB rút râu / OB thường → mức độ tin cậy tín hiệu |
| 16 | SCOB — định nghĩa | 🔴 Sai/thiếu | Viết lại theo đề xuất đã có (ứng viên cực trị liên tục) |
| 17 | SCOB — cách vào lệnh | ⚪ Chưa có | Toàn bộ decision tree (3 case tại IDM, nhồi lệnh, decay theo phiên) |
| 18 | CHOCH entry với IDM cho R:R cao | ⚪ Chưa có | Quy tắc có/không cần IDM sau CHOCH dựa trên mức độ quét thanh khoản |

---

## Chi tiết từng mục

### #1 — Pullback
**Tài liệu:** Phần 1, trang 1-2. **Code:** dòng 301-354.
**Trạng thái:** Đã đúng, thuật toán zigzag tổng quát khớp khái niệm "cây nến tiếp theo phá đỉnh/đáy nến trước".
**Việc cần làm:** Không cần sửa. Đây là nền tảng cho #2 (IDM).

### #2 — IDM
**Tài liệu:** Phần 2, trang 3-5. **Code:** dòng 356-370, 373-436.
**Trạng thái:** Đã đúng — xác nhận bằng **wick** (`low < idmLow`), không yêu cầu đóng nến, khớp đúng ghi chú
tài liệu *"màu nến không quan trọng, miễn giá đi xuống vượt qua A là được"*.
**Việc cần làm:** Không cần sửa.

### #3 — BOS
**Tài liệu:** Phần 2, trang 3-5, 8. **Code:** dòng 466-495.
**Trạng thái:** Đã đúng — yêu cầu **đóng nến** vượt qua (`close > lastH`), và mốc tham chiếu tự cập nhật
theo râu nến cao nhất từng thấy (dòng 500-506), khớp đúng ghi chú tinh tế ở cuối trang 8.
**Việc cần làm:** Không cần sửa.

### #4 — CHOCH cơ bản
**Tài liệu:** Phần 2, trang 6, 8. **Code:** dòng 439-464.
**Trạng thái:** Đã đúng — cũng yêu cầu đóng nến xác nhận.
**Việc cần làm:** Không cần sửa.

### #5 — CHOCH có/không HTF POI 🔴
**Tài liệu:** Phần 2, trang 6 ("Hai trường hợp xuất hiện CHOCH"). **Code:** input `structure_type` (dòng 10).
**Vấn đề:** Tài liệu phân biệt 2 case dựa trên **sự kiện thực tế trên chart** — giá có chạm vùng POI của
khung thời gian cao hơn (HTF) ngay trước khi CHOCH hình thành hay không. Code hiện biến việc này thành
**1 công tắc cấu hình tĩnh** áp dụng cho toàn bộ chart, không tự nhận diện từng trường hợp.
**Việc cần làm:**
- Thêm khả năng lấy vùng POI từ khung thời gian cao hơn (multi-timeframe, qua `request.security` hoặc
  cho phép nhập thủ công 1 vùng giá HTF).
- Khi 1 pullback đầu tiên (PB1) bị phá, kiểm tra: giá vừa chạm vùng HTF POI đó không?
  - Có chạm → xử lý như CHOCH ngay tại đó (case 1, không cần đợi BOS).
  - Không chạm → giữ nguyên xử lý IDM → BOS → chờ CHOCH ở HL/LH sau đó (case 2).
**Phụ thuộc:** cần cơ chế đọc POI khung lớn hơn (liên quan #10 nhưng khác timeframe).

### #6 — CHOCH có thể fail / dời LH-HL ⚪
**Tài liệu:** Phần 2, trang 7. **Code:** chưa xác định rõ ràng có xử lý hay không.
**Mô tả tài liệu:** Sau khi đánh dấu CHOCH theo lý thuyết, nếu giá không đi tiếp theo hướng CHOCH mà tiếp
tục phá đáy/đỉnh gần nhất theo hướng cũ → CHOCH đó coi như **fail**, phải **bỏ đánh dấu**, dời mốc LH/HL
sang vị trí mới, và chờ giá phá mốc mới thì mới có CHOCH hợp lệ. CHOCH mới hình thành vẫn có thể tiếp tục fail.
**Việc cần làm:** Thêm state để đánh dấu 1 CHOCH là "tạm/provisional"; nếu giá phá tiếp theo hướng cũ trước
khi có BOS xác nhận xu hướng mới → gỡ CHOCH, dời LH/HL, quay lại chờ.
**Phụ thuộc:** #4, #5.

### #7 — Imbalance (IMB) — xử lý inside bar 🟡
**Tài liệu:** Phần 3, trang 21-22. **Code:** dòng 274/276 (điều kiện gap), dòng 521-524/541-544 (inside bar).
**Đã đúng:** Định nghĩa gap 3 nến, không phân biệt màu nến — khớp tài liệu.
**Vấn đề:**
1. Tài liệu: *"trong xu hướng tăng, đáy của inside bar vẫn được xem xét để xác định IMB, còn đỉnh của
   inside bar không được xem xét"* (và ngược lại cho xu hướng giảm) — tức chỉ loại **1 phía**.
   Code hiện thay **cả high lẫn low** bằng biên của mother bar cùng lúc — sai tính bất đối xứng này.
2. Xử lý này **mặc định TẮT** (`poi_type` mặc định = `"---"` chứ không phải `"Mother Bar"`).
**Việc cần làm:**
- Sửa lại: chỉ thay thế **1 phía** (phía không dùng để xác định IMB theo đúng hướng xu hướng), giữ nguyên
  phía còn lại là giá trị thật của inside bar.
- Cân nhắc bật mặc định thay vì để user tự bật.
**Phụ thuộc:** #10 (OB dùng kết quả IMB làm điều kiện).

### #8 — Extreme IMB / vào lệnh bằng IMB ⚪
**Tài liệu:** Phần 3, trang 23-25. **Code:** chưa có.
**Mô tả tài liệu:**
- Trong 1 nhịp di chuyển có thể có **nhiều IMB chồng lên nhau**; IMB gần cực trị nhất được gọi là **Extreme IMB**.
- Khi 1 IMB gần bị khai thác 1 phần (chưa hết) → phải **thu hẹp (THU HẸP)** vùng IMB đó lại cho đúng phần
  còn chưa được khai thác.
- Có thể **vào lệnh riêng dựa trên IMB**: cần 2 điều kiện — (1) giá phá qua IDM, và (2) giá quay về khai
  thác Extreme IMB. SL đặt trên đỉnh của cây nến tạo ra Extreme IMB.
**Việc cần làm:**
- Track toàn bộ các IMB xuất hiện trong 1 nhịp giá (không chỉ dùng làm điều kiện ẩn cho OB như hiện tại).
- Đánh dấu IMB nào là Extreme IMB (gần cực trị nhất).
- Thêm logic thu hẹp vùng IMB khi bị khai thác một phần.
- (Tuỳ chọn) thêm nhãn tín hiệu khi đủ 2 điều kiện vào lệnh bằng IMB.
**Phụ thuộc:** #7.

### #9 — Order Flow (OF) ⚪
**Tài liệu:** Phần 4, trang 26-36. **Code:** chưa có (chỉ có Order Block, là "bản tinh chỉnh" của OF).
**Mô tả tài liệu:** OF = chuyển động hồi **cuối cùng** trước khi giá tiếp diễn xu hướng. Điều kiện hợp lệ:
(1) giá phải phá khỏi đáy/đỉnh của chính OF đó, và (2) OF không được nằm trong 1 OF trước đó (nếu nằm
trong thì bị loại, chỉ giữ OF ngoài cùng). **Không dùng IMB** để xác định OF (khác OB).
**Việc cần làm:**
- Thêm track riêng cho OF, độc lập với logic OB hiện có (không cần điều kiện IMB).
- Vẽ vùng OF dạng box tồn tại lâu dài, xoá/đánh dấu đã khai thác khi giá phá qua đáy/đỉnh của nó.
- Có thể tái dùng thuật toán pullback (#1) để tìm các leg hồi làm ứng viên OF.
**Phụ thuộc:** không phụ thuộc IMB (#7), nhưng nên tách biệt rõ với OB (#10) để tránh nhầm lẫn khi hiển thị.

### #10 — Order Block (OB) — xác định cực trị 🟡
**Tài liệu:** Phần 5-1, trang 37. **Code:** dòng 509-548.
**Đã đúng:** Điều kiện IMB (gap 3 nến), cơ chế "di dời sang nến tiếp theo" khi chưa đủ điều kiện.
**Vấn đề:** Điều kiện xác định "đáy thấp nhất/đỉnh cao nhất" (`high_MOBS > high[4] and high_MOBS > high[2]`,
dòng 514/534) chỉ so sánh với **đúng 1 nến mỗi bên** — cửa sổ quá hẹp, có thể neo sai nến OB nếu cực trị
thật của cả nhịp cần nhiều hơn 2-3 nến để hình thành (giống lỗi ở #16 SCOB).
**Việc cần làm:** Thay bằng cơ chế theo dõi cực trị liên tục (biến `var`, không giới hạn số nến) — dùng
chung 1 hàm với đề xuất sửa SCOB ở #16 nếu có thể, để tránh trùng lặp logic.
**Phụ thuộc:** #7 (IMB đúng), là nền cho #11, #16, #19(không nằm trong backlog này).

### #11 — Entry OB dựa trên thanh khoản ⚪
**Tài liệu:** Phần 5-1/5-2, trang 38-51. **Code:** chưa có (chỉ vẽ zone, không có tín hiệu vào lệnh).
**Mô tả tài liệu — 3 trường hợp:**
1. **OB rút râu** (đã quét thanh khoản của nến trước nó) → xác suất cao hơn OB thường.
2. **OB hình thành sau khi quét 1 vùng thanh khoản lớn** (trendline, vùng EQ) → độ uy tín rất cao, **không
   cần đợi IDM** mới được vào lệnh.
3. **OB rút râu nhưng chỉ quét thanh khoản gần** (chưa đủ uy tín bằng case 2) → cần thêm điều kiện IDM.
**Nguyên tắc cốt lõi:** *"Trong giao dịch, thanh khoản mới là quan trọng, không phải OB."*
**Việc cần làm:**
- Phân loại mỗi OB khi vẽ ra: có phải "OB rút râu" không (so đáy/đỉnh của cây nến OB với cây nến ngay
  trước nó).
- Case 1/3 (rút râu, chưa quét vùng TK lớn): gắn nhãn "cần IDM" — chỉ hiện tín hiệu sau khi có BOS + IDM mới.
- Case 2 (quét vùng TK lớn: trendline/EQ trước khi hình thành OB): gắn nhãn "uy tín cao — không cần IDM" —
  hiện tín hiệu ngay khi giá chạm lại OB.
- (Nhận diện vùng trendline/EQ là phần khó nhất, có thể để giai đoạn 2.)
**Phụ thuộc:** #10.

### #16 — SCOB — định nghĩa đầy đủ 🔴
**Tài liệu:** Phần 11-1, trang 74. **Code:** dòng 289-298 (hàm `scob()`).
**Vấn đề (đã phân tích chi tiết ở các lượt trước):**
- Chỉ nhận diện case "Tại POI" (1/3 trường hợp tài liệu mô tả), bỏ sót "Tại pullback" và "Tại IDM của quá khứ".
- Cửa sổ xác nhận chỉ 1 nến trước/sau → bỏ sót xác nhận trễ nhiều nến và case inside bar lồng nhau.
- Chỉ tô màu bar (`barcolor`), không tạo vùng tồn tại lâu dài để quay lại khai thác.
**Việc cần làm:** Đã có bản đề xuất code cụ thể (theo dõi ứng viên cực trị liên tục bằng biến `var`, bỏ
qua inside bar bằng `isb`, không bắt buộc nằm trong OB zone có sẵn, vẽ thành box có mitigate) — xem lại
đề xuất đã trao đổi trước đó khi quyết định áp dụng.
**Phụ thuộc:** #10 (dùng OB zone cho case "Tại POI"), dùng chung `isb` với #7/#10.

### #17 — SCOB — cách vào lệnh ⚪
**Tài liệu:** Phần 11-1/11-2, trang 75-91. **Code:** chưa có.
**Mô tả tài liệu:**
- **SCOB hình thành tại IDM** — 3 case:
  1. Nến rút râu qua IDM nhưng **không** quét thanh khoản của nến ngay trước nó → SCOB yếu → vào LTF vẫn
     phải **đợi có IDM ở LTF** mới vào lệnh.
  2. Nến rút râu qua IDM **và** quét thanh khoản của nến ngay trước nó → SCOB mạnh (đã lấy TK 2 lần) →
     có thể vào lệnh ngay khi giá về khai thác, **không cần đợi IDM ở LTF**.
  3. Nến đóng hẳn bên trên IDM (không rút râu) → phải đợi giá đi lên khai thác decisional POI/Ex POI,
     xác suất thấp hơn (~50%).
- **SCOB hình thành tại decisional POI/Ex POI:** logic tương tự, với Ex POI thì luôn có thể vào ngay.
- **Tác dụng giảm dần theo thời gian:** nếu SCOB/POI không được khai thác trong khoảng ~1 phiên (tối đa
  ~3 phiên) thì độ tin cậy giảm mạnh, không nên tin theo SCOB của HTF nữa.
- **Nhồi lệnh liên tục:** cho phép vào lệnh lặp lại theo các SCOB pullback nếu **bên dưới không còn POI
  nào khác**; nếu còn POI phía dưới thì không nhồi (giá nhiều khả năng đi tiếp xuống đó).
**Việc cần làm:** Vì là indicator, đề xuất thể hiện dưới dạng nhãn phân loại tín hiệu (vd: "SCOB — cần IDM"
/ "SCOB — vào ngay") thay vì đặt lệnh thật; thêm cảnh báo khi SCOB quá hạn ~3 phiên chưa được khai thác.
**Phụ thuộc:** #16, #10, #2 (IDM).

### #18 — CHOCH entry với IDM cho R:R cao ⚪
**Tài liệu:** Phần 12, trang 92-109. **Code:** chưa có (chỉ có cấu trúc CHOCH/IDM cơ bản #2-#4, chưa có
quy tắc quyết định entry).
**Mô tả tài liệu (rút gọn từ 2 nhóm case chính):**
- **Nhóm A — CHOCH cần IDM** (trang 92): nếu đỉnh/đáy tạo CHOCH **đóng nến hẳn** (không quét râu qua đỉnh/đáy
  quá khứ) → thị trường **chưa lấy đủ thanh khoản** → bắt buộc phải đợi giá phá IDM mới, sau đó chạm lại
  vùng POI mới được vào lệnh. Nếu SCOB hình thành ngay tại vị trí đó thay vì đợi IDM mới thì có thể vào theo SCOB.
- **Nhóm B — CHOCH không cần IDM** (trang 93): nếu đỉnh/đáy tạo CHOCH có **quét râu nến** qua đỉnh/đáy quá
  khứ (đã lấy đủ thanh khoản ở đó) → có thể vào lệnh ngay khi giá hồi về vùng POI, **không cần đợi IDM mới**.
- **Tích hợp SCOB (trang 92-109 phần ví dụ thực tế):** khi giá chạm 1 vùng POI mà **bên dưới vẫn còn 1
  POI khác** → không vào lệnh ngay, phải đợi SCOB xác nhận tại đó rồi mới vào. Nếu **không còn POI nào
  khác bên dưới** → có thể vào lệnh trực tiếp khi chạm POI, không cần đợi SCOB.
**Việc cần làm:**
- Thêm logic phân loại mỗi CHOCH: có "quét râu qua đỉnh/đáy quá khứ" (Nhóm B) hay "đóng nến hẳn, chưa
  quét" (Nhóm A) → gắn nhãn "cần IDM" / "không cần IDM" tương ứng.
- Thêm kiểm tra "còn POI khác bên dưới vùng đang xét hay không" để quyết định có cần chờ SCOB xác nhận
  hay cho phép vào lệnh trực tiếp.
**Phụ thuộc:** #16, #17, #2, #4/#5 — đây là mục **phụ thuộc nhiều nhất**, nên làm sau cùng.

---

## Gợi ý thứ tự triển khai (theo phụ thuộc)

```
#7  (IMB đúng)
 └─▶ #10 (OB đúng) ──┬─▶ #11 (Entry OB)
                      ├─▶ #16 (SCOB đúng) ──▶ #17 (Entry SCOB) ─┐
                      └─▶ #8  (Extreme IMB)                     │
#5  (CHOCH + HTF POI) ──▶ #6 (CHOCH fail) ──────────────────────┼─▶ #18 (CHOCH entry R:R cao)
#9  (Order Flow) — độc lập, có thể làm bất cứ lúc nào ───────────┘
```

`#1, #2, #3, #4` đã đúng, không nằm trong luồng phụ thuộc trên (chỉ là nền tảng sẵn có).

---

## Phụ lục — Fibonacci Retracement (nghiên cứu thêm, KHÔNG có trong tài liệu SMC)

Đã tìm trong toàn bộ text trích xuất được của `857464368-banktrap-SMC.pdf` — **không có bất kỳ đề cập nào**
đến Fibonacci. Tài liệu này thuần theo trường phái SMC/Order Flow (dùng OB, IMB, thanh khoản, cấu trúc
BOS/CHOCH/IDM) — không dùng công cụ Fibonacci, đây là điều bình thường vì SMC/ICT thường thay thế Fib
bằng các khái niệm thanh khoản kể trên.

Tìm hiểu từ nguồn ngoài, tóm tắt để tham khảo nếu sau này muốn thêm Fibonacci như một lớp xác nhận bổ sung:

**Khái niệm cơ bản:** Fibonacci retracement là các đường ngang vẽ giữa 1 đỉnh và 1 đáy swing, đánh dấu các
mức % hồi lại phổ biến: **0.236, 0.382, 0.5, 0.618, 0.786**. Mức 0.618 ("golden ratio") được xem là quan
trọng nhất; giá phá qua mức 0.786 thường được coi là dấu hiệu đảo chiều thay vì chỉ hồi (pullback).
[How To Use Fibonacci Levels In Trading](https://finimize.com/content/fibonacci-levels),
[Fibonacci Retracement Levels (0.382, 0.5, 0.618)](https://forexforstarters.com/indicators/fibonacci/retracements/)

**Kết hợp với SMC (nếu muốn dùng làm lớp xác nhận cho OB/SCOB đã có trong indicator này):** Vùng entry tối
ưu ("Optimal Trade Entry" — OTE) là vùng hồi 62%-79% của nhịp giá tạo ra CHOCH. Setup có xác suất cao nhất
là khi 1 Order Block hoặc FVG nằm **trùng** vào vùng OTE 62%-79% này — tức Fibonacci không thay thế OB/IMB
mà đóng vai trò xác nhận thêm ("confluence").
[How to integrate Smart Money Concepts (OB) coupled with Fibonacci indicator](https://www.mql5.com/en/articles/13396),
[Smart Money Concepts (SMC): How Institutional Traders Move Markets](https://fibalgo.com/education/smart-money-concepts-trading)

**Ghi chú:** Đây là ý tưởng ngoài phạm vi 13 mục ở trên, không thuộc backlog chính thức — chỉ ghi lại để
tham khảo nếu sau này muốn cân nhắc thêm làm lớp xác nhận cho #10 (OB) hoặc #16 (SCOB).
