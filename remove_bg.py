import os
from PIL import Image

def process_image(filepath):
    print(f"Processing {filepath}...")
    img = Image.open(filepath).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if pixel is grayscale and light (checkerboard)
        # AI checkerboard is typically ~204 or 255.
        # Sum > 450 means average > 150.
        if sum(item[:3]) > 450 and max(item[:3]) - min(item[:3]) < 40:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    if "cow" not in filepath:
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
    img.save(filepath)
    print(f"Saved {filepath}")

directory = 'c:/Apps/rajadhani/web/assets/game/images/sprites'
for filename in os.listdir(directory):
    if filename.endswith(".png"):
        process_image(os.path.join(directory, filename))
