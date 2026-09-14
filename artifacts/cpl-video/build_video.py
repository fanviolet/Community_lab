from __future__ import annotations

import asyncio
import math
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
SCENES = ROOT / "scenes"
OUTPUT = ROOT / "output"
W, H = 1920, 1080

NAVY = "#111827"
INK = "#172036"
BLUE = "#246BFD"
CYAN = "#13B8D4"
VIOLET = "#6D4AFF"
WHITE = "#FFFFFF"
MUTED = "#667085"
PALE = "#F4F7FC"
GREEN = "#16A36A"

FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_SEMIBOLD = Path("C:/Windows/Fonts/seguisb.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")


def font(size: int, bold: bool = False, semibold: bool = False):
    path = FONT_BOLD if bold else FONT_SEMIBOLD if semibold else FONT_REGULAR
    return ImageFont.truetype(str(path), size=size)


def cover(image: Image.Image, size=(W, H), focal=(0.5, 0.5)) -> Image.Image:
    image = image.convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, round((resized.width - size[0]) * focal[0]))
    top = max(0, round((resized.height - size[1]) * focal[1]))
    return resized.crop((left, top, left + size[0], top + size[1]))


def contain(image: Image.Image, size: tuple[int, int], background=WHITE) -> Image.Image:
    image = image.convert("RGBA")
    scale = min(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, background)
    canvas.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return canvas.convert("RGB")


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 10,
):
    x, y = xy
    for line in wrap(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def label(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, fill=BLUE):
    fnt = font(28, semibold=True)
    width = draw.textbbox((0, 0), text, font=fnt)[2]
    draw.rounded_rectangle((x, y, x + width + 44, y + 52), radius=16, fill=fill)
    draw.text((x + 22, y + 9), text, font=fnt, fill=WHITE)


def add_top_brand(draw: ImageDraw.ImageDraw, dark=False):
    fill = WHITE if dark else INK
    draw.ellipse((84, 74, 112, 102), fill=CYAN)
    draw.ellipse((102, 74, 130, 102), fill=VIOLET)
    draw.text((146, 70), "COMMUNITY PROJECT LAB", font=font(25, semibold=True), fill=fill)


def image_with_overlay(path: Path, opacity: int, color=(8, 18, 42), focal=(0.5, 0.5)):
    image = cover(Image.open(path), focal=focal)
    overlay = Image.new("RGBA", (W, H), (*color, opacity))
    image = image.convert("RGBA")
    image.alpha_composite(overlay)
    return image.convert("RGB")


def scene_01():
    canvas = image_with_overlay(SOURCE / "community-action.jpg", 150, focal=(0.5, 0.44))
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw, dark=True)
    label(draw, "MỌI THAY ĐỔI ĐỀU BẮT ĐẦU TỪ MỘT CÂU HỎI", 120, 300, CYAN)
    y = draw_wrapped(draw, "Một vấn đề được nhìn thấy...", (120, 385), font(78, bold=True), WHITE, 1120, 8)
    draw_wrapped(draw, "có thể trở thành một dự án thay đổi cộng đồng.", (120, y + 12), font(48, semibold=True), "#D8E8FF", 1180, 8)
    draw.rounded_rectangle((120, 832, 680, 838), radius=3, fill=CYAN)
    draw.text((120, 872), "60 GIÂY ĐỂ KHÁM PHÁ CPL", font=font(26, semibold=True), fill=WHITE)
    return canvas


def scene_02():
    canvas = image_with_overlay(SOURCE / "students-classroom.jpg", 125, color=(15, 22, 48), focal=(0.5, 0.48))
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw, dark=True)
    draw.text((120, 220), "Ý tưởng tốt thường dừng lại trên giấy.", font=font(64, bold=True), fill=WHITE)
    issues = [
        ("01", "Thiếu công cụ", "Quy trình phân tán, khó theo dõi"),
        ("02", "Thiếu kỹ năng", "Chưa biết bắt đầu và triển khai"),
        ("03", "Thiếu kết nối", "Ý tưởng và nguồn lực chưa gặp nhau"),
    ]
    x = 120
    for number, title, body in issues:
        draw.rounded_rectangle((x, 430, x + 500, 740), radius=24, fill=(255, 255, 255, 224))
        draw.text((x + 34, 468), number, font=font(34, bold=True), fill=BLUE)
        draw.text((x + 34, 535), title, font=font(38, bold=True), fill=INK)
        draw_wrapped(draw, body, (x + 34, 600), font(25), MUTED, 420, 8)
        x += 555
    return canvas


