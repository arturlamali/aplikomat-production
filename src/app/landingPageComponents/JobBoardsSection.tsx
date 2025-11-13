import { motion } from "framer-motion";
import {
  Building2,
  Trophy,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

interface JobBoard {
  name: string;
  logo: LucideIcon;
}

export function JobBoardsSection() {
  const jobBoards: JobBoard[] = [
    { name: "justjoin.it", logo: Building2 },
    { name: "rocketjobs.pl", logo: Trophy },
  ];

  return (
    <div className="border-t border-white/10 py-12">
      <p className="mb-8 text-center text-sm font-medium text-gray-400">
        STWORZONE PRZEZ EKSPERTÓW Z WIODĄCYCH PORTALI PRACY
      </p>
      <div className="flex flex-wrap items-center justify-center gap-12">
        {jobBoards.map((board) => (
          <motion.div
            key={board.name}
            className="group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 opacity-25 blur-xl transition-opacity group-hover:opacity-50" />
            <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-6 py-3 backdrop-blur-xs">
              <board.logo className="h-6 w-6 text-white" />
              <span className="font-medium text-white">{board.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
