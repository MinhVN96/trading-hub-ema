# BANKTRAP SMC — TỔNG HỢP TOÀN BỘ PHƯƠNG PHÁP

> Tài liệu tổng hợp từ 149 trang PDF BankTrap SMC (857464368-banktrap-SMC.pdf)

---

## MỤC LỤC

1. [Nền Tảng Cấu Trúc Thị Trường](#1-nền-tảng-cấu-trúc-thị-trường)
2. [Các Vùng Vào Lệnh (POI)](#2-các-vùng-vào-lệnh-poi)
3. [Bẫy Tổ Chức (SMT)](#3-bẫy-tổ-chức-smt)
4. [Quy Trình Phân Tích HTF → LTF](#4-quy-trình-phân-tích-htf--ltf)
5. [Các Phương Pháp Vào Lệnh](#5-các-phương-pháp-vào-lệnh)
6. [Retail Liquidity & Trendline Breakout](#6-retail-liquidity--trendline-breakout)
7. [Session Liquidity (Thanh Khoản Phiên)](#7-session-liquidity-thanh-khoản-phiên)
8. [Quản Lý Lệnh](#8-quản-lý-lệnh)
9. [Thứ Tự Ưu Tiên Vào Lệnh](#9-thứ-tự-ưu-tiên-vào-lệnh)
10. [Checklist Trước Khi Vào Lệnh](#10-checklist-trước-khi-vào-lệnh)

---

## 1. Nền Tảng Cấu Trúc Thị Trường

### 1.1 BOS — Break of Structure (Phá Vỡ Cấu Trúc)

- Giá phá vỡ đỉnh (bullish) hoặc đáy (bearish) trước → xác nhận xu hướng tiếp tục
- Sau mỗi BOS → tạo ra một IDM mới
- BOS phân biệt: **Internal BOS** (trong cấu trúc nhỏ) và **External BOS** (phá vỡ cấu trúc lớn)

### 1.2 CHOCH — Change of Character (Đảo Chiều Xu Hướng)

Tín hiệu đảo chiều xu hướng. Có 2 loại điều kiện:

**CHOCH CẦN IDM khi vào lệnh:**
- Đáy thấp nhất (bearish) đóng nến bên dưới đáy trước (không quét râu)
- Thân nến đóng qua đáy → thị trường chưa lấy TK → cần giá vượt IDM mới vào lệnh

**CHOCH KHÔNG CẦN IDM khi vào lệnh:**
- Đáy thấp nhất quét râu nến qua đáy trước (wick sweep)
- Thị trường đã lấy TK → có thể vào lệnh ngay khi giá về POI

> **Quy tắc vàng:** Nếu đáy tạo CHOCH cũng quét râu qua đáy trước → không cần IDM. Nếu chỉ đóng thân → cần IDM.

### 1.3 IDM — Inducement (Dẫn Dụ / Bẫy Thanh Khoản)

- Là lần pullback **đầu tiên** sau BOS
- Là bẫy TK nhỏ để dẫn dụ retail trader vào sai chiều
- **Phải vượt IDM** mới xác định được POI để vào lệnh
- Vị trí IDM có thể bị dịch chuyển khi giá tạo đáy/đỉnh mới

**Các trường hợp sau khi giá vượt IDM:**
- **Case a:** Giá vượt IDM → về chạm POI → vào lệnh
- **Case b:** Giá quét IDM, đóng nến bên kia IDM → về POI → vào lệnh
- **Case c:** Giá vượt IDM, đi lên đóng trên đỉnh cũ → về POI → vào lệnh
- **Case d:** Không có IDM hình thành → **KHÔNG VÀO LỆNH** dù giá về POI

**Trường hợp rút râu tại IDM (không đóng nến qua):**
1. Đợi SCOB hình thành trong HTF → xuống LTF vào với SCOB
2. Xuống LTF ngay để tìm CHOCH rồi vào lệnh

### 1.4 IMB — Imbalance (Vùng Mất Cân Bằng)

- Khoảng trống giữa **nến 1 và nến 3** (high nến 1 thấp hơn low nến 3, hoặc ngược lại)
- OB **phải có IMB** để hợp lệ
- **Extreme IMB:** IMB gần extreme nhất trong chuỗi nến

### 1.5 OF — Order Flow (Dòng Lệnh)

> "Order block is just **refinery version** of the order flow. After CHOCH, always mark your ORDER FLOW first, not order block."

**Định nghĩa:**
> "Order flow là chuyển động **hồi cuối cùng** trước khi tiếp diễn xu hướng"

OF là lần retracement (pullback) **cuối cùng** trước khi xu hướng tiếp tục — đây là cấu trúc cấp cao hơn OB, dùng để xác định vùng POI chính xác hơn.

---

#### Điều Kiện OF Hợp Lệ (Quy Tắc #1 Bắt Buộc)

**Bearish OF (xu hướng giảm):**
1. Giá phải **phá khỏi đáy của OF** (break below OF low)
2. OF **không được nằm trong OF trước đó** (must not be contained within the previous OF)

**Bullish OF (xu hướng tăng):**
1. Giá phải **phá khỏi đỉnh của OF** (break above OF high)
2. OF **không được nằm trong OF trước đó**

> **Lưu ý đặc biệt:** Nếu OF mới có một phần nằm trên OF cũ và một phần nằm dưới OF khác → **hợp lệ** (không bị chứa hoàn toàn trong OF nào).

---

#### Hình Dạng OF Hợp Lệ

OF có thể có 4 dạng hình thái:

| Dạng | Mô Tả |
|------|-------|
| **(a)** | Dạng cơ bản — pullback rõ ràng |
| **(b)** | Dạng nén — pullback nhỏ, dễ nhận POI |
| **(c)** | Dạng phức tạp → **nên nén lại thành dạng (b)** để dễ xác định POI |
| **(d)** | Dạng biến thể khác |

> **Thực hành:** Khi OF có cấu trúc phức tạp dạng (c), hãy nén lại thành dạng (b) để xác định POI dễ hơn.

---

#### Quy Tắc Xác Định OF Trên Chart

1. **Sau CHOCH → bắt đầu xác định OF** (không phải OB)
2. Chỉ cần xác định OF **cuối cùng** trước điểm đảo chiều — các OF trong quá trình giá đi không cần đánh dấu
3. Sau khi giá đã chạm đáy/đỉnh, các OF phía trên/dưới không còn giá trị — chúng đã bị khai thác
4. "OF nằm ở pullback nhỏ cuối cùng của pullback lớn"
5. **IMB không tham gia vào việc hình thành OF** — khi xác định OF, bỏ qua IMB

---

#### Quy Trình Sử Dụng OF Thực Tế

```
CHOCH xác nhận đảo chiều
    ↓
Xác định OF đầu tiên (bullish/bearish theo chiều mới)
    ↓
Kiểm tra: OF có phá đáy/đỉnh? Có nằm ngoài OF trước không?
    ↓
OF hợp lệ → Xác định POI trong OF (OB, IMB entry)
    ↓
Chờ giá về POI trong OF → Vào lệnh
```

---

#### 9 Ví Dụ Thực Tế (EUR/USD Daily — SMC Phần 4)

| Ví Dụ | Nội Dung Chính |
|-------|---------------|
| **1/9** | Xác định bearish OF trong downtrend — điều kiện phá đáy |
| **2/9** | Bearish OF — kiểm tra điều kiện "không nằm trong OF trước" |
| **3/9** | Ví dụ OF6 có phần trên OF3 và phần dưới OF4 → hợp lệ |
| **4/9** | Sau CHOCH → chuyển sang xác định bullish OF |
| **5/9** | Nén OF phức tạp dạng (c) → dạng (b) để dễ xác định POI |
| **6/9** | Chỉ đánh dấu OF cuối cùng; các OF trước không cần thiết |
| **7/9** | OF trong pullback nhỏ cuối của pullback lớn |
| **8/9** | IMB không tham gia hình thành OF — bỏ qua khi xác định |
| **9/9** | Tổng hợp: sau khi giá khai thác OF → các OF cũ không còn giá trị |

---

#### Phân Biệt OF vs OB

| Tiêu Chí | OF (Order Flow) | OB (Order Block) |
|----------|----------------|-----------------|
| Cấp bậc | Cao hơn (macro) | Thấp hơn (micro) |
| Xác định trước | **Xác định OF trước** | Xác định OB sau OF |
| Bản chất | Toàn bộ vùng retracement | Nến cụ thể trong OF |
| Mục đích | Xác định vùng POI rộng | Entry chính xác trong POI |
| IMB | Không tính IMB khi xác định | OB bắt buộc có IMB |

### 1.6 Pullback Hợp Lệ

- **Impulsive move** (move nhanh, mạnh) → **Corrective move** (pullback chậm, nhỏ)
- Pullback hợp lệ = impulsive + corrective
- **Internal structure vs External structure:** Giá đang trong cấu trúc vs giá phá vỡ cấu trúc

---

## 2. Các Vùng Vào Lệnh (POI)

### 2.1 OB — Order Block

Nến cuối cùng trước move mạnh, **bắt buộc phải có IMB** phía sau.

| Loại OB | Đặc điểm |
|---------|-----------|
| **Extreme OB** | OB gần extreme nhất (đỉnh/đáy) của cấu trúc |
| **Decisional OB** | OB nằm giữa cấu trúc, sau lần pullback đầu tiên |
| **OB Rút Râu (Wick OB)** | OB quét TK của nến trước → xác suất cao hơn |

**Quy tắc xác định OB:**
- Xác định từ đáy của move (bullish) hoặc đỉnh của move (bearish)
- Nến phải có IMB phía sau mới là OB hợp lệ
- Nếu tất cả OB đều bị khai thác → xác định lại từ OF

### 2.2 IFC — Inverse Fair Candle (Nến Đảo Chiều Đặc Biệt)

- Nến có **râu dài** quét qua IDM, nhưng **thân đóng ngược chiều** (bên kia IDM)
- Khi cả thân và râu nến IFC đều bị khai thác → OB chuyển sang **nến kế tiếp**
- Vào lệnh khi giá về khai thác vùng OB của IFC

### 2.3 SCOB — Single Candle Order Block

Nến đơn tại POI với điều kiện đặc biệt:

**Điều kiện SCOB:**
- **Nến I** phải ở vị trí extreme (đỉnh/đáy nhất)
- **Nến II** đóng bên dưới nến I (bearish SCOB) hoặc bên trên (bullish SCOB)
- Nến II xác nhận SCOB

**Cách vào lệnh với SCOB:**
- **Cách 1 (ít rủi ro hơn):** Đợi SCOB thứ 2 xác nhận → vào lệnh (R:R thấp hơn)
- **Cách 2 (rủi ro hơn):** Vào ngay khi giá về chạm SCOB (R:R cao hơn)
- Nếu SCOB quá rộng → vào tại **Fibonacci 50%** của SCOB

**Nhồi lệnh SCOB (Add position):**
- Khi giá về chạm SCOB sau khi đã có lệnh chạy → nhồi thêm
- SL lệnh mới = SL lệnh cũ
- Không nhồi khi giá đã đi quá xa

### 2.4 HTF POI vs LTF POI

| | HTF POI | LTF POI |
|--|---------|---------|
| **Vai trò** | Xác định vùng giá lớn | Xác định điểm vào chính xác |
| **Timeframe** | H4, Daily, 2D | M15, M5, M1 |
| **Cách dùng** | Đợi giá chạm → xuống LTF | Tìm CHOCH/SCOB/Flip để vào |

---

## 3. Bẫy Tổ Chức (SMT)

### 3.1 SMT Là Gì?

**Smart Money Trap** — Bẫy do tổ chức thiết kế để săn stop loss của retail trader.

### 3.2 SMT Xuất Hiện Tại 3 Vị Trí:

1. **Tại IDM (counter-trend):** Giá giả vờ đảo chiều nhưng không có POI hợp lệ
2. **Tại OB counter-trend:** Giá chạm OB ngược chiều nhưng không đủ điều kiện
3. **Tại OB valid-trend:** Bẫy trong xu hướng chính

### 3.3 Cách Nhận Biết SMT:

- Giá tạo CHOCH nhưng **không đủ điều kiện IDM** → đây là SMT
- Vùng OB bên trên IDM (trong xu hướng giảm) → là SMT, không vào lệnh
- Không có POI hợp lệ bên dưới → không vào lệnh

---

## 4. Quy Trình Phân Tích HTF → LTF

```
HTF (H4 / Daily / 2D)
  → Xác định xu hướng (BOS)
  → Xác định POI (Extreme POI + Decisional POI)
  → Đợi giá chạm POI
        ↓
LTF (M15 / M5 / M1)
  → Tìm CHOCH (có/không IDM)
  → Hoặc tìm Flip entry (SZ → DZ)
  → Hoặc tìm SCOB
        ↓
VÀO LỆNH tại POI của LTF khi có xác nhận
```

**Nguyên tắc:**
- Khi chạm POI HTF → pullback đầu tiên thường là CHOCH trong LTF
- Nếu SCOB POI trong HTF → phải vào lệnh ở LTF (SCOB entry hoặc CHOCH flip)
- Nếu POI dựa trên OB → phải tìm CHOCH/flip/SCOB trong LTF để vào
- Nếu POI dựa trên OF → phải dùng OF trong LTF để quyết định

---

## 5. Các Phương Pháp Vào Lệnh

### 5A. CHOCH Entry (Phần 12)

**Lý thuyết:**
Sau BOS → đợi IDM → giá vượt IDM → tìm POI → đợi CHOCH trong LTF → vào lệnh.

**Các trường hợp CHOCH:**

| Trường hợp | Mô tả | Hành động |
|-----------|-------|-----------|
| Đáy đóng nến bên dưới đáy cũ | CHOCH cần IDM | Đợi vượt IDM rồi vào POI |
| Đáy quét râu qua đáy cũ | CHOCH không cần IDM | Vào lệnh khi giá về POI |
| Giá rút râu tại IDM (không đóng nến qua) | IDM chưa bị phá vỡ hoàn toàn | Đợi SCOB HTF hoặc xuống LTF tìm CHOCH |

**Điều kiện CHOCH không cần IDM:**
- Đáy mới thấp hơn VÀ đã quét râu nến qua đáy trước đó
- Tức thị trường đã tự lấy TK → không cần IDM nữa

### 5B. SCOB Entry (Phần 11)

**Cách 1 — SCOB trong HTF:**
1. Xác định SCOB trong HTF (H1, H4)
2. Khi giá về chạm SCOB → xuống LTF (M5, M1)
3. Tìm CHOCH trong LTF để vào lệnh

**Cách 2 — Nhồi lệnh SCOB trong LTF:**
1. Đã có lệnh từ vào lệnh trước
2. Giá về chạm SCOB mới hình thành → nhồi thêm lệnh
3. SL giống lệnh trước

**Quy tắc nhồi lệnh:**
- Nếu giá đã đi lên/xuống rồi (xa POI) → KHÔNG nhồi nữa
- Chỉ nhồi khi giá còn trong vùng POI hợp lệ

### 5C. Flip Entry (Phần 13)

**Định nghĩa:** Vùng Supply chuyển thành Demand (hoặc Demand thành Supply).

---

#### FLIP SUPPLY → DEMAND (Xu hướng giảm, tìm điểm MUA)

**Trường hợp a — Đáy thấp nhất đóng nến bên dưới đáy trước:**
```
Xu hướng giảm → Giá chạm HTF POI/Sweep → Hình thành Supply Zone (SZ)
→ Giá đi xuống tạo Demand Zone (DZ) → Giá đi lên vượt biên trên SZ = CHOCH
→ Lúc này SZ đã flip thành Demand
→ Khi giá về chạm DZ → tìm điểm vào lệnh MUA
```
- DZ phải hình thành NGAY SAU SZ và TRƯỚC KHI tạo CHOCH
- CHOCH này CẦN IDM (vì đáy đóng nến bên dưới, không quét râu)
- Giá phải vượt IDM → về khai thác DZ → vào lệnh

**Trường hợp b — Đáy thấp nhất quét râu qua đáy trước:**
- Thị trường đã lấy TK trước
- CHOCH KHÔNG CẦN IDM
- Khi giá về chạm DZ → vào lệnh mua ngay

---

#### FLIP DEMAND → SUPPLY (Xu hướng tăng, tìm điểm BÁN)

**Trường hợp a — Đỉnh cao nhất đóng nến bên trên đỉnh trước:**
```
Xu hướng tăng → Giá chạm HTF POI → Hình thành Demand Zone (DZ) bên dưới
→ Giá đi lên tạo Supply Zone (SZ) → Giá đi xuống vượt biên dưới DZ = CHOCH
→ SZ đã flip thành Supply
→ Khi giá lên chạm SZ → vào lệnh BÁN
```
- CHOCH CẦN IDM (đỉnh đóng nến bên trên, không quét râu)

**Trường hợp b — Đỉnh cao nhất quét râu qua đỉnh trước:**
- Thị trường đã lấy TK → CHOCH KHÔNG CẦN IDM
- Khi giá lên chạm SZ → vào lệnh bán ngay

---

#### FLIP VỚI EXTREME POI (Ex POI)

Khi trên vùng SZ còn có Extreme POI:
- Khi giá về chạm Ex POI → có thể vào lệnh trực tiếp không cần xác nhận LTF
- Với flip entry: vào lệnh bán khi giá về chạm SZ, không cần đợi về Ex POI
- Sau khi vào lệnh tại SZ → đợi giá về chạm Ex POI để nhồi lệnh

---

#### FLIP ENTRY SAU KHI TẠO CHOCH

**Trường hợp a — Đáy quét râu qua đáy cũ (thị trường đã lấy TK):**
```
Sau CHOCH → giá đi lên chạm SZ bên trên → có PHẢN ỨNG, không vượt qua SZ
→ Giá đi xuống chạm DZ bên dưới → vào lệnh mua lên
```
- Đây là dạng flip supply/demand to demand/supply SAU CHOCH

**Trường hợp b — Đáy đóng nến bên dưới (chưa lấy TK):**
```
Sau CHOCH → giá về chạm DZ nhưng CHƯA THỂ VÀO LỆNH
vì thị trường chưa lấy đủ TK → giá phải vượt qua IDM (lúc này DZ là SMT)
```
- Phải đợi: khai thác vùng POI nào đó bên dưới rồi mới vào
- Hoặc: giá rút râu đi lên (không chạm POI) → vào lệnh theo SCOB

---

#### FLIP ENTRY — XÁC SUẤT CAO NHẤT

> Flip entry là phần vào lệnh **cuối cùng** và **xác suất thành công cao nhất** trong tất cả các cách vào lệnh.
>
> Lý do: Thị trường đã được xác nhận chuyển từ cung sang cầu (hoặc ngược lại). Khi giá về khai thác DZ/SZ, xác suất thành công rất cao.

**Quy tắc khi giá chạm vùng DZ (Flip):**
- Phải xuống LTF (M15) để xác nhận
- Tìm CHOCH trong LTF → xác định OB → vào lệnh
- Cách xác nhận CHOCH uy tín nhất: xác định các OB trong M15

---

## 6. Retail Liquidity & Trendline Breakout

### 6.1 Retail Liquidity Là Gì?

Thanh khoản của các retail trader (nhỏ lẻ). Tập trung tại:
- Đỉnh/đáy rõ ràng
- Đường trendline phổ biến
- Vùng hỗ trợ/kháng cự

### 6.2 Liq Trendline (Trendline Thanh Khoản)

Đường trendline mà nhiều retail trader dùng để sell breakout. Khi giá breakout với **râu nến** (không đóng nến bên dưới):
- Retail trader sell → đây là bẫy
- Smart Money mua ngược chiều

**Quy tắc giao dịch:**
1. Sau khi phá IDM → đánh dấu OB để mua lên
2. Khi giá chạm trendline nhưng không về OB → trendline là hỗ trợ, tiếp tục mua
3. Khi thị trường lấy đủ TK ở IDM VÀ trendline → sẽ đi lên, không về OB nữa

> **Nguyên tắc quan trọng:** "Quan trọng nhất là liquidity và cấu trúc, không phải OB. Không phải lúc nào cũng phải vào lệnh tại OB."

---

## 7. Session Liquidity (Thanh Khoản Phiên)

### 7.1 Ba Phiên Giao Dịch

| Phiên | Đặc điểm | Giao dịch |
|-------|----------|-----------|
| **Á (Asian)** | Ít trader, volume thấp, biên độ hẹp | Không nên giao dịch chính |
| **Âu (London)** | Nhiều trader nhất, move mạnh | Phiên chính để giao dịch |
| **Mỹ (New York)** | Khối lượng cao nhất | Phiên chính để giao dịch |

### 7.2 Mối Liên Hệ Giữa 3 Phiên

- **Luôn luôn có ít nhất 1 phiên đi ngược xu hướng 2 phiên còn lại**
- Nếu phiên Á và Âu tăng → phiên Mỹ sẽ giảm
- Nếu phiên Á tăng và phiên London giảm → phiên New York tăng
- Dùng mối liên hệ này để **xác nhận bổ sung** khi không biết đó là CHOCH, BOS hay không

### 7.3 Cách Giao Dịch Theo Phiên

**TK tập trung ở đỉnh/đáy của các phiên:**
- Retail trader thường sell khi giá phá đỉnh phiên Á lúc London mở phiên
- Thực chất: Smart Money **lấy TK của phiên Á** → sau đó đảo chiều

**4 trường hợp tại London mở phiên:**

| Trường hợp | Hành động |
|-----------|-----------|
| Giá quét đáy phiên Á + rút râu lên → tạo IFC | Vào lệnh với SCOB/CHOCH/flip, TP tại đỉnh phiên Á |
| Giá phá đáy phiên Á nhưng không đóng nến bên dưới | Đây là IDM → đợi vượt IDM, vào lệnh tại POI bên dưới |
| Giá phá đỉnh phiên Á + rút râu xuống | Sell ngắn hạn, TP tại pullback gần nhất (không phải đáy phiên Á) |
| Giá chạm HTF POI → pullback đầu tiên | CHOCH → xác nhận đảo chiều → vào lệnh theo CHOCH |

### 7.4 Phiên Mỹ Quét Đỉnh Phiên Âu → Sell

**Quy trình:**
1. Phiên Á và Âu đều tăng → phiên Mỹ sẽ giảm
2. Phiên Mỹ quét TK đỉnh phiên Âu → hình thành SCOB
3. Dùng **M5 làm HTF**, **M1 làm LTF** (vì phiên ít nến)
4. Không vào lệnh trong M5 → xuống M1 tìm **OB M1 trong SCOB M5**
5. Khi giá chạm OB M1 → vào lệnh sell
6. TP tại đáy phiên Âu (vì 2 phiên trước tăng, phiên Mỹ giảm)

### 7.5 Phiên Mỹ Quét Đáy Phiên Âu → Buy

**Quy trình:**
1. Phiên Mỹ quét TK đáy phiên Âu → hình thành SCOB
2. Xuống LTF (M1) tìm OB M1 trong SCOB M5
3. Vào lệnh buy khi giá chạm OB M1
4. Sau khi có SCOB thứ 2 → có thể xuống M1 để vào thêm lệnh

### 7.6 Không Vào Lệnh Khi:

- Phiên Mỹ đóng nến bên dưới đáy phiên Âu → không vào sell ngay (giá có thể tiếp tục xuống)
- Phiên Âu quét đỉnh phiên Á nhưng không thể đẩy giá xuống → xem POI ẩn trong H4

### 7.7 Cách Xử Lý Lệnh Trước Khi Kết Thúc Phiên

**Nguyên tắc:**
- **Đóng lệnh trong ngày** khi kết thúc phiên
- Để lệnh qua ngày hôm sau rất nguy hiểm
- Nếu phiên Á và Âu đều tăng → phiên Mỹ giảm → thoát lệnh khi giá đến CHOCH (không phải TP ban đầu)

**Xử lý khi có nhiều POI:**
- Sau khi phá IDM → xác định 3 POI (POI 1, 2, 3)
- Xuống LTF → tránh được việc 2 lệnh bị SL cùng lúc
- Nếu không có POI M1 trong POI 2 M5 → chấp nhận miss lệnh

---

## 8. Quản Lý Lệnh

### 8.1 Stop Loss

| Trường hợp | Đặt SL ở đâu |
|-----------|-------------|
| Mua tại OB | Bên dưới đáy OB |
| Bán tại OB | Bên trên đỉnh OB |
| Muốn an toàn hơn | Bên trên nến đã quét TK của đỉnh/đáy trước |
| 2 POI gần nhau | Đặt SL bên dưới POI thứ 2 |
| Vào lệnh tại SCOB | SL bên trên OB lớn (nếu giá chạm OB mà bị fail = đảo chiều) |

### 8.2 Take Profit

| TP | Mức giá |
|---|---------|
| **TP 1** | Đỉnh/đáy pullback gần nhất (IDM) |
| **TP 2** | Đỉnh/đáy cũ (cấu trúc trước) |
| **TP chính** | Đỉnh/đáy của HTF |
| **Phiên giao dịch** | TP tại đỉnh/đáy phiên đối lập |

### 8.3 Nhồi Lệnh (Add Position)

**Điều kiện nhồi:**
- Giá về chạm SCOB thứ 2 trong vùng POI
- Còn trong phiên giao dịch (không nên nhồi sau khi ra khỏi phiên)
- Giá chưa đi quá xa khỏi POI

**SL khi nhồi:**
- SL lệnh mới = SL lệnh cũ (không thay đổi)
- Lệnh 1 be, lệnh 2 SL → kết quả = hòa vốn

### 8.4 Be (Break Even)

- Khi lệnh đã đạt TP 1 → dời SL về điểm vào lệnh (be)
- Lệnh sau bị SL → lệnh trước đã be → không lỗ

### 8.5 Vào Lệnh An Toàn Hơn vs Rủi Ro Hơn

| | An toàn hơn | Rủi ro hơn |
|--|------------|-----------|
| **Điều kiện** | Đợi SCOB thứ 2 xác nhận | Vào ngay khi giá chạm SCOB |
| **R:R** | Thấp hơn | Cao hơn |
| **Xác suất** | Cao hơn | Thấp hơn |
| **Khuyến nghị** | Người mới | Người có kinh nghiệm |

---

## 9. Thứ Tự Ưu Tiên Vào Lệnh

Từ xác suất **thấp → cao:**

```
1. OB thông thường (chạm OB vào ngay)
        ↓
2. CHOCH Entry (sau khi giá tạo CHOCH tại POI)
        ↓
3. FLIP Entry (vùng Supply/Demand đã flip)
   ← XÁC SUẤT CAO NHẤT →
```

**Lý do flip entry có xác suất cao nhất:**
- Thị trường đã được xác nhận chuyển từ cung sang cầu
- Giá chạm vùng đã được "chứng minh" bởi cấu trúc
- Tổ chức đã xác nhận hướng thông qua CHOCH

---

## 10. Checklist Trước Khi Vào Lệnh

### Phân tích HTF

- [ ] Xu hướng HTF là gì? BOS đã xác nhận chưa?
- [ ] POI HTF ở đâu? (Extreme POI hay Decisional POI?)
- [ ] Đây có phải là Flip Zone không?
- [ ] Có POI ẩn nào ở dưới không?

### Xác nhận IDM & Cấu Trúc

- [ ] IDM đã hình thành chưa?
- [ ] Giá đã vượt qua IDM chưa?
- [ ] CHOCH có cần IDM không? (đóng thân → cần; quét râu → không cần)

### Xác nhận Vào Lệnh (LTF)

- [ ] LTF có CHOCH xác nhận không?
- [ ] OB có IMB không? (không có IMB → không hợp lệ)
- [ ] Có SCOB hình thành không?
- [ ] Có phải OB Rút Râu không? (xác suất cao hơn)

### Quản Lý Lệnh

- [ ] SL đặt ở đâu? Hợp lý không?
- [ ] TP 1, TP 2, TP chính ở đâu?
- [ ] R:R có từ 1:2 trở lên không?
- [ ] Có nhồi lệnh không? Điều kiện nhồi đã đủ chưa?

### Session

- [ ] Đang ở phiên nào? (Á / Âu / Mỹ)
- [ ] Phiên trước đã quét đỉnh/đáy phiên kia chưa?
- [ ] 2 phiên trước đi cùng chiều → phiên này đi ngược?
- [ ] Có nên đóng lệnh trước khi kết thúc phiên không?

---

## PHỤ LỤC — CÁC THUẬT NGỮ

| Thuật ngữ | Tiếng Anh | Ý nghĩa |
|-----------|-----------|---------|
| BOS | Break of Structure | Phá vỡ cấu trúc → xác nhận xu hướng |
| CHOCH | Change of Character | Đảo chiều xu hướng |
| IDM | Inducement | Bẫy thanh khoản nhỏ trước move chính |
| IMB | Imbalance | Vùng mất cân bằng (khoảng trống nến) |
| OF | Order Flow | Dòng lệnh — retracement cuối trước move |
| OB | Order Block | Vùng lệnh — nến cuối trước move mạnh |
| IFC | Inverse Fair Candle | Nến IFC — râu dài quét IDM, thân đóng ngược |
| SMT | Smart Money Trap | Bẫy tổ chức để săn SL retail |
| SCOB | Single Candle OB | Nến đơn POI với điều kiện đặc biệt |
| HTF | Higher Time Frame | Khung thời gian lớn (H4, Daily) |
| LTF | Lower Time Frame | Khung thời gian nhỏ (M15, M5, M1) |
| POI | Point of Interest | Vùng điểm vào lệnh quan trọng |
| TK | Thanh Khoản | Liquidity |
| SZ | Supply Zone | Vùng cung (kháng cự, bán) |
| DZ | Demand Zone | Vùng cầu (hỗ trợ, mua) |
| SL | Stop Loss | Cắt lỗ |
| TP | Take Profit | Chốt lời |
| be | Break Even | Dời SL về điểm vào = hòa vốn |
| R:R | Risk:Reward | Tỷ lệ rủi ro:lợi nhuận |
| Ex POI | Extreme POI | POI cực kỳ gần đỉnh/đáy |
| Flip | Flip Entry | Vùng cung/cầu đổi vai trò |

---

## SƠ ĐỒ QUY TRÌNH GIAO DỊCH TỔNG QUÁT

```
[1] XÁC ĐỊNH XU HƯỚNG HTF
    BOS đã xác nhận? → Xu hướng tăng / giảm
              ↓
[2] XÁC ĐỊNH IDM
    Pullback đầu tiên sau BOS = IDM
    Đợi giá vượt IDM
              ↓
[3] XÁC ĐỊNH POI
    Extreme OB / Decisional OB / Flip Zone
    Có phải Flip entry không?
              ↓
[4] CHỜ GIÁ VỀ POI (HTF)
              ↓
[5] XUỐNG LTF TÌM XÁC NHẬN
    CHOCH (có/không IDM)?
    SCOB hình thành?
    Flip entry (SZ→DZ / DZ→SZ)?
              ↓
[6] VÀO LỆNH
    Đặt SL + TP
    Quản lý lệnh theo phiên
              ↓
[7] QUẢN LÝ
    TP1 → Be lệnh → đợi TP2
    Nhồi lệnh khi có SCOB thứ 2
    Đóng lệnh trước khi kết thúc phiên
```

---

*Tài liệu tổng hợp từ BankTrap SMC PDF — 149 trang*
*Phương pháp: SMC (Smart Money Concepts) — BankTrap System*
*Công cụ bổ trợ: MACD(13,21) để xác nhận thêm*
