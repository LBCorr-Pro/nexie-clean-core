import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "bg-background",
        slug: "lowercase font-mono text-sm bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, onChange, value, ...props }, ref) => {
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;
      if (variant === 'slug') {
        value = value
          .toLowerCase()
          .replace(/\s+/g, '-') // Substitui espaços por hífens
          .replace(/[^a-z0-9-]/g, ''); // Remove caracteres inválidos
        event.target.value = value;
      }
      if (onChange) {
        onChange(event);
      }
    };

    // CORREÇÃO: Garante que o valor nunca seja nulo ou indefinido.
    const finalValue = value ?? '';

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        onChange={handleChange}
        value={finalValue}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
