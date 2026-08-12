'use client';

import { motion } from 'framer-motion';
import { Search, ShoppingBag, HeartHandshake, ArrowRight } from 'lucide-react';

const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

const DEFAULT_STEPS = [
  {
    step: '01',
    title: 'Explore & Discover',
    desc: 'Browse unique handcrafted products and curated collections from independent artisan vendors.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Seamless Order',
    desc: 'Add items from multiple vendors in a single cart with direct buyer protection & instant checkout.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Delivered to You',
    desc: 'Track your package in real-time while directly supporting creative small business owners.',
    icon: HeartHandshake,
  },
];

export default function HowItWorks({ steps = DEFAULT_STEPS }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center space-y-2.5 max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FF3B6B]/10 text-[#FF3B6B]">
          Simple Process
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          How It Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Shop from verified artisans and creators in three effortless steps
        </p>
      </div>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8"
      >
        {steps.map((h, index) => {
          const IconComp = h.icon || Search;

          return (
            <motion.div
              key={h.title || index}
              variants={cardFadeUp}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="group relative h-full"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-300 group-hover:text-[#FF3B6B] transition-colors pointer-events-none">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}

              <div className="relative h-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs group-hover:shadow-md group-hover:border-[#FF3B6B] transition-all duration-300 flex flex-col items-center text-center">
                
                <div className="absolute top-5 right-6 text-[11px] font-extrabold tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full group-hover:bg-[#FF3B6B]/10 group-hover:text-[#FF3B6B] transition-colors">
                  STEP {h.step}
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FF3B6B]/10 text-[#FF3B6B] flex items-center justify-center mb-5 group-hover:bg-[#FF3B6B] group-hover:text-white transition-colors duration-300">
                  <IconComp className="w-6 h-6 sm:w-7 sm:h-7 stroke-2" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-[#FF3B6B] transition-colors duration-200">
                  {h.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-2 leading-relaxed max-w-xs">
                  {h.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}