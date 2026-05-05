# PWA Icon Generation Instructions

## Quick Setup (Using Online Tool)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `public/logo.png`
3. Download the generated icon pack
4. Extract to `public/icons/`

## Manual Setup (Using ImageMagick - if installed)

If you have ImageMagick installed, run these commands from the project root:

```bash
# Create icons directory
mkdir -p public/icons

# Generate standard icons
magick public/logo.png -resize 72x72 public/icons/icon-72x72.png
magick public/logo.png -resize 96x96 public/icons/icon-96x96.png
magick public/logo.png -resize 128x128 public/icons/icon-128x128.png
magick public/logo.png -resize 144x144 public/icons/icon-144x144.png
magick public/logo.png -resize 152x152 public/icons/icon-152x152.png
magick public/logo.png -resize 192x192 public/icons/icon-192x192.png
magick public/logo.png -resize 384x384 public/icons/icon-384x384.png
magick public/logo.png -resize 512x512 public/icons/icon-512x512.png

# Generate maskable icons (with padding for safe area)
magick public/logo.png -resize 154x154 -gravity center -extent 192x192 -background white public/icons/icon-maskable-192x192.png
magick public/logo.png -resize 410x410 -gravity center -extent 512x512 -background white public/icons/icon-maskable-512x512.png
```

## Fallback (Copy existing logo)

If you don't have ImageMagick, you can temporarily use the existing logo:

```bash
mkdir -p public/icons
cp public/logo.png public/icons/icon-192x192.png
cp public/logo.png public/icons/icon-512x512.png
cp public/logo.png public/icons/icon-maskable-192x192.png
cp public/logo.png public/icons/icon-maskable-512x512.png
```

Then optimize them later using an online tool.

## iOS Splash Screens (Optional)

For better iOS experience, add splash screens:
- 640x1136 (iPhone SE)
- 750x1334 (iPhone 8)
- 1125x2436 (iPhone X)
- 1242x2688 (iPhone XS Max)

Place them in `public/splash/` and reference in `layout.tsx`.
