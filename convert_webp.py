import os
from PIL import Image
import sys

def convert_to_webp(folder_path):
    print(f"Scanning directory: {folder_path}")
    count = 0
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith('.png'):
                png_path = os.path.join(root, file)
                webp_path = os.path.splitext(png_path)[0] + '.webp'
                try:
                    with Image.open(png_path) as img:
                        img.save(webp_path, 'webp', quality=90)
                    print(f"Converted: {png_path} -> {webp_path}")
                    count += 1
                except Exception as e:
                    print(f"Failed to convert {png_path}: {e}")
    print(f"Done. Converted {count} files.")

if __name__ == "__main__":
    target_dir = r"c:\Apps\rajadhani\web\assets\game\images\sprites"
    convert_to_webp(target_dir)
