# Skywage Logo Files

This directory is for storing the Skywage logo and brand assets.

## Recommended Files

Please add the following files to this directory:

- `logo.png` - Full Skywage logo (recommended size: 200px height, with proportional width)
- `logo-icon.png` - Icon-only version of the logo (recommended size: 64x64px)
- `favicon.ico` - Browser tab icon (recommended size: 32x32px)

## Usage

These logo files will be used throughout the application in the following ways:

- `logo.png` - Main navigation header, landing page, and footer
- `logo-icon.png` - Mobile navigation and smaller UI elements
- `favicon.ico` - Browser tab icon

## How to Reference

In your Next.js components, you can reference these images like this:

```jsx
import Image from 'next/image';

// Full logo
<Image src="/images/logo.png" alt="Skywage Logo" width={200} height={50} />

// Icon only
<Image src="/images/logo-icon.png" alt="Skywage" width={32} height={32} />
```

For the favicon, it's automatically referenced in the HTML head when placed in the public directory.
