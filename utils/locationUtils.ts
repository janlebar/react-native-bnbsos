/**
 * Location message encoding and parsing utilities.
 * These functions ensure compatibility with the Next.js web app's location message format.
 *
 * Format: "📍 Location: https://www.google.com/maps?q=LATITUDE,LONGITUDE"
 */

/**
 * Encodes latitude and longitude into the chat message text format.
 * This MUST match the format used in Next.js MessageInput.handleSendLocation.
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Encoded location message string
 */
export function encodeLocationMessage(
  latitude: number,
  longitude: number
): string {
  return `📍 Location: https://www.google.com/maps?q=${latitude},${longitude}`;
}

export interface ParsedLocation {
  latitude: number;
  longitude: number;
  url: string;
}

/**
 * Parses a chat message text to extract location coordinates.
 * Returns null if the message is not a location message.
 *
 * This MUST use the same regex as Next.js MessagesPanel.extractCoordinates.
 *
 * @param text - Message text to parse
 * @returns Parsed location data or null
 */
export function parseLocationMessage(text?: string): ParsedLocation | null {
  if (!text) return null;

  // Same regex as MessagesPanel.extractCoordinates in the Next.js app
  const match = text.match(
    /Location: (https:\/\/www\.google\.com\/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+))/
  );

  if (!match) return null;

  return {
    url: match[1],
    latitude: parseFloat(match[2]),
    longitude: parseFloat(match[3]),
  };
}

/**
 * Returns true if a message text is a location message.
 *
 * @param text - Message text to check
 * @returns True if the message is a location message
 */
export function isLocationMessage(text?: string): boolean {
  return parseLocationMessage(text) !== null;
}

/**
 * Returns a platform-appropriate Maps URL for opening in native maps app.
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param platform - Platform identifier ("ios", "android", or "web")
 * @returns Platform-specific maps URL
 */
export function getMapsUrl(
  latitude: number,
  longitude: number,
  platform: "ios" | "android" | "web" = "web"
): string {
  const label = encodeURIComponent("Shared Location");
  switch (platform) {
    case "ios":
      return `maps:0,0?q=${label}@${latitude},${longitude}`;
    case "android":
      return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    default:
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}
