import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import ImageSlideshow from '../components/ImageSlideshow';
import { ProverbMarquee } from '../components/ProverbMarquee';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { 
  ArrowRight, 
  Play, 
  Pause, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone,
  Send, 
  MapPin, 
  User, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';

const translations = {
  en: {
    navFeatures: "Features",
    navShowcase: "Gallery",
    navSolution: "The Solution",
    navAbout: "About",
    navStory: "Story",
    navFounder: "Founder",
    navPricing: "Pricing",
    navFAQ: "FAQ",
    navContact: "Contact",
    navLogIn: "Log In",
    navGetStarted: "Get Started",

    // Hero
    heroTitle: "It's time to make staff management <br/> more modern and convenient.",
    heroSubtitle: "KiriHR brings employee management, attendance, requests, and everyday HR operations together in one modern Cambodia HR software platform, <br/> making work simpler, clearer, and more efficient.",
    heroCta: "Experience Kiri HR",
    pauseVideo: "Pause Video",
    playVideo: "Play Video",

    // Solution
    solutionTitle: "Simple by design.",
    solutionDesc: "Say goodbye to outdated HR software. Kiri HR brings cloud-native attendance with smart technology, automatic Cambodia payroll software integration, and live Telegram alerts to modern teams.",
    manifesto: "DISCOVER OUR STORY",

    // Features
    featuresTitle: "Automated Attendance & Salary Management",
    featuresSubtitle: "Powerful location tracking and automated payroll, seamlessly crafted to streamline your entire team operation.",
    showcaseTitle: "Interface Showcase",
    showcaseSubtitle: "Explore a visual tour of smart check-ins, instant payroll, and real-time alerts designed to bring harmony to your team.",
    f1Title: "Smart Attendance",
    f1Desc: "Track employee check-ins and check-outs with GPS-based attendance, working hours, late arrivals, overtime, and attendance records—all in real time.",
    f2Title: "Smart Payroll",
    f2Desc: "Easily calculate salaries, overtime, advances, and deductions in USD and KHR, and export PDF payslips instantly",
    f3Title: "Real-time Notification",
    f3Desc: "Connect Kiri HR with Telegram and receive instant notifications for attendance, late arrivals, leave requests, and important HR activities.",

    // About Section
    aboutTag: "About Kiri HR",
    aboutTitle: "Revolutionizing workplace management for modern teams.",
    aboutDesc1: "Kiri HR transforms complex admin tasks into a fluid, elegant, and modern digital experience.",
    aboutDesc2: "We combine intelligent shift scheduling, automated payroll processing, precise geolocation attendance tracking, and real-time Telegram alerts into a single cohesive platform.",
    aboutStat1Number: "10x Faster",
    aboutStat1Label: "Faster Monthly HR Processing",
    aboutStat2Number: "24/7",
    aboutStat2Label: "Real-time Telegram Alerts",
    aboutStat3Number: "GPS",
    aboutStat3Label: "Verified Geolocation Attendance",

    // Story Section
    storyTag: "The Story of Kiri HR",
    storyTitle: "The story of Kiri HR",
    storyP1: <>Every great company starts with a simple realization: <strong className="font-bold text-slate-900">managing a team shouldn’t feel like fighting your own tools.</strong></>,
    storyP2: "For years, business leaders and HR managers in Cambodia have been trapped between two extremes. On one side are overly rigid, complex platforms built for large foreign enterprises—requiring weeks of setup, confusing interfaces, and zero integration with daily communication channels like Telegram. On the other side are messy manual spreadsheets that consume countless hours, cause payroll errors, and leave management blind to real-time operations.",
    storyP3: <><strong className="font-bold text-slate-900">We set out to rebuild workplace management from the ground up.</strong></>,
    storyP4: "Kiri HR was created to prove that management software doesn't have to be clunky, complicated, or slow. We reimagined the entire employee experience with absolute focus on clarity, speed, and design. By stripping away unnecessary complexity, we crafted a fluid platform where smart shift scheduling, pinpoint GPS attendance tracking, automated salary processing, and real-time Telegram alerts work together in complete harmony.",
    storyP5: "Today, Kiri HR empowers modern teams with zero-friction daily check-ins and effortless management—giving employees autonomy and leadership true peace of mind.",

    // Founder Section
    founderTag: "Leadership & Vision",
    founderTitle: "A note from our founder.",
    founderQuote: "Our focus is on creating a reliable, intuitive, and locally relevant HR platform designed around the way businesses in Cambodia actually work.",
    founderName: "Udomkevin Vat",
    founderRole: "Founder",
    founderBio: "I’m passionate about using technology to solve real problems for Cambodian businesses. I created Kiri HR with the vision of building a modern Khmer HR system that makes employee management, attendance, payroll, and everyday HR tasks simpler and more efficient.",
    founderLocation: "Phnom Penh, Cambodia",

    // Contact Founder
    contactTag: "Direct Line",
    contactTitle: "Connect directly with the founder.",
    contactSubtitle: "Have questions, custom enterprise needs, or want a personal walkthrough? Reach out directly through your preferred channel.",
    contactPhoneLabel: "Direct Phone",
    contactPhoneVal: "093988991",
    contactEmailLabel: "Direct Email",
    contactEmailVal: "kirihrsystem@gmail.com",
    contactTelegramLabel: "Direct Telegram",
    contactTelegramVal: "@Udomkevin",
    contactLocationLabel: "Headquarters",
    contactLocationVal: "Phnom Penh, Cambodia",
    sendMessageTitle: "Send a Direct Message",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourMessage: "Your Message",
    sendButton: "Send Message",
    messageSentSuccess: "Thank you! Your message has been sent to the founder.",

    // Testimonials
    testimonialsTitle: "Loved by teams",
    testimonialsSubtitle: "See how our platform is transforming workspace management for businesses everywhere.",


    // Pricing
    pricingTag: "Clear Pricing",
    pricingTitle: "Simple plans for every team.",
    pricingSubtitle: "Start for free, upgrade when you need more power and control.",
    pricingTiers: [
      {
        name: "Starter",
        price: "$4.99",
        period: "/month",
        description: "Perfect for small businesses with up to 10 employees.",
        features: [
      "Up to 10 employees",
      "GPS-based attendance tracking",
      "Photo-based attendance check-in",
      "Automated payroll calculation",
      "Telegram integration",
      "Basic reports"],
        button: "Get Started",
        popular: false
      },
      {
        name: "Pro",
        price: "$9.99",
        period: "/month",
        description: "Ideal for small to medium-sized businesses with up to 25 employees.",
        features: [
      "Up to 25 employees",
      "GPS-based attendance tracking",
      "Photo-based attendance check-in",
      "Automated payroll calculation",
      "Telegram integration",
      "Basic reports"],
        button: "Choose Pro",
        popular: true
      },
      {
        name: "Enterprise",
        price: "Contact Us",
        period: "",
        description: "Designed for businesses and large enterprises with a growing number of employees.",
        features: [
      "Flexible employee capacity",
      "GPS-based attendance tracking",
      "Photo-based attendance check-in",
      "Automated payroll calculation",
      "Telegram integration",
      "Advanced reporting",
      "Custom features and system modifications",
      "Personalized training and support"],
        button: "Contact Our Team",
        popular: false
      }
    ],

    // FAQs
    faqTag: "Knowledge Base",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about setting up and scaling with Kiri HR.",
    faqs: [
      {
        q: "How does GPS geolocation attendance tracking work?",
        a: "Employees check in or out using their mobile browser or app. Kiri HR verifies their GPS coordinates against designated workspace coordinates and radii, preventing off-site check-ins while preserving employee privacy."
      },
      {
        q: "How does Kiri HR support multi-currency payroll in USD and KHR?",
        a: "You can set flexible exchange rates (e.g., 1 USD = 4,100 KHR) and manage salaries, overtime, and advances in either currency with automatic calculation and KHQR payment integration."
      },
      {
        q: "Can I link Kiri HR to Telegram for instant notifications?",
        a: "Yes! Kiri HR features native Telegram Bot integration. Admins and managers receive instant alerts for employee check-ins, late check-ins, leave requests, and daily shift summaries directly in their group chats."
      },
      {
        q: "Is there a free trial or flexible subscription plan?",
        a: "Yes, new workspaces get instant access. We offer flexible monthly and yearly billing options with simple KHQR bank transfers or redeemable invite codes."
      },
      {
        q: "Is employee data secure and private?",
        a: "Security is paramount. Data is encrypted both in transit and at rest with cloud persistence, role-based access controls, and strict admin permissions."
      }
    ],

    // Final CTA & Footer
    ctaTitle: "Begin the <br/> transformation.",
    ctaButton: "Start Your Journey",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    footerContact: "Contact"
  },
  km: {
    navFeatures: "លក្ខណៈពិសេស",
    navShowcase: "វិចិត្រសាល",
    navSolution: "ដំណោះស្រាយ",
    navAbout: "អំពីយើង",
    navStory: "ប្រវត្តិ",
    navFounder: "ស្ថាបនិក",
    navPricing: "តម្លៃ",
    navFAQ: "សំណួរញឹកញាប់",
    navContact: "ទំនាក់ទំនង",
    navLogIn: "ចូល",
    navGetStarted: "ចាប់ផ្តើម",

    // Hero
    heroTitle: "គ្រប់គ្រងបុគ្គលិក <br/> ដោយងាយស្រួល និង ទំនើបស្រប <br/>ទៅតាមសម័យឌីជីថល",
    heroSubtitle: "ការគ្រប់គ្រងបុគ្គលិកគឺជាផ្នែកសំខាន់មួយសម្រាប់អាជីវកម្មរបស់លោកអ្នក ដូចនេះហើយ ប្រព័ន្ធគ្រប់គ្រងបុគ្គលិក KiriHR (Khmer HR System) បង្កើតឡើងដើម្បីជួយសម្រួល និង​ ធ្វើទំនើបកម្មទៅលើប្រព័ន្ធគ្រប់គ្រងបុគ្គលិក វត្តមាន ការស្នើរសុំផ្សេងៗ និងដំណើរការរដ្ឋបាលប្រចាំថ្ងៃ ឱ្យកាន់តែងាយស្រួលជាងមុន។",
    heroCta: "ចុះឈ្មោះប្រើប្រាស់ Kiri HR",
    pauseVideo: "ផ្អាកវីដេអូ",
    playVideo: "ចាក់វីដេអូ",

    // Solution
    solutionTitle: "ងាយស្រួល ទាន់សម័យ​ និងទំនើប",
    solutionDesc: "Kiri HR ផ្តល់ជូនលោកអ្នកនូវការកត់ត្រាវត្តមានលើវេបសាយមួយដែលចាំបាច់ និង សំខាន់បំផុតសម្រាប់ម្ចាស់អាជីវកម្ម ការគណនាប្រាក់ខែ និងការជូនដំណឹងតាម Telegram ដើម្បីធ្វើឱ្យការគ្រប់គ្រងក្រុមការងាររបស់អ្នកកាន់តែងាយស្រួល និងទំនើបតាមបែប Cambodia HR Software។",
    manifesto: "អានសេចក្តីថ្លែងការណ៍របស់យើង",

    // Features
    featuresTitle: "ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងប្រាក់ខែដោយស្វ័យប្រវត្តិ",
    featuresSubtitle: "គ្រប់គ្រងវត្តមានតាមទីតាំងដែលកំណត់ និងគណនាប្រាក់ខែស្វ័យប្រវត្តិ ជាមួយនឹងបច្ចេកវិទ្យាទំនើប ដើម្បីបង្កើនប្រសិទ្ធភាពការងារ។",
    showcaseTitle: "ផ្ទាំងទស្សនីយភាពរបស់ប្រព័ន្ធ",
    showcaseSubtitle: "ទស្សនាការបង្ហាញពីរចនាបថរបស់ប្រព័ន្ធ ការកត់ត្រាវត្តមានឆ្លាតវៃ និងការគណនាប្រាក់ខែ ដែលបង្កើតឡើងដើម្បីជួយសម្រួលដល់ការងាររដ្ឋបាល។",
    f1Title: "ការចុះវត្តមានរបស់បុគ្គលិក និងស្នើសុំច្បាប់ដោយឆ្លាតវៃ",
    f1Desc: "តាមដានការចុះឈ្មោះចូល និងចេញពីការងាររបស់បុគ្គលិកដោយមានការកំណត់ទីតាំងជាក់លាក់ កត់ត្រានូវ ម៉ោងធ្វើការ មកធ្វើការយឺត ស្នើសុំច្បាប់​ និង អនុម័តច្បាប់ដោយស្វ័យប្រវត្តិ ។",
    f2Title: "គណនាប្រាក់ខែដោយស្វ័យប្រវត្តិ និងត្រឹមត្រូវ",
    f2Desc: "ងាយស្រួលក្នុងការបើកប្រាក់ខែទៅកាន់បុគ្គលិក ដោយមិនចាំបាច់ចំណាយពេលក្នុងការគិតទៅលើប្រាក់ខែរបស់បុគ្គលិក KiriHR នឹងគណនា ប្រាក់ខែទៅតាមវត្តមានបុគ្គលិកជាក់ស្ដែង ប្រាក់បន្ថែមម៉ោង​ ការឈប់សម្រាក ការកាត់ទៅលើលក្ខខណ្ឌផ្សេងៗទៅតាមតម្រូវការរបស់ក្រុមហ៊ុន និង កាត់ប្រាក់នៅពេលបុគ្គលិកមកយឺត ។",
    f3Title: "មានការជូនដំណឹងភ្លាមៗទៅកាន់ផ្នែករដ្ឋបាល ឬ ម្ចាស់អាជីវកម្ម និង បុគ្គលិក",
    f3Desc: "បុគ្គលិកទាំងអស់ នឹងទទួលបានការជូនដំណឹងភ្លាមៗនៅពេលដែលបានចុះវត្តមាន​ទាំងចូល និងចេញពីការងារ​ ការស្នើសុំច្បាប់ ការអនុម័តច្បាប់ និងការពិនត្យបញ្ជាក់ប្រាក់ខែ។ ផ្ទុយទៅវិញ សម្រាប់ផ្នែករដ្ឋបាល និង ម្ចាស់អាជីវកម្ម នឹងទទួលបានសារជូនដំណឹងផ្សេងៗទៀតដូចជា ការបន្ថែមបុគ្គលិក ការកែប្រែព័ត៌មានបុគ្គលិក និង ការសម្រេចអនុម័តទៅលើច្បាប់របស់បុគ្គលិកដែលបានស្នើសុំ ។",

    // About Section
    aboutTag: "អំពី Kiri HR",
    aboutTitle: "ប្រព័ន្ធគ្រប់គ្រងរដ្ឋបាល សម្រាប់បុគ្គលិកសម័យថ្មី",
    aboutDesc1: "Kiri HR ផ្លាស់ប្តូរការងាររដ្ឋបាលដែលស្មុគស្មាញ មកជាបទពិសោធន៍ឌីជីថលថ្មីមួយដ៏រលូន ត្រជាក់ភ្នែក និងទាន់សម័យបំផុត។",
    aboutDesc2: "យើងរួមបញ្ចូលការរៀបចំកាលវិភាគវេនធ្វើការដ៏ឆ្លាតវៃ ការទូទាត់ប្រាក់បៀវត្សរ៍ដោយស្វ័យប្រវត្តិ ការតាមដានវត្តមានតាមទីតាំងGPS និងការជូនដំណឹងតាម Telegram ក្នុងពេលជាក់ស្តែងទៅជាប្រព័ន្ធតែមួយ។",
    aboutStat1Number: "10x លឿនជាងមុន",
    aboutStat1Label: "រហ័សជាងមុន 10ដង ក្នុងការរៀបចំ HR",
    aboutStat2Number: "24/7",
    aboutStat2Label: "ទទួលព័ត៌មានតាម Telegram 24/7",
    aboutStat3Number: "GPS",
    aboutStat3Label: "កត់ត្រាវត្តមានតាម GPS ត្រឹមត្រូវ",

    // Story Section
    storyTag: "ប្រវត្តិរបស់ Kiri HR",
    storyTitle: "ប្រវត្តិរបស់ Kiri HR",
    storyP1: <>គ្រប់អាជីវកម្មជោគជ័យទាំងអស់ តែងតែចាប់ផ្តើមចេញពីការយល់ឃើញដ៏សាមញ្ញមួយ៖ <strong className="font-bold text-slate-900">«ការគ្រប់គ្រងល្អ មានវិន័យ សុក្រឹត និងតម្លាភាព នាំមកនូវជោគជ័យដល់អាជីវកម្ម»។</strong></>,
    storyP2: "ជាច្រើនឆ្នាំមកនេះ អ្នកដឹកនាំអាជីវកម្ម និងអ្នកគ្រប់គ្រង HR នៅកម្ពុជា តែងជួបបញ្ហាប្រឈមមុខនឹងជម្រើសពីរដ៏លំបាក។ បញ្ហាទី១គឺប្រព័ន្ធគ្រប់គ្រងបុគ្គលិកមានភាពស្មុគស្មាញ ចំណាយពេលយូរក្នុងការរៀបចំ សាំញ៉ាំ និងមិនមានការតភ្ជាប់ជាមួយកម្មវិធីប្រាស្រ័យទាក់ទងប្រចាំថ្ងៃដូចជា Telegram។ ឯបញ្ហាមួយទៀត គឺការកត់ត្រាដោយដៃលើ Excel ឬក្រដាស ដែលចំណាយពេលយូរ មានកំហុសច្រើន និងធ្វើឱ្យថ្នាក់ដឹកនាំ ម្ចាស់អាជីវកម្ម ពិបាកតាមដានព័ត៌មានជាក់ស្តែង។",
    storyP3: <><strong className="font-bold text-slate-900">យើងបានចាប់ផ្តើមបង្កើតប្រព័ន្ធគ្រប់គ្រងការងារឡើងវិញដោយយកបញ្ហាខាងលើមកដោះស្រាយ</strong></>,
    storyP4: "Kiri HR ត្រូវបានបង្កើតឡើងដើម្បីបង្ហាញថា ប្រព័ន្ធគ្រប់គ្រងការងារមិនចាំបាច់មានភាពស្មុគស្មាញ ឬសាំញុាំច្រើននោះឡើយ។ យើងបានផ្លាស់ប្តូរទម្រង់នៃការគ្រប់គ្រងបុគ្គលិក ដោយផ្តោតលើភាពច្បាស់លាស់ លឿនរហ័ស និងភាពទាន់សម័យស្របតាមសម័យឌីជីថល។ តាមរយៈការលុបបំបាត់ភាពស្មុគស្មាញដែលមិនចាំបាច់ យើងបានបង្កើតប្រព័ន្ធមួយដ៏រលូន ដែលរួមបញ្ចូលការរៀបចំវេនធ្វើការ ការកត់ត្រាវត្តមានតាម ដោយកំណត់ទីតាំង ដ៏ត្រឹមត្រូវ ការគណនាប្រាក់ខែស្វ័យប្រវត្តិ និង Telegram Alerts ដំណើរការរួមគ្នាយ៉ាងល្អឥតខ្ចោះ។",
    storyP5: "បច្ចុប្បន្ន Kiri HR ជួយសម្រួលដល់ការងារប្រចាំថ្ងៃរបស់ក្រុមការងារសម័យថ្មី ផ្តល់ភាពងាយស្រួលដល់បុគ្គលិក និងផ្តល់ទំនុកចិត្តទាំងស្រុងដល់ថ្នាក់ដឹកនាំ។",

    // Founder Section
    founderTag: "ថ្នាក់ដឹកនាំ និងចក្ខុវិស័យ",
    founderTitle: "សារពីស្ថាបនិករបស់យើង។",
    founderQuote: "ពួកយើងផ្តោតលើការបង្កើតប្រព័ន្ធ HR ដែលមានសមត្ថភាពខ្ពស់ ស្ថេរភាព ងាយស្រួលប្រើ និងសមស្របជាមួយតម្រូវការរបស់អាជីវកម្មនៅកម្ពុជា។",
    founderName: "វ៉ាត ឧត្តមខេវិន",
    founderRole: "ស្ថាបនិក",
    founderBio: "ខ្ញុំមានចំណង់ចំណូលចិត្តក្នុងការប្រើប្រាស់បច្ចេកវិទ្យា ដើម្បីដោះស្រាយបញ្ហាជាក់ស្តែងសម្រាប់អាជីវកម្មនៅកម្ពុជា។ Kiri HR បង្កើតឡើងដោយមានចក្ខុវិស័យក្នុងការកសាងប្រព័ន្ធ HR ខ្មែរទំនើបមួយ ដែលជួយសម្រួលការគ្រប់គ្រងបុគ្គលិក វត្តមាន ប្រាក់ខែ និងការងាររដ្ឋបាលធនធានមនុស្សប្រចាំថ្ងៃ ឱ្យកាន់តែងាយស្រួល និងមានប្រសិទ្ធភាព។",
    founderLocation: "រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា",

    // Contact Founder
    contactTag: "ទំនាក់ទំនងផ្ទាល់",
    contactTitle: "ភ្ជាប់ទំនាក់ទំនងដោយផ្ទាល់ជាមួយក្រុមការងារ",
    contactSubtitle: "មានសំណួរ ត្រូវការដំណោះស្រាយពិសេស ឬចង់បានការណែនាំដោយផ្ទាល់? ទាក់ទងមកយើងតាមរយៈបណ្តាញដែលអ្នកពេញចិត្ត។",
    contactPhoneLabel: "ទូរស័ព្ទទំនាក់ទំនង",
    contactPhoneVal: "093988991",
    contactEmailLabel: "អ៊ីមែល",
    contactEmailVal: "kirihrsystem@gmail.com",
    contactTelegramLabel: "តេលេក្រាម",
    contactTelegramVal: "@Udomkevin",
    contactLocationLabel: "ទីស្នាក់ការកណ្តាល",
    contactLocationVal: "រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា",
    sendMessageTitle: "ផ្ញើសារផ្ទាល់",
    yourName: "ឈ្មោះរបស់អ្នក",
    yourEmail: "អ៊ីមែលរបស់អ្នក",
    yourMessage: "សាររបស់អ្នក",
    sendButton: "ផ្ញើសារ",
    messageSentSuccess: "សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើទៅកាន់ស្ថាបនិកហើយ។",

    // Testimonials
    testimonialsTitle: "ទទួលបានការជឿទុកចិត្តពីក្រុមការងារ",
    testimonialsSubtitle: "ស្វែងយល់ពីរបៀបដែលប្រព័ន្ធ Kiri HR កំពុងផ្លាស់ប្តូរការគ្រប់គ្រងបុគ្គលិក និងអាជីវកម្មទូទាំងប្រទេស។",


    // Pricing
    pricingTag: "តម្លៃច្បាស់លាស់",
    pricingTitle: "គម្រោងសាមញ្ញសម្រាប់គ្រប់ក្រុមការងារ។",
    pricingSubtitle: "ចាប់ផ្តើមដោយឥតគិតថ្លៃ ដំឡើងកញ្ចប់នៅពេលអ្នកត្រូវការមុខងារបន្ថែម។",
    pricingTiers: [
      {
        name: "ចាប់ផ្តើម",
        price: "$4.99",
        period: "/ខែ",
        description: "សាកសមបំផុតសម្រាប់អាជីវកម្មធុនតូច ដែលមានសមាជិកបុគ្គលិក​មិនលើសពី១០នាក់។",
        features: ["បុគ្គលិករហូតដល់ 10 នាក់", "ចុះវត្តមានដោយកំណត់ទីតាំង GPS", "បុគ្គលិកអាចចុះវត្តមានដោយថតរូប", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់សារជាមួយ Telegram", "របាយការណ៍ទូទៅ"],
        button: "ចាប់ផ្តើម",
        popular: false
      },
      {
        name: "Pro",
        price: "$9.99",
        period: "/ខែ",
        description: "សាកសមបំផុតសម្រាប់អាជីវកម្មធុនតូច​ ឬ មធ្យម ដែលមានសមាជិកបុគ្គលិក​មិនលើសពី២៥នាក់។",
        features: ["ចំនួនបុគ្គលិករហូតដល់ 25 នាក់", "ចុះវត្តមានដោយកំណត់ទីតាំង GPS", "បុគ្គលិកអាចចុះវត្តមានដោយថតរូប", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់សារជាមួយ Telegram", "របាយការណ៍ទូទៅ"],
        button: "ជ្រើសរើស Pro",
        popular: true
      },
      {
        name: "សហគ្រាស",
        price: "ទាក់ទង",
        period: "",
        description: "សាកសមបំផុតសម្រាប់អាជីវកម្ម ឬ​ សហគ្រាស​ធុនឌំ ដែលមានសមាជិកបុគ្គលិកច្រើន។",
        features: ["អាចកំណត់ចំនួនបុគ្គលិកតាមជាក់ស្ដែង", "ចុះវត្តមានដោយកំណត់ទីតាំង GPS", "បុគ្គលិកអាចចុះវត្តមានដោយថតរូប", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់សារជាមួយ Telegram", "របាយការណ៍ទូទៅ", "កែប្រែ ឬ បន្ថែមប្រព័ន្ធបានទៅតាមតម្រូវការ", "ការបណ្តុះបណ្តាលផ្ទាល់"],
        button: "ទាក់ទងមកក្រុមការងារ",
        popular: false
      }
    ],

    // FAQs
    faqTag: "សំណួរ និងចម្លើយ",
    faqTitle: "សំណួរដែលសួរញឹកញាប់",
    faqSubtitle: "អ្វីគ្រប់យ៉ាងដែលអ្នកត្រូវដឹងអំពីការរៀបចំ និងការប្រើប្រាស់ Kiri HR។",
    faqs: [
      {
        q: "តើការតាមដានវត្តមានតាមទីតាំង GPS ដំណើរការយ៉ាងដូចម្តេច?",
        a: "បុគ្គលិកចុះឈ្មោះចូល ឬចេញដោយប្រើកម្មវិធីរុករកតាមទូរស័ព្ទ ឬកម្មវិធី។ Kiri HR ផ្ទៀងផ្ទាត់កូអរដោនេ GPS របស់ពួកគេធៀបនឹងកូអរដោនេ និងកាំដែលបានកំណត់នៃកន្លែងធ្វើការ ដើម្បីការពារការចុះឈ្មោះក្រៅទីតាំង ខណៈពេលដែលរក្សាឯកជនភាពបុគ្គលិក។"
      },
      {
        q: "តើ Kiri HR គាំទ្រការទូទាត់ប្រាក់បៀវត្សរ៍ពីររូបិយប័ណ្ណ USD និង KHR យ៉ាងដូចម្តេច?",
        a: "អ្នកអាចកំណត់អត្រាប្តូរប្រាក់ (ឧទាហរណ៍ 1 USD = 4,100 KHR) និងគ្រប់គ្រងប្រាក់ខែ ម៉ោងបន្ថែម និងប្រាក់មុនជារូបិយប័ណ្ណណាមួយជាមួយនឹងការគណនាស្វ័យប្រវត្តិ និងការទូទាត់តាម KHQR។"
      },
      {
        q: "តើខ្ញុំអាចភ្ជាប់ Kiri HR ទៅ Telegram សម្រាប់ការជូនដំណឹងភ្លាមៗបានទេ?",
        a: "បាន! Kiri HR មានមុខងារភ្ចាប់ជាមួយ Telegram Bot។ អ្នកគ្រប់គ្រងទទួលបានការជូនដំណឹងភ្លាមៗសម្រាប់ការចុះឈ្មោះចូល/ចេញរបស់បុគ្គលិក ការមកយឺត ការស្នើសុំច្បាប់ និងសេចក្តីសង្ខេបប្រចាំថ្ងៃនៅក្នុងក្រុម Telegram។"
      },
      {
        q: "តើមានការសាកល្បងឥតគិតថ្លៃ ឬគម្រោងជាវដែលបត់បែនបានទេ?",
        a: "បាទ/ចាស កន្លែងធ្វើការថ្មីទទួលបានការចូលប្រើភ្លាមៗ។ យើងផ្តល់ជូននូវជម្រើសបង់ប្រាក់ប្រចាំខែ និងប្រចាំឆ្នាំជាមួយនឹងការផ្ទេរប្រាក់តាម KHQR ឬកូដអញ្ជើញ។"
      },
      {
        q: "តើទិន្នន័យបុគ្គលិកមានសុវត្ថិភាព និងឯកជនភាពទេ?",
        a: "សុវត្ថិភាពគឺជាអាទិភាពចម្បង។ ទិន្នន័យត្រូវបានកូដនីយកម្ម និងរក្សាទុកក្នុងប្រព័ន្ធ Cloud ដោយមានការគ្រប់គ្រងសិទ្ធិតាមតួនាទីយ៉ាងតឹងរ៉ឹង។"
      }
    ],

    // Final CTA & Footer
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
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [lang, setLang] = useState('en');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  const t = translations[lang as keyof typeof translations];
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const snap = await getDocs(collection(db, 'testimonials'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTestimonials(data);
      } catch (err: any) {
        if (err.message && err.message.includes("Missing or insufficient permissions")) {
          handleFirestoreError(err, OperationType.LIST, 'testimonials');
        } else {
          console.error("Failed to fetch testimonials:", err);
        }
      }
    };
    fetchTestimonials();
  }, []);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setIsSubmittingMessage(true);
      try {
        await addDoc(collection(db, 'direct_messages'), {
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim(),
          status: 'unread',
          createdAt: new Date().toISOString()
        });
        setFormSubmitted(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => {
          setFormSubmitted(false);
        }, 6000);
      } catch (err) {
        console.error("Error submitting contact form message:", err);
        // Optimistic display so user experience remains smooth
        setFormSubmitted(true);
        setContactForm({ name: '', email: '', message: '' });
      } finally {
        setIsSubmittingMessage(false);
      }
    }
  };

  const fadeRise = {
    hidden: { opacity: 0, y: 24 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as any, delay: custom * 0.15 }
    })
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f8fafc] text-primary-text font-sans">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md py-2.5 sm:py-4 shadow-sm' : 'bg-transparent py-3 sm:py-6'}`}>
        <div className="w-full px-6 md:px-12 flex justify-between items-center gap-2">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 sm:gap-3 group bg-transparent shrink-0">
            <div className="relative flex items-center justify-center bg-transparent">
              <img 
                src="/logo.png" 
                alt="Kiri HR Logo" 
                fetchPriority="high"
                decoding="async"
                className="h-7 sm:h-9 md:h-10 w-auto object-contain bg-transparent grayscale-0 opacity-100 sm:grayscale sm:opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-out"
              />
            </div>
            <span className="text-lg sm:text-2xl font-display text-primary-text tracking-tight font-bold group-hover:text-indigo-600 transition-colors duration-300 whitespace-nowrap">
              Kiri HR
            </span>
          </Link>
          <div className="hidden md:flex gap-8 text-[17px] font-medium items-center">
            <a href="#features" className="hover:text-black/60 transition-colors">{t.navFeatures}</a>
            <a href="#showcase" className="hover:text-black/60 transition-colors">{t.navShowcase}</a>
            <a href="#about" className="hover:text-black/60 transition-colors">{t.navAbout}</a>
            <a href="#story" className="hover:text-black/60 transition-colors">{t.navStory}</a>
            <a href="#founder" className="hover:text-black/60 transition-colors">{t.navFounder}</a>
            <a href="#pricing" className="hover:text-black/60 transition-colors">{t.navPricing}</a>
            <a href="#faq" className="hover:text-black/60 transition-colors">{t.navFAQ}</a>
            <a href="#contact" className="hover:text-black/60 transition-colors">{t.navContact}</a>
          </div>
          <div className="flex gap-1.5 sm:gap-3 items-center shrink-0">
            <button 
              onClick={() => setLang(lang === 'en' ? 'km' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] sm:text-[13px] font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
              title="Toggle Language"
            >
              <Globe size={13} className="text-slate-600 sm:w-3.5 sm:h-3.5" />
              <span className="uppercase tracking-wider">{lang === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            </button>
            <Link to="/login" className="text-[12px] sm:text-[14px] font-semibold text-slate-700 hover:text-black whitespace-nowrap px-1 sm:px-2">{t.navLogIn}</Link>
            <Link to="/signup" className="editorial-btn text-[11px] sm:text-[13px] px-3.5 py-1.5 sm:px-6 sm:py-3 whitespace-nowrap">{t.navGetStarted}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-bg-base">
        <motion.video 
          ref={videoRef}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isVideoLoaded ? 0.8 : 0, 
            scale: isVideoLoaded ? 1 : 1.05 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          onCanPlay={() => setIsVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen transform-gpu"
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          poster="/images/mockup6.webp"
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </motion.video>
        
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
            dangerouslySetInnerHTML={{ __html: t.heroSubtitle }}
          />

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

      {/* Philosophy / Solution Section */}
      <section id="solution" className="py-32 px-6 md:px-12 max-w-7xl mx-auto bg-white">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-5xl md:text-7xl mb-8 text-slate-900" dangerouslySetInnerHTML={{ __html: t.solutionTitle }} />
            <motion.p custom={1} variants={fadeRise} className="text-[18px] text-muted-text leading-relaxed font-normal mb-8">
              {t.solutionDesc}
            </motion.p>
            <motion.div custom={2} variants={fadeRise}>
              <a href="#about" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-slate-900 text-white font-bold text-[13px] uppercase tracking-wider transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 cursor-pointer">
                {t.manifesto} <ArrowRight size={16} />
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeRise}
            className="aspect-[3/4] bg-gray-100 overflow-hidden rounded-2xl shadow-sm"
          >
            <img 
              src="/images/mockup6_correct.webp" 
              alt="Workspace aesthetic" 
              loading="lazy"
              decoding="async"
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
            <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-5xl md:text-6xl mb-6 text-slate-900">
              {t.featuresTitle}
            </motion.h2>
            <motion.p custom={1} variants={fadeRise} className="text-[18px] text-muted-text max-w-xl mx-auto">
              {t.featuresSubtitle}
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 border-t border-slate-300 pt-16">
            {[
              { title: t.f1Title, desc: t.f1Desc },
              { title: t.f2Title, desc: t.f2Desc },
              { title: t.f3Title, desc: t.f3Desc }
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

      {/* Picture Slideshow Gallery / Product Showcase */}
      <section id="showcase" className="py-32 px-6 md:px-12 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <ImageSlideshow 
            lang={lang as 'en' | 'km'} 
            title={t.showcaseTitle}
            subtitle={t.showcaseSubtitle}
          />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div 
              className="lg:col-span-6 space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight">
                {t.aboutTitle}
              </motion.h2>

              <motion.p custom={2} variants={fadeRise} className="text-[17px] text-slate-600 leading-relaxed font-normal">
                {t.aboutDesc1}
              </motion.p>

              <motion.p custom={3} variants={fadeRise} className="text-[17px] text-slate-600 leading-relaxed font-normal">
                {t.aboutDesc2}
              </motion.p>
            </motion.div>

            <motion.div 
              className="lg:col-span-6 grid sm:grid-cols-3 lg:grid-cols-1 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div 
                custom={1} 
                variants={fadeRise} 
                className="group relative bg-indigo-50/70 border border-indigo-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-indigo-50/60 sm:hover:border-indigo-300/90 p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="text-3xl font-display font-extrabold text-indigo-600 sm:text-slate-900 sm:group-hover:text-indigo-600 transition-colors mb-1">{t.aboutStat1Number}</div>
                <div className="text-sm font-semibold text-slate-800 sm:group-hover:text-indigo-950 transition-colors">{t.aboutStat1Label}</div>
              </motion.div>

              <motion.div 
                custom={2} 
                variants={fadeRise} 
                className="group relative bg-sky-50/70 border border-sky-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-sky-50/60 sm:hover:border-sky-300/90 p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="text-3xl font-display font-extrabold text-sky-600 sm:text-slate-900 sm:group-hover:text-sky-600 transition-colors mb-1">{t.aboutStat2Number}</div>
                <div className="text-sm font-semibold text-slate-800 sm:group-hover:text-sky-950 transition-colors">{t.aboutStat2Label}</div>
              </motion.div>

              <motion.div 
                custom={3} 
                variants={fadeRise} 
                className="group relative bg-emerald-50/70 border border-emerald-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-emerald-50/60 sm:hover:border-emerald-300/90 p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="text-3xl font-display font-extrabold text-emerald-600 sm:text-slate-900 sm:group-hover:text-emerald-600 transition-colors mb-1">{t.aboutStat3Number}</div>
                <div className="text-sm font-semibold text-slate-800 sm:group-hover:text-emerald-950 transition-colors">{t.aboutStat3Label}</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <motion.section 
        id="story" 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-32 px-6 md:px-12 bg-slate-50 border-t border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-6"
            >
              <div className="mb-10">
                <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight">
                  {t.storyTitle}
                </motion.h2>
              </div>

              <div className="text-lg md:text-xl text-slate-600 leading-relaxed font-normal space-y-6 md:space-y-8">
                <motion.p custom={2} variants={fadeRise}>
                  {t.storyP1}
                </motion.p>
                <motion.p custom={3} variants={fadeRise}>
                  {t.storyP2}
                </motion.p>
                <motion.p custom={4} variants={fadeRise}>
                  {t.storyP3}
                </motion.p>
                <motion.p custom={5} variants={fadeRise}>
                  {t.storyP4}
                </motion.p>
                <motion.p custom={6} variants={fadeRise}>
                  {t.storyP5}
                </motion.p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-6"
            >
              <ImageSlideshow lang={lang as 'en' | 'km'} hideHeader={true} compact={true} />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Founder Section */}
      <section id="founder" className="py-28 md:py-36 px-6 md:px-12 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.2),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div 
              className="lg:col-span-5 order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                <img 
                  src="/images/owner.webp" 
                  alt="Founder" 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover filter contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xl font-bold text-white drop-shadow-sm">{t.founderName}</div>
                  <div className="text-sm font-semibold text-indigo-400">{t.founderRole}</div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-indigo-400" />
                    {t.founderLocation}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-7 order-1 lg:order-2 space-y-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-white font-extrabold leading-tight tracking-tight drop-shadow-sm">
                {t.founderTitle}
              </motion.h2>

              <motion.blockquote custom={2} variants={fadeRise} className="text-xl sm:text-2xl text-slate-100 leading-relaxed font-serif italic border-l-4 border-indigo-500 pl-6 my-6 bg-slate-900/80 p-6 rounded-r-2xl border-y border-r border-slate-800/80 shadow-md">
                "{t.founderQuote}"
              </motion.blockquote>

              <motion.p custom={3} variants={fadeRise} className="text-slate-200 text-base sm:text-lg leading-relaxed font-normal">
                {t.founderBio}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection 
        testimonials={testimonials} 
        lang={lang}
        title={(t as any).testimonialsTitle}
        subtitle={(t as any).testimonialsSubtitle}
      />

      
      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight">
              {(t as any).pricingTitle}
            </motion.h2>
            <motion.p custom={1} variants={fadeRise} className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
              {(t as any).pricingSubtitle}
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {((t as any).pricingTiers || []).map((tier: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                className={`relative flex flex-col p-8 rounded-3xl border ${tier.popular ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'border-slate-200 bg-white text-slate-900 shadow-xl'}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className={`text-lg ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.period}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${tier.popular ? 'text-slate-300' : 'text-slate-600'}`}>{tier.description}</p>
                </div>
                
                <div className="flex-grow space-y-4 mb-8">
                  {tier.features.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${tier.popular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={`text-sm ${tier.popular ? 'text-slate-200' : 'text-slate-700'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                {index === 2 ? (
                  <a 
                    href="#contact" 
                    className={`block text-center py-4 px-6 rounded-xl font-bold transition-all ${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                  >
                    {tier.button}
                  </a>
                ) : (
                  <Link 
                    to="/signup" 
                    className={`block text-center py-4 px-6 rounded-xl font-bold transition-all ${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                  >
                    {tier.button}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="py-32 px-6 md:px-12 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl text-slate-900 mb-4">
              {t.faqTitle}
            </motion.h2>
            <motion.p custom={2} variants={fadeRise} className="text-slate-600 text-base sm:text-lg">
              {t.faqSubtitle}
            </motion.p>
          </motion.div>

          <div className="space-y-4">
            {t.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-6 flex justify-between items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="font-display font-bold text-lg text-slate-900">{faq.q}</span>
                    <div className="p-2 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 pt-2 text-slate-600 text-base leading-relaxed border-t border-slate-100">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Founder Section */}
      <section id="contact" className="py-32 px-6 md:px-12 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <motion.div 
              className="lg:col-span-6 space-y-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl text-slate-900 leading-tight">
                {t.contactTitle}
              </motion.h2>

              <motion.p custom={2} variants={fadeRise} className="text-slate-600 text-base sm:text-lg leading-relaxed">
                {t.contactSubtitle}
              </motion.p>

              <motion.div custom={3} variants={fadeRise} className="space-y-4 pt-4">
                {/* Direct Phone */}
                <div className="group relative flex items-center gap-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-emerald-50/60 sm:hover:border-emerald-300/90 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white sm:bg-slate-900 sm:text-white sm:group-hover:bg-emerald-600 sm:group-hover:text-white flex items-center justify-center shrink-0 shadow-sm sm:group-hover:shadow-md transition-all duration-300">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:group-hover:text-emerald-700 transition-colors">{t.contactPhoneLabel}</div>
                    <a href={`tel:${t.contactPhoneVal.replace(/[^+\d]/g, '')}`} className="text-base font-semibold text-slate-900 sm:group-hover:text-emerald-950 transition-colors flex items-center gap-1.5">
                      {t.contactPhoneVal}
                      <ExternalLink size={14} className="text-slate-400 sm:group-hover:text-emerald-600 transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Direct Email */}
                <div className="group relative flex items-center gap-4 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-indigo-50/60 sm:hover:border-indigo-300/90 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white sm:bg-slate-900 sm:text-white sm:group-hover:bg-indigo-600 sm:group-hover:text-white flex items-center justify-center shrink-0 shadow-sm sm:group-hover:shadow-md transition-all duration-300">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:group-hover:text-indigo-700 transition-colors">{t.contactEmailLabel}</div>
                    <a href={`mailto:${t.contactEmailVal}`} className="text-base font-semibold text-slate-900 sm:group-hover:text-indigo-950 transition-colors flex items-center gap-1.5">
                      {t.contactEmailVal}
                      <ExternalLink size={14} className="text-slate-400 sm:group-hover:text-indigo-600 transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Direct Telegram */}
                <div className="group relative flex items-center gap-4 p-5 rounded-2xl bg-sky-50/70 border border-sky-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-sky-50/60 sm:hover:border-sky-300/90 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-sky-500 text-white sm:bg-slate-900 sm:text-white sm:group-hover:bg-sky-500 sm:group-hover:text-white flex items-center justify-center shrink-0 shadow-sm sm:group-hover:shadow-md transition-all duration-300">
                    <Send size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:group-hover:text-sky-700 transition-colors">{t.contactTelegramLabel}</div>
                    <a href={`https://t.me/${t.contactTelegramVal.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-slate-900 sm:group-hover:text-sky-950 transition-colors flex items-center gap-1.5">
                      {t.contactTelegramVal}
                      <ExternalLink size={14} className="text-slate-400 sm:group-hover:text-sky-600 transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Headquarters */}
                <div className="group relative flex items-center gap-4 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 sm:bg-slate-50 sm:border-slate-200/80 sm:hover:bg-amber-50/60 sm:hover:border-amber-300/90 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white sm:bg-slate-900 sm:text-white sm:group-hover:bg-amber-600 sm:group-hover:text-white flex items-center justify-center shrink-0 shadow-sm sm:group-hover:shadow-md transition-all duration-300">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:group-hover:text-amber-700 transition-colors">{t.contactLocationLabel}</div>
                    <div className="text-base font-semibold text-slate-900 sm:group-hover:text-amber-950 transition-colors">{t.contactLocationVal}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="lg:col-span-6 bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{t.sendMessageTitle}</h3>

              {formSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <p className="text-sm font-semibold">{t.messageSentSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">{t.yourName}</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g., Alex Johnson"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">{t.yourEmail}</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="e.g. kirihrsystem@gmail.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">{t.yourMessage}</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we help your team?"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingMessage}
                    className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmittingMessage ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {t.sendButton}
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 text-center bg-white border-t border-slate-100">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2 custom={0} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-12 mx-auto max-w-4xl px-4" dangerouslySetInnerHTML={{ __html: t.ctaTitle }} />
          <motion.div custom={1} variants={fadeRise}>
            <Link to="/signup" className="editorial-btn">
              {t.ctaButton}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Proverb Marquee */}
      <ProverbMarquee />

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3.5 group cursor-pointer">
            <img 
              src="/logo.png" 
              alt="Kiri HR Logo" 
              loading="lazy"
              decoding="async"
              className="h-10 w-auto object-contain bg-transparent grayscale-0 opacity-100 sm:grayscale sm:opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-out"
            />
            <div>
              <div className="font-display text-3xl tracking-tight font-extrabold text-white group-hover:text-indigo-400 transition-colors duration-300">Kiri HR</div>
              <p className="text-xs text-slate-400 mt-0.5">Automating workspace management with elegance.</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-8 text-[14px] font-medium text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">{t.navAbout}</a>
            <a href="#story" className="hover:text-white transition-colors">{t.navStory}</a>
            <a href="#founder" className="hover:text-white transition-colors">{t.navFounder}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t.navPricing}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t.navFAQ}</a>
            <a href="#contact" className="hover:text-white transition-colors">{t.navContact}</a>
            <Link to="/privacy" className="hover:text-white transition-colors">{t.footerPrivacy}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t.footerTerms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
