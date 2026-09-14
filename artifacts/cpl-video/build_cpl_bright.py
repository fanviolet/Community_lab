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
SOURCE = ROOT / "source"
OUTPUT.mkdir(parents=True, exist_ok=True)

RW, RH = 1280, 720
OW, OH = 1920, 1080
FPS = 30
DURATION = 60

INK = "#18304B"
SOFT_INK = "#52708A"
WHITE = "#FFFFFF"
BLUE = "#3478F6"
CYAN = "#16B8C8"
VIOLET = "#7D5CF3"
CORAL = "#FF6B6B"
YELLOW = "#FFC857"
GREEN = "#35C98B"
PINK = "#F36FB1"

PALE_BLUE = "#F2F8FF"
PALE_MINT = "#EEFCF7"
PALE_YELLOW = "#FFF9E8"
PALE_LILAC = "#F7F3FF"
PALE_CORAL = "#FFF3F1"

FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_SEMIBOLD = Path("C:/Windows/Fonts/seguisb.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")

ONLINE_MUSIC = SOURCE / "pixabay-corporate-technology-164714.mp3"
COUNTERATTACK = Path(r"D:\music\music1\y2mate.com - 05  Counterattack Mankind  High Quality.mp3")
JET_SET_RUN = Path(r"D:\music\music1\y2mate.com - My Hero Academia OST   Jet Set Run.mp3")
TEAM_POTENTIAL = Path(r"D:\music\music1\y2mate.com - Haikyuu    Team Potential Extended.mp3")


def font(size: int, bold: bool = False, semibold: bool = False):
    path = FONT_BOLD if bold else FONT_SEMIBOLD if semibold else FONT_REGULAR
    return ImageFont.truetype(str(path), size=size)


def rgba(color: str, alpha: int = 255):
    h = color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


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
    return 1 - math.exp(-7 * v) * math.cos(10 * v)


def local(t, start, duration):
    return clamp((t - start) / duration)


def mix(a, b, p):
    return a + (b - a) * p


def text_center(d, xy, text, size, color=INK, bold=False, semibold=False):
    d.text(xy, text, font=font(size, bold, semibold), fill=rgba(color), anchor="mm")


def bg(base: str, t: float, accent=BLUE):
    img = Image.new("RGBA", (RW, RH), base)
    d = ImageDraw.Draw(img, "RGBA")
    # Gentle paper-like waves add movement without crowding the frame.
    for band in range(3):
        pts = []
        y0 = 600 + band * 48
        for x in range(-40, RW + 41, 40):
            y = y0 + math.sin(x / 150 + t * (0.35 + band * 0.08)) * (18 + band * 5)
            pts.append((x, y))
        pts += [(RW + 40, RH + 20), (-40, RH + 20)]
        d.polygon(pts, fill=rgba(accent, 12 + band * 5))
    for i in range(9):
        x = (75 + i * 151 + t * (8 + i % 3)) % (RW + 80) - 40
        y = 95 + (i * 79) % 455 + math.sin(t * 0.7 + i) * 8
        r = 3 + i % 3
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba([BLUE, CYAN, YELLOW, CORAL, GREEN][i % 5], 42))
    return img


def brand(d, y=47):
    d.ellipse((52, y - 9, 74, y + 13), fill=rgba(CYAN))
    d.ellipse((68, y - 9, 90, y + 13), fill=rgba(VIOLET, 235))
    d.text((104, y - 14), "COMMUNITY PROJECT LAB", font=font(17, semibold=True), fill=rgba(INK))


def label(d, text, color=BLUE):
    box = d.textbbox((0, 0), text, font=font(14, semibold=True))
    w = box[2] - box[0] + 30
    d.rounded_rectangle((56, 78, 56 + w, 112), radius=8, fill=rgba(WHITE, 235), outline=rgba(color, 150), width=2)
    text_center(d, (56 + w / 2, 95), text, 14, color, semibold=True)


def shadow_card(img, box, fill=WHITE, outline="#DDE8F2", radius=8, shadow=True):
    x1, y1, x2, y2 = box
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh, "RGBA")
        sd.rounded_rectangle((x1 + 7, y1 + 10, x2 + 7, y2 + 10), radius=radius, fill=(37, 75, 112, 34))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9)))
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle(box, radius=radius, fill=rgba(fill), outline=rgba(outline), width=2)


def pop_text(d, t, start, xy, text, size, color=INK, bold=True):
    p = spring(local(t, start, 0.65))
    if p <= 0:
        return
    s = max(3, int(size * max(0.2, p)))
    d.text((xy[0], xy[1] + 28 * (1 - p)), text, font=font(s, bold=bold), fill=rgba(color, int(255 * clamp(p))), anchor="mm")


def slide_text(d, t, start, xy, text, size, color=INK, bold=True):
    p = ease(local(t, start, 0.65))
    d.text((xy[0] - 90 * (1 - p), xy[1]), text, font=font(size, bold=bold), fill=rgba(color, int(255 * p)), anchor="lm")


