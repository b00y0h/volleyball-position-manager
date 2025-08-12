import { useEffect, useState } from "react";

export interface BrowserCapabilities {
  // Storage capabilities
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  
  // JavaScript features
  es6: boolean;
  asyncAwait: boolean;
  
  // DOM/CSS features
  flexbox: boolean;
  grid: boolean;
  transforms: boolean;
  animations: boolean;
  
  // Touch/interaction
  touchEvents: boolean;
  pointerEvents: boolean;
  
  // Modern web APIs
  intersectionObserver: boolean;
  resizeObserver: boolean;
  requestAnimationFrame: boolean;
  
  // Browser-specific
  isModernBrowser: boolean;
  browserName: string;
  browserVersion: string;
}

export interface BrowserSupportState {
  capabilities: BrowserCapabilities;
  isSupported: boolean;
  unsupportedFeatures: string[];
  recommendations: string[];
  isLoading: boolean;
}

const REQUIRED_FEATURES: (keyof BrowserCapabilities)[] = [
  "es6",
  "localStorage",
  "flexbox",
  "requestAnimationFrame",
];

const RECOMMENDED_FEATURES: (keyof BrowserCapabilities)[] = [
  "transforms",
  "animations",
  "touchEvents",
  "intersectionObserver",
];

export function useBrowserSupport() {
  const [supportState, setSupportState] = useState<BrowserSupportState>({
    capabilities: {} as BrowserCapabilities,
    isSupported: true,
    unsupportedFeatures: [],
    recommendations: [],
    isLoading: true,
  });

  useEffect(() => {
    detectBrowserCapabilities();
  }, []);

  const detectBrowserCapabilities = async () => {
    const capabilities: BrowserCapabilities = {
      // Storage capabilities
      localStorage: checkLocalStorage(),
      sessionStorage: checkSessionStorage(),
      indexedDB: checkIndexedDB(),
      
      // JavaScript features
      es6: checkES6(),
      asyncAwait: checkAsyncAwait(),
      
      // DOM/CSS features
      flexbox: checkFlexbox(),
      grid: checkGrid(),
      transforms: checkTransforms(),
      animations: checkAnimations(),
      
      // Touch/interaction
      touchEvents: checkTouchEvents(),
      pointerEvents: checkPointerEvents(),
      
      // Modern web APIs
      intersectionObserver: checkIntersectionObserver(),
      resizeObserver: checkResizeObserver(),
      requestAnimationFrame: checkRequestAnimationFrame(),
      
      // Browser-specific
      isModernBrowser: false, // Will be calculated
      browserName: getBrowserName(),
      browserVersion: getBrowserVersion(),
    };

    // Determine if this is a modern browser
    capabilities.isModernBrowser = isModernBrowser(capabilities);

    // Check which required features are missing
    const unsupportedFeatures = REQUIRED_FEATURES.filter(
      feature => !capabilities[feature]
    );

    // Check recommended features for optimization suggestions
    const missingRecommended = RECOMMENDED_FEATURES.filter(
      feature => !capabilities[feature]
    );

    const recommendations = generateRecommendations(capabilities, missingRecommended);

    setSupportState({
      capabilities,
      isSupported: unsupportedFeatures.length === 0,
      unsupportedFeatures,
      recommendations,
      isLoading: false,
    });
  };

  // Feature detection functions
  function checkLocalStorage(): boolean {
    try {
      const test = "__localStorage_test__";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  function checkSessionStorage(): boolean {
    try {
      const test = "__sessionStorage_test__";
      window.sessionStorage.setItem(test, test);
      window.sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  function checkIndexedDB(): boolean {
    return "indexedDB" in window;
  }

  function checkES6(): boolean {
    try {
      // Check for arrow functions, let/const, template literals
      new Function("const test = (x) => `Hello ${x}`;")();
      return true;
    } catch {
      return false;
    }
  }

  function checkAsyncAwait(): boolean {
    try {
      new Function("async function test() { await Promise.resolve(); }")();
      return true;
    } catch {
      return false;
    }
  }

  function checkFlexbox(): boolean {
    const element = document.createElement("div");
    element.style.display = "flex";
    return element.style.display === "flex";
  }

  function checkGrid(): boolean {
    const element = document.createElement("div");
    element.style.display = "grid";
    return element.style.display === "grid";
  }

  function checkTransforms(): boolean {
    const element = document.createElement("div");
    const prefixes = ["transform", "webkitTransform", "mozTransform", "msTransform"];
    return prefixes.some(prefix => prefix in element.style);
  }

  function checkAnimations(): boolean {
    const element = document.createElement("div");
    const prefixes = ["animation", "webkitAnimation", "mozAnimation", "msAnimation"];
    return prefixes.some(prefix => prefix in element.style);
  }

  function checkTouchEvents(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  function checkPointerEvents(): boolean {
    return "onpointerdown" in window;
  }

  function checkIntersectionObserver(): boolean {
    return "IntersectionObserver" in window;
  }

  function checkResizeObserver(): boolean {
    return "ResizeObserver" in window;
  }

  function checkRequestAnimationFrame(): boolean {
    return "requestAnimationFrame" in window;
  }

  function getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    if (userAgent.includes("Chromium")) return "Chromium";
    
    return "Unknown";
  }

  function getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const versionMatch = userAgent.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : "Unknown";
  }

  function isModernBrowser(capabilities: BrowserCapabilities): boolean {
    const modernFeatures: (keyof BrowserCapabilities)[] = [
      "es6",
      "localStorage",
      "flexbox",
      "transforms",
      "requestAnimationFrame",
    ];

    return modernFeatures.every(feature => capabilities[feature]);
  }

  function generateRecommendations(
    capabilities: BrowserCapabilities,
    missingRecommended: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (!capabilities.localStorage) {
      recommendations.push("Enable JavaScript and cookies for full functionality");
    }

    if (!capabilities.transforms || !capabilities.animations) {
      recommendations.push("Update your browser for better visual effects");
    }

    if (!capabilities.touchEvents && capabilities.pointerEvents) {
      recommendations.push("Consider using a touch-enabled device for better interaction");
    }

    if (!capabilities.intersectionObserver) {
      recommendations.push("Update your browser for improved performance");
    }

    if (!capabilities.isModernBrowser) {
      recommendations.push("Consider updating to a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)");
    }

    return recommendations;
  }

  return supportState;
}

// Utility function for components to check specific features
export function checkFeatureSupport(feature: keyof BrowserCapabilities): boolean {
  // This is a synchronous version for immediate checks
  switch (feature) {
    case "localStorage":
      try {
        const test = "__test__";
        window.localStorage.setItem(test, test);
        window.localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    
    case "touchEvents":
      return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    
    case "requestAnimationFrame":
      return "requestAnimationFrame" in window;
    
    default:
      return true; // Assume supported for unlisted features
  }
}