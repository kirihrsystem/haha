const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const pricingSection = `
      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div custom={0} variants={fadeRise} className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-widest mb-6">
              {(t as any).pricingTag}
            </motion.div>
            <motion.h2 custom={1} variants={fadeRise} className="editorial-heading text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight">
              {(t as any).pricingTitle}
            </motion.h2>
            <motion.p custom={2} variants={fadeRise} className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
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
                className={\`relative flex flex-col p-8 rounded-3xl border \${tier.popular ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'border-slate-200 bg-white text-slate-900 shadow-xl'}\`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className={\`text-2xl font-bold mb-2 \${tier.popular ? 'text-white' : 'text-slate-900'}\`}>{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className={\`text-lg \${tier.popular ? 'text-slate-400' : 'text-slate-500'}\`}>{tier.period}</span>
                  </div>
                  <p className={\`text-sm leading-relaxed \${tier.popular ? 'text-slate-300' : 'text-slate-600'}\`}>{tier.description}</p>
                </div>
                
                <div className="flex-grow space-y-4 mb-8">
                  {tier.features.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <CheckCircle2 className={\`w-5 h-5 shrink-0 \${tier.popular ? 'text-indigo-400' : 'text-indigo-600'}\`} />
                      <span className={\`text-sm \${tier.popular ? 'text-slate-200' : 'text-slate-700'}\`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <a 
                  href="#contact" 
                  className={\`block text-center py-4 px-6 rounded-xl font-bold transition-all \${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}\`}
                >
                  {tier.button}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
`;

code = code.replace('{/* FAQs Section */}', pricingSection + '\n      {/* FAQs Section */}');

fs.writeFileSync('src/pages/Landing.tsx', code);