def bezier(p0, p1, p2, p):
    q = 1 - p
    return (q * q * p0[0] + 2 * q * p * p1[0] + p * p * p2[0], q * q * p0[1] + 2 * q * p * p1[1] + p * p * p2[1])


def curve(d, p0, p1, p2, color, width=4, progress=1.0):
    pts = [bezier(p0, p1, p2, i / 48 * progress) for i in range(49)]
    d.line(pts, fill=rgba(color, 170), width=width, joint="curve")


def moving_dot(d, p0, p1, p2, p, color, r=7):
    x, y = bezier(p0, p1, p2, p % 1)
    d.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color))


def icon_person(d, x, y, color=BLUE, scale=1.0, shirt=None):
    shirt = shirt or color
    d.ellipse((x - 18 * scale, y - 67 * scale, x + 18 * scale, y - 31 * scale), fill=rgba(color))
    d.rounded_rectangle((x - 29 * scale, y - 27 * scale, x + 29 * scale, y + 32 * scale), radius=int(14 * scale), fill=rgba(shirt))
    d.line((x - 14 * scale, y + 30 * scale, x - 20 * scale, y + 68 * scale), fill=rgba(INK), width=max(2, int(8 * scale)))
    d.line((x + 14 * scale, y + 30 * scale, x + 20 * scale, y + 68 * scale), fill=rgba(INK), width=max(2, int(8 * scale)))
    d.line((x - 28 * scale, y - 8 * scale, x - 48 * scale, y + 18 * scale), fill=rgba(shirt), width=max(2, int(9 * scale)))
    d.line((x + 28 * scale, y - 8 * scale, x + 48 * scale, y + 18 * scale), fill=rgba(shirt), width=max(2, int(9 * scale)))


def icon_group(d, x, y, scale=1.0):
    icon_person(d, x, y, BLUE, scale)
    icon_person(d, x - 63 * scale, y + 11 * scale, CORAL, scale * 0.78)
    icon_person(d, x + 63 * scale, y + 11 * scale, GREEN, scale * 0.78)


def icon_laptop(d, x, y, scale=1.0, color=BLUE):
    w, h = 150 * scale, 94 * scale
    d.rounded_rectangle((x - w / 2, y - h / 2, x + w / 2, y + h / 2), radius=int(8 * scale), fill=rgba(INK), outline=rgba(color), width=max(2, int(4 * scale)))
    d.rounded_rectangle((x - w / 2 + 9 * scale, y - h / 2 + 9 * scale, x + w / 2 - 9 * scale, y + h / 2 - 9 * scale), radius=int(4 * scale), fill=rgba(PALE_BLUE))
    d.polygon([(x - 92 * scale, y + 52 * scale), (x + 92 * scale, y + 52 * scale), (x + 73 * scale, y + 67 * scale), (x - 73 * scale, y + 67 * scale)], fill=rgba(SOFT_INK))


def icon_school(d, x, y, scale=1.0):
    d.polygon([(x, y - 75 * scale), (x - 92 * scale, y - 25 * scale), (x + 92 * scale, y - 25 * scale)], fill=rgba(YELLOW))
    d.rectangle((x - 78 * scale, y - 25 * scale, x + 78 * scale, y + 65 * scale), fill=rgba(WHITE), outline=rgba(INK), width=max(2, int(3 * scale)))
    for i in (-1, 0, 1):
        xx = x + i * 46 * scale
        d.rectangle((xx - 13 * scale, y - 5 * scale, xx + 13 * scale, y + 28 * scale), fill=rgba(PALE_BLUE), outline=rgba(BLUE), width=2)
    d.rectangle((x - 16 * scale, y + 24 * scale, x + 16 * scale, y + 65 * scale), fill=rgba(CORAL))


def icon_bulb(d, x, y, scale=1.0):
    d.ellipse((x - 35 * scale, y - 52 * scale, x + 35 * scale, y + 18 * scale), fill=rgba(YELLOW), outline=rgba(INK), width=max(2, int(3 * scale)))
    d.rounded_rectangle((x - 16 * scale, y + 12 * scale, x + 16 * scale, y + 38 * scale), radius=5, fill=rgba(SOFT_INK))
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        d.line((x + math.cos(a) * 48 * scale, y - 17 * scale + math.sin(a) * 48 * scale, x + math.cos(a) * 61 * scale, y - 17 * scale + math.sin(a) * 61 * scale), fill=rgba(CORAL), width=max(2, int(3 * scale)))


def icon_chat(d, x, y, scale=1.0, color=CYAN):
    d.rounded_rectangle((x - 62 * scale, y - 40 * scale, x + 62 * scale, y + 33 * scale), radius=int(15 * scale), fill=rgba(color))
    d.polygon([(x - 27 * scale, y + 30 * scale), (x - 42 * scale, y + 54 * scale), (x - 5 * scale, y + 32 * scale)], fill=rgba(color))
    for i in (-1, 0, 1):
        d.ellipse((x + i * 24 * scale - 5 * scale, y - 8 * scale, x + i * 24 * scale + 5 * scale, y + 2 * scale), fill=rgba(WHITE))


