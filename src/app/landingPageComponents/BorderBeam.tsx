export function BorderBeam({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 rounded-[inherit] [border:1.5px_solid_transparent] ${className} after:animate-border-beam [mask-clip:padding-box,border-box]! [mask-composite:intersect]! [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)] after:absolute after:aspect-square after:w-[100px] after:[background:linear-gradient(to_left,#4f46e5,#8b5cf6,transparent)] after:[offset-anchor:90%_50%] after:[offset-path:rect(0_auto_auto_0_round_100px)]`}
    />
  );
}
