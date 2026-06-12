# Pine Script v5 - Toàn Bộ Kiến Thức (Master Reference)

## MỤC LỤC
1. [Tổng Quan & Execution Model](#1-tổng-quan--execution-model)
2. [Khai Báo Script](#2-khai-báo-script)
3. [Kiểu Dữ Liệu & Type System](#3-kiểu-dữ-liệu--type-system)
4. [Biến & Khai Báo](#4-biến--khai-báo)
5. [Toán Tử & Biểu Thức](#5-toán-tử--biểu-thức)
6. [Cấu Trúc Điều Kiện](#6-cấu-trúc-điều-kiện)
7. [Vòng Lặp](#7-vòng-lặp)
8. [Hàm (Functions)](#8-hàm-functions)
9. [Collections: Arrays, Matrices, Maps](#9-collections-arrays-matrices-maps)
10. [Objects (UDTs)](#10-objects-udts)
11. [Time Series & Built-in Variables](#11-time-series--built-in-variables)
12. [Plots & Visuals](#12-plots--visuals)
13. [Lines, Boxes, Labels, Tables](#13-lines-boxes-labels-tables)
14. [Inputs](#14-inputs)
15. [Alerts](#15-alerts)
16. [request.security() & HTF Data](#16-requestsecurity--htf-data)
17. [Sessions & Time](#17-sessions--time)
18. [Strategies](#18-strategies)
19. [Libraries](#19-libraries)
20. [Non-standard Charts](#20-non-standard-charts)
21. [Repainting](#21-repainting)
22. [Limitations](#22-limitations)
23. [Debugging Techniques](#23-debugging-techniques)
24. [Style Guide](#24-style-guide)
25. [Error Messages & Fixes](#25-error-messages--fixes)
26. [Pattern Codes Quan Trọng](#26-pattern-codes-quan-trọng)

---

## 1. TỔNG QUAN & EXECUTION MODEL

### Script chạy trên mỗi bar (từ trái sang phải)
```pine
//@version=5
indicator("My Script", overlay=true)
// Mỗi dòng code chạy lại trên TỪNG BAR lịch sử
// Sau lịch sử → chạy trên real-time bars (cập nhật từng tick)
```

### Execution Model
- Script chạy **một lần trên mỗi bar** lịch sử (bar_index = 0 đến last)
- Real-time: chạy lại mỗi tick, commit khi bar đóng
- `barstate.isrealtime` = true khi đang ở real-time bar
- `barstate.isconfirmed` = true khi bar vừa đóng (confirmed)
- `barstate.islastconfirmedhistory` = true ở bar lịch sử cuối cùng

### Time Series
- Mọi built-in variable (close, open, high, low, volume...) là **series**
- `close` = giá đóng cửa bar hiện tại
- `close[1]` = bar trước, `close[2]` = 2 bar trước
- `[]` = look-back operator (không phải array indexing!)

---

## 2. KHAI BÁO SCRIPT

```pine
//@version=5

// Indicator (không có order management)
indicator("Title", shorttitle="Short", overlay=true, 
          max_lines_count=500, max_labels_count=500, max_boxes_count=500,
          timeframe="", timeframe_gaps=true)

// Strategy (có order management)  
strategy("Title", overlay=true, initial_capital=10000, 
         default_qty_type=strategy.percent_of_equity, default_qty_value=100,
         commission_type=strategy.commission.percent, commission_value=0.1,
         max_bars_back=500)

// Library (dùng để chia sẻ functions)
library("LibraryTitle", overlay=true)
```

### Tham số quan trọng của indicator()
- `overlay=true` → vẽ trên chart chính; `false` → pane riêng
- `scale=scale.right` / `scale.left` / `scale.none`
- `max_bars_back=N` → tăng look-back buffer (khi gặp lỗi "cannot determine referencing length")
- `timeframe=""` → chạy ở timeframe khác (built-in MTF)
- `explicit_plot_zorder=true` → plots vẽ theo thứ tự code

---

## 3. KIỂU DỮ LIỆU & TYPE SYSTEM

### Primitive Types
| Type | Mô tả |
|------|--------|
| `int` | Số nguyên |
| `float` | Số thực |
| `bool` | true/false |
| `color` | Màu sắc |
| `string` | Chuỗi ký tự |
| `line` | Đối tượng line |
| `label` | Đối tượng label |
| `box` | Đối tượng box |
| `table` | Đối tượng table |
| `linefill` | Đối tượng linefill |
| `array<T>` | Mảng |
| `matrix<T>` | Ma trận |
| `map<K,V>` | Map |

### Type Forms (Qualifiers)
- `const` → hằng tại compile time
- `input` → hằng từ input của user
- `simple` → hằng tại bar_index=0
- `series` → thay đổi theo từng bar (mặc định)

### Type Casting
```pine
int x = int(3.7)      // → 3 (truncate, không phải round)
float y = float(5)    // → 5.0
string s = str.tostring(close)
float n = str.tonumber("3.14")
```

### na (Not Available)
```pine
float x = na          // phải khai báo type khi dùng na
bool b = na(close[500])  // kiểm tra na
x := nz(x[1], 0.0)   // nz: thay na bằng 0 hoặc default
```

### Color
```pine
color c1 = color.red
color c2 = color.new(color.blue, 50)    // transparency 0-100 (100=trong suốt)
color c3 = color.rgb(255, 0, 0, 50)    // r,g,b,transparency
color c4 = #FF0000                      // hex
color c5 = #FF000080                    // hex với alpha (80 hex = 50% trong suốt)
// QUAN TRỌNG: hex transparency NGƯỢC với Pine (00=đục, FF=trong)
// 80 hex ≈ transparency=50 trong Pine

// Lấy thành phần màu
r = color.r(c1)
g = color.g(c1) 
b = color.b(c1)
t = color.t(c1)  // transparency

// Gradient
gradColor = color.from_gradient(value, minVal, maxVal, bottomColor, topColor)
```

---

## 4. BIẾN & KHAI BÁO

### Khai báo thông thường (immutable sau khi gán)
```pine
x = close * 2          // inferred type = float
float y = high - low   // explicit type
int n = 10
bool isUp = close > open
string msg = "Hello"
```

### var (khởi tạo 1 lần, giữ giá trị qua bars)
```pine
var float maxHigh = na     // chỉ khởi tạo ở bar_index=0
var int count = 0
count := count + 1         // cộng dồn qua các bars
var label myLbl = na       // label tồn tại lâu dài
```

### varip (giữ giá trị giữa các ticks)
```pine
varip int tickCount = 0
tickCount := tickCount + 1   // tăng mỗi tick, không reset khi bar confirm
```

### Compound assignment operators
```pine
x += 1    // x := x + 1
x -= 1    // x := x - 1  
x *= 2    // x := x * 2
x /= 2    // x := x / 2
x %= 3    // x := x % 3
```

---

## 5. TOÁN TỬ & BIỂU THỨC

### Arithmetic
```pine
+ - * /    // cộng trừ nhân chia
%          // modulo
math.pow(base, exp)  // lũy thừa (không dùng ^)
```

### Comparison & Logic
```pine
== != > >= < <=   // so sánh
and or not        // logic (KHÔNG dùng && || !)
```

### Ternary (conditional expression)
```pine
result = condition ? valueIfTrue : valueIfFalse
// Ternary là LAZY: chỉ evaluate branch được chọn
```

### Quan trọng: Operators với na
```pine
na + 1 == na    // na "nhiễm" mọi phép tính
nz(x, 0) + 1   // dùng nz() để xử lý na
```

### String operators
```pine
s = "Hello" + " World"    // nối chuỗi
str.length(s)
str.contains(s, "World")
str.startswith(s, "Hello")
str.endswith(s, "!")
str.substring(s, 0, 5)
str.replace(s, "Hello", "Hi")
str.lower(s) / str.upper(s)
str.match(s, "regex")     // regex matching
str.pos(s, "sub")         // vị trí substring
str.split(s, ",")         // trả về array<string>
str.format("{0}: {1,number,#.##}", "Price", close)
str.format_time(timestamp, "yyyy-MM-dd HH:mm", timezone)
```

---

## 6. CẤU TRÚC ĐIỀU KIỆN

### if/else
```pine
// Phải nhất quán kiểu trả về
result = if condition1
    value1
else if condition2
    value2
else
    value3

// Không có giá trị trả về
if close > open
    label.new(bar_index, high, "UP")
```

### switch
```pine
// switch với expression
day = switch dayofweek
    dayofweek.monday    => "Mon"
    dayofweek.tuesday   => "Tue"
    => "Other"          // default

// switch không có expression (thay ternary chain)
val = switch
    close > open and volume > ta.sma(volume, 20) => color.green
    close < open => color.red
    => color.gray
```

---

## 7. VÒNG LẶP

### for
```pine
// Đếm lên
for i = 0 to 9
    // i = 0, 1, ..., 9

// Đếm xuống  
for i = 9 to 0 by -1
    // i = 9, 8, ..., 0

// Với step
for i = 0 to 100 by 5
    // i = 0, 5, 10, ..., 100

// break và continue
for i = 0 to 100
    if condition
        break      // thoát vòng lặp
    if skipCond
        continue   // bỏ qua iteration này
```

### for...in (iterate array)
```pine
int[] arr = array.from(1, 3, 6, 3, 8)

// Iterate values
for val in arr
    // val = từng phần tử

// Iterate với index
for [idx, val] in arr
    // idx = index, val = value

// Với index tracking (cách cũ)
for i = 0 to array.size(arr) - 1
    val = array.get(arr, i)
```

### while
```pine
i = 0
while i < 10
    // làm gì đó
    i := i + 1
    if exitCond
        break
```

### Giới hạn vòng lặp
- Mỗi bar: tối đa **500ms** thực thi
- Nếu quá: "Loop too long" error → optimize algorithm

---

## 8. HÀM (FUNCTIONS)

### Khai báo
```pine
// Single-line
double(x) => x * 2

// Multi-line (dùng indent 4 spaces trong function body)
calcMA(source, length, maType) =>
    switch maType
        "SMA" => ta.sma(source, length)
        "EMA" => ta.ema(source, length)
        => ta.sma(source, length)

// Return tuple
getOHLC() =>
    [open, high, low, close]

// Gọi tuple function
[o, h, l, c] = getOHLC()
```

### Function overloading (v5)
```pine
// Khác số tham số → OK
mult(x1, x2) => x1 * x2
mult(x1, x2, x3) => x1 * x2 * x3

// Cùng số tham số → phải khai báo type tường minh
mult(float x1, float x2) => x1 * x2
mult(bool x1, bool x2) => x1 and x2 ? true : false
```

### Default parameters
```pine
f(x, y = 1) => x + y
f(5)     // → 6 (y dùng default)
f(5, 2)  // → 7
```

### Recursion
```pine
// Cho phép nhưng không quá 500 lần
factorial(n) =>
    n <= 1 ? 1 : n * factorial(n - 1)
```

### Built-in math functions
```pine
math.abs(x)
math.ceil(x)
math.floor(x)
math.round(x, precision)
math.round_to_mintick(x)
math.max(a, b, ...)
math.min(a, b, ...)
math.pow(base, exp)
math.sqrt(x)
math.log(x) / math.log10(x)
math.sin/cos/tan/asin/acos/atan(x)
math.todegrees(rad) / math.toradians(deg)
math.avg(a, b, ...)
math.sum(arr)
math.sign(x)    // -1, 0, hoặc 1
math.random(min, max, seed)
// Constants
math.pi         // 3.14159...
math.phi        // 1.618... (golden ratio)
math.rphi       // 0.618... (golden ratio conjugate)
math.e          // 2.718...
```

---

## 9. COLLECTIONS: ARRAYS, MATRICES, MAPS

### Arrays
```pine
// Tạo array
float[] a = array.new<float>(5, 0.0)    // size=5, fill=0.0
int[] b = array.new_int(3, na)
var float[] prices = array.new<float>()

// Tạo từ values
int[] c = array.from(1, 3, 6, 8)        // inline
var string[] d = array.new<string>()

// CRUD
array.push(a, value)                    // thêm vào cuối
array.unshift(a, value)                 // thêm vào đầu
array.insert(a, index, value)
val = array.pop(a)                      // xóa & lấy cuối
val = array.shift(a)                    // xóa & lấy đầu
array.remove(a, index)
array.set(a, index, value)
val = array.get(a, index)

// Info
size = array.size(a)
idx = array.indexof(a, value)           // -1 nếu không tìm thấy
idx = array.lastindexof(a, value)
bool has = array.includes(a, value)

// Math trên array
array.sum(a) / array.avg(a) / array.min(a) / array.max(a)
array.median(a) / array.mode(a) / array.stdev(a) / array.variance(a)
array.abs(a)                            // array of abs values
array.sort(a, order.ascending)
array.sort_indices(a, order.ascending)  // indices của sorted order
array.binary_search(a, value)           // index hoặc -1
array.binary_search_leftmost(a, value)
array.binary_search_rightmost(a, value)
array.percentrank(a, index)
array.percentile_nearest_rank(a, pct)
array.percentile_linear_interpolation(a, pct)
array.range(a)                          // max - min

// Manipulate
array.reverse(a)
array.concat(a, b)
array.copy(a)
array.join(a, ",")                      // → string
array.slice(a, from, to)                // subarray
array.fill(a, value, from, to)

// Array của drawings
label[] lblArr = array.new_label()
array.new_line() / array.new_box() / array.new_string()

// first/last
array.first(a) / array.last(a)

// Giới hạn: max 100,000 elements
```

### Matrices
```pine
matrix<float> m = matrix.new<float>(rows, cols, na)
matrix.get(m, row, col)
matrix.set(m, row, col, value)
matrix.rows(m) / matrix.columns(m) / matrix.elements_count(m)
matrix.row(m, row)          // → array
matrix.col(m, col)          // → array
matrix.add_row(m, index, array_or_na)
matrix.add_col(m, index, array_or_na)
matrix.remove_row(m, index) // → array
matrix.remove_col(m, index) // → array
matrix.fill(m, value, from_row, from_col, to_row, to_col)
matrix.copy(m) / matrix.reverse(m) / matrix.transpose(m)
matrix.reshape(m, rows, cols)
matrix.concat(m1, m2)       // append m2 to m1
matrix.sum(m1, m2_or_scalar)
matrix.diff(m1, m2_or_scalar)
matrix.mult(m1, m2_or_scalar_or_vector)
matrix.pow(m, power)
matrix.det(m) / matrix.inv(m) / matrix.pinv(m)
matrix.rank(m) / matrix.trace(m)
matrix.avg(m) / matrix.min(m) / matrix.max(m) / matrix.median(m) / matrix.mode(m)
matrix.sort(m, col, order)
matrix.eigenvalues(m) / matrix.eigenvectors(m)
matrix.kron(m1, m2)
// Checks: matrix.is_zero/identity/binary/symmetric/antisymmetric/diagonal/antidiagonal/triangular/stochastic/square

// Historical state: m[1] = trạng thái matrix 1 bar trước (từ May 2022)
```

### Maps (v5)
```pine
map<string, float> m = map.new<string, float>()
map.put(m, "key", value)
val = map.get(m, "key")
bool has = map.contains(m, "key")
map.remove(m, "key")
map.clear(m)
map.size(m)
string[] keys = map.keys(m)
float[] vals = map.values(m)
map.copy(m)
```

---

## 10. OBJECTS (UDTs)

### Khai báo User-Defined Type
```pine
type Point
    int x
    float y = 0.0        // default value
    string label = "P"

type Zone
    float top
    float bottom
    color zoneColor = color.new(color.red, 80)
    bool isActive = true
```

### Sử dụng
```pine
// Tạo instance
p = Point.new(bar_index, close)           // positional
p2 = Point.new(x=bar_index, y=close, label="Hi") // named

// Truy cập field
p.x := bar_index + 1
val = p.y

// Dùng trong array
var Point[] points = array.new<Point>()
array.push(points, Point.new(bar_index, close))

// Dùng với request.security (tiết kiệm tuple limit)
myObj = request.security(sym, tf, Zone.new(high, low))
```

---

## 11. TIME SERIES & BUILT-IN VARIABLES

### Price & Volume
```pine
open, high, low, close, volume, vwap
hl2    // (high + low) / 2
hlc3   // (high + low + close) / 3
ohlc4  // (open + high + low + close) / 4
hlcc4  // (high + low + close + close) / 4  ← shortcut cho HLCC4
```

### Bar Information
```pine
bar_index           // index của bar (0 = đầu tiên)
last_bar_index      // index của bar cuối cùng trong dataset
last_bar_time       // UNIX time của bar cuối
barstate.isrealtime
barstate.isconfirmed
barstate.islast
barstate.isfirst
barstate.islastconfirmedhistory
barstate.isnew      // true ở tick đầu tiên của bar mới
```

### Symbol Info
```pine
syminfo.ticker      // "AAPL"
syminfo.tickerid    // "NASDAQ:AAPL"
syminfo.prefix      // "NASDAQ"
syminfo.description
syminfo.type        // "stock", "futures", etc.
syminfo.currency    // "USD"
syminfo.basecurrency
syminfo.mintick     // tick size
syminfo.minmove
syminfo.pointvalue
syminfo.volumetype
// Chart type checks
syminfo.prefix()    // static function: exchange prefix of any symbol
syminfo.ticker()    // static function: ticker without prefix
chart.is_standard   // true = bars/candles/hollow/line/area/baseline
chart.is_heikinashi / chart.is_renko / chart.is_linebreak
chart.is_kagi / chart.is_pnf / chart.is_range
chart.bg_color      // background color
chart.fg_color      // optimal contrast color with bg
chart.left_visible_bar_time  / chart.right_visible_bar_time
```

### Timeframe
```pine
timeframe.period        // "D", "60", "1", etc.
timeframe.multiplier    // 1, 60, etc. (số)
timeframe.isminutes / timeframe.isseconds / timeframe.isdaily
timeframe.isweekly / timeframe.ismonthly
timeframe.isintraday    // true nếu < Daily
timeframe.in_seconds(tf)  // chuyển tf string → seconds

timeframe.change("D")   // true ở bar đầu tiên của ngày mới (từ June 2022)
```

### Time functions
```pine
time                    // UNIX timestamp (ms) của bar hiện tại
time_close              // UNIX timestamp đóng cửa
timenow                 // UNIX timestamp hiện tại (real-time)

// Lấy thành phần thời gian
year(t) / month(t) / dayofmonth(t) / dayofweek(t)
hour(t) / minute(t) / second(t) / weekofyear(t)

// dayofweek constants
dayofweek.sunday = 1, monday = 2, ..., saturday = 7

// Phát hiện bar mới (Daily)
newDay = ta.change(time("D")) != 0
// Hoặc:
newExchangeDay = ta.change(dayofmonth) != 0

// timestamp() tạo UNIX time
ts = timestamp(2024, 1, 15, 9, 30, 0)  // series int
ts2 = timestamp("2024-01-15")          // const int

// Session
session.isfirstbar / session.islastbar
session.isfirstbar_regular / session.islastbar_regular
session.ismarket / session.ispremarket / session.ispostmarket
time_tradingday   // beginning of trading day

// Timezone
time("D", "0930-1600", "America/New_York")
```

### Technical Analysis (ta.*)
```pine
// Moving averages
ta.sma(source, length)
ta.ema(source, length)
ta.rma(source, length)   // Wilder's MA
ta.wma(source, length)
ta.vwma(source, length)
ta.swma(source)          // symmetric weighted MA (4 bars)
ta.hma(source, length)   // Hull MA
ta.alma(source, length, offset, sigma)

// Momentum
ta.rsi(source, length)
ta.macd(source, fast, slow, signal)  // → [macd, signal, hist]
ta.stoch(close, high, low, length)
ta.cci(source, length)
ta.mom(source, length)
ta.roc(source, length)
ta.tsi(source, short, long)
ta.cmo(source, length)
ta.mfi(source, length)

// Bands / Channels
ta.bb(source, length, mult)     // → [basis, upper, lower]
ta.bbw(source, length, mult)    // bandwidth
ta.kc(source, length, mult)     // Keltner
ta.kcw(source, length, mult)    // Keltner width
ta.dmi(diLen, adxSmoothing)     // → [diPlus, diMinus, adx]
ta.supertrend(factor, atrPeriod) // → [supertrend, direction]

// ATR / Volatility  
ta.atr(length)
ta.tr(handle_na)   // true range
ta.tr               // built-in true range variable
ta.accdist          // accumulation/distribution
ta.obv              // on-balance volume
ta.pvt              // price-volume trend
ta.nvi / ta.pvi    // negative/positive volume index
ta.wad              // Williams %R AD
ta.wvad             // Williams Variable Accumulation/Distribution
ta.iii              // Intraday Intensity Index

// SAR
ta.sar(start, inc, max)

// VWAP
ta.vwap             // standard VWAP
ta.vwap(source)     // custom source
ta.vwap(source, anchor, stdev_mult)  // → [vwap, upper, lower] (June 2022)

// Crossing
ta.crossover(source1, source2)   // source1 crosses above source2
ta.crossunder(source1, source2)
ta.cross(source1, source2)       // either direction

// Highest/Lowest
ta.highest(source, length) / ta.lowest(source, length)
ta.highestbars(source, length)   // bars back từ highest
ta.lowestbars(source, length)
ta.min(source) / ta.max(source)  // all-time min/max từ bar đầu (Aug 2022)

// Statistical
ta.stdev(source, length)
ta.variance(source, length)
ta.median(source, length)
ta.mode(source, length)
ta.correlation(source1, source2, length)
ta.dev(source, length)
ta.percentrank(source, length)   // % giá trị quá khứ < hiện tại (0-100)
ta.percentile_linear_interpolation(source, length, percentage)
ta.percentile_nearest_rank(source, length, percentage)
ta.linreg(source, length, offset)

// Supporting
ta.rising(source, length) / ta.falling(source, length)
ta.cum(source)              // cumulative sum
ta.change(source)           // source - source[1]
ta.change(source, length)   // source - source[length]
ta.barsince(condition)      // số bars kể từ condition=true
ta.valuewhen(condition, source, occurrence)  // giá trị source khi condition
ta.pivothigh(source, leftbars, rightbars)   // pivot high (na nếu không phải pivot)
ta.pivotlow(source, leftbars, rightbars)
ta.pivot_point_levels(type, developing)     // [P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5]
ta.range(source, length)                    // max - min trong length bars
```

---

## 12. PLOTS & VISUALS

### plot()
```pine
// Signature
plot(series, title, color, linewidth, style, trackprice, histbase, 
     offset, join, editable, show_last, display)

// Styles
plot.style_line         // default
plot.style_stepline
plot.style_histogram
plot.style_cross
plot.style_area
plot.style_columns
plot.style_circles
plot.style_linebr        // line with breaks at na

// Examples
plot(close)
plot(ta.sma(close, 20), "SMA20", color.blue, linewidth=2)
p = plot(close, display=display.none)   // ẩn nhưng vẫn trackable

// display parameter (July 2022)
display.all             // hiện ở mọi nơi
display.none            // ẩn hoàn toàn
display.data_window     // chỉ Data Window
display.pane            // chỉ pane của indicator
display.price_scale     // chỉ price scale
display.status_line     // chỉ status line
display.all - display.status_line   // mọi nơi trừ status line
```

### plotshape()
```pine
plotshape(condition, title, style, location, color, offset, text, textcolor, 
          editable, size, show_last, display)

// Shapes
shape.circle / shape.square / shape.diamond
shape.triangleup / shape.triangledown
shape.arrowup / shape.arrowdown
shape.flag / shape.xcross / shape.cross
shape.labelup / shape.labeldown  // với text

// Location  
location.abovebar / location.belowbar / location.top / location.bottom
location.absolute  // dùng với giá trị y chính xác

plotshape(ta.crossover(close, ta.sma(close,20)), "Buy", shape.arrowup, 
          location.belowbar, color.green)
```

### plotchar()
```pine
plotchar(series, title, char, location, color, offset, text, textcolor, 
         editable, size, show_last, display)
// char: bất kỳ ký tự Unicode nào: "▲", "●", "✦", etc.
plotchar(close > open, "Up", "▲", location.abovebar, color.green, size=size.small)
```

### plotarrow()
```pine
plotarrow(series, title, colorup, colordown, offset, minheight, maxheight,
          editable, show_last, display)
// series > 0 → mũi tên lên, < 0 → xuống, = 0 / na → không vẽ
```

### plotcandle() & plotbar()
```pine
plotcandle(open, high, low, close, title, color, wickcolor, editable, 
           show_last, bordercolor)
plotbar(open, high, low, close, title, color, editable, show_last, display)
// Nếu bất kỳ OHLC nào = na → không vẽ bar đó

// HTF candles trên intraday chart
[o, h, l, c] = request.security(ticker, "D", [open, high, low, close], 
                                  gaps=barmerge.gaps_on)
bodyColor = o > c ? color.red : color.green
plotcandle(timeframe.isintraday ? o : na, h, l, c, color=bodyColor)
```

### fill()
```pine
// Fill giữa 2 plots
p1 = plot(high, display=display.none)
p2 = plot(low, display=display.none)
fill(p1, p2, color.new(color.blue, 90))

// Fill giữa 2 hlines
h1 = hline(100)
h2 = hline(0)
fill(h1, h2, color.new(color.green, 90))

// fillgaps: controls fill trên gaps (March 2021)
fill(p1, p2, color.blue, fillgaps=false)
```

### hline()
```pine
// Ngang tĩnh - KHÔNG chấp nhận series
hline(100, "Level", color.gray, linestyle=hline.style_dashed, linewidth=1)
// hline.style_solid / hline.style_dotted / hline.style_dashed
// color phải là INPUT type (không dynamic)
// Workaround cho dynamic hline:
plot(someValue, trackprice=true, offset=-9999, display=display.none)
```

### bgcolor() & barcolor()
```pine
// Background color của toàn pane
bgcolor(color, offset, editable, show_last, title)
bgcolor(close > open ? color.new(color.green, 90) : na)

// Color của candles
barcolor(color, offset, editable, show_last, title)
barcolor(close > open ? color.lime : color.red)
// na → không thay đổi
// barcolor là hàm DUY NHẤT có thể ảnh hưởng chart từ separate pane!
```

### Vertical line (workaround)
```pine
// Vẽ vertical line bằng histogram với scale.none
plot(condition ? 10e20 : na, style=plot.style_histogram, 
     color=color.new(color.red, 0), linewidth=1, scale=scale.none)
```

### Pivot tracking (non-repainting)
```pine
// fixnan fills na gaps với giá trị cuối cùng
pivotHigh = fixnan(ta.pivothigh(5, 5))
plot(pivotHigh, "Pivot High", color.red, offset=-5)
// offset âm → shift left (trễ), dương → shift right (tương lai)
```

### Plot count limits
- `plot()` với const color = **1 count**
- `plot()` với series color = **2 counts**
- `plotcandle()` với tất cả series = **up to 7 counts**
- `hline()`, `line.new()`, `label.new()`, `table.new()`, `box.new()` = **0 counts**
- Tổng max: **64 counts**

### Size constants
```pine
size.tiny / size.small / size.normal / size.large / size.huge / size.auto
```

---

## 13. LINES, BOXES, LABELS, TABLES

### Lines
```pine
// Tạo line
l = line.new(x1, y1, x2, y2, 
             xloc=xloc.bar_index,   // hoặc xloc.bar_time
             extend=extend.none,     // extend.right / extend.left / extend.both
             color=color.blue,
             style=line.style_solid, // line.style_dashed / line.style_dotted / line.style_arrow_right, etc.
             width=1)

// Setters
line.set_x1(l, bar_index)
line.set_y1(l, value)
line.set_x2(l, bar_index + 10)
line.set_y2(l, value)
line.set_xy1(l, x, y) / line.set_xy2(l, x, y)
line.set_color(l, color.red)
line.set_style(l, line.style_dashed)
line.set_width(l, 2)
line.set_extend(l, extend.right)

// Getters
line.get_x1(l) / line.get_y1(l)
line.get_x2(l) / line.get_y2(l)
line.get_price(l, bar_index)    // giá tại bar_index trên line

// Xóa
line.delete(l)
line.copy(l)   // clone

// Array của tất cả lines
line.all        // array<line> của tất cả lines hiện có

// Giới hạn
// Default: 50 lines cuối hiển thị
// Max: max_lines_count=500 trong indicator()
```

### Boxes
```pine
b = box.new(left, top, right, bottom,
            border_color=color.blue,
            border_width=1,
            border_style=line.style_solid,
            bgcolor=color.new(color.blue, 90),
            text="",
            text_size=size.normal,
            text_color=color.black,
            text_halign=text.align_center,
            text_valign=text.align_center,
            text_wrap=text.wrap_auto,    // Aug 2022
            text_font_family=font.family_default)  // Sep 2022

// xloc support
box.new(left, top, right, bottom, xloc=xloc.bar_index)

// Setters
box.set_left(b, val) / box.set_right(b, val)
box.set_top(b, val) / box.set_bottom(b, val)
box.set_lefttop(b, left, top) / box.set_rightbottom(b, right, bottom)
box.set_border_color(b, color) / box.set_bgcolor(b, color)
box.set_border_width(b, width)
box.set_text(b, text) / box.set_text_color(b, color)
box.set_text_size(b, size) / box.set_text_halign(b, align)
box.set_text_valign(b, valign) / box.set_text_wrap(b, wrap)
box.set_text_font_family(b, font)

// Getters
box.get_left(b) / box.get_right(b)
box.get_top(b) / box.get_bottom(b)

box.delete(b) / box.copy(b)
box.all         // array<box>

// Giới hạn: default 50, max_boxes_count=500
```

### Labels
```pine
lbl = label.new(x, y, text="",
                xloc=xloc.bar_index,
                yloc=yloc.price,     // yloc.abovebar / yloc.belowbar / yloc.price
                color=color.blue,
                style=label.style_label_down,
                textcolor=color.white,
                size=size.normal,
                textalign=text.align_left,
                tooltip="",
                text_font_family=font.family_default)

// Label styles
label.style_none         // chỉ text, không background
label.style_label_down   // bubble chỉ xuống
label.style_label_up     // bubble chỉ lên
label.style_label_left / label.style_label_right
label.style_label_lower_left / label.style_label_lower_right
label.style_label_upper_left / label.style_label_upper_right
label.style_label_center
label.style_arrowdown / label.style_arrowup / label.style_cross / label.style_xcross
label.style_diamond / label.style_circle / label.style_square / label.style_flag
label.style_text_outline  // Aug 2022

// Setters
label.set_x(lbl, x) / label.set_y(lbl, y)
label.set_xy(lbl, x, y)
label.set_text(lbl, text)
label.set_color(lbl, color)
label.set_textcolor(lbl, color)
label.set_style(lbl, style)
label.set_size(lbl, size)
label.set_tooltip(lbl, text)
label.set_text_font_family(lbl, font)

// Getters
label.get_x(lbl) / label.get_y(lbl) / label.get_text(lbl)

label.delete(lbl) / label.copy(lbl)
label.all       // array<label>

// Giới hạn: default 50, max_labels_count=500
```

### Linefills (Dec 2021)
```pine
// Fill giữa 2 line objects
lf = linefill.new(line1, line2, color=color.new(color.blue, 90))
linefill.set_color(lf, color)
linefill.get_line1(lf) / linefill.get_line2(lf)
linefill.delete(lf)
// Linefill extends/moves with its lines
array.new_linefill()
```

### Tables
```pine
// Tạo table (tối đa 9, một ở mỗi position)
t = table.new(position.top_right, columns, rows,
              bgcolor=color.white,
              border_color=color.gray,
              border_width=1,
              frame_color=color.black,
              frame_width=1)

// Positions
position.top_left / position.top_center / position.top_right
position.middle_left / position.middle_center / position.middle_right
position.bottom_left / position.bottom_center / position.bottom_right

// Set cell
table.cell(t, col, row, text="", 
           width=0, height=0,
           text_color=color.black,
           text_halign=text.align_center,
           text_valign=text.align_center,
           text_size=size.normal,
           text_font_family=font.family_default,
           bgcolor=color.white,
           tooltip="")

// Merge cells (March 2022)
table.merge_cells(t, from_col, from_row, to_col, to_row)

// Setters
table.set_bgcolor(t, color)
table.set_border_color(t, color)
table.cell_set_text(t, col, row, text)
table.cell_set_bgcolor(t, col, row, color)
table.cell_set_text_color(t, col, row, color)
table.cell_set_text_size(t, col, row, size)
table.cell_set_text_halign(t, col, row, align)
table.cell_set_text_valign(t, col, row, valign)
table.cell_set_width(t, col, row, width)
table.cell_set_height(t, col, row, height)
table.cell_set_tooltip(t, col, row, text)
table.cell_set_text_font_family(t, col, row, font)

table.delete(t)
// Nên dùng var để tái sử dụng: var table t = na
// table chỉ nên vẽ trên barstate.islast
```

### Text alignment
```pine
text.align_left / text.align_center / text.align_right
text.align_top / text.align_center / text.align_bottom
text.wrap_none / text.wrap_auto   // wrap trong box
```

### Font family
```pine
font.family_default      // proportional font
font.family_monospace    // monospace (tốt cho alignment text)
```

---

## 14. INPUTS

```pine
// Các loại input
input.int(defval, title, minval, maxval, step, tooltip, inline, group, display)
input.float(defval, title, minval, maxval, step, options, tooltip, ...)
input.bool(defval, title, tooltip, inline, group, display)
input.string(defval, title, options=["A","B","C"], tooltip, ...)
input.color(defval, title, tooltip, inline, group, display)
input.symbol(defval, title, tooltip, inline, group, display, confirm)
input.timeframe(defval, title, options, tooltip, inline, group, display, confirm)
input.session(defval, title, options, tooltip, inline, group, display, confirm)
input.source(defval, title, tooltip, inline, group, display)
input.time(defval, title, tooltip, inline, group, display, confirm)
input.text_area(defval, title, tooltip, display, confirm)  // Feb 2022

// Tham số tổ chức
// inline: ghép inputs cùng dòng
// group: nhóm inputs với header
// tooltip: hover text
// display: input.none (ẩn) hoặc input.all

// Ví dụ
maLength = input.int(20, "MA Length", minval=1, maxval=500, group="Settings")
showMA = input.bool(true, "Show MA", group="Settings")
maType = input.string("EMA", "MA Type", options=["SMA","EMA","WMA"], group="Settings")
srcInput = input.source(close, "Source")
tfInput = input.timeframe("D", "Timeframe")
colorInput = input.color(color.blue, "Color")
```

---

## 15. ALERTS

```pine
// alertcondition() - tạo điều kiện trong "Create Alert" dialog
alertcondition(condition, title, message)
alertcondition(ta.crossover(close, ta.sma(close, 20)), 
               "Price Cross SMA", 
               "{{ticker}} crossed above SMA at {{close}}")

// alert() - trigger programmatically
alert(message, freq=alert.freq_once_per_bar)
// freq: alert.freq_once_per_bar / alert.freq_once_per_bar_close / alert.freq_all

// Placeholders trong message
// {{ticker}}, {{exchange}}, {{close}}, {{open}}, {{high}}, {{low}}
// {{volume}}, {{time}}, {{timenow}}, {{interval}}
// {{strategy.order.action}}, {{strategy.order.id}}, {{strategy.order.price}}
// {{strategy.order.alert_message}}  ← từ comment param của strategy.entry/exit

// Strategy alerts
// //@strategy_alert_message Default Message  (Aug 2022)
```

---

## 16. REQUEST.SECURITY() & HTF DATA

```pine
// Signature
request.security(symbol, timeframe, expression, 
                 gaps=barmerge.gaps_off,
                 lookahead=barmerge.lookahead_off,
                 ignore_invalid_symbol=false,
                 currency="")

// Cơ bản
htfClose = request.security(syminfo.tickerid, "D", close)
htfHigh = request.security("BINANCE:BTCUSDT", "W", high)

// Tuple (tiết kiệm calls)
[htfO, htfH, htfL, htfC] = request.security(syminfo.tickerid, "D", [open, high, low, close])

// UDT (tiết kiệm tuple limit 127)
type OHLC
    float o
    float h 
    float l
    float c
htf = request.security(sym, tf, OHLC.new(open, high, low, close))
// Dùng: htf.o, htf.h, htf.l, htf.c

// Gaps
// barmerge.gaps_off = lấp đầy gaps (default)
// barmerge.gaps_on = na tại những bars không có dữ liệu HTF
[o, h, l, c] = request.security(sym, "D", [open, high, low, close], 
                                  gaps=barmerge.gaps_on)

// Lookahead (CẢNH BÁO: có thể gây repainting)
// barmerge.lookahead_off = default (an toàn, không nhìn tương lai)
// barmerge.lookahead_on = lấy giá trị CUỐI của HTF bar ngay khi bar đó bắt đầu
//   → repaints! Chỉ dùng khi nguồn đã confirmed (như close[1])

// Non-repainting pattern
nonRepaintSec(sym, tf, src) =>
    request.security(sym, tf, src[barstate.isrealtime ? 1 : 0])[barstate.isrealtime ? 0 : 1]

// Lower timeframe data (intrabar)
request.security_lower_tf(symbol, timeframe, expression)
// Trả về array[] chứa tất cả intrabar values
// Max: 100,000 intrabars

// Giới hạn: max 40 request.*() calls

// Ticker helpers
ticker.new(prefix, ticker, session, adjustment)
ticker.standard(syminfo.tickerid)  // standard chart (không bị modify)
```

### Tránh repainting
```pine
// Dùng confirmed values
htfClose = request.security(sym, "D", close[1])   // close đã đóng của HTF
// Hoặc dùng barmerge.lookahead_on với [1]:
htfClose = request.security(sym, "D", close[1], lookahead=barmerge.lookahead_on)
// Cả 2 tương đương và non-repainting
```

### Các request khác
```pine
request.quandl(ticker, gaps, index, ignore_invalid_symbol)
request.financial(symbol, field, period, gaps, ignore_invalid_symbol, currency)
request.earnings(symbol, field, gaps, lookahead, ignore_invalid_symbol, currency)
request.dividends(symbol, field, gaps, lookahead, ignore_invalid_symbol, currency)
request.splits(symbol, field, gaps, lookahead, ignore_invalid_symbol, currency)
request.economic(country_code, field, gaps, ignore_invalid_symbol)  // April 2022
```

---

## 17. SESSIONS & TIME

```pine
// Kiểm tra session
inSession = not na(time("D", "0930-1600:23456", "America/New_York"))
// Format session: "HHMM-HHMM:days" 
// days: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
// v5 default: "1234567" (tất cả ngày) vs v4: "23456" (thứ 2-6)

// Helper function
timeInRange(tf, session) => not na(time(tf, session))

// Session coloring
sessionColor = switch
    timeInRange(timeframe.period, "0930-1600") => color.new(color.blue, 90)
    => na   // transparent ngoài session
bgcolor(sessionColor)

// Timezone
"America/New_York" / "Europe/London" / "Asia/Tokyo"
// GMT offset: "GMT-5" / "UTC+7"

// input.session() cho user nhập session
sess = input.session("0930-1600", "Session")
```

---

## 18. STRATEGIES

```pine
strategy("Name", overlay=true,
         initial_capital=10000,
         currency=currency.USD,
         default_qty_type=strategy.percent_of_equity,
         default_qty_value=100,
         pyramiding=0,
         commission_type=strategy.commission.percent,
         commission_value=0.1,
         slippage=0,
         calc_on_every_tick=false,  // true = calc mỗi tick (chậm hơn)
         calc_on_order_fills=false,
         process_orders_on_close=false,
         close_entries_rule="ANY",
         max_bars_back=500,
         risk_free_rate=2.0,       // April 2022: cho Sharpe/Sortino
         use_bar_magnifier=false)   // May 2022: LTF data trong backtesting

// Entry orders
strategy.entry("Long", strategy.long, qty=1, limit=na, stop=na,
               oca_name="", oca_type=strategy.oca.none,
               comment="", alert_message="")

strategy.entry("Short", strategy.short)

// Exit orders (PHẢI làm gì đó: profit/loss/trail/stop/limit)
strategy.exit("Exit Long", "Long",
              qty=na, qty_percent=na,
              profit=na, limit=na,
              loss=na, stop=na,
              trail_price=na, trail_points=na, trail_offset=na,
              oca_name="", comment="",
              comment_profit="", comment_loss="", comment_trailing="",
              alert_message="",
              alert_profit="", alert_loss="", alert_trailing="")

// Close orders
strategy.close("Long", comment="", qty=na, qty_percent=na,
               alert_message="", immediately=false)  // immediately = June 2022
strategy.close_all(comment="", alert_message="", immediately=false)

// Order management
strategy.cancel("id")
strategy.cancel_all()

// Position info
strategy.position_size      // + = long, - = short, 0 = flat
strategy.position_avg_price
strategy.opentrades         // số trades đang mở
strategy.closedtrades       // số trades đã đóng

// Trade info (các hàm từ October 2021)
strategy.opentrades.entry_price(trade_num)
strategy.opentrades.entry_bar_index(trade_num)
strategy.opentrades.entry_time(trade_num)
strategy.opentrades.size(trade_num)
strategy.opentrades.profit(trade_num)
strategy.opentrades.commission(trade_num)
strategy.opentrades.max_runup(trade_num)
strategy.opentrades.max_drawdown(trade_num)

strategy.closedtrades.entry_price(trade_num)
strategy.closedtrades.exit_price(trade_num)
strategy.closedtrades.profit(trade_num)
strategy.closedtrades.entry_comment(trade_num)  // Dec 2022
strategy.closedtrades.exit_comment(trade_num)   // Dec 2022
strategy.closedtrades.entry_id(trade_num)
strategy.closedtrades.exit_id(trade_num)

// P&L
strategy.netprofit
strategy.grossprofit
strategy.grossloss
strategy.max_drawdown
strategy.max_runup   // April 2022
strategy.account_currency

// qty_percent (June 2022 breaking change)
// qty_percent luôn apply trên INITIAL position size, không phải remaining
// Ví dụ: qty_percent=50 → luôn đóng 50% vị thế ban đầu, không phải 50% còn lại

// Direction constants
strategy.long / strategy.short

// OCA (One-Cancels-All)
strategy.oca.none / strategy.oca.cancel / strategy.oca.reduce

// Qty type
strategy.fixed / strategy.cash / strategy.percent_of_equity
```

---

## 19. LIBRARIES

```pine
// Khai báo library
//@version=5
library("MyLib", overlay=true)

// Phải có export keyword
export myFunction(float source, simple int length) =>
    ta.sma(source, length)

// Export UDT
export type Signal
    float entry
    float stop
    bool isLong

// Constraints trong library:
// - KHÔNG có request.*()
// - KHÔNG có input.*()  
// - KHÔNG có plot*(), fill(), bgcolor()

// Import library
import username/LibraryName/1 as lib
result = lib.myFunction(close, 20)

// Compiler annotations
// @description: mô tả library
// @function: mô tả function
// @param name: mô tả parameter
// @returns: mô tả return value

// Library functions return "simple" hoặc "series" (không phải const/input)
// Dùng "simple" prefix để force simple result:
export simple int simpleFunc(simple int n) => n * 2
```

---

## 20. NON-STANDARD CHARTS

```pine
// Heikin Ashi
haTicker = ticker.heikinashi(syminfo.tickerid)
[haO, haH, haL, haC] = request.security(haTicker, timeframe.period, 
                                          [open, high, low, close])
// CẢNH BÁO: HA values là SYNTHETIC - không dùng cho backtesting orders!

// Lấy OHLC thật trên HA chart
realTicker = ticker.new(syminfo.prefix, syminfo.ticker)
realClose = request.security(realTicker, timeframe.period, close)

// Renko
renkoTicker = ticker.renko(syminfo.tickerid, "ATR", 10)
// Tham số 2: "Traditional" / "ATR" / "Percent"
// Tham số 3: box size

// Line Break
lbTicker = ticker.linebreak(syminfo.tickerid, 3)  // 3 = line count

// Kagi
kagiTicker = ticker.kagi(syminfo.tickerid, 3)     // 3 = reversal

// Point & Figure
pnfTicker = ticker.pointfigure(syminfo.tickerid, "hl", "ATR", 14, 3)
// Tham số 2: source "hl" hoặc "close"
// Tham số 3: box size method
// Tham số 4: box size value  
// Tham số 5: reversal
```

---

## 21. REPAINTING

### Các nguyên nhân repainting
1. **Dùng `request.security()` với `lookahead_on`** và source là close (chưa confirmed)
2. **Dùng built-in variables thay đổi real-time** trong điều kiện
3. **Vẽ drawings lùi về quá khứ** (modify lịch sử)
4. **`varip` variables** (thay đổi trong real-time bars)
5. **`timenow`** thay đổi liên tục

### Cách tránh repainting
```pine
// 1. Dùng confirmed security data
htfData = request.security(sym, tf, close[1])  // close đã đóng

// 2. Chỉ trigger conditions khi bar confirmed
if barstate.isconfirmed
    // safe zone - không repaint

// 3. Non-repainting HTF pattern
nonRepSec(sym, tf, src) =>
    request.security(sym, tf, src[barstate.isrealtime ? 1 : 0])[barstate.isrealtime ? 0 : 1]

// 4. Không dùng timenow trong conditions
// 5. Dùng barstate.islastconfirmedhistory để distinguish
```

---

## 22. LIMITATIONS

| Giới hạn | Giá trị |
|----------|---------|
| Thời gian compile | 2 phút (3 lần timeout → 1 giờ ban) |
| Thời gian execute | 20s (basic), 40s (khác) |
| Loop mỗi bar | 500ms |
| Plot count | 64 |
| Lines/Boxes/Labels mặc định | 50 (mỗi loại) |
| Lines/Boxes/Labels tối đa | 500 |
| Tables | 9 (một ở mỗi position) |
| request.*() calls | 40 |
| Intrabars | 100,000 |
| Tuple size (all request.*) | 127 elements |
| Compiled tokens | 60,000 (indicator/strategy), 1M (library) |
| Local blocks | 500 |
| Variables per scope | 1,000 |
| Array/Matrix elements | 100,000 |
| Look-back `[]` | 5,000 bars |
| Look-forward (xloc.bar_index) | 500 bars |
| Chart bars | 20K (Premium), 10K (Pro/Pro+), 5K (khác) |
| Strategy orders | 9,000 |
| Deep backtesting orders | 200,000 |

```pine
// Tăng look-back buffer
indicator("Title", max_bars_back=500)
// Hoặc cho variable cụ thể:
max_bars_back(series, 500)
// Cho drawings với time:
max_bars_back(time, 500)
```

---

## 23. DEBUGGING TECHNIQUES

### Numeric values
```pine
// Đơn giản nhất
plot(bar_index)

// Giữ nguyên scale của chart
plotchar(myValue, "Debug", "", location.top, size=size.tiny)
// Xuất hiện trong Data Window nhưng không ảnh hưởng scale
```

### String values (chỉ qua labels)
```pine
// Print function (last bar only)
print(txt) =>
    var label lbl = label.new(bar_index, na, txt, 
                               xloc.bar_index, yloc.price, 
                               color(na), label.style_label_left,
                               color.black, size.normal)
    label.set_xy(lbl, bar_index, ta.highest(10)[1])
    label.set_text(lbl, txt)

// Dùng:
print("Close: " + str.tostring(close, "#.##"))
```

### Debug mọi bar
```pine
label.new(bar_index, high, str.tostring(close, "#.##"))
// Nhớ set max_labels_count=500
```

### Debug inside functions
```pine
// Return tuple với debug value
myFunc(x) =>
    result = x * 2
    debugVal = x + 1
    [result, debugVal]

[r, d] = myFunc(close)
plotchar(d, "Debug", "", location.top)
```

### Debug inside loops
```pine
// Save single value trước khi exit
debugStr = ""
for i = 0 to 9
    debugStr := debugStr + str.tostring(i) + ":" + str.tostring(close[i]) + "\n"
label.new(bar_index, high, debugStr, style=label.style_label_left)
```

### Debug in for loops với lines
```pine
for i = 1 to lookbackInput
    trBalance += math.sign(ta.tr - ta.tr[i])
    string := string + str.tostring(i, "00") + "*" + str.tostring(ta.tr[i]) + "\n"

label.new(bar_index, 0, string, style=label.style_none, size=size.small)
hline(0)
plot(trBalance)
// Dùng str.tostring(i, "00") để zero-pad số index
// Modulo để sample subset: if i % 2 == 0 → chỉ lấy mỗi 2 iterations
```

### Debugging tips tổng hợp
```pine
// Quick debug float/int/bool:
plotchar(v, "v", "", location.top, size=size.tiny)

// Quick debug string (last bar):
print(stringName)

// AutoHotkey shortcuts (Windows only):
// ^+f → insert plotchar(variableName, "variableName", "", location.top, size=size.tiny)
// ^+p → insert print(txt) => var _label = label.new(...); print()
```

---

## 24. STYLE GUIDE

### Naming conventions
```pine
// camelCase: variables, functions
maFast = ta.ema(close, 12)
pivotHi() => ta.pivothigh(5, 5)

// SCREAMING_SNAKE_CASE: constants
BULL_COLOR = color.green
MAX_BARS = 500

// Suffix "Input": user inputs
maLengthInput = input.int(20, "Length")
showLabelsInput = input.bool(true, "Show Labels")
```

### Tổ chức file (thứ tự)
```pine
// 1. License/copyright comment (nếu có)
// 2. //@version=5
// 3. indicator()/strategy()/library() declaration
// 4. import statements
// 5. Constants (SCREAMING_SNAKE_CASE)
// 6. Inputs (camelCase + Input suffix)
// 7. Function declarations
// 8. Calculations
// 9. Strategy calls (nếu strategy)
// 10. Visual outputs (plot, label, line, etc.)
// 11. Alerts
```

### Formatting
```pine
// Spaces xung quanh operators
x = a + b * c
a := b + 1

// Spaces sau dấu phẩy
foo(a, b, c)

// Line wrapping: 2 spaces indent (4 spaces = local block)
result = longFunctionName(arg1, arg2,
  arg3, arg4)  // 2-space indent cho continuation

// Tránh dùng var cho non-persistent values
// var chỉ khi thực sự cần persist qua bars
```

---

## 25. ERROR MESSAGES & FIXES

| Error | Fix |
|-------|-----|
| `if statement too long` | Extract code vào helper function |
| `too many securities` | Gộp nhiều request.*() vào một tuple/UDT. Hàm gọi request.*() nhân số calls |
| `Mismatched input 'plot'` | `plot()` phải ở column 0, không được indent |
| `Loop too long (> 500ms)` | Optimize: binary search thay linear, giảm số iterations |
| `Too many local variables` | Combine: `var3 = expr1 + expr2` thay `var1 + var2` |
| `Cannot determine referencing length` | Add `max_bars_back=N` vào indicator() hoặc `max_bars_back(var, N)` |
| `Invalid argument 'style' in 'plot'` | v4→v5: plot style thay đổi tên, thêm `plot.style_` prefix |
| `Undeclared identifier 'input.xxx'` | v4→v5: input phải là `input.int()`, `input.float()`, etc. |
| `Invalid argument 'when' in 'strategy.close'` | Dùng `if condition \n strategy.close()` thay `strategy.close(when=condition)` |
| `Cannot call 'input.int' with 'literal float' for 'const int'` | Dùng `input.int(defval=10)` với integer, không phải float |
| `Cannot use mutable variable as security argument` | Wrap trong function: `calcFunc() => \n s = 0.0 \n s := ...` |

---

## 26. PATTERN CODES QUAN TRỌNG

### All-time high/low tracking
```pine
allTimeHigh(src) =>
    var float atH = na
    atH := na(atH) ? src : math.max(atH, src)
    atH

// Hoặc ngắn hơn:
var float atHigh = na
atHigh := math.max(nz(atHigh, high), high)
```

### Last non-na value
```pine
lastVal = fixnan(mySeries)
// Tương đương:
// nz(mySeries, mySeries[1]) nhưng fixnan tự động fill toàn bộ lịch sử
```

### N-day high (time-based)
```pine
MS_IN_5DAYS = 5 * 24 * 60 * 60 * 1000
var float maxHi = na
if timenow - time < MS_IN_5DAYS
    maxHi := math.max(nz(maxHi, high), high)
```

### Non-repainting security
```pine
nonRepaintSec(sym, tf, src) =>
    request.security(sym, tf, src[barstate.isrealtime ? 1 : 0])[barstate.isrealtime ? 0 : 1]
```

### Session background
```pine
timeInRange(tf, session) =>
    not na(time(tf, session))

REG_COLOR = color.new(color.blue, 90)

bgcolor(timeInRange(timeframe.period, "0930-1600:23456") ? REG_COLOR : na)
```

### Gradient background từ RSI/oscillator
```pine
myCCI = ta.cci(close, 20)
bullColor = color.new(color.green, 75)
bearColor = color.new(color.red, 75)
bgColor = myCCI >= 0 
    ? color.from_gradient(myCCI, 0, 100, color.new(color.green, 90), bullColor)
    : color.from_gradient(myCCI, -100, 0, bearColor, color.new(color.red, 90))
bgcolor(bgColor)
```

### HTF candles trên intraday chart
```pine
[o, h, l, c] = request.security(syminfo.tickerid, "D", 
                                   [open, high, low, close], 
                                   gaps=barmerge.gaps_on)
bodyColor = o > c ? color.new(color.red, 30) : color.new(color.green, 30)
plotcandle(timeframe.isintraday ? o : na, h, l, c, 
           "HTF Candle", bodyColor, bodyColor)
```

### Pivot tracking với fixnan
```pine
pivotHi = fixnan(ta.pivothigh(5, 5))   // luôn có giá trị, không na
pivotLo = fixnan(ta.pivotlow(5, 5))
plot(pivotHi, "Pivot High", color.red, offset=-5)
plot(pivotLo, "Pivot Low", color.green, offset=-5)
```

### OF (Order Flow) Zone Box
```pine
// Vẽ box cho OF zone
drawOFBox(top, bottom, leftBar) =>
    box.new(leftBar, top, bar_index, bottom,
            border_color=color.orange,
            border_width=1,
            bgcolor=color.new(color.orange, 80))

// Update box khi OF còn hiệu lực  
updateOFBox(b, rightBar) =>
    box.set_right(b, rightBar)
```

### CHOCH Detection (Change of Character)
```pine
// Detect CHOCH: price breaks structure high/low
var float structureHigh = na
var float structureLow = na
var bool bullishBias = true

// Update structure
if ta.pivothigh(5, 5)
    structureHigh := ta.pivothigh(5, 5)
if ta.pivotlow(5, 5)
    structureLow := ta.pivotlow(5, 5)

// CHOCH
bullCHOCH = bullishBias and close < nz(structureLow)
bearCHOCH = not bullishBias and close > nz(structureHigh)
```

### Multi-timeframe structure
```pine
type HTFData
    float swingHigh
    float swingLow
    bool isBullish

getHTFData() =>
    sHigh = ta.highest(high, 20)
    sLow = ta.lowest(low, 20)
    HTFData.new(sHigh, sLow, close > ta.sma(close, 50))

htf4H = request.security(syminfo.tickerid, "240", getHTFData())
// Dùng: htf4H.swingHigh, htf4H.isBullish, etc.
```

### Khai báo var với label/line/box
```pine
// Label tái sử dụng (tốt hơn tạo mới mỗi bar)
var label myLbl = label.new(bar_index, high, "")
label.set_xy(myLbl, bar_index, high)
label.set_text(myLbl, "Price: " + str.tostring(close))

// Line từ điểm cũ đến hiện tại (cập nhật liên tục)
var line myLine = line.new(bar_index, close, bar_index, close)
line.set_xy2(myLine, bar_index, close)
```

### Boolean to number conversion
```pine
// v3+: booleans không tự convert sang number
bton(b) => b ? 1 : 0

// Đếm conditions true
count = bton(c1) + bton(c2) + bton(c3)
```

### Table thông tin (header + data)
```pine
var table infoTable = table.new(position.top_right, 2, 5,
                                  bgcolor=color.new(color.black, 70),
                                  border_width=1)

if barstate.islast
    table.cell(infoTable, 0, 0, "Indicator", text_color=color.gray, text_size=size.small)
    table.cell(infoTable, 1, 0, "Value", text_color=color.gray, text_size=size.small)
    table.cell(infoTable, 0, 1, "RSI", text_color=color.white, text_size=size.small)
    table.cell(infoTable, 1, 1, str.tostring(ta.rsi(close, 14), "#.##"), 
               text_color=ta.rsi(close, 14) > 70 ? color.red : color.green,
               text_size=size.small)
```

### Function overload cho MA type
```pine
calcMA(src, len, maType) =>
    switch maType
        "EMA" => ta.ema(src, len)
        "SMA" => ta.sma(src, len)
        "RMA" => ta.rma(src, len)
        "WMA" => ta.wma(src, len)
        "HMA" => ta.hma(src, len)
        => ta.ema(src, len)  // default
```

---

## MIGRATION NOTES

### v4 → v5 (quan trọng nhất)
| v4 | v5 |
|----|----|
| `study()` | `indicator()` |
| `security()` | `request.security()` |
| `sma()` | `ta.sma()` |
| `rsi()` | `ta.rsi()` |
| `highest()` | `ta.highest()` |
| `crossover()` | `ta.crossover()` |
| `abs()` | `math.abs()` |
| `tostring()` | `str.tostring()` |
| `heikinashi()` | `ticker.heikinashi()` |
| `resolution` param | `timeframe` param |
| `transp` param | `color.new(color, transp)` |
| `iff(c, t, f)` | `c ? t : f` |
| `offset(s, n)` | `s[n]` |
| `input(type=input.integer)` | `input.int()` |
| `strategy.entry(long)` | `strategy.entry(strategy.long)` |
| Session default "23456" | Session default "1234567" |

### v3 → v4 (quan trọng)
- Color constants: `red` → `color.red`
- `color()` → `color.new()`
- Plot styles: `histogram` → `plot.style_histogram`
- `period`, `isintraday` → `timeframe.period`, `timeframe.isintraday`
- `n` → `bar_index`
- `ticker`, `tickerid` → `syminfo.ticker`, `syminfo.tickerid`
- `interval` → `timeframe.multiplier`
- Phải explicit type khi dùng na: `float x = na`

### v2 → v3
- Self-referenced variables removed: `s = nz(s[1]) + x` phải viết: `s = 0.0; s := nz(s[1]) + x`
- Forward-referenced variables removed
- Lookahead_off là default (thay vì lookahead_on)
- Math với booleans bị cấm → dùng `bton(b)` = `b ? 1 : 0`

---

## RELEASE NOTES HIGHLIGHTS (v5 key features)

**December 2022**: Pine Objects (UDTs với `type` keyword), `ticker.standard()`
**November 2022**: `math.round_to_mintick()` fix với na
**October 2022**: Pine Script Editor mới, `fill()` vertical gradient, `str.format_time()`
**September 2022**: `text_font_family` monospace support trong labels/boxes/tables
**August 2022**: `label.style_text_outline`, `ta.pivot_point_levels()`, `box.text_wrap`, `ta.min()/ta.max()` all-time, `//@strategy_alert_message`
**July 2022**: `display` parameter cho plot*() functions: `display.data_window`, `display.pane`, `display.price_scale`, `display.status_line`
**June 2022**: `strategy.exit()` qty_percent từ initial position; `ta.vwap()` với anchor/stdev_mult; `timeframe.change()`; session.isfirstbar/islastbar variables; `strategy.close(immediately=true)`
**May 2022**: Matrix support trong `request.security()`; `[]` operator cho matrices; chart.bg_color/fg_color/is_standard; `request.security_lower_tf()`; `syminfo.prefix()/ticker()` functions
**April 2022**: `display` param cho barcolor/bgcolor/fill/hline; `request.economic()`; `strategy.max_runup`
**March 2022**: Array sort/percentile/binary search functions; table.merge_cells(); `array.new<type>` templates; `timeframe.in_seconds()`; `input.text_area()`
**February 2022**: `array.new<float>` templates; line/label/box.copy()
**January 2022**: Linefills; str.contains/pos/substring/replace/lower/upper/startswith/endswith/match(); box text support; last_bar_index/last_bar_time; hlcc4
**November 2021**: `for...in` operator; function overloads; currency conversion cho request.*()
**October 2021**: Pine Script v5 released! switch/while/libraries; runtime.error(); default function params; strategy trade info functions
