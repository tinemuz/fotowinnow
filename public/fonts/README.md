# Custom Fonts for Fotowinnow

This directory contains custom fonts used for watermarking images in the application.

## Adding Custom Fonts

1. Place your font files (.ttf, .woff, .woff2) in this directory
2. Add the font names to the `svgFontMap` object in `src/server/api/routers/watermark.ts`
3. Add the font to the selection dropdown in `src/app/_components/SingleImageUploader.tsx`

## Font Configuration

The application uses the `FONTCONFIG_PATH` environment variable to point to this directory, ensuring that custom fonts are available in serverless environments where you might not have control over system-wide font installations.

## Example

To add a new font:

1. Add your font file (e.g., `MyCustomFont.ttf`) to this directory
2. Update the `svgFontMap` in `watermark.ts`:
   ```javascript
   const svgFontMap = {
       // ... existing entries
       'My Custom Font': "'My Custom Font', sans-serif",
   };
   ```
3. Update the selection dropdown in `SingleImageUploader.tsx`:
   ```javascript
   {[
       // ... existing entries
       "My Custom Font",
   ].map((f) => (
       <option key={f} value={f}>
           {f}
       </option>
   ))}
   ```

The `FONTCONFIG_PATH` environment variable is already configured to point to this directory.
