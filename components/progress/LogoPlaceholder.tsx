'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function LogoPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center mb-6"
    >
      <Image
        src="/Logo-Tekiyo-Blanc.png"
        alt="Tekiyo"
        width={28}
        height={28}
        className="opacity-90"
        priority
      />
    </motion.div>
  );
}

