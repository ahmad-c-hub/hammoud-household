import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
