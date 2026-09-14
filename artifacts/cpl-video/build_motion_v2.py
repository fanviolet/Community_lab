from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
OUTPUT.mkdir(parents=True, exist_ok=True)

RW, RH = 1280, 720
OW, OH = 1920, 1080
FPS = 30
DURATION = 60

INK = "#111827"
NIGHT = "#09101F"
PANEL = "#15223A"
WHITE = "#F8FAFC"
MUTED = "#A9B7CC"
BLUE = "#2F7BFF"
CYAN = "#16C7D9"
VIOLET = "#7758F6"
CORAL = "#FF6B6B"
YELLOW = "#F6C84C"
GREEN = "#25C281"

FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_SEMIBOLD = Path("C:/Windows/Fonts/seguisb.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")


def font(size: int, bold: bool = False, semibold: bool = False):
    path = FONT_BOLD if bold else FONT_SEMIBOLD if semibold else FONT_REGULAR
    return ImageFont.truetype(str(path), size=size)


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def ease(v):
    v = clamp(v)
    return 1 - (1 - v) ** 3


def ease_in_out(v):
    v = clamp(v)
    return 4 * v**3 if v < 0.5 else 1 - (-2 * v + 2) ** 3 / 2


def spring(v):
    v = clamp(v)
    return 1 - math.exp(-7 * v) * math.cos(11 * v)


def local(t, start, duration):
    return clamp((t - start) / duration)


def mix(a, b, t):
    return a + (b - a) * t


def rgba(hex_color: str, alpha=255):
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def text_center(draw, xy, text, fnt, fill, anchor="mm"):
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor)


def brand(draw, alpha=255, y=52):
    draw.ellipse((58, y - 8, 78, y + 12), fill=rgba(CYAN, alpha))
    draw.ellipse((72, y - 8, 92, y + 12), fill=rgba(VIOLET, alpha))
    draw.text((104, y - 13), "COMMUNITY PROJECT LAB", font=font(17, semibold=True), fill=rgba(WHITE, alpha))


