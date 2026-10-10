function Container({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className} bg-white`}
    >
      {children}
    </div>
  );
}

export default Container;
