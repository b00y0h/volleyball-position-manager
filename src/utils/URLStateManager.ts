/**
 * URLStateManager - Handles URL encoding/decoding of position data for sharing
 */

import {
  URLPositionData,
  CustomPositionsState,
  SystemType,
  PlayerPosition,
  FormationPositions,
} from "@/types";

// Current version for backward compatibility
const CURRENT_VERSION = "1.0.0";

// Maximum URL length to stay within browser limits
const MAX_URL_LENGTH = 2000;

export class URLStateManager {
  /**
   * Encode position data into a shareable URL
   */
  static encodePositionsToURL(
    baseURL: string,
    system: SystemType,
    rotation: number,
    positions: CustomPositionsState
  ): string {
    try {
      // Validate input parameters
      if (
        !baseURL ||
        !system ||
        typeof rotation !== "number" ||
        positions === null ||
        positions === undefined
      ) {
        throw new Error("Invalid input parameters");
      }

      const urlData: URLPositionData = {
        system,
        rotation,
        positions,
        version: CURRENT_VERSION,
      };

      // Convert to JSON and compress
      const jsonString = JSON.stringify(urlData, this.dateReplacer);
      const compressed = this.compressData(jsonString);

      // Create URL parameters
      const params = new URLSearchParams({
        d: compressed, // compressed data
        v: CURRENT_VERSION, // version
        s: system, // system
        r: rotation.toString(), // rotation
      });

      const fullURL = `${baseURL}?${params.toString()}`;

      // Check URL length and use fallback if too long
      if (fullURL.length > MAX_URL_LENGTH) {
        return this.createFallbackURL(baseURL, system, rotation, positions);
      }

      return fullURL;
    } catch (error) {
      console.error("Failed to encode positions to URL:", error);
      throw new Error("Failed to create shareable URL");
    }
  }

  /**
   * Decode position data from URL parameters
   */
  static decodePositionsFromURL(url: string): URLPositionData | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const compressed = params.get("d");
      const version = params.get("v");
      const system = params.get("s") as SystemType;
      const rotation = params.get("r");

      if (!compressed || !version || !system || !rotation) {
        return null;
      }

      // Decompress and parse data
      const jsonString = this.decompressData(compressed);
      const data = JSON.parse(jsonString, this.dateReviver) as URLPositionData;

      // Validate version compatibility
      if (!this.isVersionCompatible(data.version)) {
        console.warn(
          `URL version ${data.version} may not be fully compatible with current version ${CURRENT_VERSION}`
        );
      }

      // Validate data structure
      if (!this.validateURLData(data)) {
        throw new Error("Invalid URL data structure");
      }

