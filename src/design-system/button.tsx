import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "brand" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  brand: "btn-brand",
  ghost: "btn-ghost",
};

type SharedProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type ButtonProps = SharedProps & ComponentPropsWithoutRef<"button">;

type LinkButtonProps = SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "children"> & {
    href: string;
  };

export function Button(props: ButtonProps | LinkButtonProps) {
  const variant = props.variant ?? "brand";
  const classes = `${variantClass[variant]} ${props.className ?? ""}`.trim();

  if ("href" in props) {
    const { href, children } = props;
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { children, ...rest } = props;
  delete rest.variant;
  delete rest.className;

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
