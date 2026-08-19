import Link from "next/link";

import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";

export default function StudyNote({
  source,
  className,
}: {
  source: StudySource;
  className?: string;
}) {
  if (source === "user") return null;

  return (
    <p className={className}>
      {source === "empty" ? (
        <>
          No album playlists yet — this is a sample layout. Add albums to a
          playlist to see your own crates here.
        </>
      ) : (
        <>
          Showing sample crates so the layout is visible.{" "}
          <Link
            href="/login?view=login"
            className="underline decoration-current/30 underline-offset-3 hover:decoration-current"
          >
            Sign in
          </Link>{" "}
          to load yours.
        </>
      )}
    </p>
  );
}
