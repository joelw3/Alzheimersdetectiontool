import { useState, useEffect } from "react";
import { Settings, Type, Volume2, Moon, Sun } from "lucide-react";

export function AccessibilitySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem("fontSize") || "16");
  });
  const [volume, setVolume] = useState(() => {
    return parseInt(localStorage.getItem("volume") || "100");
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("highContrast") === "true";
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    // Store volume setting for use in audio playback
    localStorage.setItem("volume", volume.toString());
    // Update global volume if speech synthesis is available
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [volume]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("highContrast", highContrast.toString());
  }, [highContrast]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all z-50"
        aria-label="Open accessibility settings"
      >
        <Settings className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl p-6 w-80 z-50 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Accessibility
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close settings"
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        {/* Font Size */}
        <div>
          <label className="flex items-center text-gray-700 font-semibold mb-2">
            <Type className="w-5 h-5 mr-2" />
            Text Size
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-bold"
            >
              A-
            </button>
            <input
              type="range"
              min="12"
              max="24"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-bold"
            >
              A+
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Current: {fontSize}px</p>
        </div>

        {/* Volume */}
        <div>
          <label className="flex items-center text-gray-700 font-semibold mb-2">
            <Volume2 className="w-5 h-5 mr-2" />
            Audio Volume
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-1">{volume}%</p>
        </div>

        {/* High Contrast */}
        <div>
          <label className="flex items-center justify-between text-gray-700 font-semibold">
            <span className="flex items-center">
              {highContrast ? (
                <Sun className="w-5 h-5 mr-2" />
              ) : (
                <Moon className="w-5 h-5 mr-2" />
              )}
              High Contrast
            </span>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                highContrast ? "bg-indigo-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  highContrast ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setFontSize(16);
            setVolume(100);
            setHighContrast(false);
          }}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
