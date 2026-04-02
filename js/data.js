/**
 * data.js — Static data: Jobs, News, Roadmap
 * Edit this file to add/remove/update job listings,
 * news articles, or roadmap phases.
 */

// ─── JOB LISTINGS ───────────────────────────────────────────────────────────
// Fields:
//   id       — unique number
//   title    — job title
//   company  — company name
//   logo     — emoji logo
//   dom      — 'swe' | 'ds'
//   type     — 'Full-time' | 'Internship'
//   salary   — salary string
//   remote   — boolean
//   intern   — boolean
//   exp      — experience requirement string
//   posted   — when posted (display string)
//   desc     — job description
//   tags     — array of skill tags
//   rec      — recruiter email
// ─────────────────────────────────────────────────────────────────────────────
const JOBS = [
  {
    id: 1, title: 'SDE Trainee', company: 'TCS', logo: '🔷',
    dom: 'swe', type: 'Full-time', salary: '₹3.5-4.5 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '1h ago',
    desc: 'Join TCS under NQT program. 3-month intensive training then product team allocation. Great starting point for freshers.',
    tags: ['Java', 'Python', 'Data Structures'], rec: 'campus@tcs.com'
  },
  {
    id: 2, title: 'Data Science Intern', company: 'Fractal Analytics', logo: '🧮',
    dom: 'ds', type: 'Internship', salary: '₹40-60K/mo',
    remote: true, intern: true, exp: '0 yrs', posted: '3h ago',
    desc: 'Work on real ML models in insurance and CPG domain. Ideal for DS freshers with Python and stats background.',
    tags: ['Python', 'ML', 'Statistics'], rec: 'talent@fractal.ai'
  },
  {
    id: 3, title: 'Software Engineer (Entry Level)', company: 'Razorpay', logo: '💳',
    dom: 'swe', type: 'Full-time', salary: '₹12-18 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '5h ago',
    desc: "Join Razorpay engineering. Strong DSA mandatory. CGPA 7.5+ preferred. One of India's best SWE workplaces.",
    tags: ['DSA', 'System Design', 'APIs'], rec: 'eng-hiring@razorpay.com'
  },
  {
    id: 4, title: 'ML Engineer Intern', company: 'Google', logo: '🔵',
    dom: 'ds', type: 'Internship', salary: '₹1L+/mo',
    remote: false, intern: true, exp: '0 yrs', posted: '2h ago',
    desc: 'STEP internship for final year students. Work on Google-scale ML infrastructure. Highly competitive.',
    tags: ['Python', 'TensorFlow', 'Research'], rec: 'step-intern@google.com'
  },
  {
    id: 5, title: 'Associate Software Engineer', company: 'Infosys', logo: '🟦',
    dom: 'swe', type: 'Full-time', salary: '₹3.6-6.5 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '4h ago',
    desc: 'Infosys InfyTQ / PowerProgrammer track. Premium package for top performers.',
    tags: ['Java', 'Spring Boot', 'MySQL'], rec: 'campus@infosys.com'
  },
  {
    id: 6, title: 'Data Analyst Trainee', company: 'Mu Sigma', logo: '📊',
    dom: 'ds', type: 'Full-time', salary: '₹4-6 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '6h ago',
    desc: 'Intensive data analytics training on live client problems. Strong stepping stone to DS careers.',
    tags: ['SQL', 'Excel', 'Tableau', 'Python'], rec: 'campus@mu-sigma.com'
  },
  {
    id: 7, title: 'Frontend Developer (Fresher)', company: 'Zepto', logo: '⚡',
    dom: 'swe', type: 'Full-time', salary: '₹8-14 LPA',
    remote: true, intern: false, exp: '0-1 yr', posted: '7h ago',
    desc: "Build UI for India's fastest growing quick-commerce. Strong React and JavaScript required.",
    tags: ['React', 'JavaScript', 'CSS'], rec: 'tech@zepto.in'
  },
  {
    id: 8, title: 'AI/ML Research Intern', company: 'Microsoft Research', logo: '🪟',
    dom: 'ds', type: 'Internship', salary: '₹80K-1L/mo',
    remote: false, intern: true, exp: '0 yrs', posted: '1d ago',
    desc: 'Research internship at MSRI Bangalore. NLP and CV focus. Publications possible.',
    tags: ['PyTorch', 'NLP', 'Research', 'Python'], rec: 'msri-intern@microsoft.com'
  },
  {
    id: 9, title: 'Backend Engineer (New Grad)', company: 'PhonePe', logo: '📱',
    dom: 'swe', type: 'Full-time', salary: '₹10-16 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '8h ago',
    desc: 'New Grad program. Build high-scale payments infrastructure handling millions of UPI transactions.',
    tags: ['Java', 'Microservices', 'Kafka'], rec: 'newgrad@phonepe.com'
  },
  {
    id: 10, title: 'Data Science Analyst', company: 'American Express', logo: '💠',
    dom: 'ds', type: 'Full-time', salary: '₹7-12 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '1d ago',
    desc: 'Analytics in credit risk and fraud detection. Stats and Python heavy role.',
    tags: ['Python', 'SAS', 'Statistics', 'SQL'], rec: 'campus@aexp.com'
  },
  {
    id: 11, title: 'Graduate Engineer Trainee (IT)', company: 'Wipro', logo: '🟢',
    dom: 'swe', type: 'Full-time', salary: '₹3.5-4 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '1d ago',
    desc: "Wipro's GET program. OOP, databases, web fundamentals training. Broad learning opportunities.",
    tags: ['Python', 'Java', 'SQL', 'OOP'], rec: 'campus@wipro.com'
  },
  {
    id: 12, title: 'ML Ops Intern', company: 'Swiggy', logo: '🍔',
    dom: 'ds', type: 'Internship', salary: '₹50-70K/mo',
    remote: true, intern: true, exp: '0 yrs', posted: '2d ago',
    desc: "Deploy and monitor ML models for Swiggy's recommendation and ETA prediction systems.",
    tags: ['Python', 'Docker', 'MLflow', 'AWS'], rec: 'ds-intern@swiggy.in'
  },
  {
    id: 13, title: 'SDE Intern', company: 'Amazon', logo: '📦',
    dom: 'swe', type: 'Internship', salary: '₹1L+/mo',
    remote: false, intern: true, exp: '0 yrs', posted: '2d ago',
    desc: 'Amazon SDE Internship — work on real product features. Strong OOP and DSA required. PPO possible.',
    tags: ['Java', 'DSA', 'OOP', 'System Design'], rec: 'campus@amazon.com'
  },
  {
    id: 14, title: 'Junior Data Scientist', company: 'Juspay', logo: '💸',
    dom: 'ds', type: 'Full-time', salary: '₹8-14 LPA',
    remote: true, intern: false, exp: '0-1 yr', posted: '3d ago',
    desc: 'Payments data science — fraud detection and personalization. Python or Haskell preferred.',
    tags: ['Python', 'ML', 'SQL'], rec: 'ds@juspay.in'
  },
  {
    id: 15, title: 'React Developer Intern', company: 'Razorpay', logo: '💳',
    dom: 'swe', type: 'Internship', salary: '₹60-80K/mo',
    remote: false, intern: true, exp: '0 yrs', posted: '3d ago',
    desc: "Build Razorpay's dashboard UIs. Strong React and TypeScript required. PPO opportunity.",
    tags: ['React', 'TypeScript', 'Redux'], rec: 'intern@razorpay.com'
  },
  {
    id: 16, title: 'NLP Research Intern', company: 'IISc Bangalore', logo: '🏫',
    dom: 'ds', type: 'Internship', salary: '₹25-40K/mo',
    remote: false, intern: true, exp: '0 yrs', posted: '4d ago',
    desc: 'Academic NLP research internship with possible conference paper co-authorship.',
    tags: ['NLP', 'Transformers', 'PyTorch'], rec: 'nlp-lab@iisc.ac.in'
  },
  {
    id: 17, title: 'Software Engineer I', company: 'Walmart Global Tech', logo: '🛒',
    dom: 'swe', type: 'Full-time', salary: '₹12-20 LPA',
    remote: false, intern: false, exp: '0-1 yr', posted: '4d ago',
    desc: "Walmart's India tech hub. Strong CS fundamentals required. Competitive programming background a bonus.",
    tags: ['Java', 'DSA', 'Distributed Systems'], rec: 'campus@walmart.com'
  },
  {
    id: 18, title: 'Data Engineering Intern', company: 'Dunzo', logo: '🏃',
    dom: 'ds', type: 'Internship', salary: '₹35-50K/mo',
    remote: true, intern: true, exp: '0 yrs', posted: '5d ago',
    desc: 'Build ETL pipelines and data quality frameworks for real-time delivery logistics data.',
    tags: ['Python', 'Airflow', 'BigQuery', 'SQL'], rec: 'data@dunzo.com'
  },
];