def icon_calendar(d, x, y, scale=1.0):
    d.rounded_rectangle((x - 64 * scale, y - 55 * scale, x + 64 * scale, y + 60 * scale), radius=int(8 * scale), fill=rgba(WHITE), outline=rgba(VIOLET), width=max(2, int(3 * scale)))
    d.rectangle((x - 64 * scale, y - 55 * scale, x + 64 * scale, y - 23 * scale), fill=rgba(VIOLET))
    for row in range(2):
        for col in range(3):
            xx, yy = x - 36 * scale + col * 36 * scale, y + row * 30 * scale
            d.ellipse((xx - 6 * scale, yy - 6 * scale, xx + 6 * scale, yy + 6 * scale), fill=rgba(GREEN if row + col > 1 else BLUE))


def icon_pin(d, x, y, scale=1.0, color=CORAL):
    d.ellipse((x - 36 * scale, y - 48 * scale, x + 36 * scale, y + 24 * scale), fill=rgba(color))
    d.polygon([(x - 25 * scale, y + 8 * scale), (x + 25 * scale, y + 8 * scale), (x, y + 62 * scale)], fill=rgba(color))
    d.ellipse((x - 11 * scale, y - 23 * scale, x + 11 * scale, y - 1 * scale), fill=rgba(WHITE))


def icon_docs(d, x, y, scale=1.0):
    for i, color in enumerate((VIOLET, BLUE, GREEN)):
        xx, yy = x + i * 16 * scale, y - i * 12 * scale
        d.rounded_rectangle((xx - 55 * scale, yy - 66 * scale, xx + 55 * scale, yy + 66 * scale), radius=int(7 * scale), fill=rgba(WHITE), outline=rgba(color), width=max(2, int(3 * scale)))
        for row in range(3):
            d.rounded_rectangle((xx - 33 * scale, yy - 30 * scale + row * 22 * scale, xx + 31 * scale, yy - 23 * scale + row * 22 * scale), radius=3, fill=rgba(color, 110))


def icon_tree(d, x, y, scale=1.0):
    d.rectangle((x - 11 * scale, y - 2 * scale, x + 11 * scale, y + 72 * scale), fill=rgba(CORAL))
    d.ellipse((x - 65 * scale, y - 68 * scale, x + 5 * scale, y + 5 * scale), fill=rgba(GREEN))
    d.ellipse((x - 5 * scale, y - 78 * scale, x + 70 * scale, y + 3 * scale), fill=rgba(CYAN))
    d.ellipse((x - 35 * scale, y - 105 * scale, x + 38 * scale, y - 28 * scale), fill=rgba(GREEN))


def icon_code(d, x, y, scale=1.0):
    d.text((x, y), "</>", font=font(int(60 * scale), bold=True), fill=rgba(VIOLET), anchor="mm")


def small_icon(d, kind, x, y, scale=1.0, color=BLUE):
    if kind == "person":
        icon_person(d, x, y + 8 * scale, color, 0.5 * scale)
    elif kind == "laptop":
        icon_laptop(d, x, y, 0.48 * scale, color)
    elif kind == "school":
        icon_school(d, x, y, 0.48 * scale)
    elif kind == "bulb":
        icon_bulb(d, x, y, 0.55 * scale)
    elif kind == "chat":
        icon_chat(d, x, y, 0.55 * scale, color)
    elif kind == "calendar":
        icon_calendar(d, x, y, 0.52 * scale)
    elif kind == "pin":
        icon_pin(d, x, y, 0.55 * scale, color)
    elif kind == "docs":
        icon_docs(d, x, y, 0.48 * scale)
    elif kind == "tree":
        icon_tree(d, x, y, 0.55 * scale)
    elif kind == "code":
        icon_code(d, x, y, 0.75 * scale)


def scene_problem(t):
    img = bg(PALE_YELLOW, t, YELLOW)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "TRƯỚC CPL", CORAL)
    slide_text(d, t, 0.15, (70, 150), "MỘT VẤN ĐỀ XUẤT HIỆN.", 47)
    slide_text(d, t, 0.7, (70, 210), "AI SẼ BIẾN NÓ THÀNH HÀNH ĐỘNG?", 30, CORAL)
    icon_person(d, 225, 455 + math.sin(t * 1.4) * 5, BLUE, 1.05)
    icon_bulb(d, 390, 370, 1.0)
    icon_school(d, 990, 468, 1.05)
    p = ease_in_out(local(t, 1.2, 3.2))
    curve(d, (430, 370), (675, 190), (880, 410), CORAL, 5, p)
    moving_dot(d, (430, 370), (675, 190), (880, 410), p, CORAL, 9)
    if p > .72:
        q = (p - .72) / .28
        d.arc((840, 370, 930, 460), 200, 200 + int(230 * q), fill=rgba(CORAL), width=5)
    text_center(d, (640, 635), "Ý TƯỞNG CÓ. ĐƯỜNG ĐI CHƯA RÕ.", 22, SOFT_INK, semibold=True)
    return img


