# Quy tắc dự án Trading

- Trả lời và viết tài liệu bằng tiếng Việt.
- Phạm vi và tiến độ: `trading-bot/docs/ROADMAP.md` là nguồn chuẩn. Xong mục nào thì đánh `[x]` ở đó.
- Tài liệu cấp giai đoạn giữ đúng tên ở ROADMAP mục 2.7: `requirements.md`, `strategy-spec.md`, `architecture.md`, `runbook.md`.
- Cách dùng Superpowers cho dự án này: `trading-bot/docs/huong-dan-superpowers.md`.
- Superpowers: spec lưu ở `trading-bot/docs/superpowers/specs/`, plan lưu ở `trading-bot/docs/superpowers/plans/`.

## Git

- Nhánh tích hợp là `develop`: PR merge vào `develop`. `master` chỉ nhận từ `develop` khi tôi quyết.
- Mỗi hạng mục một nhánh `feat/<gđ>-<việc>`, tách từ `develop`.
- Được commit trên nhánh `feat/*`, kể cả các bước commit trong plan của Superpowers. Trước khi commit, chạy `git branch --show-current` để chắc đang ở nhánh `feat/*`.
- Không commit trên `develop`, `master`, `plan/*` hay bất kỳ nhánh nào khác khi tôi chưa nói rõ.
- Không push, không merge, không mở PR khi tôi chưa bảo. PR mặc định nhắm vào `develop`.
- Không tạo git worktree trong thư mục OneDrive; làm trực tiếp trên nhánh `feat/*`.

## Phạm vi

- Chưa viết code giao dịch cho tới khi GĐ 1 được duyệt.
- Test cần MT5 chạy trên máy này; CI GitHub chỉ chạy test offline.
- Test nào bị bỏ qua (thiếu MT5, TradingView lỗi RE10110…) thì phải nói rõ, không báo xanh.