def scene_03():
    canvas = Image.new("RGB", (W, H), PALE)
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw)
    draw.text((112, 155), "CPL nối liền khoảng cách", font=font(54, bold=True), fill=INK)
    draw.text((112, 225), "từ ý tưởng đến tác động thật.", font=font(54, bold=True), fill=BLUE)

    shot = Image.open(SOURCE / "cpl-home.png").convert("RGB")
    shot = shot.resize((1280, 720), Image.Resampling.LANCZOS)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = ImageDraw.Draw(shadow)
    sh.rounded_rectangle((552, 338, 1862, 1080), radius=30, fill=(20, 34, 70, 42))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow)
    canvas.alpha_composite(shot.convert("RGBA"), (582, 318))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((110, 420, 500, 795), radius=24, fill=INK)
    draw.text((152, 465), "MỘT NỀN TẢNG", font=font(24, semibold=True), fill=CYAN)
    draw_wrapped(draw, "Phát hiện vấn đề. Kiến tạo giải pháp. Triển khai dự án.", (152, 530), font(34, bold=True), WHITE, 300, 12)
    return canvas.convert("RGB")


def scene_04():
    canvas = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw)
    draw.text((105, 150), "Một hành trình khép kín. Bảy bước rõ ràng.", font=font(56, bold=True), fill=INK)
    graphic = Image.open(SOURCE / "image2.png")
    graphic = contain(graphic, (1580, 800), WHITE)
    canvas.paste(graphic, (170, 245))
    return canvas


def scene_05():
    canvas = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw, dark=True)
    draw.text((120, 170), "AI không thay con người quyết định.", font=font(60, bold=True), fill=WHITE)
    draw.text((120, 250), "AI giúp con người nhìn sâu hơn và hành động tốt hơn.", font=font(38, semibold=True), fill="#AFC7F7")

    center = (960, 600)
    nodes = [
        (390, 455, "PHÂN TÍCH", "Nguyên nhân"),
        (1530, 455, "ĐỊNH HƯỚNG", "Giải pháp"),
        (430, 785, "LẬP KẾ HOẠCH", "Dự án"),
        (1490, 785, "KẾ THỪA", "Tri thức"),
    ]
    for x, y, _, _ in nodes:
        draw.line((center[0], center[1], x, y), fill="#315080", width=4)
    draw.ellipse((820, 460, 1100, 740), fill=VIOLET, outline="#9D8BFF", width=5)
    draw.text((897, 526), "AI", font=font(90, bold=True), fill=WHITE)
    draw.text((875, 645), "TRỢ LÝ SỐ", font=font(25, semibold=True), fill=WHITE)
    for x, y, title, body in nodes:
        draw.rounded_rectangle((x - 210, y - 78, x + 210, y + 78), radius=22, fill="#1B2942", outline="#33496D", width=2)
        tw = draw.textbbox((0, 0), title, font=font(27, bold=True))[2]
        draw.text((x - tw / 2, y - 42), title, font=font(27, bold=True), fill=CYAN)
        bw = draw.textbbox((0, 0), body, font=font(23))[2]
        draw.text((x - bw / 2, y + 5), body, font=font(23), fill="#D7E2F4")
    return canvas


def scene_06():
    canvas = Image.new("RGB", (W, H), PALE)
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw)
    draw.text((120, 160), "Mọi thứ được tổ chức để cùng tiến về phía trước.", font=font(55, bold=True), fill=INK)
    items = [
        ("NHIỆM VỤ", "Rõ người, rõ việc", BLUE),
        ("TIẾN ĐỘ", "Có thể đo lường", GREEN),
        ("THÀNH VIÊN", "Đúng vai trò", VIOLET),
        ("KẾT QUẢ", "Lưu trữ, kế thừa", CYAN),
    ]
    x = 120
    for title, body, color in items:
        draw.rounded_rectangle((x, 390, x + 390, 720), radius=24, fill=WHITE, outline="#DCE4F0", width=2)
        draw.ellipse((x + 38, 435, x + 112, 509), fill=color)
        draw.text((x + 38, 555), title, font=font(29, bold=True), fill=INK)
        draw_wrapped(draw, body, (x + 38, 610), font(25), MUTED, 310, 6)
        x += 430
    draw.text((120, 820), "Minh bạch hơn  •  Phối hợp tốt hơn  •  Tạo tác động rõ ràng hơn", font=font(33, semibold=True), fill=BLUE)
    return canvas


def scene_07():
    canvas = Image.new("RGB", (W, H), "#0D1B2A")
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw, dark=True)
    draw.text((120, 170), "Quy mô phát triển giả định sau năm đầu", font=font(58, bold=True), fill=WHITE)
    stats = [
        ("500+", "học sinh tham gia"),
        ("50", "ý tưởng cộng đồng"),
        ("20", "dự án thực tế"),
        ("100+", "tài liệu kinh nghiệm"),
        ("30–50%", "giảm thời gian quản lý"),
    ]
    positions = [(120, 385), (640, 385), (1160, 385), (380, 700), (1010, 700)]
    for (value, caption), (x, y) in zip(stats, positions):
        draw.text((x, y), value, font=font(72, bold=True), fill=CYAN if value != "30–50%" else "#A88BFF")
        draw.text((x, y + 105), caption, font=font(27, semibold=True), fill="#D6E0EF")
    draw.text((120, 955), "Từ một trường học → nhiều cộng đồng → mạng lưới nhiều địa phương", font=font(30, semibold=True), fill=WHITE)
    return canvas


