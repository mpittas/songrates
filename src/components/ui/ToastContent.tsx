import Button from "./Button";

interface ToastContentProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ToastContent({
  title,
  description,
  actionLabel,
  onAction,
}: ToastContentProps) {
  return (
    <div className="w-full rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-white shadow-xl">
      <div className="text-sm font-semibold">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-neutral-300">{description}</div>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-3 flex justify-end">
          <Button variant="white" size="xs" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
