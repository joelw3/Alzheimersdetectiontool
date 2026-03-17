import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show shortcuts with Ctrl/Cmd + ?
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with Escape
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 bg-gray-700 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-all z-40"
        aria-label="View keyboard shortcuts"
        title="Keyboard shortcuts (Ctrl + /)"
      >
        <Keyboard className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Keyboard className="w-7 h-7 mr-2 text-indigo-600" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Navigation</h3>
            <div className="space-y-2">
              <ShortcutItem shortcut="Tab" description="Move to next element" />
              <ShortcutItem
                shortcut="Shift + Tab"
                description="Move to previous element"
              />
              <ShortcutItem shortcut="Enter" description="Activate button/link" />
              <ShortcutItem shortcut="Space" description="Toggle checkbox/button" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Recording</h3>
            <div className="space-y-2">
              <ShortcutItem
                shortcut="Space"
                description="Start/stop voice recording (when focused)"
              />
              <ShortcutItem
                shortcut="Escape"
                description="Cancel current action"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Accessibility
            </h3>
            <div className="space-y-2">
              <ShortcutItem
                shortcut="Ctrl/Cmd + +"
                description="Increase text size"
              />
              <ShortcutItem
                shortcut="Ctrl/Cmd + -"
                description="Decrease text size"
              />
              <ShortcutItem
                shortcut="Ctrl/Cmd + /"
                description="Show keyboard shortcuts"
              />
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-900">
              <strong>💡 Tip:</strong> All interactive elements can be accessed
              using the keyboard. Use Tab to navigate and Enter/Space to
              activate.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

function ShortcutItem({
  shortcut,
  description,
}: {
  shortcut: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span className="text-gray-700">{description}</span>
      <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-sm text-gray-900">
        {shortcut}
      </kbd>
    </div>
  );
}
