# Logic vẽ vùng Demand / Supply (POI) — Trading_Hub_3_v1.1

Tài liệu giải thích cách indicator xác định và vẽ các vùng POI (Point of Interest), viết cho người không đọc code.
Nguồn: `Trading_Hub_3_v1.1.pine`.

---

## 1. Một vùng POI được vẽ ra như thế nào

Code chạy như một **máy 2 trạng thái**, luôn chỉ theo dõi **một ứng viên tại một thời điểm**
(`Trading_Hub_3_v1.1.pine` L509-548 — biến `isSweepOBS` cho Supply, `isSweepOBD` cho Demand).

Dưới đây mô tả vùng **Supply**. Vùng **Demand** hoạt động đối xứng ngược lại hoàn toàn.

### Bước 1 — Tìm "nến mồi": một đỉnh swing 3 nến

Máy dò tìm cây nến có đỉnh **cao hơn cả nến liền trước và nến liền sau**:

```
        ┃
       ┃█┃  ← nến này: đỉnh cao hơn 2 nến hai bên  →  trở thành ứng viên
    ┃  ┃█┃  ┃
```

Tìm được → chuyển sang Bước 2 và **ngừng nhận ứng viên mới** cho tới khi xử lý xong ứng viên hiện tại.

> Demand: tìm nến có đáy **thấp hơn** cả nến liền trước và nến liền sau.

### Bước 2 — Chờ có "khoảng trống" (imbalance / FVG)

Máy kiểm tra: **đáy của nến ứng viên có nằm cao hơn hẳn đỉnh của cây nến cách nó 2 nến hay không**:

```
   ┃█┃  ← nến ứng viên C
   ─┸─  đáy nến C ..............
                                 ▲
                                 │ khoảng trống — giá rơi mạnh, không nến nào lấp
            ┏━┓                  ▼
   nến C+2  ┃█┃ đỉnh ...........
```

- **Có khoảng trống** → xác nhận, vẽ vùng ngay (Bước 3).
- **Chưa có** → ứng viên **trượt sang phải 1 nến** rồi kiểm tra lại, lặp mãi cho tới khi gặp khoảng trống.
  **Không có giới hạn thời gian chờ.**

→ Đây là lý do vùng vẽ ra **thường không nằm đúng ngay cây nến đỉnh**, mà lệch sang phải vài nến —
nó nằm ở cây nến **bắt đầu cú rơi**.

> Demand: kiểm tra đỉnh nến ứng viên có nằm **thấp hơn** đáy cây nến cách nó 2 nến hay không.

### Bước 3 — Vẽ hộp

| Cạnh hộp | Lấy từ đâu |
|---|---|
| Cạnh trên | **Đỉnh** (kể cả râu) của **duy nhất 1 cây nến** ứng viên |
| Cạnh dưới | **Đáy** (kể cả râu) của chính cây nến đó |
| Cạnh trái | Đúng cây nến đó (lùi về quá khứ ~2-3 nến so với lúc hộp xuất hiện) |
| Cạnh phải | Kéo dài vô tận sang phải |

**Tóm lại: 1 vùng = 1 cây nến, từ đỉnh râu tới đáy râu.**

Ngoại lệ duy nhất: nếu bật `POI type = Mother Bar` và cây nến đó là inside bar,
hộp được nới rộng ra bằng **nến mẹ** (L521-524 cho Supply, L541-544 cho Demand).

### Bước 4 — Vòng đời của vùng sau khi vẽ

Xử lý ở `processZones()` (L267-287), chạy lại mỗi nến:

| Giá làm gì với vùng | Kết quả |
|---|---|
| Chưa chạm | Vùng giữ màu, tiếp tục kéo dài sang phải |
| Chạm vào **bên trong** nhưng chưa qua khỏi mép ngoài | Chuyển **xám (Mitigated)**, ngừng kéo dài |
| **Xuyên qua hẳn** (râu vượt đỉnh vùng Supply / thủng đáy vùng Demand) | **XÓA HẲN**, biến mất khỏi chart |
| Một nến bao trọn vùng và đóng cửa vượt qua | Đổi thành vùng ngược lại (**breaker block**) |
| Vùng cũ hơn 2000 nến (input "Max IPA age") | Xóa |

### Gộp vùng (`handleZone`, L246-262)

Vùng mới luôn được so với **vùng gần nhất cùng loại**:

- Vùng mới **bao trùm** vùng cũ → **gộp** thành một hộp to (lấy đỉnh cao nhất, đáy thấp nhất, cạnh trái sớm nhất).
- Vùng mới **nằm lọt hoàn toàn** trong vùng cũ → **không vẽ**.
- Input `Merge Ratio` (mặc định 0) nới lỏng điều kiện gộp: đỉnh/đáy chỉ cần lệch nhau dưới tỉ lệ này là đã gộp.
  Để 0 nghĩa là chỉ gộp khi bao trùm thật sự.

---

## 2. Vì sao nhiều đỉnh/đáy rõ ràng lại KHÔNG có vùng nào

Xếp theo mức độ phổ biến:

### ① Vùng ĐÃ từng được vẽ, nhưng đã bị xóa vì giá quét qua  ← nguyên nhân chính

Indicator này cố ý **chỉ giữ lại vùng còn "tươi"** (chưa bị giá xuyên qua).
Chỉ cần một cái râu nến vượt qua mép ngoài là vùng bị xóa vĩnh viễn, không để lại dấu vết.

