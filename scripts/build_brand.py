"""Build Event2Action's original geometric integration icon (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'custom_components/event2action/brand'
OUTPUT.mkdir(parents=True, exist_ok=True)

# Draw at 4x and downsample for clean small-scale edges.
SCALE = 4
image = Image.new('RGBA', (256 * SCALE, 256 * SCALE))
draw = ImageDraw.Draw(image)
blue = '#155e86'
white = '#ffffff'
amber = '#ffd166'

def box(bounds, radius, color):
    draw.rounded_rectangle(tuple(int(v * SCALE) for v in bounds), radius=radius * SCALE, fill=color)

def polygon(points, color):
    draw.polygon([(int(x*SCALE), int(y*SCALE)) for x,y in points], fill=color)

box((8, 8, 248, 248), 52, blue)
box((45, 44, 113, 212), 22, white)
box((59, 61, 99, 85), 7, blue)
for x, y in ((65, 111), (92, 111), (65, 138), (92, 138)):
    draw.ellipse(((x-6)*SCALE, (y-6)*SCALE, (x+6)*SCALE, (y+6)*SCALE), fill=blue)
box((62, 163, 96, 190), 10, blue)
# An arrow maps the incoming remote event to an action (lightning).
polygon(((125, 119), (145, 119), (145, 108), (165, 128), (145, 148), (145, 137), (125, 137)), white)
polygon(((194, 66), (168, 132), (190, 132), (177, 190), (220, 113), (197, 113), (213, 66)), amber)
for size, name in ((256, 'icon.png'), (512, 'icon@2x.png')):
    image.resize((size, size), Image.Resampling.LANCZOS).save(OUTPUT / name, optimize=True)
print('Built integration icons in', OUTPUT)
