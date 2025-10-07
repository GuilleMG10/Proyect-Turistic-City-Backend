export default function ErrorBanner({ message }: { message: string }) {
  return (
    <aside className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800" role="alert">
      {message}
    </aside>
  );
}
