# Từ điển khái niệm — Trading Hub 3 v1.1 LuxAlgo

Sổ ghi nhớ các khái niệm dùng chung khi nói chuyện về indicator này.
Mục đích: **thống nhất cách gọi** để không phải giải thích lại mỗi lần, và để tra ngược ra
đúng chỗ trong code.

Nguồn định nghĩa gốc: `Document/857464368-banktrap-SMC.pdf` (BankTrap SMC).
Chỗ nào là quy ước riêng của dự án (không có trong tài liệu) đều được ghi rõ.

---

## Pullback

Điểm đảo chiều của engine zigzag chạy ở **độ phân giải 1 nến**.

Cách nó chạy (`#region Pullback`): mỗi nến được xếp vào một trong ba trạng thái — `uptrend`
(đỉnh cao hơn **và** đáy cao hơn nến trước), `downtrend` (đỉnh thấp hơn **và** đáy thấp hơn),
`notrend` (nến bao trùm). Mỗi lần trạng thái đổi chiều thì chốt một pivot: đỉnh vào `puHigh`,
đáy vào `puLow`.

**Cần nhớ:** đây là zigzag *thô nhất có thể*. Một cái ngoáy 2-3 nến cũng sinh ra một cặp pivot.
Trên BTCUSDT 4H nó đẻ ~670 chân hồi cho ~1100 nến. Mọi thứ xây trên pullback đều phải tính
đến mật độ này.

Pullback nuôi hai thứ: **IDM** và **Order Flow**. Nó *không* nuôi CHoCH/BOS — hai cái đó dùng
engine fractal riêng (`swings(chochLen)`).

### Nến nằm lọt trong nến trước = "không tồn tại"

Nến có đỉnh thấp hơn **và** đáy cao hơn nến tham chiếu thì **không khớp nhánh nào** trong ba
nhánh của engine → `top`/`bot` giữ nguyên, không sinh pivot nào.

Đây **đúng theo tài liệu** (trang 2, *"Cách xác định pullback hợp lệ"*):

> *"Nếu giá không phá qua đỉnh hoặc đáy cây nến trước đó mà chỉ di chuyển trong khoảng giữa
> đỉnh và đáy của cây nến trước đó thì đó không phải là pullback hợp lệ."*
>
> *"A, N và 2 cây nến tiếp theo đều nằm trong H ⇒ 4 nến này được xem như **không tồn tại**
> mà chỉ xét cây nến phá qua đỉnh/đáy của H."*

### ⚠ Hệ quả: vùng mù sau một nến biên độ lớn

Một cây nến biên độ rất lớn trở thành nến tham chiếu. Nếu sau đó giá đi ngang **bên trong**
biên độ đó, engine **đứng hình** cho tới khi có nến phá ra ngoài — có thể kéo dài hàng trăm nến.

Ca thật (BTCUSDT 4H, 10/10 → 21/11): một nến 4H rơi ~8.000 điểm, rồi giá đi ngang trong biên
độ đó suốt hơn một tháng. Engine **không ghi một pivot đỉnh nào** trong cả giai đoạn. Dấu vết:
một ứng viên OF-D duy nhất `D H31 >122504.1` — mép trái 10/10, đáy 21/11, cao 24.600 điểm.

