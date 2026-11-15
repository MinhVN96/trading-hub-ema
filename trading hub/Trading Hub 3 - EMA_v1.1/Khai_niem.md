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
2. **Xác nhận** (điều kiện #1) — giá **đóng thân nến** vượt qua **mốc phá** (xem
   [[#Mốc phá]]). Lúc này mới vẽ hộp.
3. **Huỷ** — trước khi kịp xác nhận mà **râu** xuyên qua **biên giữ** → bỏ ứng viên. Đây là luật
   *"OF không hợp lệ"* của tài liệu: trong xu hướng giảm, nếu **trước khi** phá đáy mà giá lại
   phá đỉnh trước thì đáy đó không phải OF.
4. **Hết hạn** — quá `ofConfirmBars` nến mà chưa xác nhận → bỏ.
5. **Rời vùng** — có **cây nến đầu tiên nằm trọn bên ngoài** vùng (xem [[#Rời vùng]]).
6. **Khai thác (mitigated)** — **sau khi đã rời vùng**, giá quay lại **chạm vào trong** vùng
   nhưng chưa xuyên qua biên giữ → chuyển **xám**. **Vẫn nằm trên chart.** Mép phải dừng ở đâu
   tuỳ khung (xem [[#Khai thác]]).
7. **Xoá** — **râu** xuyên qua **biên giữ** → vùng hết hiệu lực, biến mất. Kể cả vùng đã xám.

**Lưu ý về hai tiêu chuẩn "phá"** — cố ý không đối xứng:
- **Xác nhận** dùng `close` (tài liệu đòi đóng nến vượt qua).
- **Huỷ / xoá** dùng **râu** (`low` / `high`), giống luật `Delete sweep zones` của POI.
  Bật `ofSweepClose` (*"Quet bien giu: doi DONG NEN"*) thì huỷ/xoá cũng phải **đóng cửa** vượt
  biên giữ. Ô này điều khiển **cả ba chỗ** cùng lúc: xoá vùng đã vẽ, huỷ ứng viên (mã `P`), và
  hai việc đó bên engine khung lớn. Mặc định **tắt**.

### Mốc phá

Mức giá mà nến phải **đóng thân vượt qua** thì ứng viên mới được xác nhận. Theo tài liệu trang 7
(*"Cách thức xác định BOS hợp lệ"*, ghi chú cuối trang):

> *"trường hợp giá **chưa đóng thân nến** qua đỉnh trước mà **chỉ quét râu nến** qua đỉnh trước,
> khi đó điểm cao nhất không phải là đỉnh trước mà là **điểm cao nhất của nến quét râu nến**, và
> chỉ khi nào sau đó có cây nến **đóng thân nến qua điểm cao nhất này** thì mới hình thành."*

- Ban đầu mốc phá = **biên xa** (đỉnh với OF-D, đáy với OF-S).
- Nến nào **râu** vượt mốc mà **không đóng** qua → mốc dời tới đỉnh râu (OF-D) / đáy râu (OF-S).
  Nhiều nến quét liên tiếp thì mốc chạy theo cực trị hiện tại.
- Hộp vẽ ra **vẫn là** `[biên giữ ; biên xa]`. Mốc phá chỉ quyết định **lúc nào** xác nhận.

Code: `ofCRef` (engine chính), `hcRef` (engine khung lớn).

### Rời vùng

> **Quy ước riêng của dự án — chặt hơn tài liệu** (chốt ngày 2026-10-06).

**Rời vùng = cây nến đầu tiên nằm TRỌN bên ngoài vùng.**

| | Điều kiện |
|---|---|
| OF-D | `low > đỉnh vùng` |
| OF-S | `high < đáy vùng` |

Nếu chính nến xác nhận đã nằm trọn ngoài vùng (ví dụ nhảy gap) thì tính là rời vùng luôn.

Tài liệu (trang 26 + 7) coi **nến đóng vượt biên xa** đã là phá ra. Dự án **không** lấy mốc đó:
nến xác nhận thường vẫn còn râu nằm trong vùng, và nến ngay sau nó rút râu lại là chuyện bình
thường của một cú phá. Tính đó là khai thác thì mất luôn một OF tiềm năng ngay khi nó vừa ra đời.
Ca thật: OF-S-395 trên ETHUSDT 15m, 02/10.

**Cái giá chấp nhận:** cú retest **sát ngay sau** nến phá mà râu vẫn chạm vùng sẽ **không** được
tính là khai thác. Ca thật: OF-D #1485 `[1565.19 ; 1604.00]` trên ETHUSDT 4H, nến retest có
`L 1597.25`. Đây là hệ quả của luật, **không phải bug**. Đừng đổi lại.

Code: `ofLeft` (engine chính), `hzAway` (engine khung lớn).

### Khai thác

Chỉ xét **sau khi đã rời vùng**. Trang 26: *"sau khi giá giảm xuống **khỏi** OF1 **và** đi lên
khai thác OF1"*.

Tài liệu không nói râu hay thân. Dự án chia theo khung (ranh giới: **1H thuộc nhóm dưới**):

| Khung | Râu chạm vào vùng | Thân nến (open **hoặc** close) nằm trong vùng |
|---|---|---|
| **≤ 1H** | xám **và** chốt mép phải | — (râu đã đủ) |
| **> 1H** | xám, mép phải **vẫn kéo dài** | chốt mép phải tại **lần đầu tiên** |

Lý do: một nến 4H là 16 nến 15m — cái râu của nó có thể là cả một nhịp giao dịch. Ở khung lớn
phải đợi thân nến mới chắc giá đã thật sự giao dịch bên trong vùng.

Code: `ofWickEnds` / `htfWickEnds`. Cờ `ofMit` = đã chạm (màu), `ofBody` = đã có thân (mép phải).

### OF gần trùng nhau

Hai OF cùng chiều mà đỉnh (hoặc đáy) chỉ lệch nhau vài điểm (ca thật: lệch 0.95 và 1.99) thì
**giữ cả hai, không gộp, không dung sai**. Trang 27 mục 1: *"OF nằm bên ngoài OF trước — B, C đều
là OF hợp lệ"* — nhô ra một chút vẫn là OF riêng.

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

## Điều kiện #2 và luật thu hẹp (vùng lồng nhau)

> ⚠ Mục này **thay thế "Luật tuổi"** cũ (*"vùng trẻ nằm trong vùng già → vùng già chết"*).
> Luật tuổi đã bỏ vì nó làm **ngược** điều kiện #2 của tài liệu.

Tài liệu có **hai luật** về vùng lồng nhau, đọc vội thì tưởng trái ngược:

1. **Điều kiện #2** (trang 26): *"OF2 không phải là OF hợp lệ … vì nằm trong OF1"* → vùng
   **trong** bị loại, vùng **ngoài** sống.
2. **Luật thu hẹp** (trang 26 hình c→b, trang 27 mục 2, trang 29): *"OF nằm ở pullback **nhỏ cuối
   cùng** của pullback lớn"*, *"tốt nhất nên thu gọn OF lại"* → vùng **trong** sống, vùng **ngoài**
   chỉ là bản vẽ rộng tay.

Phân biệt bằng một câu hỏi: **giữa hai chân hồi đã có một nhịp tiếp diễn trọn vẹn chưa?** —
tức vùng ngoài đã **xác nhận xong** trước khi chân hồi của vùng trong hình thành chưa.

Kiểm tra ngay lúc ứng viên xác nhận (`ofNestVerdict`), chỉ xét vùng **cùng chiều**, chỉ xét
**khoảng giá** (bề ngang hộp không tham gia), xét **mọi** vùng kể cả vùng đã xám:

| Tình huống | Mã | Kết quả |
|---|---|---|
| Ứng viên nằm trọn trong vùng cũ, **sát cực trị** của nó (OF-D: sát đáy; OF-S: sát đỉnh) | `W` | **vẽ** ứng viên, **dọn** vùng rộng — đây là bản thu hẹp |
| Ứng viên nằm trọn trong vùng cũ, ở giữa, vùng cũ **đã xác nhận trước** chân hồi của ứng viên | `N` | **loại** ứng viên — hai OF riêng biệt, điều kiện #2 |
| Ứng viên **nuốt trọn** một vùng có mép trái muộn hơn | `T` | **loại** ứng viên — nó là bản rộng của nhịp hồi đã có bản hẹp |
| Chồng lấn **một phần**, nhô ra dù chỉ một chút | — | **cả hai sống** (trang 27 mục 1) |

"Sát cực trị" = nằm trong `ofShrinkEdge` (mặc định 0.35) phần chiều cao của vùng rộng, tính từ
biên cực trị. Đặt 0 = tắt luật thu hẹp.

Ứng viên bị loại ở đây là **mất hẳn**, không "sống lại" khi vùng bao ngoài chết — đúng ý tài
liệu: nó **chưa bao giờ** là OF hợp lệ.

Code: `ofNestVerdict`, `atShrinkEdge`, `shrinkWideOF` (engine chính) và `htfNestVerdict`,
`htfShrinkWide` (engine khung lớn).

**Các lỗi đã từng mắc ở đúng chỗ này** — ghi lại để không lặp:

1. Quyết định bằng **kích thước** (*"luôn giữ vùng nhỏ hơn"*): một chân hồi to vừa xác nhận
   bao trọn đám OF vụn cũ trong dải đó → **bị loại thẳng**. Hệ quả: OF 2 và OF 3 trên
   BTCUSDT 4H không bao giờ được vẽ.
2. Luật tuổi nhưng **đo bằng thứ tự ra đời**, chạy cả hai chiều: vùng to bao trùm một OF hợp lệ
   đang sống → xoá mất OF đó, rồi chính vùng to lại bị quét chết → **mất sạch cả hai**.
   Hệ quả: OF 1 đang vẽ đúng bỗng biến mất.
3. Luật tuổi đo bằng thứ tự ra đời, chỉ **một chiều lồng**: OF 4 già nhưng ra đời **sau** OF 5,
   nên lúc nó được tạo nó đang *bao* OF 5 → nhánh đó không làm gì → OF 4 già vẫn nằm lại.
4. Toàn bộ "luật tuổi" (giết vùng **già** bên ngoài, giữ vùng **trẻ** bên trong): làm **ngược**
   điều kiện #2 — giữ cái ngoáy nhỏ và vứt cả nhịp hồi thật. Đã thay bằng bảng ở trên.

---

## Vùng tuyến đầu — ĐÃ BỎ

Từng là quy ước: vùng gần giá nhất (OF-D đỉnh cao nhất / OF-S đáy thấp nhất) được **giữ màu** dù
đã bị khai thác. **Đã bỏ** (khối `A2` trong code), vì tài liệu trang 42 nói thẳng: *"Khi giá quay
về khai thác OB2 **không nên** SELL vì ở trên còn có OB1 chưa bị khai thác"* — vùng đã tiêu không
phải là đích, kể cả khi nó nằm gần giá nhất.

Giờ màu chỉ trả lời **một** câu hỏi: **đã bị khai thác chưa**. Màu = còn hiệu lực, xám = đã tiêu.

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

## OF khung lớn (HTF) vẽ lên khung nhỏ

Vẽ OF của khung lớn (mặc định **4H**, ô `Khung lon lay OF`) lên chart đang xem (vd 15m) để làm
POI khung lớn. Tự **tắt** khi khung đang xem ≥ khung đã chọn.

- **Màu riêng**: OF-D xanh lá `#00C853`, OF-S vàng `#FFD600`, viền **nét đứt**. Nhãn có tiền tố
  khung, vd `240 OF-D`.
- **Engine thứ hai**: Pine không cho mảng/hộp đi qua `request.security`, nên script chạy một bản
  **sao** của engine OF, nuôi bằng nến 4H **đã đóng** (`[1]` + `lookahead_on`). Mọi thứ của nó mang
  tiền tố `h*` (`hzTop`, `hcRef`, …). **Sửa luật OF thì phải sửa cả hai chỗ.**
- Engine chỉ chạy **một nhịp** mỗi khi một nến 4H vừa đóng (`newH`).
- Mọi luật (mốc phá, rời vùng, khai thác, điều kiện #2, thu hẹp) **giống hệt** engine chính. Ngưỡng
  râu/thân đo theo **khung lớn**: 4H > 1H nên phải có **thân nến 4H** trong vùng.
- Vùng bị khai thác **không xoá hồ sơ** — hồ sơ ở lại để vẫn loại được ứng viên nằm trong nó (mã
  `N`), giống vùng xám bên chart 4H. Chỉ **quét qua biên giữ** hoặc **quá tuổi** mới xoá hẳn.

### Luật hiển thị vùng khung lớn

Một vùng 4H **hiện** khi thoả **cả hai**:

1. **Còn hàng** — một trong hai:
   - vùng 4H **chưa bị khai thác** (bất kể OF 15m bên trong đã bị khai thác hết hay chưa); **hoặc**
   - vùng 4H đã bị khai thác nhưng **được cứu**: bên trong còn ít nhất một OF 15m thoả **cả bốn**:
     - **cùng chiều** (OF-D trong OF-D, OF-S trong OF-S);
     - **chưa bị khai thác**;
     - **đã tồn tại TRƯỚC** lúc vùng 4H bị khai thác (so nến xác nhận của OF 15m với `hzMitBar`).
       OF 15m sinh ra trong chính nhịp khai thác là cấu trúc mới, không phải "hàng còn sót";
     - **nằm trong**: nằm trọn, **hoặc** chỉ nhô ra ở **biên gần** — biên trên với OF-D, biên dưới
       với OF-S. Nhô ra biên xa (đáy OF-D / đỉnh OF-S) thì **không** tính.
2. **Qua hạn ngạch** — nằm trong top `htfOFMax` (mặc định 3) vùng **còn hàng** gần giá nhất mỗi chiều.

### Bốn trạng thái của vùng khung lớn

| Trạng thái | Nghĩa |
|---|---|
| `CON NGUYEN` | chưa bị khai thác → hiện |
| `duoc CUU` | đã khai thác, nhưng bên trong còn OF 15m hợp lệ → hiện |
| `TAM AN` | đã khai thác, **chưa từng** có OF 15m hợp lệ bên trong → ẩn, **chưa** chốt chết |
| `CHET HAN` | **từng** có OF 15m hợp lệ bên trong, giờ hết → ẩn **vĩnh viễn** |

**Chết là vĩnh viễn**: vùng đã `CHET HAN` thì sau này có OF 15m mới mọc trong đó cũng **không**
sống lại.

`TAM AN` tồn tại vì một lý do kỹ thuật: engine 4H chỉ phát hiện khai thác ở **cuối** nến 4H, lúc
16 nến 15m đã chạy xong và có thể đã làm xám hết các OF 15m bên trong. Nếu đọc "tập rỗng" lúc đó
thành "đã khai thác hết" thì vùng chết oan. Cờ `hzSeen` phân biệt "chưa từng có" với "từng có,
giờ hết".

Code: khối `(D1)`–`(D5)`, `htfHasLiveInner`, các cờ `hzMit` / `hzMitBar` / `hzSeen` / `hzDead`.

---

## Bia mộ debug (mã lý do)

Bật `DEBUG - Bia mo vung OF bi loai / bi xoa`. Mỗi vùng/ứng viên chết để lại một nhãn nhỏ tại
mép trái, ghi **chiều** (`D`/`S`) và **mã lý do**. Vùng của engine khung lớn có thêm tiền tố `4H`.

**Ứng viên bị huỷ** (chữ cam), dạng `D P2 >61130` = Demand, chết vì `P` ở nến thứ 2, biên xa 61130:

| Mã | Nghĩa |
|---|---|
| `P` | phá nhầm — râu xuyên biên giữ trước khi kịp xác nhận |
| `H` | hết hạn — quá `ofConfirmBars` nến chưa xác nhận |
| `N` | nằm trọn trong một OF cùng chiều đã xác nhận trước đó (điều kiện #2) |
| `T` | nó là bản vẽ rộng của một nhịp hồi đã có bản hẹp |

**Vùng đã vẽ bị xoá** (chữ đỏ), dạng `D!Q`:

| Mã | Nghĩa |
|---|---|
| `Q` | bị quét — râu (hoặc đóng cửa nếu bật `ofSweepClose`) xuyên biên giữ |
| `K` | chạm nắp cứng `OF_HARD_CAP` |
| `V` | pivot mới phủ nhận vùng (chỉ khi bật `ofInvalidPivot`) |
| `W` | vùng rộng nhường chỗ cho bản thu hẹp |

Nhãn dùng chung quota **500 label** của TradingView. Dùng hai ô `Chi hien chieu` / `ly do` để chỉ
vẽ đúng loại đang truy vết.

Các công cụ debug khác: `Tooltip chi tiet` (rê chuột vào nhãn OF; bật lên thì nhãn in thêm
`đỉnh/đáy`), `Bang soi tung vung` (từng vùng xếp theo khoảng cách tới giá, kèm khối vùng khung
lớn bên dưới), `Nhat ky su kien`, `Ve UNG VIEN OF dang cho` (hộp ma viền đứt). Bật **bất kỳ** công
cụ debug nào thì engine chính vẽ ra **hết** vùng trong bộ nhớ; vùng đáng lẽ bị ẩn mang dấu `!`.

---

## Bảng đếm vùng (debug)

Bật/tắt bằng `DEBUG - Bang dem vung`. Cột `D` = Demand, `S` = Supply. Dùng để biết vùng bị mất
ở **khâu nào** thay vì đoán:

| Dòng | Nghĩa | Đọc thế nào |
|---|---|---|
| `ung vien sinh` | chân hồi được nhận làm ứng viên | = 0 → hỏng ở engine pullback |
| `-> ve box` | ứng viên xác nhận thành công, đã vẽ hộp | |
| `huy: pha nham` | mã `P` | chiếm phần lớn → điều kiện #1 quá xa |
| `huy: trong OF truoc` | mã `N` | |
| `huy: ban rong (c->b)` | mã `T` | |
| `huy: het han` | mã `H` | nhiều → tăng `ofConfirmBars` |
| `xoa: bi quet` | mã `Q` | |
| `xoa: pivot (V)` | mã `V` | |
| `xoa: nap cung (K)` | mã `K` | |
| `xoa: nhuong ban hep (W)` | mã `W` | |
| `an: ngach` | **trạng thái hiện tại**, không phải sự kiện: số vùng đang bị hạn ngạch ẩn | |
| `kiem tra` | phải bằng **0** | khác 0 → còn một đường xoá chưa được đếm, đừng tin các dòng khác |

Bên dưới là **phễu của engine khung lớn**, đọc giống hệt, cộng thêm: `danh dau da khai thac`,
`ho so / con hang`, `chet han D/S`, `engine bat?` (kèm số ứng viên đang chờ), `trong do: duoc cuu`.
