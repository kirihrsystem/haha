const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const oldLink = `<a 
                  href="#contact" 
                  className={\`block text-center py-4 px-6 rounded-xl font-bold transition-all \${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}\`}
                >
                  {tier.button}
                </a>`;

const newLink = `{index === 2 ? (
                  <a 
                    href="#contact" 
                    className={\`block text-center py-4 px-6 rounded-xl font-bold transition-all \${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}\`}
                  >
                    {tier.button}
                  </a>
                ) : (
                  <Link 
                    to="/signup" 
                    className={\`block text-center py-4 px-6 rounded-xl font-bold transition-all \${tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}\`}
                  >
                    {tier.button}
                  </Link>
                )}`;

code = code.replace(oldLink, newLink);
fs.writeFileSync('src/pages/Landing.tsx', code);