def scene_08():
    canvas = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(canvas)
    add_top_brand(draw)
    draw.text((120, 165), "Sẵn sàng để phát triển cùng cộng đồng nhà phát triển.", font=font(54, bold=True), fill=INK)
    stack = [
        ("NEXT.JS 16", "Trải nghiệm web hiện đại"),
        ("SUPABASE", "Dữ liệu, xác thực, realtime"),
        ("AI LAYER", "Phân tích xuyên suốt quy trình"),
        ("TYPESCRIPT", "Nền tảng dễ mở rộng, bảo trì"),
    ]
    for index, (title, body) in enumerate(stack):
        y = 360 + index * 145
        draw.rounded_rectangle((220, y, 790, y + 106), radius=18, fill=PALE, outline="#D8E2F0", width=2)
        draw.text((260, y + 20), title, font=font(30, bold=True), fill=BLUE)
        draw.text((260, y + 61), body, font=font(22), fill=MUTED)
        draw.line((790, y + 53, 1055, y + 53), fill="#B4C6E5", width=4)
    draw.rounded_rectangle((1055, 375, 1710, 875), radius=28, fill=NAVY)
    draw.text((1120, 435), "MỘT HẠ TẦNG SỐ", font=font(28, semibold=True), fill=CYAN)
    draw_wrapped(draw, "Cho sáng kiến cộng đồng được hình thành, triển khai và tiếp nối.", (1120, 510), font(50, bold=True), WHITE, 520, 10)
    return canvas


def scene_09():
    canvas = image_with_overlay(SOURCE / "community-action.jpg", 185, color=(8, 18, 42), focal=(0.55, 0.44))
    draw = ImageDraw.Draw(canvas)
    draw.text((120, 120), "COMMUNITY PROJECT LAB", font=font(34, semibold=True), fill=CYAN)
    y = draw_wrapped(draw, "Đừng chỉ nhìn thấy vấn đề.", (120, 305), font(72, bold=True), WHITE, 1180, 10)
    y = draw_wrapped(draw, "Hãy biến vấn đề thành hành động.", (120, y + 15), font(72, bold=True), "#9FE6F0", 1320, 10)
    draw.rounded_rectangle((120, 700, 635, 782), radius=18, fill=VIOLET)
    draw.text((169, 718), "community-lab.vercel.app", font=font(30, semibold=True), fill=WHITE)
    draw.text((120, 920), "CPL • Ý tưởng số – Lan tỏa sức mạnh số", font=font(25), fill="#D6E0EF")
    draw.text((120, 985), "Ảnh tư liệu: Wikimedia Commons (Public Domain)", font=font(18), fill="#9FB0C9")
    return canvas


SCENE_BUILDERS = [scene_01, scene_02, scene_03, scene_04, scene_05, scene_06, scene_07, scene_08, scene_09]


NARRATION = """Mỗi ngày, quanh ta có những vấn đề đáng được lắng nghe. Nhưng nhiều ý tưởng tốt vẫn dừng lại trên giấy vì thiếu công cụ, kỹ năng và sự kết nối. Community Project Lab, hay CPL, được tạo ra để thay đổi điều đó. Trên một nền tảng duy nhất, người dùng tham gia cộng đồng, phát hiện vấn đề, cùng thảo luận, đề xuất giải pháp, tạo dự án, triển khai và lưu trữ tri thức. AI không thay con người quyết định. AI là trợ lý số giúp phân tích nguyên nhân, định hướng giải pháp, xây dựng kế hoạch và học từ những dự án trước. Với CPL, nhiệm vụ, tiến độ, thành viên và kết quả đều rõ ràng, minh bạch, có thể đo lường. Sau năm đầu, CPL hướng tới hơn năm trăm học sinh, năm mươi ý tưởng, hai mươi dự án thực tế, hơn một trăm tài liệu kinh nghiệm và giảm ba mươi đến năm mươi phần trăm thời gian quản lý. Xây dựng trên nền tảng web hiện đại, CPL có thể mở rộng từ một trường học tới mạng lưới nhiều địa phương. Đừng chỉ nhìn thấy vấn đề. Hãy cùng biến vấn đề thành hành động, và hành động thành giá trị bền vững."""


def build_scenes():
    SCENES.mkdir(parents=True, exist_ok=True)
    for index, builder in enumerate(SCENE_BUILDERS, start=1):
        image = builder()
        image.save(SCENES / f"scene-{index:02d}.png", quality=95)