Tài liệu viết luật này cho tình huống **cục bộ vài nến** (trang 1 ghi rõ *"nến bao trùm phải là
nến ngay sau nến đang xem xét"*), không lường tình huống 180 nến. Nhưng áp nguyên văn thì ra
như vậy.

**Trạng thái: đã biết, cố ý giữ nguyên** (chốt ngày 2026-08-22). Nếu sau này muốn chữa: đặt hạn
dùng cho nến tham chiếu — qua N nến (~10-20 trên 4H) mà không ai phá đỉnh/đáy của nó thì ép
reset về nến hiện tại. Đó là **cố ý lệch khỏi tài liệu**, cần chốt lại trước khi làm.

---

## Swing point (HH / HL / LH / LL)

Đỉnh/đáy do engine fractal **LuxAlgo** xác nhận sau `chochLen` nến — thô hơn pullback rất nhiều.

| Nhãn | Nghĩa |
|---|---|
| `HH` | Higher High — đỉnh cao hơn đỉnh trước |
| `LH` | Lower High — đỉnh thấp hơn đỉnh trước |
| `HL` | Higher Low — đáy cao hơn đáy trước |
| `LL` | Lower Low — đáy thấp hơn đáy trước |

`chochLen` đổi theo khung: **15m dùng 50**, **4H dùng 15**. Ép 50 lên 4H thì thành ~8,3 ngày,
cấu trúc gần như không đổi chiều. Xem `chochLen15` / `chochLen4h`.

---

## CHoCH / BOS

**Một sự kiện duy nhất**, tên do bias quyết định — đúng công thức SMC chuẩn của LuxAlgo:

```
tag = bias == BEARISH ? CHoCH : BOS
```

Mốc **luôn** là một điểm swing có nhãn: phá lên thì mốc là `chTop` (HH hoặc LH), phá xuống thì
mốc là `chBtm` (LL hoặc HL). Xác nhận bằng **đóng nến**.

- **BOS** — phá **thuận** chiều bias hiện tại → xu hướng tiếp diễn. Nét **liền**.
- **CHoCH** — phá **ngược** chiều bias → đổi cấu trúc. Nét **đứt**.

Cùng một mốc giá sẽ mang tên khác nhau tùy bias lúc bị phá.

---

## IDM (Inducement)

Cái bẫy thanh khoản: mốc mà giá phải quay lại **quét** trước khi đi tiếp.

Theo BankTrap (trang 3, 4, 9): IDM là **pullback đầu tiên sau khi có BOS**. Từ đỉnh cao nhất
gióng sang trái, gặp pullback đầu tiên — đó là IDM.

Quy ước cài đặt trong dự án:

- Chỉ **BOS** mới sinh IDM. CHoCH thì không.
- Mốc được xác định **một lần** tại nến đóng BOS, rồi **không bao giờ dời**. Nếu cho dời theo
  đỉnh/đáy mới thì mốc bị kéo dần về các pullback vi mô sát đáy và mốc đúng ban đầu biến mất.
- Xác nhận quét bằng **râu nến**, không cần đóng nến (trang 3).
- Mốc chưa bị quét thì đường tự kéo dài tới nến hiện tại; bị quét rồi thì nét vẽ đứng lại
  tại nến quét.

---

## Order Flow (OF)

> "Order flow là chuyển động hồi **cuối cùng** trước khi tiếp diễn xu hướng." — BankTrap, phần 4

Vùng OF = **trọn chân hồi**, tức khoảng giá giữa **hai pivot pullback liên tiếp**.
Khác hẳn POI/OB (1 cây nến). Tài liệu ghi rõ: **IMB không tham gia vào việc hình thành OF**.

| | Ký hiệu | Là gì | Biên **xa** (xác nhận) | Biên **giữ** (huỷ/xoá) |
|---|---|---|---|---|
| Demand | `OF-D` | chân hồi **xuống** trước khi giá đi tiếp **lên** | đỉnh vùng | đáy vùng |
| Supply | `OF-S` | chân hồi **lên** trước khi giá đi tiếp **xuống** | đáy vùng | đỉnh vùng |

**Không đoán chiều lúc tạo vùng.** Một OF-S hoàn toàn có thể mọc trong nhịp tăng và vẫn đúng,
chừng nào giá chưa phá biên giữ của nó. Chiều được quyết định ở khâu **xác nhận** (phá biên nào
trước) và khâu **xoá**, không phải khâu tạo.

### Vòng đời một vùng OF

1. **Ứng viên** — chân hồi vừa chốt, chưa vẽ gì.
2. **Xác nhận** (điều kiện #1) — giá **đóng nến** vượt qua **biên xa**. Lúc này mới vẽ hộp.
3. **Huỷ** — trước khi kịp xác nhận mà **râu** xuyên qua **biên giữ** → bỏ ứng viên. Đây là luật
   *"OF không hợp lệ"* của tài liệu: trong xu hướng giảm, nếu **trước khi** phá đáy mà giá lại
   phá đỉnh trước thì đáy đó không phải OF.
4. **Hết hạn** — quá `ofConfirmBars` nến mà chưa xác nhận → bỏ.
5. **Khai thác (mitigated)** — giá quay lại **chạm vào trong** vùng nhưng chưa xuyên qua biên giữ
   → chuyển **xám**, mép phải dừng ở lần chạm cuối. **Vẫn nằm trên chart.**
6. **Xoá** — **râu** xuyên qua **biên giữ** → vùng hết hiệu lực, biến mất. Kể cả vùng đã xám.

**Lưu ý về hai tiêu chuẩn "phá"** — cố ý không đối xứng:
- **Xác nhận** dùng `close` (tài liệu đòi đóng nến vượt qua).
- **Huỷ / xoá** dùng **râu** (`low` / `high`), giống luật `Delete sweep zones` của POI.

> ### ⚠ Cùng một cây nến vừa xác nhận vừa phá nhầm → HUỶ thắng
>
> Một cây nến lớn có thể **vừa râu vượt biên giữ vừa đóng cửa ngoài biên xa**. Khi đó
> **huỷ thắng**, không vẽ vùng. Hai lý do:
>
> 1. **Luật tài liệu** — đỉnh nhịp hồi đã bị vượt thì nó không còn là nhịp hồi, chân đó
>    không phải OF.
> 2. **Nhất quán nội bộ** — đúng cây nến đó sẽ **xoá** một vùng đã vẽ (khối A dùng `high > t`).
>    Không thể vừa đủ sức giết vùng cũ vừa được phép sinh vùng mới.
>
> Nặng hơn nữa: khối (A) chỉ soi từ nến **sau** nến tạo vùng, nên nếu cho vẽ thì cái râu vi phạm
> đó **không bao giờ được kiểm tra lại** — vùng sinh ra đã sai sẵn và sống mãi.
>
> Ca thật (BTCUSDT 4H, 10/10): một nến đỏ lớn râu vượt đỉnh nhịp hồi rồi đóng cửa dưới đáy,
> vẫn sinh ra một OF-S đáng lẽ vô hiệu.

---

## Tuổi của OF — OF già / OF trẻ

**Tuổi = số nến đếm ngược từ nến hiện tại về tới cây nến ở MÉP TRÁI của vùng**, tức cây nến
pullback đã sinh ra vùng đó — chính là cây có **mũi tên** của option `Show pullback`
(OF-D: mũi tên đỏ trỏ xuống; OF-S: mũi tên xanh trỏ lên).

- **OF trẻ** — tuổi nhỏ, mép trái gần hiện tại.
- **OF già** — tuổi lớn, mép trái nằm xa về quá khứ.

Tuổi được hiển thị ngay sau nhãn: `OF-D-17` nghĩa là vùng Demand 17 tuổi (17 nến).

> ### ⚠ Tuổi ≠ thứ tự ra đời
>
> Vùng được **vẽ lùi** về bar pullback, nhưng chỉ **ra đời** lúc giá phá biên xa. Vùng càng
> **rộng** thì biên xa càng xa ⇒ xác nhận càng **muộn**. Nên một vùng già hoàn toàn có thể
> ra đời **sau** một vùng trẻ.
>
> Ví dụ thật (BTCUSDT 4H):
>
> | | Mép trái (tuổi) | Bề rộng | Xác nhận |
> |---|---|---|---|
> | OF 4 | 14/8 — **già** | 62.620–63.700 | 19/8 — **sau** |
> | OF 5 | 17/8 — trẻ | 62.780–63.430 | 18/8 — trước |
>
> Mọi so sánh già/trẻ **phải đọc mép trái**, tuyệt đối không dùng thứ tự push vào mảng.

---

## OF biên rộng (OF lớn)

Một OF **già** mà sau đó giá đã đi vào lại chính vùng đó và để lại các OF **trẻ** nằm **hoàn toàn
bên trong** nó.

Lúc ấy nó không còn là một mất cân bằng nữa — nó chỉ còn là **bề rộng của cái range**, không có
giá trị vào lệnh.

---

## Luật tuổi (điều kiện #2)

> Vùng OF **trẻ** vừa xác nhận nằm **hoàn toàn bên trong** một vùng **già** cùng chiều
> → vùng **già chết** (nó chính là OF biên rộng), vùng **trẻ sống**.

Tiêu chí là **tuổi đo bằng mép trái**, **không phải kích thước**, và **không phải thứ tự ra đời**.
Xét **cả hai chiều lồng**, ai có mép trái **sớm hơn** thì chết:

| Tình huống | Kết quả |
|---|---|
| Lồng nhau, vùng mới **trẻ** hơn | xoá vùng cũ, vẽ vùng mới |
| Lồng nhau, vùng mới **già** hơn | **không vẽ** vùng mới, giữ vùng cũ |
| Chồng lấn **một phần** | **cả hai đều sống** |

Chồng lấn một phần được tài liệu nói rõ: *"OF6 có một phần ở trên OF3 và một phần ở dưới OF4
⇒ không nằm trong OF3, OF4 ⇒ hợp lệ."*

**Ba lỗi đã từng mắc ở đúng chỗ này** — ghi lại để không lặp:

1. Quyết định bằng **kích thước** (*"luôn giữ vùng nhỏ hơn"*): một chân hồi to vừa xác nhận
   bao trọn đám OF vụn cũ trong dải đó → **bị loại thẳng**. Hệ quả: OF 2 và OF 3 trên
   BTCUSDT 4H không bao giờ được vẽ.
2. Luật tuổi nhưng **đo bằng thứ tự ra đời**, chạy cả hai chiều: vùng to bao trùm một OF hợp lệ
   đang sống → xoá mất OF đó, rồi chính vùng to lại bị quét chết → **mất sạch cả hai**.
   Hệ quả: OF 1 đang vẽ đúng bỗng biến mất.
3. Luật tuổi đo bằng thứ tự ra đời, chỉ **một chiều lồng**: OF 4 già nhưng ra đời **sau** OF 5,
   nên lúc nó được tạo nó đang *bao* OF 5 → nhánh đó không làm gì → OF 4 già vẫn nằm lại.

---

## Vùng tuyến đầu

Vùng mà giá sẽ gặp **trước tiên** nếu quay đầu lại. Quy ước riêng của dự án, không có trong
tài liệu — dùng để chọn vùng nào được **sáng màu**, vùng nào nằm chờ ở dạng xám.

- OF-D: vùng có **đỉnh cao nhất**
- OF-S: vùng có **đáy thấp nhất**

Vùng chưa từng bị chạm thì luôn sáng màu. Vùng đã bị khai thác chỉ sáng nếu nó đang ở tuyến đầu.

---

## POI / Order Block

Khác hẳn OF: **1 vùng = 1 cây nến**, từ đỉnh râu tới đáy râu, và **bắt buộc phải có imbalance**
(khoảng trống giá) thì mới xác nhận.

Chi tiết đầy đủ ở `POI_Logic.md`. Ở đây chỉ cần nhớ **hai điểm khác biệt** so với OF:

| | OF | POI / OB |
|---|---|---|
| Bề rộng vùng | trọn chân hồi (2 pivot) | 1 cây nến |
| Imbalance | **không tham gia** | **bắt buộc** |

Cách **vẽ** (kéo dài sang phải, xám khi bị khai thác, xoá khi bị xuyên qua, hạn ngạch riêng cho
nhóm sống và nhóm xám) thì OF **mượn nguyên** của POI.

---

## SCOB

Single Candle Order Block — nến quét đỉnh/đáy rồi đóng ngược lại ngay trong vùng POI.
Được thể hiện bằng **màu nến** (`barcolor`), không vẽ hộp.

---

## Hạn ngạch (quota)

Giới hạn số vùng hiển thị, **đếm riêng hai nhóm** cho mỗi chiều:

- **sống** — chưa bị chạm, còn kéo dài sang phải (`maxOFShow` / `maxPOIShow`)
- **xám** — đã bị khai thác (`maxOFMit` / `maxPOIMit`)

Tách hai nhóm để một đám vùng xám không đẩy mất các vùng còn sống.

### "5 vùng" nghĩa là 5 vùng GẦN GIÁ NHẤT

Đứng ở giá hiện tại mà đối chiếu ra hai phía:

- **xuống dưới** → nhặt các **OF-D** cho tới khi đủ 5
- **lên trên** → nhặt các **OF-S** cho tới khi đủ 5

Khoảng cách đo từ giá đóng cửa tới mép gần nhất của vùng; giá đang nằm trong vùng thì
khoảng cách = 0.

> ### ⚠ Hạn ngạch chỉ ẨN, tuyệt đối không XOÁ
>
> Vùng vượt ngưỡng bị **ẩn đi nhưng vẫn nằm trong bộ nhớ**. Khi các vùng gần giá hơn chết đi,
> nó **tự động hiện lại**.
>
> Nếu xoá hẳn thì một vùng bị đẩy khỏi top 5 sẽ mất **vĩnh viễn**, kể cả khi sau đó chỉ còn
> 2 vùng. Đây chính là thứ đã làm bay OF 2 và OF 3 trên BTCUSDT 4H — bia mộ `D!K`: chúng được
> vẽ đúng, nhưng hồi đầu tháng 7 có lúc 6 vùng OF-D cùng sống, chúng rớt khỏi top 5 và bị xoá,
> rồi không bao giờ quay lại.
>
> Việc xoá thật chỉ còn ở `OF_HARD_CAP` (30 vùng mỗi chiều) — nắp cứng chống tràn bộ nhớ và
> quota 500 box của TradingView, đặt rất rộng nên gần như không chạm tới.

> **Không phải "5 vùng mới nhất".** Vùng càng rộng thì biên xa càng xa nên xác nhận càng muộn
> ⇒ vùng hẹp vào mảng trước, vùng rộng vào sau. Nếu xoá theo thứ tự vào mảng thì một OF hợp lệ
> nằm ngay sát giá nhưng xác nhận sớm sẽ đứng đầu hàng và là kẻ **đầu tiên bị đuổi** — đúng cái
> vùng đang có giá trị nhất. Đây là cùng một lỗi với [[#Tuổi ≠ thứ tự ra đời]].


> Quota này khác với quota **500 line / 500 label / 500 box** của TradingView. Nếu thấy đường
> cấu trúc biến mất mà nhãn chữ vẫn còn thì đó là hết quota của nền tảng, không phải lỗi vẽ.

---

## Bảng đếm vùng (debug)

Bật/tắt bằng `Bang dem vung (debug)`. Cột `D` = Demand, `S` = Supply. Dùng để biết vùng bị mất
ở **khâu nào** thay vì đoán:

| Dòng | Nghĩa | Đọc thế nào |
|---|---|---|
| `ung vien sinh` | chân hồi được nhận làm ứng viên | = 0 → hỏng ở engine pullback |
| `-> ve box` | ứng viên xác nhận thành công, đã vẽ hộp | |
| `huy: pha nham` | râu xuyên biên giữ trước khi kịp xác nhận | chiếm phần lớn → điều kiện #1 quá xa |
| `huy: het han` | quá `ofConfirmBars` nến | nhiều → tăng `ofConfirmBars` |
| `xoa: bi quet` | hộp đã vẽ, sau đó bị râu xuyên biên giữ | |
| `xoa: gia bi don` | hộp bị dọn theo **luật tuổi** | |

Hiệu số giữa `-> ve box` và tổng các dòng xoá mà vẫn lớn hơn số vùng đang hiển thị thì phần
chênh đó đã bị **hạn ngạch** cắt.
