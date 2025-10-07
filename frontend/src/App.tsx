import { useState, Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import SkipLinks from "./components/SkipLinks";
import UserMenu from "./components/UserMenu";
import LoginModal from "./components/LoginModal";

// Lazy load AIChat component
const AIChat = lazy(() => import("./components/AIChat"));

export default function App() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <SkipLinks />

      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Culturistas</h1>

          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <button
              onClick={() => setIsAIOpen(true)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open AI Assistant"
            >
              AI Assistant
            </button>
            <UserMenu onLoginClick={() => setIsLoginOpen(true)} />
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-6 py-6" tabIndex={-1}>
        <Outlet />
      </main>

      <Suspense fallback={null}>
        <AIChat isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      </Suspense>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
