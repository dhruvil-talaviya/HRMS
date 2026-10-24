const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  iconBefore,
  iconAfter,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-md transition-all cursor-pointer border border-transparent gap-2 outline-none disabled:opacity-60 disabled:cursor-not-allowed lowercase";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-bg-primary text-text-primary border-border-color hover:bg-border-color",
    danger: "bg-danger text-white hover:bg-danger-hover",
    warning: "bg-warning text-white hover:bg-warning-hover",
    success: "bg-success text-white hover:bg-success-hover",
    outline: "bg-transparent border-primary text-primary hover:bg-primary-light",
    ghost: "bg-transparent text-text-secondary hover:bg-bg-primary hover:text-text-primary"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {iconBefore && <span className="flex items-center">{iconBefore}</span>}
      {children}
      {iconAfter && <span className="flex items-center">{iconAfter}</span>}
    </button>
  );
};

export default Button;