def scene_orbit(t):
    img = bg(PALE_CORAL, t, CORAL)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "TRƯỚC CPL", CORAL)
    pop_text(d, t, 0.05, (640, 142), "MỖI CÔNG CỤ GIỮ MỘT MẢNH.", 42)
    icon_person(d, 640, 430, BLUE, 0.9)
    items = [("chat", "TIN NHẮN", CYAN), ("calendar", "KẾ HOẠCH", VIOLET), ("docs", "TÀI LIỆU", GREEN), ("bulb", "Ý TƯỞNG", YELLOW), ("laptop", "BẢNG VIỆC", BLUE)]
    order = sorted(range(len(items)), key=lambda i: math.sin(t * .8 + i * math.tau / len(items)))
    for i in order:
        kind, txt, col = items[i]
        a = t * .55 + i * math.tau / len(items)
        depth = (math.sin(a) + 1) / 2
        x = 640 + math.cos(a) * 370
        y = 420 + math.sin(a) * 118
        s = .72 + depth * .34
        w, h = 176 * s, 126 * s
        shadow_card(img, (x - w / 2, y - h / 2, x + w / 2, y + h / 2), outline=col, radius=8)
        d = ImageDraw.Draw(img, "RGBA")
        small_icon(d, kind, x, y - 12 * s, .58 * s, col)
        text_center(d, (x, y + 43 * s), txt, max(10, int(13 * s)), col, bold=True)
    pop_text(d, t, 3.7, (640, 650), "CÀNG NHIỀU MẢNH. CÀNG KHÓ BẮT ĐẦU.", 23, CORAL)
    return img


def scene_people(t):
    img = bg(PALE_BLUE, t, BLUE)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "4 GÓC NHÌN", BLUE)
    pop_text(d, t, .05, (640, 140), "MỘT VẤN ĐỀ. NHIỀU NGƯỜI CẦN ĐƯỢC KẾT NỐI.", 35)
    roles = [
        (205, 360, "HỌC SINH", "Cần một điểm bắt đầu", "person", BLUE),
        (495, 455, "GIÁO VIÊN", "Cần thấy lúc nên hỗ trợ", "school", YELLOW),
        (790, 350, "TỔ CHỨC", "Cần tìm đúng dự án", "calendar", GREEN),
        (1070, 455, "NHÀ PHÁT TRIỂN", "Cần nền tảng để mở rộng", "code", VIOLET),
    ]
    for i, (x, y, role, body, kind, col) in enumerate(roles):
        p = spring(local(t, .35 + i * .24, .7))
        yy = y + 40 * (1 - p)
        d.ellipse((x - 91, yy - 91, x + 91, yy + 91), fill=rgba(WHITE), outline=rgba(col, 180), width=3)
        small_icon(d, kind, x, yy - 18, .92, col)
        text_center(d, (x, yy + 72), role, 14, col, bold=True)
        text_center(d, (x, 606), body, 15, SOFT_INK, semibold=True)
    return img


def scene_reveal(t):
    img = bg(PALE_LILAC, t, VIOLET)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "CPL XUẤT HIỆN", VIOLET)
    orbit_items = [("bulb", YELLOW), ("chat", CYAN), ("calendar", VIOLET), ("docs", GREEN), ("person", CORAL), ("laptop", BLUE)]
    settle = ease_in_out(local(t, 0.0, 2.5))
    for i, (kind, col) in enumerate(orbit_items):
        a = t * 1.1 + i * math.tau / len(orbit_items)
        r = mix(300, 190, settle)
        x = 640 + math.cos(a) * r
        y = 390 + math.sin(a) * r * .54
        d.ellipse((x - 42, y - 42, x + 42, y + 42), fill=rgba(WHITE, 245), outline=rgba(col, 180), width=2)
        small_icon(d, kind, x, y, .52, col)
    p = spring(local(t, .35, 1.2))
    r = 72 * max(.1, p)
    d.ellipse((640 - r - 28, 390 - r, 640 + r - 28, 390 + r), fill=rgba(CYAN))
    d.ellipse((640 - r + 28, 390 - r, 640 + r + 28, 390 + r), fill=rgba(VIOLET, 238))
    pop_text(d, t, 1.15, (640, 160), "COMMUNITY PROJECT LAB", 39)
    pop_text(d, t, 1.7, (640, 610), "VẤN ĐỀ  →  GIẢI PHÁP  →  HÀNH ĐỘNG", 24, VIOLET)
    return img


