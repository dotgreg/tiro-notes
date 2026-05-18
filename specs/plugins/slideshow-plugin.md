# Slideshow Plugin

## Overview
A custom tag plugin that creates image slideshows from a list of absolute image URLs using the Viewer.js library.

## Usage
```
[[slideshow]]
https://example.com/image1.png
https://example.com/image2.png
https://example.com/image3.png
[[slideshow]]
```

## Features
- Inline mode slideshow viewer
- All viewer.js options activated
- Responsive horizontal scrolling
- Image zooming, panning, rotation
- Keyboard navigation support
- Touch device support

## Technical Details

### Plugin Structure
- **CTAG File**: `/plugins/slideshow/slideshow.ctag.js`
- **Manifest**: `/plugins/slideshow/slideshow.plugin.js`

### Implementation
The plugin parses the innerTagStr to extract image URLs, loads Viewer.js from CDN, and initializes the viewer in inline mode with all available options enabled.

### Viewer.js Options Activated
- `inline: true` - Enables inline mode
- `backdrop: true` - Shows backdrop
- `button: true` - Shows control buttons
- `navbar: true` - Shows navigation bar
- `title: true` - Shows image titles
- `toolbar: true` - Shows toolbar
- `fullscreen: true` - Enables fullscreen mode
- `keyboard: true` - Enables keyboard navigation
- `focus: true` - Focuses viewer on initialization
- `loading: true` - Shows loading indicator
- `loop: true` - Enables looping
- `movable: true` - Enables moving
- `rotatable: true` - Enables rotation
- `scalable: true` - Enables scaling
- `zoomable: true` - Enables zooming
- `zoomOnTouch: true` - Enables zooming on touch
- `zoomOnWheel: true` - Enables zooming on scroll
- `slideOnTouch: true` - Enables sliding on touch
- `toggleOnDblclick: true` - Enables toggle on double-click
- `tooltip: true` - Shows tooltips
- `transition: true` - Enables transitions

## Requirements
- Absolute image URLs in the innerTagStr
- Internet connectivity to load Viewer.js from CDN