Quy luật nhận biết: **mọi vùng còn thấy trên chart đều nằm ở chỗ giá chưa từng xuyên qua.**
Nhìn lại một đỉnh cũ mà không thấy vùng → gần như chắc chắn giá đã lên cao hơn đỉnh đó ở đâu đó phía sau.

### ② Sau đỉnh/đáy đó không có khoảng trống nào

Nếu giá đi xuống từ từ, nến này nối tiếp nến kia không để hở, điều kiện Bước 2 không bao giờ đúng tại vị trí đó.
Ứng viên cứ trượt sang phải và vùng cuối cùng được vẽ ở **chỗ khác, xa đỉnh swing**.
Hay gặp ở các đỉnh mà giá đi ngang một lúc rồi mới giảm.

### ③ Máy đang bận với ứng viên trước đó

Vì chỉ theo dõi **1 ứng viên tại một thời điểm**, nếu ứng viên cũ chưa gặp khoảng trống thì
**mọi đỉnh swing mới xuất hiện trong khoảng thời gian đó đều bị bỏ qua hoàn toàn**.
Đây là điểm dễ gây "mất vùng" nhất và **không hiển thị dấu hiệu gì trên chart**.

### ④ Vùng mới nằm lọt hoàn toàn bên trong vùng cũ

Xem mục "Gộp vùng" ở trên — trường hợp này vùng mới bị bỏ qua, không vẽ.

### Cách tự kiểm tra một vị trí cụ thể

1. Nhìn **phía sau** vị trí đó: nếu giá có râu vượt qua mép ngoài → lý do ①.
2. Nếu không → soi 3 nến quanh đỉnh/đáy xem có khoảng trống không → lý do ② hoặc ③.

---

## 3. Logic phân biệt Demand (xanh) và Supply (đỏ)

Màu do **hai máy chạy song song, độc lập nhau** quyết định — mỗi máy chỉ nhìn hình dạng nến tại chỗ,
không liên quan gì tới xu hướng hay cấu trúc BOS/CHoCH:

| | **Supply (đỏ)** — L510-528 | **Demand (xanh)** — L530-548 |
|---|---|---|
| Nến mồi | Đỉnh **swing cao**: đỉnh cao hơn nến trước và nến sau | Đáy **swing thấp**: đáy thấp hơn nến trước và nến sau |
| Điều kiện xác nhận | **Đáy** nến ứng viên nằm **trên đỉnh** nến sau đó 2 nến → giá rơi để lại khoảng trống | **Đỉnh** nến ứng viên nằm **dưới đáy** nến sau đó 2 nến → giá tăng để lại khoảng trống |
| Ý nghĩa | Giá **bỏ chạy xuống** khỏi vùng này → coi là nơi có lệnh bán | Giá **bỏ chạy lên** khỏi vùng này → coi là nơi có lệnh mua |
| Biến trong code | `isSweepOBS`, `high_MOBS` / `low_MOBS`, mảng `supplyZone` | `isSweepOBD`, `high_MOBD` / `low_MOBD`, mảng `demandZone` |

**Nói gọn một câu: hướng giá rời khỏi cây nến đó quyết định màu. Rơi xuống → đỏ. Bật lên → xanh.**

### Ba điểm quan trọng đi kèm

**① Hai máy hoàn toàn tách rời.**
Máy Supply đang bận chờ khoảng trống thì máy Demand vẫn chạy bình thường và ngược lại.
Cùng một cây nến về lý thuyết có thể vừa là ứng viên đỉnh của máy này vừa là ứng viên đáy của máy kia.

**② Không dính dáng gì tới structure.**
Vùng POI không hề đọc `isCocUp` / `isBosUp` / `findIDM`. Indicator không hỏi "đang uptrend hay downtrend",
cũng không hỏi "vùng này nằm trên hay dưới giá hiện tại".
Vì vậy hoàn toàn có thể xuất hiện vùng demand (xanh) **nằm phía trên** giá hiện tại —
đúng theo thiết kế, không phải lỗi.

**③ Có một đường thứ hai để đổi màu: breaker block** (L273-277)

Khi một cây nến **bao trọn** vùng supply và **đóng cửa vượt lên trên** nó,
code tạo một vùng **demand xanh tại đúng tọa độ cũ** (vùng supply đỏ bị xóa ngay trong cùng nến đó).
Ngược lại vùng demand bị phá xuống → sinh vùng supply đỏ.

Nghĩa là một số hộp xanh trên chart **không sinh ra từ đáy swing nào cả** — chúng là vùng đỏ cũ bị lật màu.
Đây là lý do đôi khi thấy vùng xanh xuất hiện ở chỗ trước đó là vùng đỏ.

Ngoài ra màu **xám** đè lên cả hai: vùng đã bị giá chạm vào nhưng chưa xuyên qua (Mitigated),
lúc đó không còn phân biệt đỏ/xanh nữa.

---

## Ghi chú kỹ thuật

- Toàn bộ POI bật/tắt bằng input `Show POI`.
- Muốn **giữ lại cả những vùng đã bị quét** (để backtest xem vùng nào đã "chạy"):
  sửa luật xóa ở L285-287, đổi `removeZone()` thành đổi màu + ngừng kéo dài,
  giống cách xử lý vùng Mitigated.
- Điều kiện Bước 2 lần đầu tiên (ngay sau khi tìm được đỉnh swing) so nến ứng viên với nến **cách 3 nến**,
  các lần trượt sau đó mới so với nến **cách 2 nến**. Hệ quả nhỏ: cây nến ngay sau đỉnh swing
  không bao giờ được chọn làm ứng viên.