def background(t, base=NIGHT):
    img = Image.new("RGBA", (RW, RH), base)
    d = ImageDraw.Draw(img, "RGBA")
    # A quiet animated grid keeps every scene alive without fighting the message.
    shift = int((t * 18) % 64)
    for x in range(-64 + shift, RW + 64, 64):
        d.line((x, 0, x, RH), fill=(67, 92, 135, 24), width=1)
    for y in range(-64 + shift // 2, RH + 64, 64):
        d.line((0, y, RW, y), fill=(67, 92, 135, 20), width=1)
    for i in range(20):
        px = (i * 179 + t * (13 + i % 4)) % (RW + 80) - 40
        py = (i * 97 + math.sin(t * 0.7 + i) * 24) % RH
        r = 2 + i % 3
        col = rgba(CYAN if i % 3 else VIOLET, 55)
        d.ellipse((px - r, py - r, px + r, py + r), fill=col)
    return img


def add_glow(img, center, radius, color, alpha=90):
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    x, y = center
    gd.ellipse((x - radius, y - radius, x + radius, y + radius), fill=rgba(color, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    img.alpha_composite(glow)


def add_energy_overlay(img, t):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    x = ((t * 155) % (RW + 520)) - 260
    d.polygon([(x, 0), (x + 112, 0), (x + 350, RH), (x + 238, RH)], fill=rgba(CYAN, 22))
    x2 = ((t * 103 + 510) % (RW + 600)) - 300
    d.polygon([(x2, 0), (x2 + 76, 0), (x2 + 272, RH), (x2 + 196, RH)], fill=rgba(VIOLET, 16))
    progress_x = 38 + (RW - 76) * clamp(t / DURATION)
    d.line((38, RH - 18, RW - 38, RH - 18), fill=rgba(WHITE, 28), width=2)
    d.line((38, RH - 18, progress_x, RH - 18), fill=rgba(CYAN, 180), width=3)
    pulse = 4 + 2 * (math.sin(t * 5) + 1) / 2
    d.ellipse((progress_x - pulse, RH - 18 - pulse, progress_x + pulse, RH - 18 + pulse), fill=rgba(YELLOW, 235))
    return Image.alpha_composite(img, overlay)


def draw_node(d, x, y, r, color, pulse=0, ring=True):
    rr = r + 10 * pulse
    if ring:
        d.ellipse((x - rr - 9, y - rr - 9, x + rr + 9, y + rr + 9), outline=rgba(color, int(90 * (1 - pulse))), width=2)
    d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=rgba(color, 255))


def pop_text(d, t, start, pos, text, size, color=WHITE, anchor="mm", semibold=False):
    p = spring(local(t, start, 0.7))
    if p <= 0:
        return
    f = font(max(2, int(size * max(0.15, p))), bold=not semibold, semibold=semibold)
    x, y = pos
    text_center(d, (x, y + (1 - p) * 40), text, f, rgba(color, int(255 * clamp(p))), anchor=anchor)


def slide_text(d, t, start, pos, text, size, color=WHITE, from_x=-120, anchor="la", bold=True):
    p = ease(local(t, start, 0.65))
    x, y = pos
    d.text((x + (1 - p) * from_x, y), text, font=font(size, bold=bold), fill=rgba(color, int(255 * p)), anchor=anchor)


def rounded_card(img, box, fill=PANEL, outline="#2A3B5D", radius=18, alpha=255, shadow=True):
    if alpha <= 5:
        return
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        x1, y1, x2, y2 = box
        sd.rounded_rectangle((x1 + 8, y1 + 12, x2 + 8, y2 + 12), radius=radius, fill=(0, 0, 0, min(100, alpha // 2)))
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        img.alpha_composite(sh)
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle(box, radius=radius, fill=rgba(fill, alpha), outline=rgba(outline, alpha), width=2)


def scene_future(t):
    img = background(t)
    add_glow(img, (960, 350), 250, VIOLET, 65)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    slide_text(d, t, 0.2, (80, 126), "TƯƠNG LAI", 26, CYAN)
    slide_text(d, t, 0.6, (80, 185), "KHÔNG TỰ XẢY RA.", 61, WHITE)
    slide_text(d, t, 1.1, (80, 266), "Nó được xây từ những ý tưởng", 34, MUTED, from_x=-80, bold=False)
    slide_text(d, t, 1.35, (80, 309), "bắt đầu ngay hôm nay.", 34, YELLOW, from_x=-80)

    # Animated future city made only from vector geometry.
    base_y = 620
    buildings = [(725, 165, BLUE), (805, 235, VIOLET), (900, 195, CYAN), (990, 290, GREEN), (1090, 220, CORAL), (1180, 150, YELLOW)]
    city_p = ease(local(t, 1.3, 2.2))
    for idx, (x, h, col) in enumerate(buildings):
        hp = ease(local(t, 1.3 + idx * 0.12, 1.2))
        yy = base_y - h * hp
        d.rounded_rectangle((x, yy, x + 62, base_y), radius=8, fill=rgba(PANEL, 245), outline=rgba(col, 210), width=2)
        for wy in range(int(yy + 20), base_y - 15, 35):
            for wx in (x + 15, x + 38):
                lit = (idx + wy // 35 + int(t * 2)) % 3
                d.rectangle((wx, wy, wx + 10, wy + 13), fill=rgba(col if lit else MUTED, 190 if lit else 45))
    d.line((670, base_y, 1260, base_y), fill=rgba(WHITE, int(160 * city_p)), width=3)
    for idx in range(5):
        x = 760 + idx * 105
        y = 440 + math.sin(t * 1.8 + idx) * 20
        p = (math.sin(t * 3 + idx) + 1) / 2
        draw_node(d, x, y, 7, [CYAN, VIOLET, GREEN, CORAL, YELLOW][idx], p)
        if idx:
            prevx = 760 + (idx - 1) * 105
            prevy = 440 + math.sin(t * 1.8 + idx - 1) * 20
            d.line((prevx, prevy, x, y), fill=rgba(CYAN, 100), width=2)
    p = ease(local(t, 3.8, 0.8))
    d.rounded_rectangle((80, 500, 580, 570), radius=18, fill=rgba(WHITE, int(18 * p)), outline=rgba(CYAN, int(110 * p)), width=2)
    d.text((108, 518), "MỘT CỘNG ĐỒNG  •  VÔ SỐ TÁC ĐỘNG", font=font(23, semibold=True), fill=rgba(WHITE, int(255 * p)))
    return img


def scene_network(t):
    img = background(t, "#0B1427")
    add_glow(img, (640, 375), 300, BLUE, 50)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.1, (640, 138), "MỘT Ý TƯỞNG.", 56, WHITE)
    pop_text(d, t, 0.55, (640, 207), "HÀNG NGHÌN KẾT NỐI.", 56, CYAN)
    center = (640, 425)
    nodes = []
    for i in range(18):
        angle = i * math.tau / 18 + 0.15 * math.sin(t * 0.5)
        radius = 120 + (i % 3) * 58
        nodes.append((center[0] + math.cos(angle) * radius, center[1] + math.sin(angle) * radius))
    reveal = ease(local(t, 0.8, 2.8))
    count = max(1, int(len(nodes) * reveal))
    for i in range(count):
        x, y = nodes[i]
        d.line((center[0], center[1], x, y), fill=rgba(BLUE if i % 2 else VIOLET, 85), width=2)
        if i % 4 == 0 and count > i + 2:
            x2, y2 = nodes[(i + 2) % len(nodes)]
            d.line((x, y, x2, y2), fill=rgba(CYAN, 50), width=1)
    pulse = (math.sin(t * 3) + 1) / 2
    draw_node(d, *center, 38, VIOLET, pulse * 0.3)
    text_center(d, center, "CPL", font(27, bold=True), WHITE)
    colors = [CYAN, GREEN, YELLOW, CORAL, BLUE, VIOLET]
    for i in range(count):
        x, y = nodes[i]
        draw_node(d, x, y, 6 + i % 3, colors[i % len(colors)], (math.sin(t * 3 + i) + 1) / 4)
    labels = [(155, 396, "TRƯỜNG HỌC"), (1000, 370, "CỘNG ĐỒNG"), (192, 574, "NHÀ PHÁT TRIỂN"), (1005, 565, "TỔ CHỨC")]
    for i, (x, y, label) in enumerate(labels):
        p = ease(local(t, 2.2 + i * 0.18, 0.6))
        if p <= 0.01:
            continue
        d.rounded_rectangle((x, y, x + 178, y + 48), radius=14, fill=rgba(PANEL, int(245 * p)), outline=rgba(colors[i], int(190 * p)), width=2)
        text_center(d, (x + 89, y + 24), label, font(16, semibold=True), rgba(WHITE, int(255 * p)))
    return img


def scene_rewind(t):
    img = background(t, "#140F28")
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    # Speed streaks and reverse particles make the timeline reversal unmistakable.
    for i in range(26):
        y = 80 + (i * 53) % 600
        speed = 180 + (i % 5) * 80
        x = RW - ((t * speed + i * 91) % (RW + 300))
        d.line((x, y, x + 130 + i % 4 * 45, y), fill=rgba(CYAN if i % 2 else VIOLET, 60 + i % 4 * 25), width=2 + i % 3)
    pop_text(d, t, 0.1, (640, 185), "NHƯNG ĐỂ ĐẾN ĐÓ...", 37, MUTED)
    pop_text(d, t, 0.55, (640, 284), "HÃY TUA NGƯỢC.", 72, WHITE)
    y = 455
    d.line((160, y, 1120, y), fill=rgba(WHITE, 80), width=4)
    years = [(1040, "TƯƠNG LAI"), (790, "2030"), (535, "2028"), (250, "HÔM NAY")]
    travel = ease_in_out(local(t, 1.1, 2.5))
    for x, label in years:
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=rgba(MUTED, 180))
        text_center(d, (x, y + 47), label, font(19, semibold=True), MUTED)
    marker_x = mix(1040, 250, travel)
    draw_node(d, marker_x, y, 17, YELLOW, (math.sin(t * 6) + 1) / 4)
    d.polygon([(130, y), (168, y - 22), (168, y + 22)], fill=rgba(CYAN, 220))
    return img


def scene_now(t):
    img = background(t, "#0B1722")
    add_glow(img, (640, 390), 260, GREEN, 45)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.05, (640, 142), "NGAY LÚC NÀY", 24, CYAN)
    pop_text(d, t, 0.35, (640, 215), "MỘT VẤN ĐỀ ĐANG CHỜ", 53, WHITE)
    pop_text(d, t, 0.65, (640, 278), "NGƯỜI ĐẦU TIÊN LÊN TIẾNG.", 53, YELLOW)
    issues = [(270, 466, "RÁC THẢI", CORAL), (505, 510, "AN TOÀN", YELLOW), (770, 475, "GIÁO DỤC", BLUE), (1015, 520, "MÔI TRƯỜNG", GREEN)]
    for i, (x, y, label, col) in enumerate(issues):
        p = spring(local(t, 1.25 + i * 0.22, 0.65))
        rr = int(44 * max(0.1, p))
        dx = math.sin(t * 1.5 + i * 1.7) * 10
        dy = math.cos(t * 1.25 + i) * 8
        draw_node(d, x + dx, y + dy, rr, col, (math.sin(t * 3 + i) + 1) / 5)
        text_center(d, (x + dx, y + 76 + dy), label, font(18, semibold=True), rgba(WHITE, int(255 * clamp(p))))
    p = ease(local(t, 3.0, 0.75))
    if p > 0.01:
        d.rounded_rectangle((390, 612, 890, 670), radius=17, fill=rgba(WHITE, int(16 * p)), outline=rgba(CYAN, int(150 * p)), width=2)
        text_center(d, (640, 641), "CPL BẮT ĐẦU TỪ TÍN HIỆU NHỎ NHẤT", font(21, bold=True), rgba(WHITE, int(255 * p)))
    return img


def scene_flow(t):
    img = background(t, "#0A1120")
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    slide_text(d, t, 0.1, (72, 118), "CPL BIẾN TÍN HIỆU", 48, WHITE)
    slide_text(d, t, 0.42, (72, 178), "THÀNH HÀNH ĐỘNG.", 48, CYAN)
    steps = [
        ("01", "THAM GIA", BLUE), ("02", "PHÁT HIỆN", CORAL), ("03", "THẢO LUẬN", YELLOW),
        ("04", "GIẢI PHÁP", VIOLET), ("05", "TẠO DỰ ÁN", CYAN), ("06", "TRIỂN KHAI", GREEN),
        ("07", "LƯU TRI THỨC", BLUE),
    ]
    path_y = 412
    start_x, gap = 100, 180
    prog = ease(local(t, 0.85, 4.4))
    d.line((start_x, path_y, start_x + gap * 6 * prog, path_y), fill=rgba(CYAN, 190), width=6)
    for i, (num, label, col) in enumerate(steps):
        x = start_x + i * gap
        p = spring(local(t, 0.7 + i * 0.45, 0.7))
        if p <= 0:
            continue
        rr = int(31 * max(0.15, p))
        d.ellipse((x - rr, path_y - rr, x + rr, path_y + rr), fill=rgba(col, 255), outline=rgba(WHITE, 90), width=2)
        text_center(d, (x, path_y), num, font(max(10, int(18 * p)), bold=True), WHITE)
        text_center(d, (x, path_y + 72), label, font(15, semibold=True), rgba(WHITE, int(255 * clamp(p))))
        if i < 6 and prog > i / 6:
            arrow_x = x + gap * 0.72
            d.polygon([(arrow_x, path_y), (arrow_x - 12, path_y - 8), (arrow_x - 12, path_y + 8)], fill=rgba(CYAN, 220))
    if prog > 0.08:
        trail_x = start_x + ((t * 215) % (gap * 6 * max(prog, 0.1)))
        d.line((max(start_x, trail_x - 90), path_y, trail_x, path_y), fill=rgba(YELLOW, 170), width=8)
        draw_node(d, trail_x, path_y, 12, YELLOW, (math.sin(t * 7) + 1) / 5, ring=False)
    p = ease(local(t, 4.25, 0.8))
    d.rounded_rectangle((300, 570, 980, 640), radius=18, fill=rgba(PANEL, int(245 * p)), outline=rgba(VIOLET, int(190 * p)), width=2)
    text_center(d, (640, 605), "MỘT QUY TRÌNH  •  MỘT NGUỒN DỮ LIỆU  •  TÁC ĐỘNG RÕ RÀNG", font(20, semibold=True), rgba(WHITE, int(255 * p)))
    return img


def scene_ai(t):
    img = background(t, "#111026")
    add_glow(img, (640, 410), 260, VIOLET, 80)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.05, (640, 130), "AI KHÔNG QUYẾT ĐỊNH THAY BẠN.", 44, WHITE)
    pop_text(d, t, 0.5, (640, 185), "AI GIÚP BẠN NHÌN RÕ HƠN.", 35, CYAN)
    center = (640, 420)
    orbit = 145
    labels = [("PHÂN TÍCH", BLUE), ("GỢI Ý", YELLOW), ("LẬP KẾ HOẠCH", GREEN), ("HỌC TỪ DỮ LIỆU", CORAL)]
    for i, (label, col) in enumerate(labels):
        angle = t * 0.48 + i * math.tau / 4
        x = center[0] + math.cos(angle) * orbit * 1.55
        y = center[1] + math.sin(angle) * orbit * 0.78
        d.line((center[0], center[1], x, y), fill=rgba(col, 95), width=2)
        rounded_card(img, (x - 105, y - 31, x + 105, y + 31), fill=PANEL, outline=col, radius=15, alpha=245, shadow=False)
        d = ImageDraw.Draw(img, "RGBA")
        text_center(d, (x, y), label, font(15, semibold=True), WHITE)
    pulse = (math.sin(t * 4) + 1) / 2
    draw_node(d, *center, 75, VIOLET, pulse * 0.15)
    text_center(d, center, "AI", font(52, bold=True), WHITE)
    for i in range(12):
        angle = -t * 0.9 + i * math.tau / 12
        x = center[0] + math.cos(angle) * (105 + 8 * math.sin(t + i))
        y = center[1] + math.sin(angle) * (105 + 8 * math.sin(t + i))
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=rgba(CYAN if i % 2 else YELLOW, 220))
    p = ease(local(t, 3.5, 0.8))
    text_center(d, (640, 642), "CON NGƯỜI GIỮ QUYỀN QUYẾT ĐỊNH", font(24, bold=True), rgba(WHITE, int(255 * p)))
    return img


def scene_workspace(t):
    img = background(t, "#071520")
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    slide_text(d, t, 0.05, (72, 112), "MỘT KHÔNG GIAN CHUNG.", 45, WHITE)
    slide_text(d, t, 0.42, (72, 166), "CHO NGƯỜI DÙNG VÀ NHÀ PHÁT TRIỂN.", 31, CYAN)
    # Animated, fully illustrated product board.
    board = (72, 245, 875, 655)
    rounded_card(img, board, fill="#F7F9FD", outline="#DCE4F2", radius=20, alpha=255)
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle((72, 245, 875, 295), radius=20, fill=rgba("#EAF0F8", 255))
    d.rectangle((72, 275, 875, 295), fill=rgba("#EAF0F8", 255))
    for i, col in enumerate((CORAL, YELLOW, GREEN)):
        d.ellipse((94 + i * 25, 262, 106 + i * 25, 274), fill=rgba(col, 255))
    columns = [(98, "Ý TƯỞNG", BLUE), (352, "ĐANG LÀM", YELLOW), (606, "HOÀN THÀNH", GREEN)]
    for ci, (x, title, col) in enumerate(columns):
        d.text((x, 320), title, font=font(16, semibold=True), fill=rgba(INK, 255))
        for j in range(3):
            p = spring(local(t, 0.65 + ci * 0.2 + j * 0.17, 0.65))
            yy = 360 + j * 83 + (1 - p) * 40
            d.rounded_rectangle((x, yy, x + 216, yy + 60), radius=12, fill=rgba("#FFFFFF", int(255 * p)), outline=rgba("#D9E2F0", int(255 * p)), width=1)
            d.rectangle((x + 14, yy + 15, x + 20, yy + 45), fill=rgba(col, int(255 * p)))
            d.rounded_rectangle((x + 34, yy + 14, x + 170, yy + 23), radius=4, fill=rgba("#B8C5D8", int(160 * p)))
            d.rounded_rectangle((x + 34, yy + 32, x + 142, yy + 40), radius=4, fill=rgba("#D7DFEA", int(210 * p)))
    scan_x = 86 + ((t * 125) % 770)
    board_fx = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bfd = ImageDraw.Draw(board_fx, "RGBA")
    bfd.rectangle((scan_x, 300, scan_x + 72, 642), fill=rgba(CYAN, 36))
    img.alpha_composite(board_fx)
    d = ImageDraw.Draw(img, "RGBA")
    cursor_y = 342 + ((t * 46) % 250)
    d.polygon([(845, cursor_y), (860, cursor_y + 26), (852, cursor_y + 24), (859, cursor_y + 39), (850, cursor_y + 43), (842, cursor_y + 27), (835, cursor_y + 34)], fill=rgba(BLUE, 230))
    dev_items = [("WEB", BLUE), ("REALTIME", GREEN), ("AI", VIOLET), ("DATA", CORAL)]
    for i, (txt, col) in enumerate(dev_items):
        y = 284 + i * 82
        p = ease(local(t, 1.4 + i * 0.22, 0.6))
        rounded_card(img, (940, y, 1198, y + 58), fill=PANEL, outline=col, radius=15, alpha=int(245 * p), shadow=False)
        d = ImageDraw.Draw(img, "RGBA")
        d.ellipse((960, y + 19, 980, y + 39), fill=rgba(col, int(255 * p)))
        d.text((997, y + 16), txt, font=font(19, bold=True), fill=rgba(WHITE, int(255 * p)))
    text_center(d, (1068, 640), "SẴN SÀNG MỞ RỘNG", font(17, semibold=True), MUTED)
    return img


def scene_scale(t):
    img = background(t, "#101729")
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.05, (640, 110), "MỤC TIÊU NĂM ĐẦU TIÊN", 43, WHITE)
    pop_text(d, t, 0.42, (640, 158), "BẮT ĐẦU NHỎ. TẠO ĐÀ ĐỂ NHÂN RỘNG.", 25, CYAN)
    stats = [(500, "HỌC SINH", BLUE), (50, "Ý TƯỞNG", CORAL), (20, "DỰ ÁN", GREEN), (100, "TÀI LIỆU", VIOLET)]
    for i, (target, label, col) in enumerate(stats):
        x = 95 + i * 298
        p = ease(local(t, 0.85 + i * 0.15, 1.7))
        rounded_card(img, (x, 255, x + 250, 455), fill=PANEL, outline=col, radius=18, alpha=int(245 * max(0.08, p)))
        d = ImageDraw.Draw(img, "RGBA")
        value = int(target * p)
        suffix = "+" if target in (500, 100) else ""
        text_center(d, (x + 125, 332), f"{value}{suffix}", font(48, bold=True), rgba(col, int(255 * p)))
        text_center(d, (x + 125, 401), label, font(19, semibold=True), rgba(WHITE, int(255 * p)))
        wave = (math.sin(t * 2.4 + i * 1.3) + 1) / 2
        d.arc((x + 26, 277, x + 224, 437), 205, 205 + int(115 * wave), fill=rgba(col, 130), width=3)
    p = ease(local(t, 2.3, 1.1))
    d.rounded_rectangle((250, 526, 1030, 607), radius=20, fill=rgba(WHITE, int(18 * p)), outline=rgba(YELLOW, int(150 * p)), width=2)
    text_center(d, (640, 554), "30–50%", font(31, bold=True), rgba(YELLOW, int(255 * p)))
    text_center(d, (640, 589), "MỤC TIÊU GIẢM THỜI GIAN QUẢN LÝ", font(18, semibold=True), rgba(WHITE, int(255 * p)))
    for i in range(13):
        px = 105 + i * 90
        py = 486 + math.sin(t * 3.2 + i * 0.72) * 10
        d.ellipse((px - 5, py - 5, px + 5, py + 5), fill=rgba([BLUE, CORAL, GREEN, VIOLET][i % 4], 210))
        if i:
            prev_x = 105 + (i - 1) * 90
            prev_y = 486 + math.sin(t * 3.2 + (i - 1) * 0.72) * 10
            d.line((prev_x, prev_y, px, py), fill=rgba(CYAN, 85), width=2)
    # Scale ladder appears last.
    labels = ["1 TRƯỜNG", "NHIỀU CỘNG ĐỒNG", "MẠNG LƯỚI ĐỊA PHƯƠNG"]
    for i, label in enumerate(labels):
        pp = ease(local(t, 3.5 + i * 0.28, 0.55))
        x = 294 + i * 350
        d.text((x, 666), label, font=font(15, semibold=True), fill=rgba(MUTED if i < 2 else CYAN, int(255 * pp)), anchor="mm")
        if i < 2:
            d.line((x + 95, 666, x + 235, 666), fill=rgba(CYAN, int(180 * pp)), width=3)
            d.polygon([(x + 235, 666), (x + 222, 658), (x + 222, 674)], fill=rgba(CYAN, int(220 * pp)))
    return img


