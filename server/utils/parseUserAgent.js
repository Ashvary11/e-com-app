import { UAParser } from "ua-parser-js";

export const parseUserAgent = (uaString) => {
  if (!uaString) {
    return { deviceName: "Unknown device", browser: null, os: null, deviceType: null };
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown browser";
  const os = result.os.name || "Unknown OS";
  const deviceType = result.device.type; // "mobile" | "tablet" | undefined (desktop)

  // Build a stable, human-readable device label
  // Examples: "Chrome on macOS", "Safari on iPhone", "Chrome on Android"
  let deviceName;
  if (deviceType === "mobile" || deviceType === "tablet") {
    const deviceModel = result.device.model || result.device.vendor || "device";
    deviceName = `${browser} on ${deviceModel}`;
  } else {
    deviceName = `${browser} on ${os}`;
  }

  return {
    deviceName,
    browser,
    os,
    deviceType: deviceType || "desktop",
  };
};