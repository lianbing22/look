#!/bin/bash

# 确保icons目录存在
mkdir -p icons

# 检查是否已安装librsvg和ImageMagick
if ! command -v rsvg-convert &> /dev/null || ! command -v convert &> /dev/null; then
    echo "需要安装librsvg和ImageMagick工具"
    echo "在macOS上，您可以使用以下命令安装它们："
    echo "brew install librsvg imagemagick"
    exit 1
fi

# 从SVG生成各种尺寸的PNG图标
echo "正在生成图标..."

SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
    echo "生成 ${size}x${size} 图标..."
    # 使用rsvg-convert或convert命令
    if command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w $size -h $size icons/icon-placeholder.svg -o icons/icon-${size}x${size}.png
    else
        convert -background none -resize ${size}x${size} icons/icon-placeholder.svg icons/icon-${size}x${size}.png
    fi
done

echo "生成截图..."
# 生成一个示例截图
convert -size 1280x720 -background "#0a1429" -fill white -gravity center \
    -font Arial -pointsize 48 label:"恒泰视觉 AI 识别系统\n示例截图" icons/screenshot.jpg

echo "所有图标已生成" 