def scene_cta(t):
    img = background(t, "#080D18")
    add_glow(img, (640, 365), 300, BLUE, 65)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.0, (640, 178), "ĐỪNG CHỜ TƯƠNG LAI.", 54, MUTED)
    pop_text(d, t, 0.45, (640, 258), "HÃY BẮT ĐẦU TỪ", 56, WHITE)
    pop_text(d, t, 0.7, (640, 330), "MỘT VẤN ĐỀ.", 68, YELLOW)
    p = spring(local(t, 1.35, 0.8))
    breathe = 1 + 0.055 * math.sin(t * 3.2)
    r = 62 * max(0.1, p) * breathe
    orbit = 22 + 7 * math.sin(t * 2.1)
    d.ellipse((640 - r - orbit, 440 - r, 640 + r - orbit, 440 + r), fill=rgba(CYAN, int(255 * clamp(p))))
    d.ellipse((640 - r + orbit, 440 - r, 640 + r + orbit, 440 + r), fill=rgba(VIOLET, int(255 * clamp(p))))
    text_center(d, (640, 542), "COMMUNITY PROJECT LAB", font(31, bold=True), rgba(WHITE, int(255 * clamp(p))))
    q = ease(local(t, 1.85, 0.65))
    d.rounded_rectangle((410, 590, 870, 648), radius=18, fill=rgba(BLUE, int(255 * q)))
    text_center(d, (640, 619), "COMMUNITY-LAB.VERCEL.APP", font(20, bold=True), rgba(WHITE, int(255 * q)))
    return img


