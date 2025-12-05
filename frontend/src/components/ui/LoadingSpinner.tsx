type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
};

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16"
};

export default function LoadingSpinner({ size = "lg", className = "", text }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizes[size]} rounded-full border-4 border-gray-100 dark:border-gray-800`} />
        
        {/* Spinning ring */}
        <div className={`absolute inset-0 ${sizes[size]} rounded-full border-4 border-cyan-500 border-t-transparent animate-spin`} />
      </div>
      
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
