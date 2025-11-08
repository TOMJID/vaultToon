const Spinner = () => (
  <div
    className="flex h-screen items-center justify-center"
    aria-label="Loading"
  >
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-blue-500" />
  </div>
);

export default Spinner;
