"""Kiểm tra kết nối MT5 cho điều kiện xong của GĐ 0 (ROADMAP mục 6).

Chỉ ĐỌC thông tin, không đặt lệnh. Không cần mật khẩu: script gắn vào terminal
MT5 đang mở và đã đăng nhập sẵn tài khoản demo.

Cài một lần (môi trường ảo nằm ngoài OneDrive):
    py -3.14 -m venv "%USERPROFILE%\\.venvs\\trading-bot"
    "%USERPROFILE%\\.venvs\\trading-bot\\Scripts\\python.exe" -m pip install MetaTrader5

Chạy:
    "%USERPROFILE%\\.venvs\\trading-bot\\Scripts\\python.exe" trading-bot\\scripts\\check_mt5.py
    ... check_mt5.py --path "C:\\Program Files\\MetaTrader 5 IC Markets\\terminal64.exe"

Mã thoát: 0 = đạt; 1 = không kết nối được; 2 = kết nối được nhưng còn việc phải sửa.
"""

from __future__ import annotations

import argparse
import sys

import MetaTrader5 as mt5

TRADE_MODE = {
    mt5.ACCOUNT_TRADE_MODE_DEMO: "DEMO",
    mt5.ACCOUNT_TRADE_MODE_CONTEST: "CONTEST",
    mt5.ACCOUNT_TRADE_MODE_REAL: "REAL (tài khoản thật!)",
}
MARGIN_MODE = {
    mt5.ACCOUNT_MARGIN_MODE_RETAIL_NETTING: "netting",
    mt5.ACCOUNT_MARGIN_MODE_EXCHANGE: "exchange",
    mt5.ACCOUNT_MARGIN_MODE_RETAIL_HEDGING: "hedging",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--path", help="đường dẫn terminal64.exe (khi có nhiều terminal)")
    args = parser.parse_args()

    ok = mt5.initialize(path=args.path) if args.path else mt5.initialize()
    if not ok:
        code, msg = mt5.last_error()
        print(f"KHÔNG KẾT NỐI ĐƯỢC MT5: ({code}, '{msg}')")
        if code == -6:
            # Terminal tìm thấy nhưng chưa đăng nhập được vào máy chủ broker.
            print("Terminal đang mở nhưng CHƯA ĐĂNG NHẬP được tài khoản.")
            print("Xem tab Journal trong MT5: dòng 'authorization ... failed (Invalid account)'")
            print("= sai mật khẩu hoặc sai server. Đăng nhập lại bằng File > Login to Trade Account.")
        else:
            print("Kiểm tra: terminal MT5 đã cài, đang mở, đã đăng nhập tài khoản demo.")
        return 1

    try:
        term = mt5.terminal_info()
        acc = mt5.account_info()
        if acc is None:
            print(f"Terminal mở nhưng chưa đăng nhập tài khoản: {mt5.last_error()}")
            return 1

        print("== Terminal")
        print(f"  Tên            : {term.name} ({term.company})")
        print(f"  Đường dẫn      : {term.path}")
        print(f"  Kết nối server : {'có' if term.connected else 'KHÔNG'}")
        print(f"  Nút Algo Trading: {'BẬT' if term.trade_allowed else 'TẮT'}")
        print("== Tài khoản")
        print(f"  Số tài khoản   : {acc.login}")
        print(f"  Server         : {acc.server}")
        print(f"  Công ty        : {acc.company}")
        print(f"  Loại           : {TRADE_MODE.get(acc.trade_mode, acc.trade_mode)}")
        print(f"  Chế độ vị thế  : {MARGIN_MODE.get(acc.margin_mode, acc.margin_mode)}")
        print(f"  Đòn bẩy        : 1:{acc.leverage}")
        print(f"  Tiền tệ        : {acc.currency}")
        print(f"  Số dư          : {acc.balance:,.2f} {acc.currency}")
        print(f"  Vốn (equity)   : {acc.equity:,.2f} {acc.currency}")

        problems = []
        if not term.connected:
            problems.append("terminal chưa kết nối tới server broker")
        if not term.trade_allowed:
            problems.append("nút Algo Trading trên terminal đang TẮT")
        if acc.trade_mode != mt5.ACCOUNT_TRADE_MODE_DEMO:
            problems.append("tài khoản đang đăng nhập KHÔNG phải demo")

        if problems:
            print("== CHƯA ĐẠT")
            for p in problems:
                print(f"  - {p}")
            return 2
        print("== ĐẠT: Python kết nối được MT5 demo và đọc được số dư.")
        return 0
    finally:
        mt5.shutdown()


if __name__ == "__main__":
    sys.exit(main())
