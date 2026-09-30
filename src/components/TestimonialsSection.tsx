import React from 'react';
import { useReducedMotion } from 'motion/react';
import { Testimonial } from '../types';

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { 
    name: "Sokha Chen", 
    nameKh: "ចិន សុខា",
    title: "HR Director", 
    titleKh: "ប្រធានផ្នែកធនធានមនុស្ស",
    initial: "S", 
    quote: "This platform transformed how we handle employee onboarding. The automated workflows saved us countless hours.", 
    quoteKh: "ប្រព័ន្ធនេះបានផ្លាស់ប្តូររបៀបដែលយើងគ្រប់គ្រងការទទួលបុគ្គលិកថ្មី។ ដំណើរការស្វ័យប្រវត្តិកម្មបានជួយសន្សំពេលវេលាយ៉ាងច្រើន។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 1,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Bopha Meas", 
    nameKh: "មាស បុប្ផា",
    title: "Operations Manager", 
    titleKh: "អ្នកគ្រប់គ្រងប្រតិបត្តិការ",
    initial: "B", 
    quote: "A clean, intuitive interface that our entire team adopted in days. Highly recommended for any growing business.", 
    quoteKh: "ផ្ទាំងគ្រប់គ្រងច្បាស់លាស់ ងាយស្រួលប្រើប្រាស់ ដែលក្រុមការងារទាំងមូលរបស់យើងអាចប្រើបានក្នុងរយៈពេលតែប៉ុន្មានថ្ងៃប៉ុណ្ណោះ។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 1,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Vireak Roth", 
    nameKh: "រដ្ឋ វិរៈ",
    title: "CEO", 
    titleKh: "អគ្គនាយកប្រតិបត្តិ (CEO)",
    initial: "V", 
    quote: "The best HR software we've used. It strikes the perfect balance between powerful features and ease of use.", 
    quoteKh: "កម្មវិធីគ្រប់គ្រង HR ល្អបំផុតដែលយើងធ្លាប់បានប្រើ។ វាមានមុខងារសម្បូរបែប និងមានភាពងាយស្រួលក្នុងការប្រើប្រាស់ខ្ពស់។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 1,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Chanthou Keo", 
    nameKh: "កែវ ច័ន្ទថូ",
    title: "People Ops", 
    titleKh: "ប្រធានផ្នែកបុគ្គលិក",
    initial: "C", 
    quote: "We finally have all our employee data in one place. The reporting features are exactly what we needed.", 
    quoteKh: "ទីបំផុតយើងមានទិន្នន័យបុគ្គលិកទាំងអស់នៅកន្លែងតែមួយ។ មុខងាររបាយការណ៍គឺពិតជាអ្វីដែលយើងត្រូវការបំផុត។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 1,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Sina Yim", 
    nameKh: "យឹម ស៊ីណា",
    title: "Team Lead", 
    titleKh: "ប្រធានក្រុមការងារ",
    initial: "S", 
    quote: "Managing time-off requests used to be a headache. Now it's a seamless experience for everyone.", 
    quoteKh: "ការគ្រប់គ្រងការសុំច្បាប់ឈប់សម្រាកធ្លាប់ជាបញ្ហាស្មុគស្មាញ ប៉ុន្តែឥឡូវនេះវាដំណើរការយ៉ាងរលូនសម្រាប់បុគ្គលិកគ្រប់រូប។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 1,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Dara Ouk", 
    nameKh: "អ៊ុក ដារ៉ា",
    title: "Founder", 
    titleKh: "ស្ថាបនិកក្រុមហ៊ុន",
    initial: "D", 
    quote: "Incredible value. It replaced three different tools we were using and simplified our entire management process.", 
    quoteKh: "ពិតជាមានតម្លៃអស្ចារ្យ។ វាបានជំនួសឧបករណ៍ចំនួន ៣ ផ្សេងគ្នាដែលយើងធ្លាប់ប្រើ និងជួយសម្រួលដល់ដំណើរការគ្រប់គ្រងទាំងមូល។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 2,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Sovannary Seng", 
    nameKh: "សេង សុវណ្ណារី",
    title: "Culture Head", 
    titleKh: "ប្រធានវប្បធម៌ស្ថាប័ន",
    initial: "S", 
    quote: "The emphasis on user experience is clear. It feels like a consumer app, but built for enterprise.", 
    quoteKh: "បទពិសោធន៍អ្នកប្រើប្រាស់ពិតជាល្អឥតខ្ចោះ។ វាមានអារម្មណ៍ងាយស្រួលដូចកម្មវិធីទូទៅ ប៉ុន្តែមានសមត្ថភាពខ្ពស់សម្រាប់សហគ្រាស។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 2,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Mony Rith", 
    nameKh: "រិទ្ធ មុនី",
    title: "IT Administrator", 
    titleKh: "អ្នកគ្រប់គ្រងប្រព័ន្ធ IT",
    initial: "M", 
    quote: "Setup was a breeze, and the security features give us peace of mind. A phenomenal product.", 
    quoteKh: "ការដំឡើងមានភាពងាយស្រួលបំផុត ហើយសុវត្ថិភាពទិន្នន័យផ្តល់នូវទំនុកចិត្តយ៉ាងខ្លាំង។ ពិតជាផលិតផលដ៏អស្ចារ្យ។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 2,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Kosal Nget", 
    nameKh: "ង៉ែត កុសល",
    title: "Finance Lead", 
    titleKh: "ប្រធានផ្នែកហិរញ្ញវត្ថុ",
    initial: "K", 
    quote: "Payroll integration is seamless. It drastically reduced our end-of-month administrative burden.", 
    quoteKh: "ការទូទាត់ប្រាក់បៀវត្សរ៍តាម KHQR និងការគណនាស្វ័យប្រវត្តិ បានកាត់បន្ថយបន្ទុកការងារចុងខែរបស់យើងយ៉ាងច្រើន។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 2,
    createdAt: new Date().toISOString()
  },
  { 
    name: "Piseth Ly", 
    nameKh: "លី ពិសិដ្ឋ",
    title: "Product Manager", 
    titleKh: "អ្នកគ្រប់គ្រងផលិតផល",
    initial: "P", 
    quote: "The speed and reliability of the platform are unmatched. It simply works, exactly as expected.", 
    quoteKh: "ល្បឿន និងភាពជឿជាក់នៃប្រព័ន្ធគឺគ្មានគូប្រៀប។ វាដំណើរការបានយ៉ាងល្អឥតខ្ចោះ ស្របតាមការរំពឹងទុករបស់យើង។",
    color: "bg-[#EEF2FF] text-[#4F46E5]",
    row: 2,
    createdAt: new Date().toISOString()
  }
];