SCENES = [
    (0, 7, scene_future),
    (7, 14, scene_network),
    (14, 19, scene_rewind),
    (19, 25, scene_now),
    (25, 34, scene_flow),
    (34, 42, scene_ai),
    (42, 49, scene_workspace),
    (49, 56, scene_scale),
    (56, 60, scene_cta),
]


def render_at(t):
    for index, (start, end, renderer) in enumerate(SCENES):
        if t < end or index == len(SCENES) - 1:
            img = renderer(t - start)
            img = Image.alpha_composite(Image.new("RGBA", img.size, rgba(NIGHT)), img)
            # Fast luminous wipes keep the edit energetic while preserving legibility.
            transition = 0.42
            if index < len(SCENES) - 1 and t > end - transition:
                p = ease_in_out((t - (end - transition)) / transition)
                nxt = SCENES[index + 1][2](0)
                nxt = Image.alpha_composite(Image.new("RGBA", nxt.size, rgba(NIGHT)), nxt)
                mask = Image.new("L", (RW, RH), 0)
                md = ImageDraw.Draw(mask)
                edge = int((RW + 220) * p) - 110
                if edge > 0:
                    md.rectangle((0, 0, min(edge, RW), RH), fill=255)
                md.polygon([(edge, 0), (edge + 180, 0), (edge - 40, RH), (edge - 220, RH)], fill=200)
                img = Image.composite(nxt, img, mask)
                dd = ImageDraw.Draw(img, "RGBA")
                dd.polygon([(edge - 16, 0), (edge + 8, 0), (edge - 210, RH), (edge - 234, RH)], fill=rgba(CYAN, 180))
            return add_energy_overlay(img, t).convert("RGB")
    return scene_cta(4).convert("RGB")


