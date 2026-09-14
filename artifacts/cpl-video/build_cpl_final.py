from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import build_motion_v2 as b


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
OUTPUT.mkdir(parents=True, exist_ok=True)

RW, RH = b.RW, b.RH
OW, OH = b.OW, b.OH
FPS = b.FPS
DURATION = 60

NIGHT = "#080E19"
PAST = "#11151E"
INK = b.INK
PANEL = b.PANEL
WHITE = b.WHITE
MUTED = b.MUTED
BLUE = b.BLUE
CYAN = b.CYAN
VIOLET = b.VIOLET
CORAL = b.CORAL
YELLOW = b.YELLOW
GREEN = b.GREEN

AUDIO_SOURCE = Path(r"D:\music\music1\y2mate.com - 05  Counterattack Mankind  High Quality.mp3")


def f(size, bold=False, semibold=False):
    return b.font(size, bold=bold, semibold=semibold)


def opaque(img):
    return Image.alpha_composite(Image.new("RGBA", img.size, b.rgba(NIGHT)), img)


def scene_label(d, text, color=MUTED):
    d.rounded_rectangle((58, 78, 198, 110), radius=10, fill=b.rgba(color, 35), outline=b.rgba(color, 130), width=1)
    b.text_center(d, (128, 94), text, f(14, semibold=True), color)


def avatar(d, x, y, color, scale=1.0, active=True):
    alpha = 255 if active else 100
    r = 17 * scale
    d.ellipse((x - r, y - 46 * scale, x + r, y - 12 * scale), fill=b.rgba(color, alpha))
    d.rounded_rectangle((x - 28 * scale, y - 8 * scale, x + 28 * scale, y + 53 * scale), radius=int(16 * scale), fill=b.rgba(color, alpha))


def signal(d, x, y, t, color=CORAL, radius=15, rings=2):
    pulse = (math.sin(t * 4.5) + 1) / 2
    for i in range(rings):
        rr = radius + 12 + i * 15 + pulse * 8
        alpha = int(100 * (1 - pulse * 0.45) / (i + 1))
        d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=b.rgba(color, alpha), width=2)
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=b.rgba(color, 255))


def connector_particle(d, x1, y1, x2, y2, t, offset, color=CYAN):
    p = (t * 0.65 + offset) % 1
    x = b.mix(x1, x2, p)
    y = b.mix(y1, y2, p)
    d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=b.rgba(color, 230))


def scene_problem(t):
    img = b.background(t, PAST)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    scene_label(d, "TRƯỚC CPL", CORAL)

    # A stylized community map with one ignored problem signal.
    points = [(150, 240), (345, 178), (552, 260), (760, 190), (960, 272), (1110, 176), (240, 535), (480, 470), (790, 530), (1060, 485)]
    links = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (0, 6), (2, 7), (4, 8), (5, 9), (6, 7), (7, 8), (8, 9)]
    for a, c in links:
        d.line((*points[a], *points[c]), fill=b.rgba("#687386", 42), width=2)
    for i, (x, y) in enumerate(points):
        rr = 6 + 2 * math.sin(t * 1.4 + i)
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=b.rgba("#778196", 80))

    sx, sy = 640, 410
    signal(d, sx, sy, t, CORAL, 17, 3)
    for i, (x, y) in enumerate([(260, 350), (440, 600), (905, 370), (1055, 610)]):
        drift = math.sin(t * 0.8 + i) * 10
        avatar(d, x + drift, y, "#687386", 0.65, active=False)

    b.pop_text(d, t, 0.2, (640, 148), "MỘT VẤN ĐỀ XUẤT HIỆN.", 48, WHITE)
    b.pop_text(d, t, 1.0, (640, 618), "NHƯNG TÍN HIỆU KHÔNG ĐI ĐẾN ĐÂU.", 23, MUTED)
    return img


