import Image from "next/image";
import type { Fabric } from "@/lib/content";

export default function FabricCard({ fabric }: { fabric: Fabric }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative aspect-[4/3] bg-mist">
        <Image
          src={fabric.image}
          alt={`${fabric.name} fabric sample`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-navy">{fabric.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate">{fabric.description}</p>
      </div>
    </div>
  );
}
