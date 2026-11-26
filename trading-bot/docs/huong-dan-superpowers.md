# Hướng dẫn dùng Superpowers để phát triển Trading Bot theo ROADMAP

Cập nhật 26/11/2026. Bản trực tuyến: https://claude.ai/artifact/9p4YpNMhaaAnzRurMiSVRL

## 1. Tổng quan

Superpowers bắt Claude làm theo một quy trình cố định: hỏi rõ, thiết kế, lập plan, viết test trước, kiểm chứng, rồi kết thúc nhánh. Quy trình đó khớp với chu trình 6 bước ở [ROADMAP.md](ROADMAP.md) mục 5, nên cách dùng là gắn mỗi bước với đúng skill của nó.

| Bước ở ROADMAP mục 5 | Skill Superpowers | Skill làm gì |
|---|---|---|
| 1. Chốt câu hỏi (mục "Cần chốt" của giai đoạn) | `brainstorming` | Hỏi từng câu một, đưa 2–3 hướng làm kèm đề xuất |
| 2. Thiết kế ngắn — **bạn duyệt spec và plan** | `brainstorming` → `writing-plans` | Ghi spec vào `specs/`, chia plan thành task nhỏ trong `plans/` |
| 3. Viết code + test trên nhánh `feat/<gđ>-<việc>` | `subagent-driven-development` hoặc `executing-plans` | Gồm `test-driven-development`: viết test đỏ trước, rồi code cho xanh |
| 4. Chạy test (unit + PP1 / PP2 / PP3) | `systematic-debugging` (khi test đỏ) | Tìm nguyên nhân gốc trước, rồi mới sửa |
| 5. Trình diễn (kết quả thật cho bạn xem) | `verification-before-completion` · `requesting-code-review` | Chạy test thật và in kết quả; một agent khác review cả nhánh |
| 6. Qua cổng — **bạn chọn merge, PR hay giữ** | `finishing-a-development-branch` | Liệt kê lựa chọn cho bạn; sau đó đánh `[x]` trong ROADMAP |

Bạn chỉ cần quyết ở bước 2 và bước 6: duyệt spec và plan, rồi chọn cách kết thúc nhánh. Các bước còn lại Claude làm và cho bạn xem bằng chứng.

Plugin gồm 15 skill. Ngoài các skill trong bảng còn: `dispatching-parallel-agents` (chia việc độc lập cho nhiều agent), `receiving-code-review` (kiểm lại góp ý trước khi sửa), `using-git-worktrees`, `diagnosing-superpowers`, `writing-skills` và `using-superpowers` (skill nền, tự chạy đầu mỗi phiên).

## 2. Chuẩn bị một lần

1. **Tải lại VSCode** để nạp plugin: `Ctrl+Shift+P` → `Developer: Reload Window`. Kiểm tra: gõ `/superpowers` trong khung chat, phải hiện danh sách skill như `superpowers:brainstorming`, `superpowers:writing-plans`.
2. **`CLAUDE.md` ở gốc repo** (`source/CLAUDE.md`) — đã tạo ngày 26/11/2026. Superpowers ghi rõ: hướng dẫn trong CLAUDE.md được ưu tiên hơn skill. Đây là nơi đặt luật riêng của dự án (nhánh, commit, nơi lưu tài liệu). Muốn đổi luật thì sửa file này.
3. **Xử lý các việc (B) còn mở của GĐ 0** cần cho code: cài Python 3.11+, đưa Node vào PATH. Skill `verification-before-completion` bắt Claude chạy test thật trước khi báo xong, nên máy phải chạy được test.
4. **Nơi lưu tài liệu của Superpowers.** Mặc định nó lưu ở `docs/superpowers/` tại gốc repo. CLAUDE.md đã đổi sang `trading-bot/docs/superpowers/specs/` và `trading-bot/docs/superpowers/plans/` để nằm cạnh ROADMAP.

**Cách gọi một skill.** Phần lớn skill tự kích hoạt khi Claude nhận ra đúng tình huống. Muốn chắc chắn thì gõ tên skill, ví dụ `/superpowers:brainstorming`, rồi viết yêu cầu ngay sau đó.

## 3. Quy trình cho mỗi hạng mục

Mỗi lần chạy quy trình này áp cho **một hạng mục**: một ô `[ ]` trong ROADMAP, hoặc vài ô liền nhau cùng chủ đề. Đừng làm cả một giai đoạn trong một lượt: GĐ 7 có 17 ô, một plan cho cả GĐ 7 sẽ quá dài để bạn duyệt. Việc có nhãn (B) là bạn tự làm, không cần Superpowers.

Hạng mục có hai loại:

- **Viết tài liệu** (GĐ 0 `requirements.md`, GĐ 1 `strategy-spec.md`, GĐ 2 `architecture.md`): chỉ cần bước 1–2, sản phẩm chính là file tài liệu.
- **Viết code** (từ GĐ 2 phần khung dự án trở đi): đi đủ bước 1–8.