def scene_stuck(t):
    img = b.background(t, PAST)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    scene_label(d, "TRƯỚC CPL", CORAL)
    b.slide_text(d, t, 0.1, (68, 145), "Ý TƯỞNG CÓ.", 52, WHITE)
    b.slide_text(d, t, 0.45, (68, 207), "NHƯNG ĐƯỜNG ĐI THÌ KHÔNG.", 42, CORAL)

    # The signal becomes a bulb, then hits disconnected tools.
    travel = b.ease_in_out(b.local(t, 0.7, 3.7))
    bx = b.mix(220, 1015, travel)
    by = 410 + math.sin(t * 3) * 8
    d.ellipse((bx - 34, by - 43, bx + 34, by + 25), fill=b.rgba(YELLOW, 230), outline=b.rgba(WHITE, 100), width=2)
    d.rounded_rectangle((bx - 17, by + 20, bx + 17, by + 48), radius=6, fill=b.rgba("#657083", 255))
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        d.line((bx + math.cos(rad) * 48, by - 10 + math.sin(rad) * 48, bx + math.cos(rad) * 61, by - 10 + math.sin(rad) * 61), fill=b.rgba(YELLOW, 150), width=3)

    blockers = [(425, "BIỂU MẪU", "#576174"), (650, "TIN NHẮN", "#576174"), (875, "BẢNG VIỆC", "#576174")]
    for i, (x, label, col) in enumerate(blockers):
        pp = b.spring(b.local(t, 0.8 + i * 0.28, 0.65))
        y = 345 + (i % 2) * 105 + math.sin(t * 2.1 + i * 1.3) * 8
        if pp > 0.02:
            d.rounded_rectangle((x - 78, y - 55, x + 78, y + 55), radius=15, fill=b.rgba(PANEL, 245), outline=b.rgba(col, 220), width=2)
            b.text_center(d, (x, y), label, f(16, semibold=True), MUTED)
            d.line((x, y + 68, x, y + 130), fill=b.rgba(CORAL, 90), width=3)

    if travel > 0.82:
        for i in range(5):
            angle = i * math.tau / 5 + t
            x = bx + math.cos(angle) * 65
            y = by + math.sin(angle) * 50
            d.rectangle((x - 3, y - 3, x + 3, y + 3), fill=b.rgba(CORAL, 210))
        warning = Image.new("RGBA", img.size, (0, 0, 0, 0))
        wd = ImageDraw.Draw(warning, "RGBA")
        scan_y = 286 + ((t * 125) % 295)
        wd.rectangle((332, scan_y, 1095, scan_y + 54), fill=b.rgba(CORAL, 24))
        wd.line((332, scan_y, 1095, scan_y), fill=b.rgba(CORAL, 105), width=2)
        img.alpha_composite(warning)
        d = ImageDraw.Draw(img, "RGBA")
    b.pop_text(d, t, 3.75, (640, 625), "CÔNG CỤ RỜI RẠC. TIẾN ĐỘ DỄ ĐỨT GÃY.", 22, MUTED)
    return img


def scene_gaps(t):
    img = b.background(t, PAST)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    scene_label(d, "4 KHOẢNG TRỐNG", CORAL)
    b.pop_text(d, t, 0.05, (640, 138), "MỖI NGƯỜI NHÌN THẤY MỘT PHẦN.", 39, WHITE)

    cards = [
        (70, 225, "HỌC SINH", "Không biết bắt đầu", BLUE),
        (655, 225, "GIÁO VIÊN", "Khó theo dõi, hỗ trợ", YELLOW),
        (70, 440, "TỔ CHỨC", "Nguồn lực chưa gặp ý tưởng", GREEN),
        (655, 440, "CỘNG ĐỒNG", "Kinh nghiệm bị bỏ lại", VIOLET),
    ]
    centers = []
    for i, (x, y, role, body, col) in enumerate(cards):
        p = b.spring(b.local(t, 0.35 + i * 0.18, 0.65))
        yy = y + (1 - p) * 35
        d.rounded_rectangle((x, yy, x + 555, yy + 160), radius=18, fill=b.rgba(PANEL, 245), outline=b.rgba(col, 165), width=2)
        avatar(d, x + 65, yy + 87, col, 0.62)
        d.text((x + 120, yy + 37), role, font=f(18, bold=True), fill=b.rgba(col, 255))
        d.text((x + 120, yy + 79), body, font=f(20, semibold=True), fill=b.rgba(WHITE, 245))
        centers.append((x + 277, yy + 80))

    # Broken hand-off lines flicker, then the signal drops.
    for i in range(3):
        if int(t * 5 + i) % 3:
            x1, y1 = centers[i]
            x2, y2 = centers[i + 1]
            midx, midy = (x1 + x2) / 2, (y1 + y2) / 2
            d.line((x1, y1, midx - 22, midy - 12), fill=b.rgba(CORAL, 80), width=2)
            d.line((midx + 22, midy + 12, x2, y2), fill=b.rgba(CORAL, 80), width=2)
    fall = b.ease_in_out(b.local(t, 3.0, 2.3))
    sx, sy = 640, b.mix(270, 690, fall)
    signal(d, sx, sy, t, CORAL, 13, 2)
    b.pop_text(d, t, 3.35, (640, 668), "Ý TƯỞNG DỪNG LẠI.", 27, CORAL)
    return img


