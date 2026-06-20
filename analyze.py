import os
from PIL import Image

filepath = 'c:/Apps/rajadhani/web/assets/game/images/sprites/tree.png'
img = Image.open(filepath).convert("RGBA")
data = img.load()

# Print top-left 16x16 pixels to see the pattern
colors = set()
for x in range(32):
    for y in range(32):
        colors.add(data[x,y])
        
print("Colors in top-left 32x32:")
for c in list(colors)[:20]:
    print(c)
