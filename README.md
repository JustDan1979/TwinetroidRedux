# Twinetroid Redux

A respectful quality-of-life (QOL) build of **Twinetroid**, the Twine adaptation of the Metroid novelization. The original interactive story is hosted at:
https://metroiddatabase.com/a-merry-twinetroid-christmas

**Original Work Credits**
- Publisher: **Futabasha**
- Writer: **Noboyuki Shioda**
- Illustrator: **Arisaka Sumi**

This project focuses on UI/UX polish, modernized presentation, and playability improvements while preserving the original text and structure.

## Attribution
See `assets/audio/ATTRIBUTION.txt` for full image sources and notes.

## Build
Requirements: [Tweego](https://www.motoslave.net/tweego/)

```powershell
# Build the story HTML
TWEGO -o .\Twinetroid.html .\twee\Twinetroid.twee
```

## Tests
```powershell
npm install
npm run test:e2e
```

## Disclaimer
This is a fan project and is not affiliated with Nintendo, Futabasha, or Metroid Database.

