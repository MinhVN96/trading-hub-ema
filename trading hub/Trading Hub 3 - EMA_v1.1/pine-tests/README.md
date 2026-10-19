# pine-tests

Test E2E cho các file `.pine` trong thư mục cha. Bộ test dùng Playwright, chạy trên TradingView thật.

| Test | Kiểm tra gì | Thời gian |
|---|---|---|
| `compile.spec.ts` | Script compile không có lỗi (Monaco không có gạch đỏ, indicator xuất hiện trên legend) | ~1,5 phút/file |
| `runtime.spec.ts` | Script chạy hết lịch sử (có dòng `STAT` trong Pine Logs), số line/label/box chưa chạm quota 500 | ~2 phút/case |
| `logic.spec.ts` | Sự kiện CHoCH/BOS/OF trong một khoảng thời gian cố định khớp với `golden/*.json` | ~2,5 phút/case |

## Tài khoản TradingView dùng cho test

Test chạy bằng **tài khoản riêng `minhvn_itwork`** (gói Basic), không dùng tài khoản trade `ngocminh0596`. Lý do:

- Gói Basic chỉ cho lưu 1 chart layout, nên không tạo được layout test riêng trong tài khoản trade.
- Mỗi test sẽ đổi symbol/khung, thêm indicator rồi gỡ indicator trên layout. Chạy trên tài khoản trade sẽ làm hỏng layout đang dùng.

Layout test: `TV_CHART_URL` trong `.env`.

## Cài đặt (một lần)

1. Cài [Node.js LTS](https://nodejs.org/), rồi mở terminal tại thư mục `pine-tests`:
   ```
   npm install
   npx playwright install chromium
   ```
   Máy cần có Google Chrome. Test chạy trên Chrome thật (`browser.ts`), vì TradingView dễ chặn đăng nhập trên Chromium tự động.
2. Copy `.env.example` thành `.env` rồi điền `TV_CHART_URL` là link layout của tài khoản test.
3. Đăng nhập **tài khoản test** bằng email và mật khẩu (Google login thường bị chặn trong trình duyệt tự động):
   ```
   npm run login
   ```
   Đăng nhập xong, đợi trang hiện avatar rồi **tự đóng cửa sổ trình duyệt**. Script chỉ lưu session khi cửa sổ đóng.
4. Kiểm tra session (in ra username, phải là tài khoản test):
   ```
   npm run check-login
   ```
   Session hết hạn sau vài tuần. Khi test báo lỗi đăng nhập thì chạy lại bước 3.

## Chạy test

```
npm run test:compile        # nhanh, nên chạy trước mỗi commit
npm run test:runtime
npm run test:logic
npm test                    # tất cả (~12 phút)
npm run test:headed         # xem trình duyệt chạy, dùng khi sửa selector
npm run report              # xem báo cáo HTML + trace khi fail
```

## Khi TradingView đổi giao diện

Mọi selector nằm trong `pages/selectors.ts`. Các mục ghi "Da kiem 2026-10" đã được kiểm tra trên TradingView thật vào tháng 10/2026. Khi gặp lỗi "không tìm thấy phần tử":

1. Mở ảnh chụp lỗi và `error-context.md` trong `test-results/`. File đó có cây accessibility của cả trang.
2. Hoặc chạy `npm run codegen` để mở chart đã đăng nhập, click vào phần tử cần dùng, codegen sẽ in ra locator.
3. Chỉ sửa trong `pages/selectors.ts`, không sửa trong file test.

Những điều đã biết về giao diện TradingView:

- **Script mẫu ghi đè code:** ngay sau khi tải trang, TradingView tự nạp script mẫu "My script" vào editor và có thể ghi đè code vừa dán. `PineEditorPage.setCode` kiểm tra lại dòng đầu của editor và dán lại tối đa 3 lần.
- **Mở Pine Logs:** mở từ nút `···` của Pine Editor. Nút "More" trên legend thì không có mục này.
- **Đọc Pine Logs:** bảng Pine Logs là danh sách ảo, phải cuộn từ đầu tới cuối mới đọc hết.

## Golden (test logic)

1. Trong `config/scenarios.ts`, sửa `window` thành một đoạn bạn đã tự kiểm tra trên chart.
2. Chạy `npm run test:update-golden`. Lệnh này ghi file `golden/<tên>.json`.
3. **Mở file golden, đối chiếu sự kiện với chart**. Chỉ commit khi chắc chắn đúng: golden sai thì test chỉ còn bảo vệ cái sai.

Khi bạn **cố ý** sửa logic OF/cấu trúc, test logic sẽ fail và liệt kê sự kiện MẤT/THỪA. Kiểm tra từng dòng có đúng là thay đổi bạn muốn không, rồi chạy lại bước 2.

Chart chỉ tải một số nến giới hạn (hiện tại 15m tải từ 01/08/2026), nên theo thời gian `window` sẽ trôi ra ngoài vùng dữ liệu. Khi đó test sẽ báo rõ, và bạn tạo golden cho một đoạn gần hơn.

## Liên hệ với file Pine

Test bật công tắc `e2eLog` bằng cách sửa dòng `e2eLog = input.bool(false, ...)` thành `true` trước khi dán code. Đừng đổi tên biến hay định dạng của dòng đó. Định dạng log được ghi ngay trên dòng đó, và `utils/parseLogs.ts` đọc đúng định dạng này.
