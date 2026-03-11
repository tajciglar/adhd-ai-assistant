export const ANIMAL_IMAGE: Record<string, string> = {
  koala: "/animals/Profile-Koala-jukebox-bg-removed.png",
  hummingbird: "/animals/Profile-Hummingbird-jukebox-bg-removed.png",
  tiger: "/animals/Profile-Tiger-jukebox-bg-removed.png",
  meerkat: "/animals/Profile-Meerkat-jukebox-bg-removed.png",
  stallion: "/animals/Profile-Stallion-jukebox-bg-removed.png",
  fox: "/animals/Profile-Fox-jukebox-bg-removed.png",
};

export function AnimalIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const src = ANIMAL_IMAGE[id];
  if (!src) return <span className={className}>🧠</span>;
  return <img src={src} alt={id} className={className} />;
}
