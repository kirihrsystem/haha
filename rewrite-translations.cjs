const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Pause, Globe } from 'lucide-react';

const translations = {
  en: {
    navFeatures: "Features",
    navSolution: "The Solution",
    navFAQ: "FAQ",
    navLogIn: "Log In",
    navGetStarted: "Get Started",
    heroTitle: "The art of <br/> effortless management.",
    heroSubtitle: "Elevate your workspace. Kiri HR blends cinematic design with uncompromising utility, automating the mundane so you can focus on the extraordinary.",
    heroCta: "Experience Kiri HR",
    pauseVideo: "Pause Video",
    playVideo: "Play Video",
    solutionTitle: "Clarity in<br/>every detail.",
    solutionDesc: "We believe that powerful software shouldn't require a manual. By stripping away the unnecessary, we've crafted an interface that feels intuitive from the very first click.",
    manifesto: "Read our manifesto",
    featuresTitle: "Curated capabilities.",
    featuresSubtitle: "Everything you need to orchestrate your team, designed with an uncompromising attention to detail.",
    f1Title: "Time Architecture",
    f1Desc: "Fluid time tracking that respects your team's workflow without micromanagement.",
    f2Title: "Payroll Harmony",
    f2Desc: "Seamless synchronization with financial systems, eliminating friction from payday.",
    f3Title: "Human Insights",
    f3Desc: "Beautifully visualized analytics that reveal the true rhythm of your organization.",
    ctaTitle: "Begin the <br/> transformation.",
    ctaButton: "Start Your Journey",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    footerContact: "Contact"
  },
  km: {
    navFeatures: "លក្ខណៈពិសេស",
    navSolution: "ដំណោះស្រាយ",
    navFAQ: "សំណួរដែលសួរញឹកញាប់",
    navLogIn: "ចូល",
    navGetStarted: "ចាប់ផ្តើម",
    heroTitle: "សិល្បៈនៃការគ្រប់គ្រង<br/>ដោយមិនបាច់ប្រឹងប្រែង។",
    heroSubtitle: "លើកកម្ពស់កន្លែងធ្វើការរបស់អ្នក។ Kiri HR រួមបញ្ចូលការរចនាបែបភាពយន្តជាមួយនឹងអត្ថប្រយោជន៍ដ៏អស្ចារ្យ ធ្វើស្វ័យប្រវត្តិកម្មការងារធម្មតា ដូច្នេះអ្នកអាចផ្តោតលើភាពអស្ចារ្យ។",
    heroCta: "ទទួលបានបទពិសោធន៍ Kiri HR",
    pauseVideo: "ផ្អាកវីដេអូ",
    playVideo: "ចាក់វីដេអូ",
    solutionTitle: "ភាពច្បាស់លាស់នៅក្នុង<br/>រាល់ព័ត៌មានលម្អិត។",
    solutionDesc: "យើងជឿជាក់ថាកម្មវិធីដ៏មានអានុភាពមិនគួរត្រូវការសៀវភៅណែនាំទេ។ តាមរយៈការដកចេញនូវអ្វីដែលមិនចាំបាច់ យើងបានបង្កើតចំណុចប្រទាក់ដែលងាយស្រួលប្រើតាំងពីការចុចដំបូង។",
    manifesto: "អានសេចក្តីថ្លែងការណ៍របស់យើង",
    featuresTitle: "សមត្ថភាពដែលបានរៀបចំយ៉ាងល្អ។",
    featuresSubtitle: "អ្វីគ្រប់យ៉ាងដែលអ្នកត្រូវការដើម្បីរៀបចំក្រុមរបស់អ្នក ដែលត្រូវបានរចនាឡើងដោយមានការយកចិត្តទុកដាក់ខ្ពស់ចំពោះព័ត៌មានលម្អិត។",
    f1Title: "ស្ថាបត្យកម្មពេលវេលា",
    f1Desc: "ការតាមដានពេលវេលាដ៏រលូនដែលគោរពលំហូរការងាររបស់ក្រុមអ្នកដោយគ្មានការគ្រប់គ្រងតឹងរ៉ឹងពេក។",
    f2Title: "ភាពសុខដុមនៃប្រាក់បៀវត្សរ៍",
    f2Desc: "ការធ្វើសមកាលកម្មយ៉ាងរលូនជាមួយប្រព័ន្ធហិរញ្ញវត្ថុ លុបបំបាត់ភាពស្មុគស្មាញពីថ្ងៃបើកប្រាក់ខែ។",
    f3Title: "ការយល់ដឹងអំពីមនុស្ស",
    f3Desc: "ការវិភាគដែលបានមើលឃើញយ៉ាងស្រស់ស្អាត ដែលបង្ហាញពីចង្វាក់ពិតប្រាកដនៃស្ថាប័នរបស់អ្នក។",
    ctaTitle: "ចាប់ផ្តើម<br/>ការផ្លាស់ប្តូរ។",
    ctaButton: "ចាប់ផ្តើមដំណើររបស់អ្នក",
    footerPrivacy: "ឯកជនភាព",
    footerTerms: "លក្ខខណ្ឌ",
    footerContact: "ទំនាក់ទំនង"
  }
};

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [lang, setLang] = useState('en');
  const t = translations[lang as keyof typeof translations];
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const fadeRise = {
    hidden: { opacity: 0, y: 24 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: custom * 0.2 }
    })
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-primary-text font-sans">
      {/* Navigation */}
      <nav className={\`fixed w-full z-50 top-0 transition-all duration-500 \${scrolled ? 'bg-white/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}\`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="text-2xl font-display text-primary-text tracking-tight font-bold">Kiri HR</div>
          <div className="hidden md:flex gap-8 text-[14px] font-medium items-center">
            <a href="#features" className="hover:text-black/60 transition-colors">{t.navFeatures}</a>
            <a href="#solution" className="hover:text-black/60 transition-colors">{t.navSolution}</a>
            <a href="#faq" className="hover:text-black/60 transition-colors">{t.navFAQ}</a>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setLang(lang === 'en' ? 'km' : 'en')}
              className="flex items-center gap-1 text-[14px] font-medium hover:text-black/60 transition-colors mr-2"
              title="Toggle Language"
            >
              <Globe size={16} />
              <span className="uppercase">{lang}</span>
            </button>
            <Link to="/login" className="text-[14px] font-medium hidden sm:block">{t.navLogIn}</Link>
            <Link to="/signup" className="editorial-btn hidden sm:block">{t.navGetStarted}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-bg-base">
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
          autoPlay 
          muted 
          loop 
          playsInline
          poster="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=2000&q=80"
        >
          <source src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-20">
          <motion.h1 
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            className="editorial-heading editorial-h1 text-black mix-blend-color-burn"
            dangerouslySetInnerHTML={{ __html: t.heroTitle }}
          />
          
          <motion.p 
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            className="mt-8 text-[18px] text-primary-text/80 max-w-2xl mx-auto font-medium"
          >
            {t.heroSubtitle}
          </motion.p>
          
          <motion.div 
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/signup" className="editorial-btn">
              {t.heroCta}
            </Link>
            <button 
              onClick={toggleVideo}
              className="flex items-center gap-2 text-[14px] font-medium uppercase tracking-widest text-primary-text/60 hover:text-primary-text transition-colors"
            >
              {isVideoPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isVideoPlaying ? t.pauseVideo : t.playVideo}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="solution" className="py-32 px-6 md:px-12 max-w-7xl mx-auto bg-white">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-5xl md:text-7xl mb-8" dangerouslySetInnerHTML={{ __html: t.solutionTitle }} />
            <motion.p custom={1} variants={fadeRise} className="text-[18px] text-muted-text leading-relaxed font-normal mb-8">
              {t.solutionDesc}
            </motion.p>
            <motion.div custom={2} variants={fadeRise}>
              <Link to="/about" className="inline-flex items-center gap-2 font-medium text-[14px] uppercase tracking-widest border-b border-primary-text pb-1 hover:text-black/60 hover:border-black/60 transition-all">
                {t.manifesto} <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeRise}
            className="aspect-[3/4] bg-gray-100 overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1000" 
              alt="Workspace aesthetic" 
              className="w-full h-full object-cover mix-blend-multiply grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 md:px-12 bg-[#f1f5f9]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20 text-center"
          >
            <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-5xl md:text-6xl mb-6">
              {t.featuresTitle}
            </motion.h2>
            <motion.p custom={1} variants={fadeRise} className="text-[18px] text-muted-text max-w-xl mx-auto">
              {t.featuresSubtitle}
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 border-t border-slate-300 pt-16">
            {[
              {
                title: t.f1Title,
                desc: t.f1Desc
              },
              {
                title: t.f2Title,
                desc: t.f2Desc
              },
              {
                title: t.f3Title,
                desc: t.f3Desc
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeRise}
                className="group"
              >
                <div className="text-[14px] font-medium text-muted-text mb-4">0{idx + 1}</div>
                <h3 className="font-display font-extrabold text-3xl mb-4 text-primary-text">{feature.title}</h3>
                <p className="text-[16px] text-muted-text leading-relaxed">
                  {feature.desc}
                </p>
                <div className="w-0 h-[1px] bg-primary-text mt-8 group-hover:w-full transition-all duration-700 ease-out"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 text-center bg-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-6xl md:text-8xl mb-12" dangerouslySetInnerHTML={{ __html: t.ctaTitle }} />
          <motion.div custom={1} variants={fadeRise}>
            <Link to="/signup" className="editorial-btn">
              {t.ctaButton}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-text text-white py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="font-display text-3xl tracking-tight font-extrabold">Kiri HR</div>
          <div className="flex flex-wrap gap-8 text-[14px] font-medium text-white/70">
            <Link to="/privacy" className="hover:text-white transition-colors">{t.footerPrivacy}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t.footerTerms}</Link>
            <a href="mailto:hello@kirihr.com" className="hover:text-white transition-colors">{t.footerContact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
`
fs.writeFileSync('src/pages/Landing.tsx', content);
