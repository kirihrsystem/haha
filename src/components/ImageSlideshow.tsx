import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  X, 
  Sparkles, 
  Heart,
  ShieldCheck,
  Zap,
  Users,
  Smile,
  CheckCircle2
} from 'lucide-react';

export interface SlideItem {
  id: string;
  image: string;
  badge: { en: string; km: string };
  title: { en: string; km: string };
  subtitle: { en: string; km: string };
  quote: { en: string; km: string };
  role: { en: string; km: string };
}

const slides: SlideItem[] = [
  {
    id: 'empowerment',
    image: '/images/mockup3.webp',
    badge: { en: 'Employee Experience', km: 'បទពិសោធន៍បុគ្គលិក' },
    title: { en: 'Frictionless Daily Routine', km: 'ការងារប្រចាំថ្ងៃយ៉ាងរលូន' },
    subtitle: { 
      en: 'Clock in effortlessly with 1-tap GPS verification. No outdated hardware, no waiting in line.',
      km: 'ចុះវត្តមានយ៉ាងងាយស្រួលដោយការចុចតែម្តងតាម GPS។ មិនបាច់តម្រង់ជួរ មិនបាច់ប្រើម៉ាស៊ីនចាស់ៗ។'
    },
    quote: { 
      en: '"Checking in feels completely seamless. It gives us full control of our schedule."', 
      km: '"ការចុះវត្តមានមានភាពរលូនបំផុត។ វាផ្តល់ឱ្យយើងនូវការគ្រប់គ្រងពេញលេញលើកាលវិភាគរបស់យើង។"'
    },
    role: { en: 'Team Member View', km: 'ទស្សនៈបុគ្គលិក' }
  },
  {
    id: 'payday',
    image: '/images/mockup2.webp',
    badge: { en: 'Payday Joy', km: 'ភាពសប្បាយរីករាយថ្ងៃបើកប្រាក់ខែ' },
    title: { en: 'Transparent & Instant Payouts', km: 'ការទូទាត់ប្រាក់ខែប្រកបដោយតម្លាភាព' },
    subtitle: { 
      en: 'Clear digital payslips with automated KHQR salary transfers directly to your preferred bank account.',
      km: 'ទទួលបានវិក្កយបត្រឌីជីថលច្បាស់លាស់ និងការផ្ទេរប្រាក់ខែតាម KHQR ផ្ទាល់ទៅកាន់គណនីធនាគារ។'
    },
    quote: { 
      en: '"Payday is punctual, transparent, and hassle-free every single month."', 
      km: '"ថ្ងៃបើកប្រាក់ខែគឺទៀងទាត់ មានតម្លាភាព និងគ្មានការស្មុគស្មាញជារៀងរាល់ខែ។"'
    },
    role: { en: 'Financial Harmony', km: 'ភាពសុខដុមនៃប្រាក់បៀវត្សរ៍' }
  },
  {
    id: 'balance',
    image: '/images/mockup4.webp',
    badge: { en: 'Workplace Trust', km: 'ទំនុកចិត្តកន្លែងធ្វើការ' },
    title: { en: 'Autonomy Over Micromanagement', km: 'ការផ្តល់ស្វ័យភាព និងទំនុកចិត្ត' },
    subtitle: { 
      en: 'Request leave, check shift schedules, and log overtime in seconds with zero guesswork.',
      km: 'ស្នើសុំច្បាប់ ពិនិត្យកាលវិភាគវេនធ្វើការ និងកត់ត្រាម៉ោងបន្ថែមក្នុងពេលប៉ុន្មានវិនាទី។'
    },
    quote: { 
      en: '"Clear visibility builds genuine trust between team members and leadership."', 
      km: '"ភាពច្បាស់លាស់បង្កើតនូវទំនុកចិត្តពិតប្រាកដរវាងក្រុមការងារ និងថ្នាក់ដឹកនាំ។"'
    },
    role: { en: 'Culture First', km: 'វប្បធម៌ការងារខ្ពស់' }
  },
  {
    id: 'connectivity',
    image: '/images/mockup6.webp',
    badge: { en: 'Instant Telegram Sync', km: 'ការភ្ជាប់ Telegram ភ្លាមៗ' },
    title: { en: 'Stay Effortlessly Connected', km: 'រក្សាការទំនាក់ទំនងយ៉ាងរលូន' },
    subtitle: { 
      en: 'Receive real-time group updates, instant leave approvals, and shift reminders on Telegram.',
      km: 'ទទួលបានការជូនដំណឹងភ្លាមៗ ការអនុម័តច្បាប់ និងការរំលឹកវេនធ្វើការនៅលើ Telegram។'
    },
    quote: { 
      en: '"Everyone stays in the loop without downloading cluttered secondary apps."', 
      km: '"អ្នករាល់គ្នាទទួលបានព័ត៌មានទាន់ហេតុការណ៍ ដោយមិនបាច់ទាញយកកម្មវិធីច្រើនស្មុគស្មាញ។"'
    },
    role: { en: 'Communication Loop', km: 'ការទំនាក់ទំនងរហ័ស' }
  },
  {
    id: 'insights',
    image: '/images/mockup1.webp',
    badge: { en: 'Leadership Peace of Mind', km: 'ភាពស្ងប់ចិត្តនៃថ្នាក់ដឹកនាំ' },
    title: { en: 'Clarity in Every Metric', km: 'ភាពច្បាស់លាស់ក្នុងរាល់ទិន្នន័យ' },
    subtitle: { 
      en: 'Real-time attendance summaries, overtime tracking, and cost analytics designed for decision makers.',
      km: 'សេចក្តីសង្ខេបវត្តមានភ្លាមៗ ការតាមដានម៉ោងបន្ថែម និងការវិភាគចំណាយសម្រាប់ថ្នាក់ដឹកនាំ។'
    },
    quote: { 
      en: '"HR decisions backed by clean, accurate data in a few intuitive clicks."', 
      km: '"ការសម្រេចចិត្តលើផ្នែកធនធានមនុស្សផ្អែកលើទិន្នន័យត្រឹមត្រូវ និងច្បាស់លាស់។"'
    },
    role: { en: 'Executive Clarity', km: 'ភាពច្បាស់លាស់ក្នុងការគ្រប់គ្រង' }
  }
];