async def build_narration():
    import edge_tts

    communicate = edge_tts.Communicate(
        NARRATION,
        voice="vi-VN-HoaiMyNeural",
        rate="+8%",
        pitch="-2Hz",
    )
    await communicate.save(str(OUTPUT / "narration.mp3"))


def build_music(duration=60.0, sample_rate=44100):
    total = int(duration * sample_rate)
    t = np.arange(total, dtype=np.float64) / sample_rate
    music = np.zeros(total, dtype=np.float64)
    chords = [
        (146.83, 220.00, 293.66),
        (130.81, 196.00, 261.63),
        (164.81, 246.94, 329.63),
        (110.00, 164.81, 220.00),
    ]
    section = 7.5
    for index in range(math.ceil(duration / section)):
        start = int(index * section * sample_rate)
        end = min(total, int((index + 1) * section * sample_rate))
        local_t = t[start:end] - index * section
        chord = chords[index % len(chords)]
        pad = sum(np.sin(2 * np.pi * freq * local_t + index * 0.3) for freq in chord) / len(chord)
        shimmer = np.sin(2 * np.pi * chord[1] * 2 * local_t) * 0.12
        envelope = np.minimum(local_t / 1.1, 1.0) * np.minimum((section - local_t) / 1.1, 1.0)
        music[start:end] += (pad + shimmer) * np.clip(envelope, 0, 1)
    pulse = np.sin(2 * np.pi * 1.5 * t) ** 12
    music += 0.07 * pulse * np.sin(2 * np.pi * 73.42 * t)
    music *= 0.32
    fade = int(2.0 * sample_rate)
    music[:fade] *= np.linspace(0, 1, fade)
    music[-fade:] *= np.linspace(1, 0, fade)
    stereo = np.column_stack((music, music * 0.96))
    pcm = np.int16(np.clip(stereo, -1, 1) * 32767)
    with wave.open(str(OUTPUT / "music.wav"), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())


def ffmpeg_path():
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(command: list[str]):
    subprocess.run(command, check=True)


def build_scene_clips(ffmpeg: str):
    clip_dir = OUTPUT / "clips"
    clip_dir.mkdir(parents=True, exist_ok=True)
    for index in range(1, 10):
        src = SCENES / f"scene-{index:02d}.png"
        dst = clip_dir / f"scene-{index:02d}.mp4"
        zoom = "min(zoom+0.00045,1.04)" if index % 2 else "min(zoom+0.00035,1.035)"
        vf = f"zoompan=z='{zoom}':d=225:s=1920x1080:fps=30,format=yuv420p"
        run([
            ffmpeg, "-y", "-loop", "1", "-i", str(src), "-vf", vf,
            "-t", "7.5", "-r", "30", "-c:v", "libx264", "-preset", "medium",
            "-crf", "18", "-pix_fmt", "yuv420p", str(dst),
        ])


def join_clips(ffmpeg: str):
    clip_dir = OUTPUT / "clips"
    inputs: list[str] = []
    for index in range(1, 10):
        inputs += ["-i", str(clip_dir / f"scene-{index:02d}.mp4")]

    parts = []
    previous = "[0:v]"
    offset = 6.5
    for index in range(1, 9):
        output = f"[v{index}]"
        parts.append(f"{previous}[{index}:v]xfade=transition=fade:duration=1:offset={offset:.1f}{output}")
        previous = output
        offset += 6.5
    filter_complex = ";".join(parts)
    run([
        ffmpeg, "-y", *inputs, "-filter_complex", filter_complex,
        "-map", previous, "-t", "59.5", "-c:v", "libx264", "-preset", "medium",
        "-crf", "18", "-pix_fmt", "yuv420p", str(OUTPUT / "video-silent.mp4"),
    ])


def add_audio(ffmpeg: str):
    run([
        ffmpeg, "-y",
        "-i", str(OUTPUT / "video-silent.mp4"),
        "-i", str(OUTPUT / "narration.mp3"),
        "-i", str(OUTPUT / "music.wav"),
        "-filter_complex",
        "[1:a]atempo=1.05,volume=1.15,apad=pad_dur=2[n];"
        "[2:a]volume=0.20,afade=t=in:st=0:d=2,afade=t=out:st=56:d=3[m];"
        "[n][m]amix=inputs=2:duration=longest:dropout_transition=2[a]",
        "-map", "0:v", "-map", "[a]", "-t", "59.5",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(OUTPUT / "CPL-introduction-60s.mp4"),
    ])


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_scenes()
    asyncio.run(build_narration())
    build_music()
    ffmpeg = ffmpeg_path()
    build_scene_clips(ffmpeg)
    join_clips(ffmpeg)
    add_audio(ffmpeg)
    print(OUTPUT / "CPL-introduction-60s.mp4")


if __name__ == "__main__":
    main()