def scene_reveal(t):
    img = b.background(t, "#0E1025")
    b.add_glow(img, (640, 390), 260, VIOLET, 70)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    scene_label(d, "CPL XUẤT HIỆN", CYAN)

    rise = b.spring(b.local(t, 0.1, 1.4))
    cy = b.mix(665, 370, rise)
    split = b.ease(b.local(t, 0.9, 1.0))
    offset = 25 * split
    radius = 50 * max(0.25, rise)
    d.ellipse((640 - offset - radius, cy - radius, 640 - offset + radius, cy + radius), fill=b.rgba(CYAN, 255))
    d.ellipse((640 + offset - radius, cy - radius, 640 + offset + radius, cy + radius), fill=b.rgba(VIOLET, 245))

    for i in range(14):
        angle = i * math.tau / 14 + t * 0.65
        orbit = 120 + i % 3 * 26
        px = 640 + math.cos(angle) * orbit
        py = cy + math.sin(angle) * orbit * 0.58
        rr = 3 + i % 4
        d.ellipse((px - rr, py - rr, px + rr, py + rr), fill=b.rgba([BLUE, GREEN, YELLOW, CORAL][i % 4], 190))

    b.pop_text(d, t, 1.25, (640, 185), "RỒI MỌI THỨ", 46, WHITE)
    b.pop_text(d, t, 1.65, (640, 242), "ĐƯỢC KẾT NỐI.", 50, CYAN)
    b.pop_text(d, t, 2.35, (640, 555), "COMMUNITY PROJECT LAB", 28, WHITE)
    b.pop_text(d, t, 2.8, (640, 605), "VẤN ĐỀ → GIẢI PHÁP → HÀNH ĐỘNG", 21, MUTED)
    return img


def persona_header(d, t, role, quote, color):
    scene_label(d, "VỚI CPL", color)
    b.slide_text(d, t, 0.05, (64, 137), role, 24, color)
    b.slide_text(d, t, 0.32, (64, 184), quote, 37, WHITE)


def scene_student(t):
    img = b.background(t, "#081522")
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    persona_header(d, t, "GÓC NHÌN HỌC SINH", "“TÔI BIẾT BẮT ĐẦU TỪ ĐÂU.”", BLUE)

    avatar(d, 150, 430 + math.sin(t * 1.4) * 6, BLUE, 1.0)
    d.rounded_rectangle((245, 285, 590, 550), radius=20, fill=b.rgba(PANEL, 250), outline=b.rgba(BLUE, 180), width=2)
    d.text((275, 318), "VẤN ĐỀ", font=f(18, bold=True), fill=b.rgba(CORAL, 255))
    prompts = ["Điều gì đang xảy ra?", "Ai đang bị ảnh hưởng?", "Nguyên nhân nằm ở đâu?"]
    for i, text in enumerate(prompts):
        p = b.ease(b.local(t, 0.7 + i * 0.28, 0.65))
        y = 370 + i * 53
        d.rounded_rectangle((275, y, 552, y + 36), radius=10, fill=b.rgba("#233553", 245), outline=b.rgba(CYAN, int(100 + p * 80)), width=1)
        d.text((292, y + 9), text, font=f(15, semibold=True), fill=b.rgba(WHITE, int(130 + p * 125)))

    steps = [("1", "THAM GIA"), ("2", "PHÁT HIỆN"), ("3", "THẢO LUẬN"), ("4", "GIẢI PHÁP"), ("5", "DỰ ÁN"), ("6", "THỰC HIỆN"), ("7", "TRI THỨC")]
    x0, y0, gap = 670, 420, 83
    progress = b.ease(b.local(t, 1.5, 3.1))
    d.line((x0, y0, x0 + gap * 6 * progress, y0), fill=b.rgba(CYAN, 210), width=5)
    for i, (num, label) in enumerate(steps):
        p = b.spring(b.local(t, 1.25 + i * 0.32, 0.6))
        x = x0 + i * gap
        rr = max(3, int(22 * p))
        d.ellipse((x - rr, y0 - rr, x + rr, y0 + rr), fill=b.rgba([BLUE, CORAL, YELLOW, VIOLET, CYAN, GREEN, BLUE][i], 255))
        b.text_center(d, (x, y0), num, f(max(8, int(14 * max(p, 0.5))), bold=True), WHITE)
        if i in (0, 2, 4, 6):
            b.text_center(d, (x, y0 + 55), label, f(11, semibold=True), MUTED)
    spark_x = x0 + ((t * 145) % (gap * 6))
    signal(d, spark_x, y0, t, YELLOW, 6, 1)
    d.rounded_rectangle((690, 540, 1135, 596), radius=15, fill=b.rgba(VIOLET, 38), outline=b.rgba(VIOLET, 150), width=2)
    b.text_center(d, (912, 568), "AI GỢI MỞ. BẠN LÀ NGƯỜI QUYẾT ĐỊNH.", f(17, semibold=True), WHITE)
    return img


