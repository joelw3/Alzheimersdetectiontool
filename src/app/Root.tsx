import { Outlet } from "react-router";
import { AccessibilitySettings } from "./components/AccessibilitySettings";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";

export default function Root() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Outlet />
      <AccessibilitySettings />
      <KeyboardShortcuts />
    </div>
  );
}