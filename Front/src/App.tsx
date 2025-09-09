import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Descubre lugares turísticos</h1>

          <div className="flex items-center gap-3">
            <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
              AI Assistant
            </button>
            <button className="rounded-md bg-gray-900 text-white px-4 py-1.5 text-sm hover:bg-black">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
