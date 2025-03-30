export const FONT_OPTIONS = [
    "Space Mono",
    "Roboto Mono",
    "Source Code Pro",
    "JetBrains Mono",
    "IBM Plex Mono",
    "Cutive Mono"
];

export const QUALITY_OPTIONS = [
    "512p",
    "1080p",
    "2K",
    "4K"
] as const;

export type QualityOption = typeof QUALITY_OPTIONS[number];

export const MAX_WATERMARK_LENGTH = 15; 