def synth_music(path: Path):
    sr = 44100
    total = DURATION * sr
    audio = np.zeros((total, 2), dtype=np.float64)
    bpm = 128
    beat = 60 / bpm
    rng = np.random.default_rng(24)

    def add(start, sound, pan=0.0, gain=1.0):
        idx = int(start * sr)
        if idx >= total:
            return
        sound = sound[: total - idx] * gain
        left = math.sqrt((1 - pan) / 2)
        right = math.sqrt((1 + pan) / 2)
        audio[idx : idx + len(sound), 0] += sound * left
        audio[idx : idx + len(sound), 1] += sound * right

    def kick():
        n = int(0.28 * sr)
        tt = np.arange(n) / sr
        phase = 2 * np.pi * (78 * tt - 48 * tt**2)
        return np.sin(phase) * np.exp(-tt * 15)

    def snare():
        n = int(0.24 * sr)
        tt = np.arange(n) / sr
        noise = rng.normal(0, 1, n)
        body = np.sin(2 * np.pi * 180 * tt)
        return (0.7 * noise + 0.3 * body) * np.exp(-tt * 18)

    def hat(open_hat=False):
        dur = 0.16 if open_hat else 0.055
        n = int(dur * sr)
        tt = np.arange(n) / sr
        noise = rng.normal(0, 1, n)
        noise = np.concatenate(([0], np.diff(noise)))
        return noise * np.exp(-tt * (24 if open_hat else 70))

    def tone(freq, dur, decay=2.5):
        n = int(dur * sr)
        tt = np.arange(n) / sr
        wobble = 0.08 * np.sin(2 * np.pi * 1.8 * tt)
        return (np.sin(2 * np.pi * freq * tt + wobble) + 0.28 * np.sin(2 * np.pi * freq * 2 * tt)) * np.exp(-tt * decay)

    def impact():
        n = int(0.9 * sr)
        tt = np.arange(n) / sr
        noise = rng.normal(0, 1, n)
        return (0.75 * np.sin(2 * np.pi * (95 * tt - 40 * tt**2)) + 0.18 * noise) * np.exp(-tt * 5)

    # Warm future pad and a rising pulse.
    for start in np.arange(0, DURATION, beat * 4):
        chord_roots = [110.0, 130.81, 98.0, 146.83]
        root = chord_roots[int(start / (beat * 4)) % len(chord_roots)]
        for ratio, pan in ((1, -0.32), (1.5, 0.28), (2, 0.08)):
            add(start, tone(root * ratio, beat * 4, 0.55), pan, 0.065)

    # Beat enters early, drops for rewind, then returns with more energy.
    for b, start in enumerate(np.arange(0, DURATION, beat)):
        active = not (14 <= start < 18.3)
        gain = 0.70 if start < 7 else 0.88
        if active:
            add(start, kick(), 0, gain)
            if b % 4 in (1, 3):
                add(start, snare(), 0.06, 0.28)
            add(start + beat / 2, hat(), (-1) ** b * 0.38, 0.13)
            if start >= 19:
                add(start + beat * 0.75, hat(), -0.18, 0.08)
        else:
            # Reverse section uses ascending ticks instead of the main beat.
            freq = 420 + (start - 14) * 95
            add(start, tone(freq, 0.18, 18), (-1) ** b * 0.5, 0.12)

    roots = [55.0, 65.41, 49.0, 73.42]
    for n, start in enumerate(np.arange(7, DURATION, beat / 2)):
        if 14 <= start < 19:
            continue
        root = roots[(n // 8) % len(roots)]
        pattern = [1, 1.5, 2, 1.5, 1.25, 1.5, 2, 2.25]
        add(start, tone(root * pattern[n % 8], beat * 0.42, 7.0), -0.12 if n % 2 else 0.12, 0.13)

    for cut in [0, 7, 14, 19, 25, 34, 42, 49, 56]:
        add(cut, impact(), 0, 0.34 if cut else 0.22)

    # Noise riser into the CTA.
    riser_start, riser_dur = 54.0, 2.0
    n = int(riser_dur * sr)
    tt = np.arange(n) / sr
    noise = rng.normal(0, 1, n)
    envelope = (tt / riser_dur) ** 2
    riser = np.concatenate(([0], np.diff(noise))) * envelope
    add(riser_start, riser, 0, 0.10)

    # Gentle master compression, fade-in and fade-out.
    audio = np.tanh(audio * 1.25)
    fade = int(0.8 * sr)
    audio[:fade] *= np.linspace(0, 1, fade)[:, None]
    audio[-fade:] *= np.linspace(1, 0, fade)[:, None]
    peak = np.max(np.abs(audio)) or 1
    audio = (audio / peak * 0.92 * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio.tobytes())


def render_video():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    raw_video = OUTPUT / "CPL-motion-graphic-v2-silent.mp4"
    music = OUTPUT / "CPL-motion-graphic-v2-music.wav"
    final = OUTPUT / "CPL-motion-graphic-v2-60s.mp4"
    synth_music(music)

    cmd = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{RW}x{RH}", "-r", str(FPS), "-i", "-",
        "-vf", f"scale={OW}:{OH}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart", str(raw_video),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for frame in range(DURATION * FPS):
        t = frame / FPS
        proc.stdin.write(render_at(t).tobytes())
        if frame % (FPS * 5) == 0:
            print(f"Rendered {frame // FPS:02d}/{DURATION}s", flush=True)
    proc.stdin.close()
    code = proc.wait()
    if code:
        raise RuntimeError(f"Video encoder failed with code {code}")

    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(raw_video), "-i", str(music),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-t", str(DURATION), "-movflags", "+faststart", str(final),
    ], check=True)
    print(final)


if __name__ == "__main__":
    render_video()
