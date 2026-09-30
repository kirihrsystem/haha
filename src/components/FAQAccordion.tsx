import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("faqQ1"),
      answer: t("faqA1")
    },
    {
      question: t("faqQ2"),
      answer: t("faqA2")
    },
    {
      question: t("faqQ3"),
      answer: t("faqA3")
    },
    {
      question: t("faqQ4"),
      answer: t("faqA4")
    }
  ];

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="rounded-[1.75rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-lg shadow-black/5">
          <button
            onClick={() => toggleOpen(index)}
            className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <h4 className="text-lg font-bold text-slate-900 dark:text-white pr-4">{faq.question}</h4>
            <ChevronDown 
              className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} 
            />
          </button>
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                key={`faq-content-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-6 pb-5">
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