1. **Chốt câu hỏi và thiết kế** — skill `brainstorming`. Claude đọc ROADMAP và code, hỏi bạn từng câu một (gồm các ô "Cần chốt"), đưa 2–3 hướng làm kèm đề xuất, rồi viết bản thiết kế vào `specs/`.
    - Gõ: `/superpowers:brainstorming Làm hạng mục "Tải nến 15m và 4H lịch sử, lưu Parquet" của GĐ 3 trong trading-bot/docs/ROADMAP.md. Hỏi tôi các mục Cần chốt còn mở trước.`
    - Bạn làm: trả lời câu hỏi, đọc file spec, sửa hoặc duyệt. Đây là bước "Thiết kế ngắn, bạn duyệt" của ROADMAP mục 5.
2. **Ghi lại quyết định vào ROADMAP.** Mỗi ô "Cần chốt" đã trả lời thì đánh `[x]` và ghi câu trả lời cạnh nó, hoặc thêm dòng vào bảng "Đã chốt" ở mục 1.
    - Gõ: `Cập nhật ROADMAP: đánh dấu các mục Cần chốt vừa quyết và ghi câu trả lời.`
3. **Tạo nhánh** cho hạng mục, theo tên ROADMAP mục 5.
    - Gõ: `Tạo nhánh feat/gd3-tai-nen từ develop.`
4. **Lập plan** — skill `writing-plans`. Claude chia spec thành các task nhỏ, mỗi task nêu file nào, hàm nào, test nào chứng minh nó đúng. File lưu ở `plans/`.
    - Gõ: `/superpowers:writing-plans từ spec vừa duyệt.`
    - Bạn làm: đọc plan. Chỗ nào sai với ROADMAP hoặc spec thì nói ngay, sửa plan rẻ hơn sửa code.
5. **Thực thi plan.** Claude hỏi bạn chọn một trong hai cách:
    - `subagent-driven-development`: mỗi task giao cho một agent riêng, xong có agent khác review. Chắc hơn, tốn token hơn. Hợp cho port chiến lược (GĐ 4), execution (GĐ 6).
    - `executing-plans`: Claude tự làm lần lượt trong phiên hiện tại. Rẻ hơn. Hợp cho việc nhỏ như `symbols.yaml`.
    - Trong lúc làm, skill `test-driven-development` bắt viết test trước, thấy test đỏ, rồi mới viết code cho xanh. Mỗi task xong được commit trên nhánh `feat/*` (mục 5).
6. **Gặp lỗi** — skill `systematic-debugging` tự bật: tìm nguyên nhân gốc trước rồi mới sửa. Với PP1, khi Pine ↔ oracle ↔ Python lệch nhau, bạn vẫn là người phân xử bản nào đúng.
    - Gõ: `/superpowers:systematic-debugging PP1 lệch 3 sự kiện CHoCH ở BTCUSD, xem bảng lệch trong evidence/...`
7. **Kiểm chứng và trình diễn** — skill `verification-before-completion`: Claude phải chạy test và cho bạn xem kết quả thật trước khi nói "xong". Đây là bước "Trình diễn" của ROADMAP.
    - Gõ: `Chứng minh Điều kiện xong của hạng mục này: chạy test, in kết quả, chỉ tôi chỗ xem.`
    - Sau đó `requesting-code-review` cho một agent review toàn bộ nhánh. Khi có góp ý, `receiving-code-review` bắt Claude kiểm lại từng góp ý trước khi sửa, không sửa mù.
8. **Kết thúc nhánh** — skill `finishing-a-development-branch`: Claude liệt kê các lựa chọn (merge, mở PR, giữ nhánh, bỏ), bạn chọn. Sau cùng đánh `[x]` ô đó trong ROADMAP.
    - Gõ: `Hạng mục đạt điều kiện xong. Đánh [x] trong ROADMAP rồi mở PR vào develop.`

## 4. Ví dụ: bắt đầu từ GĐ 0

Theo ROADMAP mục 7, việc tiếp theo là trả lời "Cần chốt" của GĐ 0 và GĐ 1, rồi viết `requirements.md`. Đây là hạng mục loại viết tài liệu, nên chỉ qua bước 1–2.

**Lượt 1 — `requirements.md` (GĐ 0)**

1. Mở phiên Claude mới trong VSCode, gõ:
    - `/superpowers:brainstorming Viết trading-bot/docs/requirements.md cho GĐ 0 trong ROADMAP. Hỏi tôi từng mục Cần chốt của GĐ 0, mỗi lần một câu, kèm đề xuất của bạn.`
