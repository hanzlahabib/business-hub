import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                primary: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                secondary:
                    "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                danger:
                    "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                success:
                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                warning:
                    "bg-amber-500/10 text-amber-600 border-amber-500/20",
                outline:
                    "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                long: "bg-purple-500/10 text-purple-600 border-purple-500/20",
                short: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                link: "text-primary underline-offset-4 [a&]:hover:underline",
            },
            size: {
                default: "px-2 py-0.5",
                sm: "px-1.5 py-0.5 text-[10px]",
                xs: "px-1 py-0 text-[10px]",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    asChild?: boolean
}

function Badge({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: BadgeProps) {
    const Comp = asChild ? Slot : "span"

    return (
        <Comp
            data-slot="badge"
            data-variant={variant}
            data-size={size}
            className={cn(badgeVariants({ variant, size }), className)}
            {...props} />
    );
}

export { Badge, badgeVariants }
