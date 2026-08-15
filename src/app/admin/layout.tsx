export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Rotlayouten är smal (mobilanpassad). Adminvyn bryter ut till full bredd.
  return (
    <div className="relative left-1/2 -mt-6 w-screen max-w-none -translate-x-1/2 px-4">
      {children}
    </div>
  );
}
