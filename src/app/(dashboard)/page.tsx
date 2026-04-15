// This page is the root of the dashboard
// The layout will handle redirecting to the appropriate role-based dashboard
// So this page should never actually render

export default function DashboardRootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
