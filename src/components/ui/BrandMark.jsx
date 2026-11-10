export function BrandMark({ size = 'md', className = '' }) {
  const dimensions = {
    sm: 'h-8 w-8 rounded-[10px]',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-11 w-11 rounded-[14px]',
  };

  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 shadow-sm shadow-violet-900/20 ${dimensions[size] || dimensions.md} ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="h-[68%] w-[68%]">
        <path d="M5.5 9.5h5.2l5.3 13 5.3-13h5.2L18.2 27h-4.4L5.5 9.5Z" fill="white" />
        <path d="M23.4 5.2v4.4M21.2 7.4h4.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}