def scene_student(t):
    img = bg(PALE_BLUE, t, CYAN)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "VỚI HỌC SINH", BLUE)
    slide_text(d, t, .05, (65, 145), "TỪ CÂU HỎI ĐẦU TIÊN...", 39)
    icon_person(d, 160, 420, BLUE, .9)
    icon_laptop(d, 325, 442, .9, CYAN)
    steps = [("1", "THAM GIA", BLUE), ("2", "PHÁT HIỆN", CORAL), ("3", "THẢO LUẬN", CYAN), ("4", "GIẢI PHÁP", YELLOW), ("5", "DỰ ÁN", VIOLET), ("6", "HÀNH ĐỘNG", GREEN), ("7", "TRI THỨC", BLUE)]
    p = ease(local(t, 1.0, 3.7))
    p0, p1, p2 = (470, 500), (780, 210), (1160, 450)
    curve(d, p0, p1, p2, CYAN, 6, p)
    for i, (num, txt, col) in enumerate(steps):
        q = i / 6
        x, y = bezier(p0, p1, p2, q)
        appear = spring(local(t, .8 + i * .42, .6))
        r = max(4, 28 * appear)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba(col), outline=rgba(WHITE), width=3)
        text_center(d, (x, y), num, max(8, int(15 * max(.5, appear))), WHITE, bold=True)
        if i in (0, 2, 4, 6):
            text_center(d, (x, y + 54), txt, 12, col, bold=True)
    moving_dot(d, p0, p1, p2, (t * .26) % 1, YELLOW, 8)
    pop_text(d, t, 3.6, (640, 646), "AI GỢI MỞ. BẠN LÀ NGƯỜI QUYẾT ĐỊNH.", 20, BLUE)
    return img


def scene_teacher(t):
    img = bg(PALE_YELLOW, t, YELLOW)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "VỚI NHÀ TRƯỜNG", YELLOW)
    slide_text(d, t, .05, (65, 145), "THẤY TIẾN ĐỘ. HỖ TRỢ ĐÚNG LÚC.", 38)
    icon_school(d, 180, 430, .9)
    icon_calendar(d, 350, 430, .82)
    shadow_card(img, (490, 235, 1180, 615), outline="#D8E4EE", radius=8)
    d = ImageDraw.Draw(img, "RGBA")
    cols = [(525, "CẦN LÀM", BLUE), (745, "CẦN HỖ TRỢ", CORAL), (965, "HOÀN THÀNH", GREEN)]
    for x, txt, col in cols:
        text_center(d, (x + 80, 275), txt, 14, col, bold=True)
        d.rounded_rectangle((x, 300, x + 160, 307), radius=3, fill=rgba(col))
    for col in range(3):
        for row in range(2):
            x, y = 525 + col * 220, 338 + row * 110
            d.rounded_rectangle((x, y, x + 160, y + 76), radius=7, fill=rgba([PALE_BLUE, PALE_CORAL, PALE_MINT][col]), outline=rgba(cols[col][2], 105), width=2)
            d.ellipse((x + 15, y + 15, x + 29, y + 29), fill=rgba(cols[col][2]))
            d.rounded_rectangle((x + 42, y + 16, x + 138, y + 25), radius=3, fill=rgba(SOFT_INK, 110))
            d.rounded_rectangle((x + 16, y + 47, x + 115, y + 55), radius=3, fill=rgba(SOFT_INK, 70))
    q = ease_in_out((t * .25) % 1)
    x, y = bezier((550, 550), (800, 430), (1000, 550), q)
    d.rounded_rectangle((x - 72, y - 22, x + 72, y + 22), radius=7, fill=rgba(WHITE), outline=rgba(GREEN if q > .7 else CORAL), width=3)
    text_center(d, (x, y), "HOẠT ĐỘNG", 12, INK, bold=True)
    return img


def scene_org(t):
    img = bg(PALE_MINT, t, GREEN)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "VỚI TỔ CHỨC", GREEN)
    pop_text(d, t, .05, (640, 140), "NGUỒN LỰC ĐẾN ĐÚNG DỰ ÁN.", 41)
    d.ellipse((555, 315, 725, 485), fill=rgba(VIOLET), outline=rgba(WHITE), width=4)
    text_center(d, (640, 400), "DỰ ÁN", 24, WHITE, bold=True)
    resources = [("person", "TÌNH NGUYỆN VIÊN", 220, 330, BLUE), ("bulb", "CHUYÊN GIA", 1040, 315, YELLOW), ("laptop", "THIẾT BỊ", 240, 560, CORAL), ("pin", "ĐỊA ĐIỂM", 1030, 555, GREEN)]
    for i, (kind, txt, x, y, col) in enumerate(resources):
        a = t * .45 + i * math.tau / 4
        bob = math.sin(a) * 8
        d.ellipse((x - 78, y - 68 + bob, x + 78, y + 68 + bob), fill=rgba(WHITE), outline=rgba(col, 170), width=3)
        small_icon(d, kind, x, y - 12 + bob, .65, col)
        text_center(d, (x, y + 48 + bob), txt, 12, col, bold=True)
        control = ((x + 640) / 2, 215 if y < 400 else 650)
        curve(d, (x + (-75 if x > 640 else 75), y + bob), control, (640, 400), col, 3)
        moving_dot(d, (x, y + bob), control, (640, 400), t * .4 + i * .21, col, 6)
    return img