def scene_teacher(t):
    img = b.background(t, "#0A1420")
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    persona_header(d, t, "GÓC NHÌN GIÁO VIÊN / NHÀ TRƯỜNG", "“TÔI THẤY ĐÚNG LÚC CẦN HỖ TRỢ.”", YELLOW)

    b.rounded_card(img, (70, 272, 1160, 638), fill="#F4F7FB", outline="#DCE4EF", radius=18, alpha=255)
    d = ImageDraw.Draw(img, "RGBA")
    columns = [(105, "CẦN LÀM", BLUE), (445, "CẦN HỖ TRỢ", CORAL), (785, "HOÀN THÀNH", GREEN)]
    for x, title, col in columns:
        d.text((x, 305), title, font=f(17, bold=True), fill=b.rgba(INK, 255))
        d.line((x, 337, x + 278, 337), fill=b.rgba(col, 160), width=4)
    for col in range(3):
        for row in range(2):
            x, y = 105 + col * 340, 365 + row * 104
            d.rounded_rectangle((x, y, x + 278, y + 78), radius=12, fill=b.rgba("#FFFFFF", 255), outline=b.rgba("#D8E0EC", 255), width=1)
            d.rectangle((x + 14, y + 15, x + 20, y + 63), fill=b.rgba(columns[col][2], 255))
            d.rounded_rectangle((x + 36, y + 18, x + 210, y + 29), radius=5, fill=b.rgba("#AEBBCD", 180))
            d.rounded_rectangle((x + 36, y + 43, x + 160, y + 52), radius=4, fill=b.rgba("#D4DCE8", 230))

    move = b.ease_in_out((t * 0.26) % 1)
    task_x = b.mix(122, 802, move)
    task_y = 580 - math.sin(move * math.pi) * 95
    d.rounded_rectangle((task_x, task_y, task_x + 252, task_y + 60), radius=12, fill=b.rgba("#FFFFFF", 255), outline=b.rgba(CORAL if move < 0.55 else GREEN, 255), width=3)
    d.text((task_x + 22, task_y + 18), "KẾ HOẠCH TRUYỀN THÔNG", font=f(14, bold=True), fill=b.rgba(INK, 255))
    scan_x = 82 + ((t * 160) % 1050)
    fx = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(fx).rectangle((scan_x, 345, scan_x + 70, 620), fill=b.rgba(CYAN, 26))
    img.alpha_composite(fx)
    return img


