from PIL import Image

# Abrir a imagem
img = Image.open('src/img/iguacu_vidros.PNG')

# Pegar uma amostra do background azul (canto superior)
# A imagem tem o azul dominante no background
crop = img.crop((0, 0, 100, 100))
pixels = crop.getdata()

# Contar cores mais frequentes
color_counts = {}
for pixel in pixels:
    # Se for RGBA, converter para RGB
    if isinstance(pixel, tuple) and len(pixel) == 4:
        rgb = pixel[:3]
    else:
        rgb = pixel if isinstance(pixel, tuple) else (pixel, pixel, pixel)
    
    # Ignorar branco (texto)
    if rgb != (255, 255, 255):
        color_counts[rgb] = color_counts.get(rgb, 0) + 1

# Encontrar as cores mais comuns
top_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)[:5]

print("Top 5 cores mais frequentes (RGB -> HEX):")
for color, count in top_colors:
    hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
    print(f"{color} = {hex_color} ({count} pixels)")
