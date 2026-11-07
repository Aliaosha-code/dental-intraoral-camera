from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
ELECTRON_DIR = ROOT / 'electron'


def rounded_rectangle_gradient(size=1024, radius=232):
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    top = (79, 145, 255)
    bottom = (28, 78, 207)
    gradient = Image.new('RGB', (size, size))
    pixels = gradient.load()
    for y in range(size):
        mix = y / (size - 1)
        color = tuple(int(top[i] * (1 - mix) + bottom[i] * mix) for i in range(3))
        for x in range(size):
            pixels[x, y] = color

    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((32, 32, size - 32, size - 32), radius=radius, fill=255)
    image.paste(gradient, (0, 0), mask)
    return image


def draw_tooth(image):
    draw = ImageDraw.Draw(image)
    white = (255, 255, 255, 255)
    draw.rounded_rectangle((264, 214, 760, 586), radius=176, fill=white)
    draw.polygon([(304, 480), (376, 816), (444, 628), (468, 464)], fill=white)
    draw.polygon([(556, 464), (580, 628), (648, 816), (720, 480)], fill=white)
    draw.ellipse((332, 258, 520, 382), fill=(233, 242, 255, 220))
    return image


if __name__ == '__main__':
    ELECTRON_DIR.mkdir(parents=True, exist_ok=True)
    icon = rounded_rectangle_gradient()
    draw_tooth(icon)
    icon.save(ELECTRON_DIR / 'app-icon.png')

    try:
        icon.save(ELECTRON_DIR / 'app-icon.icns', format='ICNS')
        print('saved electron/app-icon.png and app-icon.icns')
    except Exception as exc:
        print('saved electron/app-icon.png')
        print('ICNS save skipped:', exc)

    try:
        icon.save(
            ELECTRON_DIR / 'app-icon.ico',
            format='ICO',
            sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
        )
        print('saved electron/app-icon.ico')
    except Exception as exc:
        print('ICO save skipped:', exc)
