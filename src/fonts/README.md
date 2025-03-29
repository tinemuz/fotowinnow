# Font Configuration for Fotowinnow

This directory contains the fontconfig configuration needed for the application to properly render text in images.

## Setup Instructions

1. Place the following TTF font files in the `ttf` directory:
   - SpaceMono-Regular.ttf
   - RobotoMono-Regular.ttf
   - SourceCodePro-Regular.ttf
   - JetBrainsMono-Regular.ttf
   - IBMPlexMono-Regular.ttf
   - CutiveMono-Regular.ttf

2. Ensure your environment variables are properly set:
   ```
   FONTCONFIG_PATH=./src/fonts
   ```

   For macOS users with Homebrew:
   ```
   PANGOCAIRO_BACKEND=fontconfig
   ```

3. The `fonts.conf` file in this directory defines the font configuration for the application.

## Troubleshooting

If you encounter the error "Fontconfig error: Cannot load default config file", ensure:
1. The `FONTCONFIG_PATH` environment variable is correctly set
2. The font files exist in the `ttf` directory
3. The permissions on the font files and directories are correct 