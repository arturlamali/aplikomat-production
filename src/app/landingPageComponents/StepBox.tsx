import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { BorderBeam } from "./BorderBeam";
import { type LucideIcon } from "lucide-react";

interface StepBoxProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  children: React.ReactNode;
}

export function StepBox({
  icon: Icon,
  title,
  description,
  isActive,
  isCompleted,
  children,
}: StepBoxProps) {
  return (
    <motion.div
      className={`relative block border p-8 ${
        isCompleted
          ? "border-green-500/20 bg-linear-to-br from-green-500/10 to-green-400/5"
          : isActive
            ? "border-indigo-500/20 bg-linear-to-br from-indigo-500/10 to-indigo-400/5"
            : "border-gray-500/20 bg-linear-to-br from-gray-800/30 to-gray-900/30"
      } overflow-hidden rounded-2xl backdrop-blur-xs transition-all`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <BorderBeam />
      {isCompleted && (
        <CheckCircle2
          className="absolute right-4 top-4 text-green-500"
          size={24}
        />
      )}
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Icon
          className={`h-12 w-12 ${
            isCompleted
              ? "text-green-500"
              : isActive
                ? "text-indigo-500"
                : "text-gray-400"
          }`}
        />
        <div>
          <p
            className={`text-xl font-semibold ${
              isCompleted
                ? "text-green-400"
                : isActive
                  ? "text-white"
                  : "text-gray-400"
            }`}
          >
            {title}
          </p>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
        <div
          className={`w-full transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
