/**
 * Device Detection Module
 *
 * This module detects client device information using ua-parser-js and sets
 * device-related cookies for server-side analytics and personalization.
 *
 * License Compatibility:
 * This module uses ua-parser-js v2.x which is licensed under AGPL-3.0.
 * Our project (infra-front) is also licensed under AGPL-3.0, so there is no
 * license conflict. Both projects share the same license terms.
 *
 * For reference:
 * - ua-parser-js v1.x was MIT licensed (also compatible)
 * - ua-parser-js v2.x switched to AGPL-3.0 (compatible with this project)
 */

import { UAParser } from 'ua-parser-js';

/**
 * Device information interface returned by the detection functions.
 */
export interface DeviceInfo {
  osName: string;
  osVersion: string;
  deviceType: string;
  deviceName: string;
}

/**
 * Sets a cookie with the given name and value.
 *
 * @param name - The cookie name
 * @param value - The cookie value (will be URL-encoded)
 */
function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict${secure}`;
}

/**
 * Reads a cookie value by name.
 *
 * @param name - The cookie name
 * @returns The decoded cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    try {
      return decodeURIComponent(match[2]);
    } catch (e) {
      return match[2];
    }
  }
  return null;
}

/**
 * Detects if the current device is an iPad.
 *
 * Uses the 'ongesturechange' event presence as a detection method.
 * This API is available on iPadOS devices but not on macOS, allowing us to
 * distinguish between iPad and iMac even when user-agent strings are similar.
 *
 * @returns true if the device is an iPad, false otherwise
 */
function isPad(): boolean {
  return typeof window !== 'undefined' && 'ongesturechange' in window;
}

/**
 * Detects the device information from the user-agent string.
 *
 * Uses ua-parser-js to parse the browser's user-agent and extract:
 * - Operating system name and version
 * - Device type (mobile, tablet, desktop, etc.)
 * - Device name (vendor + model)
 *
 * Falls back to 'Unknown' for any field that cannot be determined.
 * For iPad detection, combines user-agent analysis with feature detection
 * (ongesturechange event) for accurate identification.
 *
 * @returns DeviceInfo object containing osName, osVersion, deviceType, deviceName
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { osName: '', osVersion: '', deviceType: '', deviceName: '' };
  }

  const result = UAParser();
  const isPadDevice = isPad();

  const deviceVendor = result.device.vendor || '';
  const deviceModel = result.device.model || '';
  const deviceName = deviceVendor && deviceModel
    ? `${deviceVendor} ${deviceModel}`
    : deviceModel || deviceVendor || 'Unknown';

  let osName = result.os.name || 'Unknown';
  let deviceType = result.device.type || (isPadDevice ? 'tablet' : 'desktop');
  let finalDeviceName = deviceName;

  if (isPadDevice && osName.toLowerCase() == 'macos') {
    osName = 'iPadOS';
    deviceType = 'tablet';
    finalDeviceName = 'iPad';
  }

  return {
    osName,
    osVersion: result.os.version || 'Unknown',
    deviceType,
    deviceName: finalDeviceName,
  };
}

/**
 * Reads device information from existing cookies.
 *
 * @returns DeviceInfo object if all cookies exist, null otherwise
 */
export function readDeviceCookies(): DeviceInfo | null {
  const osName = getCookie('osName');
  const osVersion = getCookie('osVersion');
  const deviceType = getCookie('deviceType');
  const deviceName = getCookie('deviceName');

  if (osName && osVersion && deviceType && deviceName) {
    return { osName, osVersion, deviceType, deviceName };
  }
  return null;
}

/**
 * Sets device detection cookies in the browser.
 *
 * First checks if cookies already exist. If so, returns the existing values
 * without recalculating. Otherwise, detects device info and sets the cookies.
 *
 * This optimization avoids parsing the user-agent on every page load.
 *
 * @returns DeviceInfo object containing osName, osVersion, deviceType, deviceName
 */
export function setDeviceCookies(): DeviceInfo {
  try {
    const existing = readDeviceCookies();
    if (existing != null) {
      return existing;
    }

    const info = detectDevice();
    setCookie('osName', info.osName);
    setCookie('osVersion', info.osVersion);
    setCookie('deviceType', info.deviceType);
    setCookie('deviceName', info.deviceName);
    return info;
  } catch (e) {
    console.warn('Device detection failed, using Unknown values:', e);
    return { osName: 'Unknown', osVersion: 'Unknown', deviceType: 'Unknown', deviceName: 'Unknown' };
  }
}
