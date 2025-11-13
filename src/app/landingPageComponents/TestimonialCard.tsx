import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BorderBeam } from "./BorderBeam";

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  description: React.ReactNode;
}

export function TestimonialCard({
  name,
  role,
  company,
  description,
}: TestimonialCardProps) {
  return (
    <motion.div
      className="relative mb-4 block rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xs"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <BorderBeam />
      <div className="text-sm text-gray-300">
        {description}
        <div className="flex flex-row py-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white">
          {name[0]}
        </div>
        <div>
          <p className="font-medium text-white">{name}</p>
          <p className="text-sm text-gray-400">{role}</p>
          <p className="text-xs text-gray-500">{company}</p>
        </div>
      </div>
    </motion.div>
  );
}