def scene_org(t):
    img = b.background(t, "#071620")
    b.add_glow(img, (640, 430), 265, GREEN, 45)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    persona_header(d, t, "GÓC NHÌN TỔ CHỨC", "“NGUỒN LỰC ĐẾN ĐÚNG DỰ ÁN.”", GREEN)

    center = (640, 430)
    d.ellipse((center[0] - 82, center[1] - 82, center[0] + 82, center[1] + 82), fill=b.rgba(VIOLET, 240), outline=b.rgba(WHITE, 100), width=3)
    b.text_center(d, center, "DỰ ÁN", f(24, bold=True), WHITE)
    resources = [
        (230, 320, "TÌNH NGUYỆN VIÊN", BLUE), (1030, 305, "CHUYÊN GIA", YELLOW),
        (250, 565, "THIẾT BỊ", CORAL), (1020, 560, "ĐỊA ĐIỂM", GREEN),
    ]
    for i, (x, y, label, col) in enumerate(resources):
        d.line((x, y, *center), fill=b.rgba(col, 80), width=2)
        d.rounded_rectangle((x - 105, y - 34, x + 105, y + 34), radius=16, fill=b.rgba(PANEL, 245), outline=b.rgba(col, 210), width=2)
        b.text_center(d, (x, y), label, f(15, semibold=True), WHITE)
        connector_particle(d, x, y, *center, t, i * 0.23, col)
    for i in range(12):
        angle = -t * 0.7 + i * math.tau / 12
        r = 112 + 8 * math.sin(t * 1.5 + i)
        x = center[0] + math.cos(angle) * r
        y = center[1] + math.sin(angle) * r
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=b.rgba(CYAN, 200))
    b.pop_text(d, t, 3.3, (640, 645), "KẾT NỐI ĐÚNG NGƯỜI • ĐÚNG VIỆC • ĐÚNG LÚC", 20, MUTED)
    return img


def scene_developer(t):
    img = b.background(t, "#0A1022")
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    persona_header(d, t, "GÓC NHÌN NHÀ PHÁT TRIỂN", "“MỘT NỀN TẢNG ĐỂ TIẾP TỤC MỞ RỘNG.”", VIOLET)

    center = (640, 445)
    pulse = (math.sin(t * 3.2) + 1) / 2
    b.draw_node(d, *center, 72, VIOLET, pulse * 0.12)
    b.text_center(d, center, "CPL", f(31, bold=True), WHITE)
    modules = [(235, 325, "WEB", BLUE), (1040, 315, "REALTIME", GREEN), (240, 565, "AI", VIOLET), (1030, 570, "DATA", CORAL)]
    for i, (x, y, label, col) in enumerate(modules):
        p = b.spring(b.local(t, 0.75 + i * 0.24, 0.7))
        xx = b.mix(center[0], x, p)
        yy = b.mix(center[1], y, p)
        d.line((center[0], center[1], xx, yy), fill=b.rgba(col, 105), width=3)
        d.rounded_rectangle((xx - 105, yy - 42, xx + 105, yy + 42), radius=16, fill=b.rgba(PANEL, 250), outline=b.rgba(col, 220), width=2)
        d.text((xx - 58, yy - 14), "< />" if label == "WEB" else "●", font=f(22, bold=True), fill=b.rgba(col, 255))
        d.text((xx + 3, yy - 11), label, font=f(18, bold=True), fill=b.rgba(WHITE, 255))
        connector_particle(d, xx, yy, *center, t, i * 0.19, col)
    # Code rows move continuously to imply an extensible system.
    for i in range(6):
        width = 105 + 55 * (math.sin(t * 1.7 + i) + 1) / 2
        y = 280 + i * 62
        d.rounded_rectangle((555 - width / 2, y, 555 + width / 2, y + 7), radius=3, fill=b.rgba(CYAN if i % 2 else BLUE, 90))
    b.pop_text(d, t, 3.4, (640, 652), "WEB • REALTIME • AI • DATA", 21, MUTED)
    return img


