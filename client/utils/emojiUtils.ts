/**
 * Checks if an emoji string is an image data URL
 * @param emoji The emoji string to check
 * @returns true if the emoji is an image data URL, false otherwise
 */
export function isImageEmoji(emoji: string): boolean {
  return emoji.startsWith("data:image/");
}

/**
 * Gets a safe alt text for an emoji image
 * @param label Optional label for the emoji
 * @returns Descriptive alt text for screen readers
 */
export function getEmojiAltText(label?: string): string {
  return label ? `Custom emoji: ${label}` : "Custom emoji image";
}