// ─── STATIC NEWS (fallback if API fails) ─────────────────────────────────────
const NEWS = [
  { id: 1, title: 'IIT Bombay & Delhi Record 100% Campus Placements — Avg ₹16 LPA', source: 'ET Tech', time: '1h ago', cat: 'jobs', col: '#34d399', exc: 'Top IITs report strong placement seasons with product companies dominating, even in a cautious market.' },
  { id: 2, title: 'OpenAI GPT-5 Arrives — Developers Are Already Building With It', source: 'TechCrunch', time: '3h ago', cat: 'AI', col: '#7c6dfa', exc: 'GPT-5 shows dramatic reasoning improvements and is now available via API. Early benchmarks show near-human MMLU scores.' },
  { id: 3, title: 'Indian Startups Are on a 2026 Hiring Surge — 50,000 Tech Roles Open', source: 'Inc42', time: '5h ago', cat: 'jobs', col: '#34d399', exc: 'SWE and DS roles dominate the postings as Indian startup ecosystem recovers strongly from the 2023 slowdown.' },
  { id: 4, title: 'Meta Releases Llama 4 Open-Source — Best Open Model Yet', source: 'The Verge', time: '7h ago', cat: 'AI', col: '#7c6dfa', exc: 'Meta releases Llama 4 under a commercial-friendly license. Fine-tuning is now accessible to any developer with a GPU.' },
  { id: 5, title: 'GitHub Copilot is Now Free for Students — No Waitlist', source: 'Dev.to', time: '9h ago', cat: 'tools', col: '#38bdf8', exc: 'Students with an institutional email can now use GitHub Copilot Pro completely free. A huge win for fresher developers.' },
  { id: 6, title: 'Zoho, Freshworks, Razorpay Expanding to 15 New Cities', source: 'Mint', time: '12h ago', cat: 'startup', col: '#fb923c', exc: 'Indian SaaS giants are expanding engineering hubs beyond Bangalore and Hyderabad, opening roles in tier-2 cities.' },
  { id: 7, title: 'Python Overtakes JavaScript as Most Used Language — 2026 Survey', source: 'Stack Overflow', time: '1d ago', cat: 'tools', col: '#38bdf8', exc: 'Python tops the most-used language chart for the first time, driven by data science, automation, and AI adoption.' },
  { id: 8, title: 'Google Reverses Return-to-Office — Remote Work Is Back', source: 'CNBC', time: '1d ago', cat: 'jobs', col: '#34d399', exc: 'After employee pushback, Google reverses its RTO policy for most engineering roles globally, including India teams.' },
];

