import { motion } from "framer-motion";

export function CompanySection() {
  return (
    <div className="border-t border-white/10 py-12">
      <p className="mb-8 text-center text-sm font-medium text-gray-400">
        POMOGLIŚMY ZNALEŹĆ PRACĘ MARZEŃ W
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {[
          {
            name: "Allegro",
            logo: "/companies/allegro.png",
          },
          {
            name: "CD Projekt",
            logo: "/companies/CDPROJEKT.png",
          },
          {
            name: "PKO BP",
            logo: "/companies/PKO BP.png",
          },
          {
            name: "PZU",
            logo: "/companies/PZU.png",
          },
        ].map((company) => (
          <motion.div
            key={company.name}
            className="group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 opacity-25 blur-xl transition-opacity group-hover:opacity-50" />
            <img
              src={company.logo}
              alt={company.name}
              className="relative h-8 w-24 opacity-50 brightness-0 invert transition-opacity group-hover:opacity-100"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