def scene_community(t):
    img = b.background(t, "#071521")
    b.add_glow(img, (420, 430), 230, CYAN, 48)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    persona_header(d, t, "GÓC NHÌN CỘNG ĐỒNG", "HÀNH ĐỘNG HÔM NAY. TRI THỨC CHO NGÀY MAI.", CYAN)

    center = (380, 435)
    for i in range(4):
        rr = 58 + i * 43 + ((t * 38) % 43)
        alpha = max(15, 115 - i * 24 - int((t * 38) % 43))
        d.ellipse((center[0] - rr, center[1] - rr, center[0] + rr, center[1] + rr), outline=b.rgba(CYAN, alpha), width=3)
    d.ellipse((center[0] - 68, center[1] - 68, center[0] + 68, center[1] + 68), fill=b.rgba(GREEN, 245))
    b.text_center(d, center, "HOÀN THÀNH", f(17, bold=True), WHITE)

    for i in range(5):
        x = 770 + i * 36
        y = 515 - i * 18
        d.rounded_rectangle((x, y, x + 180, y + 112), radius=12, fill=b.rgba("#F5F7FB", 255), outline=b.rgba(VIOLET, 150), width=2)
        d.rectangle((x + 20, y + 24, x + 134, y + 32), fill=b.rgba("#9DACBF", 170))
        d.rectangle((x + 20, y + 48, x + 148, y + 55), fill=b.rgba("#CED6E2", 220))
        d.rectangle((x + 20, y + 70, x + 112, y + 77), fill=b.rgba("#CED6E2", 220))
    arc_p = (t * 0.5) % 1
    ax, ay = b.mix(450, 850, arc_p), 430 - math.sin(arc_p * math.pi) * 170
    signal(d, ax, ay, t, YELLOW, 8, 1)
    d.text((793, 360), "KHO TRI THỨC", font=f(20, bold=True), fill=b.rgba(VIOLET, 255))
    d.text((793, 400), "Dự án cũ tạo nền móng\ncho dự án tiếp theo.", font=f(18, semibold=True), fill=b.rgba(MUTED, 255), spacing=8)
    return img


def scene_scale(t):
    img = b.background(t, "#0D1424")
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    scene_label(d, "QUY MÔ DỰ KIẾN", YELLOW)
    b.pop_text(d, t, 0.05, (640, 135), "MỤC TIÊU SAU NĂM ĐẦU", 42, WHITE)

    stats = [(500, "HỌC SINH", BLUE, "+"), (50, "Ý TƯỞNG", CORAL, ""), (20, "DỰ ÁN", GREEN, ""), (100, "TÀI LIỆU", VIOLET, "+")]
    for i, (target, label, col, suffix) in enumerate(stats):
        x = 72 + i * 302
        p = b.ease(b.local(t, 0.55 + i * 0.16, 1.5))
        d.rounded_rectangle((x, 225, x + 260, 405), radius=18, fill=b.rgba(PANEL, 250), outline=b.rgba(col, 190), width=2)
        b.text_center(d, (x + 130, 292), f"{int(target * p)}{suffix}", f(44, bold=True), col)
        b.text_center(d, (x + 130, 360), label, f(18, semibold=True), WHITE)
        wave = (math.sin(t * 2.8 + i) + 1) / 2
        d.arc((x + 27, 247, x + 233, 390), 205, 205 + int(118 * wave), fill=b.rgba(col, 145), width=3)

    d.rounded_rectangle((274, 448, 1006, 510), radius=17, fill=b.rgba(YELLOW, 30), outline=b.rgba(YELLOW, 150), width=2)
    b.text_center(d, (640, 479), "30-50% MỤC TIÊU GIẢM THỜI GIAN QUẢN LÝ", f(20, bold=True), YELLOW)

    places = [(220, "1 TRƯỜNG"), (640, "NHIỀU CỘNG ĐỒNG"), (1060, "NHIỀU ĐỊA PHƯƠNG")]
    growth = b.ease(b.local(t, 2.0, 3.0))
    for i, (x, label) in enumerate(places):
        p = b.spring(b.local(t, 1.8 + i * 0.45, 0.7))
        rr = max(4, int((18 + i * 8) * p))
        signal(d, x, 585, t + i, [BLUE, GREEN, CYAN][i], rr, 1 + i)
        b.text_center(d, (x, 648), label, f(16, semibold=True), WHITE)
        if i < 2:
            end = b.mix(x + 45, places[i + 1][0] - 45, growth)
            d.line((x + 45, 585, end, 585), fill=b.rgba(CYAN, 150), width=3)
    return img


