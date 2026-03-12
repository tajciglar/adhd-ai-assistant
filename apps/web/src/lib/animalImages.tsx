export const ANIMAL_IMAGE: Record<string, string> = {
  koala: "/animals/koala.png",
  hummingbird: "/animals/hummingbird.png",
  tiger: "/animals/tiger.png",
  meerkat: "/animals/meerkat.png",
  stallion: "/animals/stallion.png",
  fox: "/animals/fox.png",
  rabbit: "/animals/rabbit.png",
  elephant: "/animals/elephant.png",
  dolphin: "/animals/dolphin.png",
  hedgehog: "/animals/hedgehog.png",
  bull: "/animals/bull.png",
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