// ─── DSA ROADMAP ─────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    icon: '📐', title: 'Phase 1: Math & CS Fundamentals',
    sub: 'Linear Algebra, Probability, Statistics, OS, DBMS, Computer Networks',
    status: 'Start Here', sc: 'var(--accent)',
    items: ['MIT 6.006 Algorithms (free on MIT OCW)', 'StatQuest for Statistics (YouTube)', 'DBMS & Networks by Neso Academy']
  },
  {
    icon: '💡', title: 'Phase 2: DSA & Problem Solving',
    sub: 'Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Greedy — 150+ LeetCode problems',
    status: 'Core Skill', sc: 'var(--orange)',
    items: ["Striver's SDE Sheet (191 problems)", 'LeetCode Blind 75', 'NeetCode.io full roadmap']
  },
  {
    icon: '🐍', title: 'Phase 3A: Python for DS/ML',
    sub: 'NumPy, Pandas, Matplotlib, scikit-learn, end-to-end ML projects on Kaggle',
    status: 'DS/ML Track', sc: 'var(--sky)',
    items: ['Kaggle free courses (highly recommended)', 'fast.ai Practical Deep Learning', 'Andrej Karpathy Neural Nets from Scratch']
  },
  {
    icon: '⚛️', title: 'Phase 3B: Web Dev for SWE',
    sub: 'HTML/CSS → JavaScript → React → Node.js → Databases → REST APIs',
    status: 'SWE Track', sc: 'var(--sky)',
    items: ['The Odin Project (completely free)', 'Full Stack Open by University of Helsinki', 'freeCodeCamp full curriculum']
  },
  {
    icon: '🧠', title: 'Phase 4A: Deep Learning & ML',
    sub: 'Neural Networks, CNNs, RNNs, Transformers, LLMs, PyTorch, model deployment',
    status: 'Advanced DS', sc: 'var(--green)',
    items: ['fast.ai Practical Deep Learning (Part 2)', 'Hugging Face NLP course (free)', 'Papers With Code for research reading']
  },
  {
    icon: '🏗️', title: 'Phase 4B: System Design',
    sub: 'Scalability, Load Balancers, Databases, Caching, Microservices — SWE interviews',
    status: 'Advanced SWE', sc: 'var(--green)',
    items: ['System Design Primer on GitHub', 'Grokking System Design (Educative)', 'DDIA book by Martin Kleppmann']
  },
  {
    icon: '📦', title: 'Phase 5: Projects & Portfolio',
    sub: '2-3 strong projects per track. Host on GitHub. Write blog posts. Contribute to OSS.',
    status: 'Build Portfolio', sc: 'var(--accent)',
    items: ['SWE: Full-stack app + browser extension', 'DS/ML: End-to-end Kaggle project + deployed model', 'Both: Open source contribution (good first issues)']
  },
  {
    icon: '🎯', title: 'Phase 6: Interview Prep',
    sub: 'Mock interviews, HR rounds, offer negotiation, internship → PPO conversion',
    status: 'Final Mile', sc: 'var(--orange)',
    items: ['Pramp for free mock interviews', 'Interviewing.io for paid practice', 'Cracking the Coding Interview book']
  },
];