interface ImageSlideshowProps {
  lang?: 'en' | 'km';
  autoPlayInterval?: number;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  compact?: boolean;
}

export default function ImageSlideshow({ 
  lang = 'en', 
  autoPlayInterval = 6000,
  title,
  subtitle,
  hideHeader = false,
  compact = false
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isKm = lang === 'km';

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance logic
  useEffect(() => {
    if (isPlaying && !isFullscreen) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, autoPlayInterval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFullscreen, autoPlayInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentIndex];

  // Touch Swipe Handlers for mobile
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const displayTitle = title || (isKm ? 'ផ្ទាំងទស្សនីយភាពរបស់ប្រព័ន្ធ' : 'Interface Showcase');
  const displaySubtitle = subtitle || (isKm
    ? 'ទស្សនាការបង្ហាញពីរចនាបថរបស់ប្រព័ន្ធ ការកត់ត្រាវត្តមានឆ្លាតវៃ និងការគណនាប្រាក់ខែ ដែលបង្កើតឡើងដើម្បីជួយសម្រួលដល់ការងាររដ្ឋបាល។'
    : 'Explore a visual tour of smart check-ins, instant payroll, and real-time alerts designed to bring harmony to your team.');

  return (
    <div className="w-full">
      {/* Landing Page Section Header */}
      {!hideHeader && (
        <div className="mb-10 sm:mb-14 text-center px-2">
          <h2 className="editorial-heading text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 text-slate-900 leading-tight">
            {displayTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-text max-w-xl mx-auto leading-relaxed font-normal">
            {displaySubtitle}
          </p>
        </div>
      )}

      {/* Main Slideshow Frame */}
      <div className="relative max-w-7xl mx-auto">
        <div 
          className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl shadow-slate-200/60 transition-all overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Main Visual Canvas */}
          <div className={`relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 group ${compact ? 'aspect-[4/3] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[4/4] xl:aspect-[3/4]' : 'aspect-[4/3] sm:aspect-video md:aspect-[16/10] lg:aspect-auto lg:h-[650px] xl:h-[750px]'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={currentSlide.image} 
                  alt="Slideshow image" 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Top Bar: Play/Fullscreen Controls */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-end z-20">
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                  title={isPlaying ? (isKm ? 'ផ្អាកស្លាយ' : 'Pause Slideshow') : (isKm ? 'ចាក់ស្លាយ' : 'Play Slideshow')}
                >
                  {isPlaying ? <Pause size={14} className="sm:w-4 sm:h-4" /> : <Play size={14} className="sm:w-4 sm:h-4" />}
                </button>

                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                  title={isKm ? 'មើលពេញអេក្រង់' : 'View Fullscreen'}
                >
                  <Maximize2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>



            {/* Arrow Controls */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 hover:border-slate-500 backdrop-blur-md transition-all cursor-pointer shadow-xl active:scale-95 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 hover:border-slate-500 backdrop-blur-md transition-all cursor-pointer shadow-xl active:scale-95 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Progress Bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 z-20 overflow-hidden">
                <motion.div
                  key={currentIndex + (isPlaying ? '-playing' : '-paused')}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-indigo-400 via-slate-200 to-indigo-300"
                />
              </div>
            )}
          </div>

          {/* Minimalist Slide Selector Pills & Counter */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
            {/* Slide Navigation Dots / Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
              {slides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'w-8 sm:w-10 bg-slate-900' 
                        : 'w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Slide Counter Indicator */}
            <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold shrink-0">
              <span className="text-slate-900">0{currentIndex + 1}</span> / 0{slides.length}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">
                  Slide {currentIndex + 1} of {slides.length}
                </span>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 sm:p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lightbox Image */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <img 
                src={currentSlide.image} 
                alt="Slideshow image" 
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
              />

              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 p-3 sm:p-4 rounded-full bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 p-3 sm:p-4 rounded-full bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