const TestimonialCard = ({ item, isKhmer }: { item: Testimonial; isKhmer: boolean }) => {
  const displayName = (isKhmer && item.nameKh) ? item.nameKh : item.name;
  const displayTitle = (isKhmer && item.titleKh) ? item.titleKh : item.title;
  const displayQuote = (isKhmer && item.quoteKh) ? item.quoteKh : item.quote;
  const initial = isKhmer && item.nameKh ? item.nameKh.charAt(0) : (item.initial || item.name.charAt(0).toUpperCase());

  return (
    <div className="w-full h-full bg-[#FFFFFF] rounded-[16px] border border-[#E4E4E7] p-6 shadow-[0_1px_2px_rgba(9,9,11,0.04)] hover:shadow-md transition-shadow duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${item.color || 'bg-[#EEF2FF] text-[#4F46E5]'}`} style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif' }}>
          {initial}
        </div>
        <div>
          <div className="text-[#09090B] text-sm leading-tight" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 600 }}>{displayName}</div>
          <div className="text-[#71717A] text-xs leading-tight mt-0.5" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 500 }}>{displayTitle}</div>
        </div>
      </div>
      <p className="text-[#09090B] text-[14.5px] leading-relaxed whitespace-normal" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 400 }}>
        "{displayQuote}"
      </p>
    </div>
  );
};

