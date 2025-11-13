import { motion } from "framer-motion";
import {
  Globe,
  Users,
  Shield,
  Trophy,
  MessageSquare,
  Building2,
  type LucideIcon,
} from "lucide-react";

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

export function EnhancedStatsSection() {
  const stats: Stat[] = [
    { icon: Globe, value: "250K+", label: "Wygenerowanych CV" },
    { icon: Users, value: "98%", label: "Współczynnik zatrudnienia" },
    { icon: Shield, value: "100%", label: "Zgodność z ATS" },
    { icon: Trophy, value: "85%", label: "Skuteczność w branży IT" },
    { icon: MessageSquare, value: "24/7", label: "Wsparcie techniczne" },
    { icon: Building2, value: "10K+", label: "Firm partnerskich" },
  ];

  return (
    <div className="px-4 py-16">
      <h3 className="mb-12 text-center text-sm font-semibold text-gray-400">
        APLIKOMAT W LICZBACH
      </h3>
      <motion.div
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <stat.icon className="mb-4 h-8 w-8 text-indigo-400" />
            <p className="bg-linear-to-r from-white to-white/70 bg-clip-text text-4xl font-bold text-transparent">
              {stat.value}
            </p>
            <p className="mt-2 text-center text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
