Add-Type -AssemblyName System.Drawing

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    Write-Host "Generating icon-${size}x${size}.png..."
    
    # Create bitmap
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Fill background with blue color (#1976d2)
    $g.Clear([System.Drawing.Color]::FromArgb(25, 118, 210))
    
    # Draw dollar sign
    $fontSize = [int]($size * 0.4)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Center the text
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $g.DrawString('$', $font, $brush, ($size/2), ($size/2), $sf)
    
    # Save
    $bmp.Save("icon-${size}x${size}.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $g.Dispose()
    $bmp.Dispose()
    $font.Dispose()
    $brush.Dispose()
}

Write-Host "All icons generated successfully!"