def scene_developer(t):
    img = bg(PALE_LILAC, t, VIOLET)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "VỚI NHÀ PHÁT TRIỂN", VIOLET)
    slide_text(d, t, .05, (65, 145), "MỘT NỀN TẢNG ĐỂ TIẾP TỤC MỞ RỘNG.", 37)
    icon_person(d, 150, 440, VIOLET, .9)
    icon_laptop(d, 320, 452, 1.0, VIOLET)
    modules = [("WEB", BLUE, 610, 300, "laptop"), ("REALTIME", GREEN, 920, 270, "chat"), ("AI", VIOLET, 640, 515, "bulb"), ("DATA", CORAL, 1010, 510, "docs")]
    for i, (txt, col, x, y, kind) in enumerate(modules):
        p = spring(local(t, .55 + i * .25, .75))
        yy = y + (1 - p) * 50
        # Shallow isometric stacks inspired by Animos' depth-based card motion.
        for layer in range(2, -1, -1):
            off = layer * 8
            d.polygon([(x - 108 + off, yy - 53 + off), (x + 92 + off, yy - 53 + off), (x + 108 + off, yy + 40 + off), (x - 92 + off, yy + 40 + off)], fill=rgba(col, 40 + layer * 20), outline=rgba(col, 90))
        d.polygon([(x - 108, yy - 53), (x + 92, yy - 53), (x + 108, yy + 40), (x - 92, yy + 40)], fill=rgba(WHITE), outline=rgba(col), width=2)
        small_icon(d, kind, x - 52, yy - 7, .48, col)
        text_center(d, (x + 35, yy - 4), txt, 17, col, bold=True)
    code_x = 320 + math.sin(t * 1.4) * 8
    d.text((code_x, 545), "{  ideas: impact  }", font=font(17, semibold=True), fill=rgba(SOFT_INK), anchor="mm")
    return img


def scene_community(t):
    img = bg(PALE_BLUE, t, CYAN)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "VỚI CỘNG ĐỒNG", CYAN)
    pop_text(d, t, .05, (640, 140), "HÀNH ĐỘNG HÔM NAY. TRI THỨC CHO NGÀY MAI.", 35)
    icon_group(d, 270, 445, .88)
    icon_tree(d, 475, 450, .95)
    icon_docs(d, 1000, 445, .95)
    p = (t * .27) % 1
    curve(d, (540, 430), (720, 210), (895, 430), GREEN, 6)
    moving_dot(d, (540, 430), (720, 210), (895, 430), p, YELLOW, 9)
    for i, txt in enumerate(("CON NGƯỜI", "HOẠT ĐỘNG", "TRI THỨC")):
        text_center(d, (270 + i * 365, 610), txt, 15, [BLUE, GREEN, VIOLET][i], bold=True)
    return img


def scene_scale(t):
    img = bg(PALE_YELLOW, t, YELLOW)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d); label(d, "QUY MÔ DỰ KIẾN", CORAL)
    pop_text(d, t, .05, (640, 135), "MỤC TIÊU SAU NĂM ĐẦU", 40)
    stats = [(500, "+", "HỌC SINH", "person", BLUE), (50, "", "Ý TƯỞNG", "bulb", YELLOW), (20, "", "DỰ ÁN", "calendar", GREEN), (100, "+", "TÀI LIỆU", "docs", VIOLET)]
    for i, (target, suffix, txt, kind, col) in enumerate(stats):
        x = 85 + i * 300
        p = ease(local(t, .45 + i * .18, 1.55))
        shadow_card(img, (x, 215, x + 245, 425), outline=col, radius=8)
        d = ImageDraw.Draw(img, "RGBA")
        small_icon(d, kind, x + 55, 282, .55, col)
        text_center(d, (x + 151, 285), f"{int(target * p)}{suffix}", 42, col, bold=True)
        text_center(d, (x + 122, 380), txt, 17, INK, semibold=True)
    d.rounded_rectangle((285, 455, 995, 516), radius=8, fill=rgba(WHITE), outline=rgba(CORAL, 160), width=2)
    text_center(d, (640, 485), "30–50% MỤC TIÊU GIẢM THỜI GIAN QUẢN LÝ", 20, CORAL, bold=True)
    stages = [(185, "1 TRƯỜNG", "school", BLUE), (640, "NHIỀU CỘNG ĐỒNG", "person", GREEN), (1095, "MẠNG LƯỚI ĐỊA PHƯƠNG", "pin", VIOLET)]
    for i, (x, txt, kind, col) in enumerate(stages):
        p = spring(local(t, 2.1 + i * .45, .65))
        y = 590 + 25 * (1 - p)
        d.ellipse((x - 55, y - 48, x + 55, y + 48), fill=rgba(WHITE), outline=rgba(col, 170), width=2)
        small_icon(d, kind, x, y - 7, .48, col)
        text_center(d, (x, 661), txt, 14, col, bold=True)
        if i < 2:
            curve(d, (x + 60, y), ((x + stages[i + 1][0]) / 2, y - 45), (stages[i + 1][0] - 60, y), CYAN, 4, ease(local(t, 2.8 + i * .4, .7)))
    return img