2. Claude sẽ hỏi lần lượt 6 mục còn mở: vốn demo và rủi ro mỗi lệnh; giới hạn lỗ ngày/tuần; số lệnh mở tối đa; thước đo thành công; broker, loại tài khoản, hedging hay netting; danh sách symbol.
3. Claude viết `requirements.md`. Bạn đọc và duyệt.
4. Gõ: `Cập nhật ROADMAP: đánh [x] các mục Cần chốt của GĐ 0 và ô "Viết docs/requirements.md".`
5. Điều kiện xong của GĐ 0 còn vế thứ hai: Python kết nối được MT5 demo và in ra số dư. Việc này cần bạn mở tài khoản IC Markets và cài MT5 trước. Sau đó gõ:
    - `Viết script ngắn trong trading-bot/ để kết nối MT5 demo và in số dư. Dùng TDD nếu có phần test được, rồi chạy thật cho tôi xem kết quả.`

**Lượt 2 — `strategy-spec.md` (GĐ 1)**

GĐ 1 lớn hơn, nên tách thành vài lượt brainstorming: một lượt chốt 8 câu "Cần chốt", một lượt viết spec từng nhóm luật (swing, CHoCH/BOS, vùng OF, OF Entry).

- Gõ: `/superpowers:brainstorming GĐ 1 trong ROADMAP: đọc Trading_Hub_3_v1.11_LuxAlgo.pine và tài liệu BankTrap trong Document/, lập bảng luật ↔ trang tài liệu ↔ dòng code. Liệt kê chỗ code và tài liệu mâu thuẫn để tôi phân xử.`
- Đọc vài file lớn cùng lúc, Claude có thể dùng `dispatching-parallel-agents`, mỗi agent đọc một phần.
- Điều kiện xong: chọn 10 vị trí bất kỳ trên chart, spec giải thích được vì sao có hoặc không có lệnh. Gõ: `Kiểm spec với 10 vị trí tôi chọn sau: ...`

Từ GĐ 2 (khung dự án, CI) trở đi mới có code. Khi đó mỗi hạng mục đi đủ 8 bước ở mục 3. ROADMAP cũng ghi: chưa viết code giao dịch cho tới khi GĐ 1 được duyệt.

## 5. Commit, checklist và lỗi thường gặp

**Commit — đã chốt 26/11/2026: cho phép commit trên nhánh `feat/*`.** Superpowers mặc định commit sau mỗi task, và `subagent-driven-development` cần các commit đó để agent review so sánh từng task. Commit còn là điểm lùi lại khi task sau hỏng. Luật đã ghi trong `source/CLAUDE.md` và ROADMAP mục 5:

- Nhánh tích hợp là `develop`: `feat/*` tách từ `develop`, PR nhắm vào `develop`.
- Được commit trên `feat/*`. Không commit trên `develop`, `master`, `plan/*` hay nhánh khác khi bạn chưa nói rõ.
- Push, merge và mở PR chỉ xảy ra khi bạn bảo.
- Nhánh sẽ có nhiều commit nhỏ; muốn gọn thì squash khi merge.

**Giữ ROADMAP là checklist sống.** Spec và plan của Superpowers là tài liệu làm việc cho từng hạng mục; tiến độ chung chỉ nằm ở ROADMAP. Cuối mỗi hạng mục, đánh `[x]` ô đó và ghi lại quyết định mới ở bảng "Đã chốt".

**Lỗi thường gặp**

| Tình huống | Xử lý |
|---|---|
| Gõ `/superpowers` không thấy skill | Chưa tải lại VSCode, hoặc đang ở phiên cũ. Mở phiên mới |
| Claude bỏ qua brainstorming, viết code luôn | Gọi rõ `/superpowers:brainstorming` ở đầu yêu cầu |
| Claude muốn tạo git worktree | Repo nằm trong OneDrive; worktree nhân đôi file và OneDrive đồng bộ hết. Nói "làm trên nhánh, không dùng worktree" (đã có trong CLAUDE.md) |
| Claude định commit ngoài nhánh `feat/*` | Dừng lại, nhắc luật trong CLAUDE.md. Kiểm tra nhánh bằng `git branch --show-current` |
| Hết hạn mức nhanh | `subagent-driven-development` chạy nhiều agent. Việc nhỏ thì chọn `executing-plans` |
| Phiên bị ngắt giữa plan | Mở phiên mới, gõ `Tiếp tục plan trading-bot/docs/superpowers/plans/<file>.md từ task chưa xong`. Plan có ô `[ ]` cho từng bước nên Claude biết đang ở đâu |
| Test cần MT5 hay TradingView không chạy được | Test MT5 chỉ chạy trên máy có terminal. Phần Pine của PP1 đang vướng lỗi RE10110 của v1.11 (ô "Cần chốt" GĐ 4). Bảo Claude nói rõ test nào bị bỏ qua, không được báo xanh |
| Superpowers chạy sai, không rõ vì sao | `/superpowers:diagnosing-superpowers` để xem lại phiên đó |
| Muốn bản Superpowers mới | Máy chưa có `claude` trong PATH, nên chạy bằng `claude.exe` trong thư mục extension (`%USERPROFILE%\.vscode\extensions\anthropic.claude-code-<phiên bản>\resources\native-binary\`): `claude.exe plugin update superpowers`, rồi tải lại VSCode |