def scene_cta(t):
    img = b.background(t, "#070C16")
    b.add_glow(img, (640, 420), 300, BLUE, 60)
    d = ImageDraw.Draw(img, "RGBA")
    b.brand(d)
    b.pop_text(d, t, 0.0, (640, 155), "ĐỪNG CHỈ NHÌN THẤY VẤN ĐỀ.", 42, MUTED)
    b.pop_text(d, t, 0.35, (640, 220), "HÃY BẮT ĐẦU", 51, WHITE)
    b.pop_text(d, t, 0.62, (640, 282), "MỘT DỰ ÁN.", 59, YELLOW)

    p = b.spring(b.local(t, 0.8, 0.8))
    breathe = 1 + 0.055 * math.sin(t * 4)
    r = 57 * max(0.1, p) * breathe
    orbit = 23 + 7 * math.sin(t * 2.3)
    d.ellipse((640 - r - orbit, 420 - r, 640 + r - orbit, 420 + r), fill=b.rgba(CYAN, 255))
    d.ellipse((640 - r + orbit, 420 - r, 640 + r + orbit, 420 + r), fill=b.rgba(VIOLET, 245))
    for i, angle in enumerate(np.linspace(0, math.tau, 8, endpoint=False)):
        rr = 150 + 10 * math.sin(t * 2 + i)
        x, y = 640 + math.cos(angle) * rr, 420 + math.sin(angle) * rr * 0.48
        avatar(d, x, y, [BLUE, YELLOW, GREEN, CORAL, VIOLET, CYAN, BLUE, GREEN][i], 0.32)

    b.pop_text(d, t, 1.1, (640, 542), "COMMUNITY PROJECT LAB", 27, WHITE)
    q = b.ease(b.local(t, 1.45, 0.65))
    if q > 0.02:
        d.rounded_rectangle((415, 588, 865, 644), radius=16, fill=b.rgba(BLUE, 255))
        b.text_center(d, (640, 616), "COMMUNITY-LAB.VERCEL.APP", f(19, bold=True), WHITE)
    return img


SCENES = [
    (0, 5, scene_problem),
    (5, 11, scene_stuck),
    (11, 17, scene_gaps),
    (17, 22, scene_reveal),
    (22, 28, scene_student),
    (28, 34, scene_teacher),
    (34, 40, scene_org),
    (40, 46, scene_developer),
    (46, 51, scene_community),
    (51, 57, scene_scale),
    (57, 60, scene_cta),
]


def render_at(t):
    for index, (start, end, renderer) in enumerate(SCENES):
        if t < end or index == len(SCENES) - 1:
            img = opaque(renderer(t - start))
            transition = 0.34
            if index < len(SCENES) - 1 and t > end - transition:
                p = b.ease_in_out((t - end + transition) / transition)
                nxt = opaque(SCENES[index + 1][2](0))
                mask = Image.new("L", (RW, RH), 0)
                md = ImageDraw.Draw(mask)
                edge = int((RW + 260) * p) - 130
                if edge > 0:
                    md.rectangle((0, 0, min(edge, RW), RH), fill=255)
                md.polygon([(edge, 0), (edge + 205, 0), (edge - 45, RH), (edge - 250, RH)], fill=205)
                img = Image.composite(nxt, img, mask)
                dd = ImageDraw.Draw(img, "RGBA")
                dd.polygon([(edge - 12, 0), (edge + 12, 0), (edge - 238, RH), (edge - 262, RH)], fill=b.rgba(CYAN, 185))
            return b.add_energy_overlay(img, t).convert("RGB")
    return scene_cta(3).convert("RGB")


