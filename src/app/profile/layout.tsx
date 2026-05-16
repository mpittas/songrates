import OwnProfileShell from "@/components/profile/OwnProfileShell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnProfileShell>{children}</OwnProfileShell>;
}
