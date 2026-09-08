import { Button } from "@/components/ui/button";

export function StoryJoinHelp({
  blocked,
  failed,
  pending,
  onLinkOnly,
  className = "text-muted",
}: {
  blocked: boolean;
  failed: boolean;
  pending: boolean;
  onLinkOnly: () => void;
  className?: string;
}) {
  if (!blocked) return null;
  return (
    <div role="status" className={`mt-3 text-sm ${className}`}>
      {failed ? (
        <>
          <p>
            The QR code couldn’t be generated. Export with link only instead.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            disabled={pending}
            onClick={onLinkOnly}
          >
            Export with link only
          </Button>
        </>
      ) : (
        <p>
          Generating QR… Sharing and QR export will be available when it’s
          ready.
        </p>
      )}
    </div>
  );
}
