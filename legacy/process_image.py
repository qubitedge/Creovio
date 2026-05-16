from PIL import Image
import os

def process_image(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    # Get the top-left pixel color as the background to remove
    bg_color = img.getpixel((0, 0))
    
    datas = img.getdata()
    newData = []
    for item in datas:
        # Match colors within a tolerance
        if all(abs(item[i] - bg_color[i]) < 30 for i in range(3)):
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Processed image saved to {output_path}")

if __name__ == "__main__":
    process_image("robot.png", "robot_transparent.png")
