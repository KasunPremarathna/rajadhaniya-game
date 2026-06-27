from PIL import Image
from collections import deque

def remove_bg(image_path):
    print(f"Processing {image_path}...")
    img = Image.open(image_path).convert("RGBA")
    
    width, height = img.size
    pixels = img.load()
    
    def is_white(color):
        return color[0] > 230 and color[1] > 230 and color[2] > 230
        
    visited = set()
    queue = deque()
    
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    transparent_pixels = set()
    
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
            
        visited.add((x, y))
        
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
            
        if is_white(pixels[x, y]):
            transparent_pixels.add((x, y))
            queue.append((x - 1, y))
            queue.append((x + 1, y))
            queue.append((x, y - 1))
            queue.append((x, y + 1))
            
    for (x, y) in transparent_pixels:
        pixels[x, y] = (255, 255, 255, 0)
        
    img.save(image_path, "PNG")
    print(f"Saved {image_path}")

images = [
    r"web\assets\game\images\sprites\prehistoric\cow_farm.png",
    r"web\assets\game\images\sprites\prehistoric\npc_farmer.png",
    r"web\assets\game\images\sprites\prehistoric\npc_lumberjack.png"
]

for p in images:
    try:
        remove_bg(p)
    except Exception as e:
        print(f"Failed {p}: {e}")