      return data;
    } catch (error) {
      console.error("Failed to decode positions from URL:", error);
      return null;
    }
  }

  /**
   * Check if URL contains position data
   */
  static hasPositionData(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      return (
        params.has("d") && params.has("v") && params.has("s") && params.has("r")
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract basic info from URL without full decoding
   */
  static getURLInfo(
    url: string
  ): { system: SystemType; rotation: number; version: string } | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const system = params.get("s") as SystemType;
      const rotation = params.get("r");
      const version = params.get("v");

      if (!system || !rotation || !version) {
        return null;
      }

      return {
        system,
        rotation: parseInt(rotation),
        version,
      };
    } catch {
      return null;
    }
  }

  /**
   * Compress data using base64 encoding with JSON minification
   */
  private static compressData(data: string): string {
    try {
      // First, minify the JSON by removing unnecessary whitespace
      const minified = JSON.stringify(JSON.parse(data));

      // Convert to base64
      const base64 = btoa(minified);

      // Make URL-safe
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    } catch {
      throw new Error("Failed to compress data");
    }
  }

  /**
   * Decompress base64 encoded data
   */
  private static decompressData(compressed: string): string {
    try {
      // Restore base64 padding and characters
      let base64 = compressed.replace(/-/g, "+").replace(/_/g, "/");

      // Add padding if needed
      while (base64.length % 4) {
        base64 += "=";
      }

      // Decode from base64
      return atob(base64);
    } catch {
      throw new Error("Failed to decompress data");
    }
  }

  /**
   * Create fallback URL for very large datasets
   */
  private static createFallbackURL(
    baseURL: string,
    system: SystemType,
    rotation: number,
    positions: CustomPositionsState
  ): string {
    // Try to compress more aggressively by removing empty formations
    const compactPositions: CustomPositionsState = {};

    for (const [rotKey, rotData] of Object.entries(positions)) {
      const compactRotData: Partial<FormationPositions> = {};
      let hasData = false;

      for (const [formationType, formationData] of Object.entries(rotData)) {
        if (formationData && Object.keys(formationData).length > 0) {
          (compactRotData as Record<string, unknown>)[formationType] =
            formationData;
          hasData = true;
        }
      }

      if (hasData) {
        compactPositions[parseInt(rotKey)] =
          compactRotData as FormationPositions;
      }
    }

    const essentialData = {
      system,
      rotation,
      positions: compactPositions,
      version: CURRENT_VERSION,
    };

    const jsonString = JSON.stringify(essentialData, this.dateReplacer);
    const compressed = this.compressData(jsonString);

    const params = new URLSearchParams({
      d: compressed,
      v: CURRENT_VERSION,
      s: system,
      r: rotation.toString(),
      fallback: "1", // Indicate this is a fallback URL
    });

    const fallbackURL = `${baseURL}?${params.toString()}`;

    // If still too long, just include current rotation
    if (fallbackURL.length > MAX_URL_LENGTH) {
      const currentRotationData = {
        system,
        rotation,
        positions: { [rotation]: positions[rotation] || {} },
        version: CURRENT_VERSION,
      };

      const currentJsonString = JSON.stringify(
        currentRotationData,
        this.dateReplacer
      );
      const currentCompressed = this.compressData(currentJsonString);

      const currentParams = new URLSearchParams({
        d: currentCompressed,
        v: CURRENT_VERSION,
        s: system,
        r: rotation.toString(),
        fallback: "2", // Indicate this is a more aggressive fallback
      });

      return `${baseURL}?${currentParams.toString()}`;
    }

    return fallbackURL;
  }

  /**
   * Check version compatibility
   */
  private static isVersionCompatible(version: string): boolean {
    const [major, minor] = version.split(".").map(Number);
    const [currentMajor, currentMinor] = CURRENT_VERSION.split(".").map(Number);

    // Same major version is compatible
    // Future minor versions are assumed compatible
    return major === currentMajor && minor <= currentMinor + 1;
  }

  /**
   * Validate URL data structure
   */
  private static validateURLData(data: unknown): data is URLPositionData {
    if (!data || typeof data !== "object") return false;

    const dataObj = data as Record<string, unknown>;
    if (!dataObj.system || !["5-1", "6-2"].includes(dataObj.system as string))
      return false;
    if (
      typeof dataObj.rotation !== "number" ||
      dataObj.rotation < 0 ||
      dataObj.rotation > 5
    )
      return false;
    if (!dataObj.positions || typeof dataObj.positions !== "object")
      return false;
    if (!dataObj.version || typeof dataObj.version !== "string") return false;

    // Validate positions structure
    for (const [rotationKey, rotationData] of Object.entries(
      dataObj.positions as Record<string, unknown>
    )) {
      if (isNaN(Number(rotationKey))) return false;

      if (!rotationData || typeof rotationData !== "object") return false;

      const formations = ["rotational", "serveReceive", "base"];
      for (const formation of formations) {
        const formationData = (rotationData as Record<string, unknown>)[
          formation
        ];
        if (formationData && typeof formationData !== "object") {
          return false;
        }

        // Validate individual positions if they exist
        if (formationData) {
          for (const [, position] of Object.entries(
            formationData as Record<string, unknown>
          )) {
            if (!this.validatePlayerPosition(position)) return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Validate individual player position
   */
  private static validatePlayerPosition(
    position: unknown
  ): position is PlayerPosition {
    if (!position || typeof position !== "object") return false;

    const posObj = position as Record<string, unknown>;
    if (typeof posObj.x !== "number" || typeof posObj.y !== "number")
      return false;
    if (typeof posObj.isCustom !== "boolean") return false;
    if (
      !(posObj.lastModified instanceof Date) &&
      typeof posObj.lastModified !== "string"
    )
      return false;

    return true;
  }

  /**
   * JSON replacer function to handle Date objects
   */
  private static dateReplacer(key: string, value: unknown): unknown {
    if (value instanceof Date) {
      return { __date: value.toISOString() };
    }
    return value;
  }

  /**
   * JSON reviver function to restore Date objects
   */
  private static dateReviver(key: string, value: unknown): unknown {
    if (
      value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).__date
    ) {
      return new Date((value as Record<string, unknown>).__date as string);
    }
    // Also handle direct ISO date strings for backward compatibility
    if (key === "lastModified" && typeof value === "string") {
      return new Date(value);
    }
    return value;
  }

  /**
   * Generate a shareable URL for current state
   */
  static generateShareableURL(
    system: SystemType,
    rotation: number,
    positions: CustomPositionsState
  ): string {
    const baseURL =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}${window.location.pathname}`
        : "";

    return this.encodePositionsToURL(baseURL, system, rotation, positions);
  }

  /**
   * Parse current page URL for position data
   */
  static parseCurrentURL(): URLPositionData | null {
    if (typeof window === "undefined") return null;

    return this.decodePositionsFromURL(window.location.href);
  }

  /**
   * Update browser URL with position data (for sharing)
   */
  static updateBrowserURL(
    system: SystemType,
    rotation: number,
    positions: CustomPositionsState,
    replace: boolean = false
  ): void {
    if (typeof window === "undefined") return;

    try {
      const url = this.generateShareableURL(system, rotation, positions);

      if (replace) {
        window.history.replaceState({}, "", url);
      } else {
        window.history.pushState({}, "", url);
      }
    } catch (error) {
      console.error("Failed to update browser URL:", error);
    }
  }

  /**
   * Clear URL parameters (return to clean URL)
   */
  static clearURLParameters(): void {
    if (typeof window === "undefined") return;

    const cleanURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.replaceState({}, "", cleanURL);
  }
}