export const TestimonialsSection: React.FC<{ 
  testimonials?: Testimonial[];
  lang?: string;
  title?: string;
  subtitle?: string;
}> = ({ 
  testimonials = [],
  lang = 'en',
  title,
  subtitle
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isKhmer = lang === 'km';

  const sourceData = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;
  const r1 = sourceData.filter(t => t.row === 1);
  const r2 = sourceData.filter(t => t.row === 2);

  // Fallbacks if one row is empty
  const row1List = r1.length > 0 ? r1 : sourceData.slice(0, Math.ceil(sourceData.length / 2));
  const row2List = r2.length > 0 ? r2 : sourceData.slice(Math.ceil(sourceData.length / 2));

  const heading = title || (isKhmer ? "ទទួលបានការជឿទុកចិត្តពីក្រុមការងារ" : "Loved by teams");
  const subHeading = subtitle || (isKhmer 
    ? "ស្វែងយល់ពីរបៀបដែលប្រព័ន្ធ Kiri HR កំពុងផ្លាស់ប្តូរការគ្រប់គ្រងបុគ្គលិក និងអាជីវកម្មទូទាំងប្រទេស។" 
    : "See how our platform is transforming workspace management for businesses everywhere.");

  if (prefersReducedMotion) {
    return (
      <section className="bg-[#FAFAFA] py-32 px-6 md:px-12 border-t border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[#09090B] text-3xl md:text-4xl tracking-tight mb-4" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 700 }}>
              {heading}
            </h2>
            <p className="text-[#71717A] text-lg max-w-2xl mx-auto" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 400 }}>
              {subHeading}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...row1List, ...row2List].map((item, idx) => (
              <div key={item.id || idx} className="w-full">
                <TestimonialCard item={item} isKhmer={isKhmer} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#FAFAFA] py-32 border-t border-[#E4E4E7] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center">
        <h2 className="text-[#09090B] text-3xl md:text-4xl tracking-tight mb-4" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 700 }}>
          {heading}
        </h2>
        <p className="text-[#71717A] text-lg max-w-2xl mx-auto" style={{ fontFamily: isKhmer ? 'Kantumruy Pro, sans-serif' : 'Inter, sans-serif', fontWeight: 400 }}>
          {subHeading}
        </p>
      </div>

      <div 
        className="w-full relative flex flex-col gap-6"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}
      >
        {/* Row 1 - Left to Right */}
        <div className="flex w-full group overflow-hidden">
          <div
            className="flex gap-6 whitespace-nowrap pr-6 animate-scroll-left group-hover:[animation-play-state:paused]"
            style={{ width: "max-content" }}
          >
            {[...row1List, ...row1List, ...row1List, ...row1List].map((item, idx) => (
              <div 
                key={`r1-${item.id || idx}-${idx}`} 
                aria-hidden={idx >= row1List.length ? "true" : "false"}
                className="w-[300px] sm:w-[380px] shrink-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }}
              >
                <TestimonialCard item={item} isKhmer={isKhmer} />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 - Right to Left */}
        <div className="flex w-full group overflow-hidden">
          <div
            className="flex gap-6 whitespace-nowrap pr-6 animate-scroll-right group-hover:[animation-play-state:paused]"
            style={{ width: "max-content" }}
          >
            {[...row2List, ...row2List, ...row2List, ...row2List].map((item, idx) => (
              <div 
                key={`r2-${item.id || idx}-${idx}`} 
                aria-hidden={idx >= row2List.length ? "true" : "false"}
                className="w-[300px] sm:w-[380px] shrink-0"
                style={{ transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }}
              >
                <TestimonialCard item={item} isKhmer={isKhmer} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