def scene_cta(t):
    img = bg(PALE_LILAC, t, VIOLET)
    d = ImageDraw.Draw(img, "RGBA")
    brand(d)
    pop_text(d, t, 0.0, (640, 150), "ĐỪNG CHỈ NHÌN THẤY VẤN ĐỀ.", 35, SOFT_INK)
    pop_text(d, t, .25, (640, 217), "HÃY BẮT ĐẦU", 54)
    pop_text(d, t, .48, (640, 282), "MỘT DỰ ÁN.", 61, VIOLET)
    p = spring(local(t, .65, .8))
    icon_group(d, 640, 430, .72 * max(.15, p))
    for i, (kind, col) in enumerate((("bulb", YELLOW), ("school", BLUE), ("laptop", VIOLET), ("tree", GREEN), ("pin", CORAL))):
        a = t * .75 + i * math.tau / 5
        x, y = 640 + math.cos(a) * 230, 435 + math.sin(a) * 72
        d.ellipse((x - 39, y - 39, x + 39, y + 39), fill=rgba(WHITE), outline=rgba(col, 160), width=2)
        small_icon(d, kind, x, y, .43, col)
    q = ease(local(t, 1.15, .65))
    d.rounded_rectangle((410, 590, 870, 646), radius=8, fill=rgba(BLUE, int(255 * q)))
    d.text((640, 618), "COMMUNITY-LAB.VERCEL.APP", font=font(19, bold=True), fill=rgba(WHITE, int(255 * q)), anchor="mm")
    return img


SCENES = [
    (0, 5, scene_problem), (5, 11, scene_orbit), (11, 17, scene_people),
    (17, 22, scene_reveal), (22, 28, scene_student), (28, 34, scene_teacher),
    (34, 40, scene_org), (40, 46, scene_developer), (46, 51, scene_community),
    (51, 57, scene_scale), (57, 60, scene_cta),
]


def ribbon_transition(current, nxt, p, color):
    # A curved ribbon wipe replaces the old hard diagonal block transition.
    mask = Image.new("L", (RW, RH), 0)
    md = ImageDraw.Draw(mask)
    x = int(mix(-220, RW + 220, ease_in_out(p)))
    pts = []
    for y in range(-30, RH + 31, 20):
        edge = x + math.sin(y / 90 + p * math.pi) * 70
        pts.append((edge, y))
    md.polygon([(-50, -50)] + pts + [(-50, RH + 50)], fill=255)
    out = Image.composite(nxt, current, mask)
    d = ImageDraw.Draw(out, "RGBA")
    d.line(pts, fill=rgba(color, 165), width=12, joint="curve")
    return out


def render_at(t):
    for idx, (start, end, renderer) in enumerate(SCENES):
        if t < end or idx == len(SCENES) - 1:
            img = renderer(t - start)
            trans = .34
            if idx < len(SCENES) - 1 and t > end - trans:
                p = (t - end + trans) / trans
                img = ribbon_transition(img, SCENES[idx + 1][2](0), p, [CYAN, CORAL, VIOLET, GREEN][idx % 4])
            d = ImageDraw.Draw(img, "RGBA")
            x = 42 + (RW - 84) * clamp(t / DURATION)
            d.rounded_rectangle((42, RH - 15, RW - 42, RH - 11), radius=2, fill=rgba(INK, 25))
            d.rounded_rectangle((42, RH - 15, x, RH - 11), radius=2, fill=rgba(CYAN, 175))
            # Beat markers keep the composition visibly alive even while a message is held.
            for i in range(12):
                bx = ((i * 119 + t * (90 + i % 3 * 25)) % (RW + 60)) - 30
                by = 683 + math.sin(t * 7 + i * .75) * 8
                col = [BLUE, CYAN, CORAL, YELLOW, GREEN, VIOLET][i % 6]
                d.rounded_rectangle((bx - 10, by - 4, bx + 10, by + 4), radius=4, fill=rgba(col, 150))
            return img.convert("RGB")
    return scene_cta(3).convert("RGB")