// ─── EMAIL VARIATIONS ────────────────────────────────────────────────────────
const EMAIL_VARIATIONS = [
  (n, r, sk, c) => `Dear Hiring Manager,<br/><br/>I hope this message finds you well. I am <strong>${n}</strong>, a recent graduate from <strong>${c}</strong>. I am writing to express my strong interest in the <strong>${r}</strong> role at your organization.<br/><br/>I have hands-on experience with <strong>${sk}</strong> and a solid foundation in computer science fundamentals. I am a fast learner, genuinely passionate about building impactful technology, and ready to contribute from day one.<br/><br/>I have attached my resume for your review. I would be grateful for the opportunity to discuss how my skills align with your team's goals — even a 10-minute call would mean a lot.<br/><br/>Thank you for your time!<br/><br/>Warm regards,<br/><strong>${n}</strong><br/><span style="font-size:10px;color:var(--muted);">📎 Resume attached</span>`,

  (n, r, sk, c) => `Dear Hiring Team,<br/><br/>My name is <strong>${n}</strong>, a motivated fresher from <strong>${c}</strong>, deeply interested in the <strong>${r}</strong> position.<br/><br/>I've built strong skills in <strong>${sk}</strong> through coursework, projects, and self-learning. I'm the kind of person who learns fast, ships faster, and genuinely loves what I build.<br/><br/>My resume is attached. Would love a quick chat!<br/><br/>Best,<br/><strong>${n}</strong>`,

  (n, r, sk, c) => `Dear Recruiter,<br/><br/>I'm reaching out to apply for the <strong>${r}</strong> role. As a fresher from <strong>${c}</strong> with expertise in <strong>${sk}</strong>, I'm eager to start my career at a company doing meaningful work.<br/><br/>Resume attached — looking forward to connecting!<br/><br/>Thanks,<br/><strong>${n}</strong>`,
];

// ─── FRESHER TIPS ─────────────────────────────────────────────────────────────
const FRESHER_TIPS = [
  { i: '🎓', t: 'Mention CGPA if 7.0+ — it matters a lot for fresher roles' },
  { i: '🔗', t: 'Include GitHub & LeetCode links in every email' },
  { i: '📅', t: 'Apply Tue–Thu for best recruiter response rates' },
  { i: '⚡', t: 'Apply within 24h of posting — early applications win' },
  { i: '📝', t: 'Customize the Role field for each recruiter batch' },
  { i: '🤝', t: 'Always end with a CTA: "Can we schedule a 10-min call?"' },
];

// ─── SAMPLE RECRUITER EMAILS ───────────────────────────────────────────────────
const INDIAN_IT_RECRUITERS = [
  'talent@fractal.ai', 'campus@tcs.com', 'campus@wipro.com',
  'campus@infosys.com', 'hr@hcl.com', 'careers@mphasis.com'
];
const MNC_RECRUITERS = [
  'campus@google.com', 'university@microsoft.com',
  'campus@amazon.com', 'campus@oracle.com', 'grad-hiring@meta.com'
];
