# Generate PWA Icons Script
# This script generates all necessary PWA icon sizes from the SVG

# For Windows, you can use ImageMagick or an online tool
# Install ImageMagick from: https://imagemagick.org/script/download.php

# After installing ImageMagick, run these commands in PowerShell:

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
$svgPath = "c:\workspace\SplitUp\web\public\icons\icon.svg"
$outputDir = "c:\workspace\SplitUp\web\public\icons"

foreach ($size in $sizes) {
    $output = "$outputDir\icon-${size}x${size}.png"
    Write-Host "Generating $output..."
    magick convert -background none -density 1000 -resize ${size}x${size} $svgPath $output
}

Write-Host "All icons generated successfully!"

# Alternative: Use an online SVG to PNG converter like:
# - https://cloudconvert.com/svg-to-png
# - https://svgtopng.com/
# Upload icon.svg and generate these sizes: 72, 96, 128, 144, 152, 192, 384, 512