def synth_sfx(path: Path):
    sr = 44100
    total = DURATION * sr
    audio = np.zeros((total, 2), dtype=np.float64)
    rng = np.random.default_rng(2609)

    def add(start, sound, pan=0.0, gain=1.0):
        idx = int(start * sr)
        if idx >= total:
            return
        sound = sound[: total - idx] * gain
        left = math.sqrt((1 - pan) / 2)
        right = math.sqrt((1 + pan) / 2)
        audio[idx : idx + len(sound), 0] += sound * left
        audio[idx : idx + len(sound), 1] += sound * right

    def impact(dur=0.75, freq=95):
        n = int(dur * sr)
        tt = np.arange(n) / sr
        phase = 2 * np.pi * (freq * tt - 35 * tt**2)
        return (0.76 * np.sin(phase) + 0.17 * rng.normal(0, 1, n)) * np.exp(-tt * 6)

    def click(freq=760):
        n = int(0.12 * sr)
        tt = np.arange(n) / sr
        return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 35)

    def whoosh(dur=0.55):
        n = int(dur * sr)
        tt = np.arange(n) / sr
        noise = rng.normal(0, 1, n)
        hp = np.concatenate(([0], np.diff(noise)))
        env = np.sin(np.pi * tt / dur) ** 2
        return hp * env

    def riser(dur=1.4):
        n = int(dur * sr)
        tt = np.arange(n) / sr
        noise = rng.normal(0, 1, n)
        phase = 2 * np.pi * (150 * tt + 360 * tt**2)
        return (0.5 * np.sin(phase) + 0.22 * noise) * (tt / dur) ** 1.8

    for cut in [0, 5, 11, 17, 22, 28, 34, 40, 46, 51, 57]:
        add(cut, impact(freq=86 if cut == 17 else 105), 0, 0.42 if cut in (17, 51, 57) else 0.25)
        if cut:
            add(cut - 0.35, whoosh(), -0.25 if int(cut) % 2 else 0.25, 0.12)
    add(15.6, riser(1.4), 0, 0.18)
    add(55.6, riser(1.4), 0, 0.16)
    for start in [5.8, 6.8, 7.8, 23.0, 23.7, 24.4, 29.1, 30.0, 31.0, 35.0, 36.2, 37.4, 41.0, 42.0, 43.0, 47.3, 48.1, 49.0, 52.0, 52.4, 52.8, 53.2]:
        add(start, click(680 + int(start * 17) % 420), (-1) ** int(start * 10) * 0.45, 0.11)

    audio = np.tanh(audio * 1.15)
    peak = np.max(np.abs(audio)) or 1
    audio = (audio / peak * 0.88 * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio.tobytes())


def build_music(ffmpeg: str, sfx: Path, output: Path):
    # Five sections from the first half are re-ordered and re-shaped around the story beats.
    filters = (
        "[0:a]atrim=start=0:end=17.25,asetpts=PTS-STARTPTS,highpass=f=70,lowpass=f=5200,volume=4.2,afade=t=in:st=0:d=1.0[a0];"
        "[0:a]atrim=start=20:end=25.25,asetpts=PTS-STARTPTS,highpass=f=55,volume=2.0[a1];"
        "[0:a]atrim=start=25:end=43.25,asetpts=PTS-STARTPTS,highpass=f=48,volume=2.1[a2];"
        "[0:a]atrim=start=70:end=81.25,asetpts=PTS-STARTPTS,highpass=f=45,volume=1.25[a3];"
        "[0:a]atrim=start=115:end=124,asetpts=PTS-STARTPTS,highpass=f=45,volume=1.15,afade=t=out:st=8.2:d=0.8[a4];"
        "[a0][a1]acrossfade=d=0.25:c1=tri:c2=tri[x1];"
        "[x1][a2]acrossfade=d=0.25:c1=tri:c2=tri[x2];"
        "[x2][a3]acrossfade=d=0.25:c1=tri:c2=tri[x3];"
        "[x3][a4]acrossfade=d=0.25:c1=tri:c2=tri,volume='if(between(t,16.45,16.95),0.18,1)',loudnorm=I=-15.5:TP=-1.4:LRA=10[bed];"
        "[1:a]volume=0.72[sfx];[bed][sfx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,volume=0.82,alimiter=limit=0.94[out]"
    )
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(AUDIO_SOURCE), "-i", str(sfx),
        "-filter_complex", filters, "-map", "[out]", "-t", str(DURATION),
        "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", str(output),
    ], check=True)


def render_video():
    if not AUDIO_SOURCE.exists():
        raise FileNotFoundError(AUDIO_SOURCE)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    silent = OUTPUT / "CPL-final-silent.mp4"
    sfx = OUTPUT / "CPL-final-sfx.wav"
    music = OUTPUT / "CPL-final-music-edit.wav"
    final = OUTPUT / "CPL-introduction-final-60s.mp4"

    synth_sfx(sfx)
    build_music(ffmpeg, sfx, music)

    command = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{RW}x{RH}", "-r", str(FPS), "-i", "-",
        "-vf", f"scale={OW}:{OH}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart", str(silent),
    ]
    proc = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for frame in range(DURATION * FPS):
        proc.stdin.write(render_at(frame / FPS).tobytes())
        if frame % (FPS * 5) == 0:
            print(f"Rendered {frame // FPS:02d}/{DURATION}s", flush=True)
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError("Video encoder failed")

    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(silent), "-i", str(music), "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", str(DURATION),
        "-movflags", "+faststart", str(final),
    ], check=True)
    print(final)


if __name__ == "__main__":
    render_video()
