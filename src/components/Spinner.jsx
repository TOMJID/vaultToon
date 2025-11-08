const Spinner = () => (
  <div
    className="flex h-screen items-center justify-center animate-fade-in"
    aria-label="Loading"
  >
    <div className="relative">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-blue-500" />
      <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-purple-500" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      <div className="absolute inset-2 h-12 w-12 animate-pulse rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
    </div>
  </div>
);

export default Spinner;