def synth_sfx(path: Path):
    sr = 44100
    total = DURATION * sr
    audio = np.zeros((total, 2), dtype=np.float64)
    rng = np.random.default_rng(911)

    def add(start, sound, pan=0.0, gain=1.0):
        idx = int(start * sr)
        if idx >= total:
            return
        sound = sound[:total - idx] * gain
        audio[idx:idx + len(sound), 0] += sound * math.sqrt((1 - pan) / 2)
        audio[idx:idx + len(sound), 1] += sound * math.sqrt((1 + pan) / 2)

    def whoosh(dur=.42):
        n = int(dur * sr); tt = np.arange(n) / sr
        noise = np.concatenate(([0], np.diff(rng.normal(0, 1, n))))
        return noise * np.sin(np.pi * tt / dur) ** 2

    def ping(freq=840, dur=.16):
        n = int(dur * sr); tt = np.arange(n) / sr
        return (np.sin(2 * np.pi * freq * tt) + .25 * np.sin(2 * np.pi * freq * 2 * tt)) * np.exp(-tt * 22)

    def impact(freq=90, dur=.65):
        n = int(dur * sr); tt = np.arange(n) / sr
        return (.75 * np.sin(2 * np.pi * (freq * tt - 32 * tt**2)) + .12 * rng.normal(0, 1, n)) * np.exp(-tt * 6)

    cuts = [0, 5, 11, 17, 22, 28, 34, 40, 46, 51, 57]
    for i, cut in enumerate(cuts):
        add(cut, impact(82 if cut in (17, 51, 57) else 110), 0, .28 if cut in (17, 51, 57) else .16)
        if cut:
            add(cut - .3, whoosh(), -.35 if i % 2 else .35, .10)
    for i, start in enumerate([1.4, 2.2, 5.8, 6.7, 7.6, 12.0, 12.8, 13.6, 18.1, 19.0, 20.0, 23.0, 23.7, 24.4, 25.1, 29.0, 30.0, 31.0, 35.0, 36.1, 37.2, 41.0, 42.0, 43.0, 47.0, 48.0, 52.0, 52.4, 52.8, 53.2, 58.0]):
        add(start, ping(640 + i % 6 * 110), -.45 if i % 2 else .45, .075)
    audio = np.tanh(audio * 1.25)
    peak = np.max(np.abs(audio)) or 1
    audio = (audio / peak * .9 * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(audio.tobytes())


def build_music(ffmpeg: str, sfx: Path, output: Path):
    # Licensed online track anchors the bright electronic pulse; three local instrumental OSTs
    # supply short dramatic sections. Crossfades and sound design reshape the edit to 60 seconds.
    filters = (
        "[0:a]atrim=0:13.5,asetpts=PTS-STARTPTS,highpass=f=70,lowpass=f=15000,volume=0.85,afade=t=in:st=0:d=0.6[a0];"
        "[1:a]atrim=18:29.5,asetpts=PTS-STARTPTS,highpass=f=65,lowpass=f=12000,volume=0.78[a1];"
        "[0:a]atrim=52:65,asetpts=PTS-STARTPTS,highpass=f=70,volume=0.9[a2];"
        "[2:a]atrim=16:28,asetpts=PTS-STARTPTS,highpass=f=60,lowpass=f=13500,volume=0.76[a3];"
        "[3:a]atrim=18:29.4,asetpts=PTS-STARTPTS,highpass=f=60,lowpass=f=14000,volume=0.72,afade=t=out:st=10.6:d=0.8[a4];"
        "[a0][a1]acrossfade=d=0.35:c1=tri:c2=tri[x1];"
        "[x1][a2]acrossfade=d=0.35:c1=tri:c2=tri[x2];"
        "[x2][a3]acrossfade=d=0.35:c1=tri:c2=tri[x3];"
        "[x3][a4]acrossfade=d=0.35:c1=tri:c2=tri[bed];"
        "[4:a]volume=0.62[fx];"
        "[bed][fx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
        "loudnorm=I=-14.5:TP=-1.2:LRA=9,alimiter=limit=0.95[out]"
    )
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(ONLINE_MUSIC), "-i", str(COUNTERATTACK), "-i", str(JET_SET_RUN),
        "-i", str(TEAM_POTENTIAL), "-i", str(sfx), "-filter_complex", filters,
        "-map", "[out]", "-t", str(DURATION), "-ar", "44100", "-ac", "2",
        "-c:a", "pcm_s16le", str(output),
    ], check=True)


def render_storyboard():
    times = [2.5, 8, 14, 19.5, 25, 31, 37, 43, 48.5, 54, 58.5]
    thumbs = []
    for t in times:
        frame = render_at(t).resize((384, 216), Image.Resampling.LANCZOS)
        thumbs.append(frame)
    sheet = Image.new("RGB", (384 * 3, 216 * 4), "white")
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % 3) * 384, (i // 3) * 216))
    qa = OUTPUT / "qa" / "cpl-bright"
    qa.mkdir(parents=True, exist_ok=True)
    path = qa / "storyboard.jpg"
    sheet.save(path, quality=94)
    print(path)


def render_video():
    for src in (ONLINE_MUSIC, COUNTERATTACK, JET_SET_RUN, TEAM_POTENTIAL):
        if not src.exists():
            raise FileNotFoundError(src)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    silent = OUTPUT / "CPL-bright-motion-silent.mp4"
    sfx = OUTPUT / "CPL-bright-motion-sfx.wav"
    music = OUTPUT / "CPL-bright-motion-mix.wav"
    final = OUTPUT / "CPL-bright-motion-60s.mp4"
    synth_sfx(sfx)
    build_music(ffmpeg, sfx, music)
    cmd = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{RW}x{RH}", "-r", str(FPS), "-i", "-",
        "-vf", f"scale={OW}:{OH}:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart", str(silent),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for frame in range(DURATION * FPS):
        proc.stdin.write(render_at(frame / FPS).tobytes())
        if frame % (FPS * 5) == 0:
            print(f"Rendered {frame // FPS:02d}/{DURATION}s", flush=True)
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError("Video encoder failed")
    subprocess.run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(silent), "-i", str(music),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
        "-t", str(DURATION), "-movflags", "+faststart", str(final),
    ], check=True)
    print(final)


if __name__ == "__main__":
    import sys
    if "--storyboard" in sys.argv:
        render_storyboard()
    else:
        render_video()
