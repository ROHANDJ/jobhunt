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

// NOTE: The old hardcoded INDIAN_IT_RECRUITERS / MNC_RECRUITERS sample lists
// (campus@google.com, hr@hcl.com, …) were removed — they were guessed generic
// addresses, not real hiring contacts. Use "Load Real Fresher Leads" in the
// Auto Apply page, which pulls verified leads from automation/job-leads.json
// (populated by: node automation/runner.js leads).

// ═════════════════════════════════════════════════════════════════════════════
// 🎓  MS ABROAD / HIGHER STUDIES DATA
// Everything below powers the "MS Abroad" hub (js/study.js).
// Figures are indicative for the 2025–26 cycle — ALWAYS re-check the official
// university / scholarship page before you rely on a number or deadline.
// ═════════════════════════════════════════════════════════════════════════════

// ─── APPLICATION TIMELINE (start ~15 months before intake) ───────────────────
const STUDY_TIMELINE = [
  { when: '15–18 mo before', icon: '🧭', title: 'Explore & decide', sc: 'var(--accent)',
    items: ['Pick country + field (CS/DS/ML, etc.)', 'Fix a rough budget & funding plan', 'Shortlist 40–50 programs to research'] },
  { when: '12–14 mo before', icon: '📝', title: 'Register for exams', sc: 'var(--sky)',
    items: ['Book GRE (if needed) + IELTS/TOEFL', 'Start prep — 8–10 weeks is enough', 'Build/clean up your CV + LinkedIn'] },
  { when: '9–11 mo before', icon: '🎯', title: 'Take tests & finalize list', sc: 'var(--sky)',
    items: ['Give GRE / English test', 'Cut list to 8–12 (ambitious/target/safe)', 'Line up 3 recommenders early'] },
  { when: '6–8 mo before', icon: '✍️', title: 'Write SOP & essays', sc: 'var(--orange)',
    items: ['Draft SOP → 4–5 revisions minimum', 'Request LORs (give recommenders 4 wks)', 'Order official transcripts / WES if asked'] },
  { when: '4–6 mo before', icon: '📤', title: 'Submit applications', sc: 'var(--orange)',
    items: ['Apply before, not on, the deadline', 'Pay app fees / request fee waivers', 'Send official test scores to each uni'] },
  { when: '2–4 mo before', icon: '🎉', title: 'Decisions & funding', sc: 'var(--green)',
    items: ['Compare admits + assistantship/scholarship offers', 'Accept offer, pay deposit', 'Apply for external scholarships'] },
  { when: '1–2 mo before', icon: '🛂', title: 'Visa & money', sc: 'var(--green)',
    items: ['Get I-20 / CAS / admission letter', 'Book visa appointment ASAP', 'Arrange loan / funds / blocked account'] },
  { when: 'Departure', icon: '✈️', title: 'Fly out', sc: 'var(--accent)',
    items: ['Book flights + student housing', 'Forex card, SIM, insurance', 'Join student groups before you land'] },
];

// ─── UNIVERSITY EXPLORER ─────────────────────────────────────────────────────
// region: 'us' | 'eu' | 'uk' | 'canz'   (drives the filter chips)
const STUDY_UNIS = [
  // ── USA ──
  { name: 'Stanford University', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS Computer Science', rank: '#3', tuition: '$62k/yr', tests: 'GRE optional · TOEFL 100+', deadline: 'Dec', funding: 'RA/TA + Knight-Hennessy', link: 'https://cs.stanford.edu/admissions' },
  { name: 'Carnegie Mellon (CMU)', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS CS / MSML / MCDS', rank: '#1 CS', tuition: '$58k/yr', tests: 'GRE optional · TOEFL 100', deadline: 'Dec', funding: 'Limited aid · strong OPT outcomes', link: 'https://www.cmu.edu/graduate/' },
  { name: 'UC Berkeley', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MEng EECS / MIMS', rank: '#4', tuition: '$60k/yr', tests: 'GRE optional · TOEFL 90', deadline: 'Dec', funding: 'Some fellowships', link: 'https://eecs.berkeley.edu/academics/graduate' },
  { name: 'Georgia Tech', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS CS (also OMSCS online $7k)', rank: '#8', tuition: '$30k/yr (in-state track)', tests: 'GRE optional · TOEFL 100', deadline: 'Jan/Feb', funding: 'OMSCS is very affordable', link: 'https://omscs.gatech.edu/' },
  { name: 'UT Austin', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS CS / MSDS', rank: '#10', tuition: '$25k/yr', tests: 'GRE optional · TOEFL 79', deadline: 'Dec', funding: 'TA-ships available', link: 'https://www.cs.utexas.edu/graduate-programs' },
  { name: 'Univ. of Illinois (UIUC)', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MCS / MS CS', rank: '#9', tuition: '$35k/yr', tests: 'GRE optional · TOEFL 103', deadline: 'Dec', funding: 'Assistantships for thesis MS', link: 'https://cs.illinois.edu/academics/graduate' },
  { name: 'Northeastern University', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS CS (Align — for non-CS too)', rank: '#40', tuition: '$45k/yr', tests: 'GRE optional · TOEFL 100', deadline: 'Rolling', funding: 'Co-op = paid work terms', link: 'https://www.khoury.northeastern.edu/' },
  { name: 'Arizona State (ASU)', flag: '🇺🇸', region: 'us', country: 'USA', program: 'MS CS / Data Science', rank: 'Safe pick', tuition: '$30k/yr', tests: 'GRE optional · TOEFL 80', deadline: 'Rolling', funding: 'Merit scholarships', link: 'https://scai.engineering.asu.edu/' },

  // ── GERMANY / EU ──
  { name: 'TU Munich (TUM)', flag: '🇩🇪', region: 'eu', country: 'Germany', program: 'MS Informatics / Data Eng', rank: '#28', tuition: '≈€0 (₹12k/sem fees)', tests: 'No GRE · IELTS 6.5', deadline: 'May 31', funding: 'DAAD · nearly free', link: 'https://www.cit.tum.de/en/cit/studies/' },
  { name: 'RWTH Aachen', flag: '🇩🇪', region: 'eu', country: 'Germany', program: 'MS CS / Data Science', rank: '#99', tuition: '≈€0 (semester fee only)', tests: 'No GRE · IELTS 6.5', deadline: 'Mar/Sep', funding: 'DAAD · Deutschlandstipendium', link: 'https://www.rwth-aachen.de/' },
  { name: 'ETH Zürich', flag: '🇨🇭', region: 'eu', country: 'Switzerland', program: 'MS CS / Data Science', rank: '#7', tuition: '≈€1.5k/yr', tests: 'GRE not required · IELTS 7', deadline: 'Dec 15', funding: 'ESOP scholarship', link: 'https://inf.ethz.ch/studies.html' },
  { name: 'TU Delft', flag: '🇳🇱', region: 'eu', country: 'Netherlands', program: 'MS CS / Data Science', rank: '#47', tuition: '€21k/yr', tests: 'No GRE · IELTS 6.5', deadline: 'Apr', funding: 'Holland Scholarship · Justus & Louise', link: 'https://www.tudelft.nl/en/education/' },
  { name: 'KTH Royal Institute', flag: '🇸🇪', region: 'eu', country: 'Sweden', program: 'MS CS / Machine Learning', rank: '#73', tuition: '€15k/yr (free for EU)', tests: 'No GRE · IELTS 6.5', deadline: 'Jan 15', funding: 'KTH Scholarship covers tuition', link: 'https://www.kth.se/en/studies/master' },
  { name: 'Erasmus Mundus (multi-EU)', flag: '🇪🇺', region: 'eu', country: 'EU (2+ countries)', program: 'Joint MS (BDMA, IT4BI, etc.)', rank: 'Fully funded', tuition: 'Covered by scholarship', tests: 'Varies · IELTS 6.5', deadline: 'Dec–Jan', funding: '€1,400/mo + travel + tuition', link: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en' },

  // ── UK / IRELAND ──
  { name: 'Univ. of Oxford', flag: '🇬🇧', region: 'uk', country: 'UK', program: 'MSc Computer Science (1 yr)', rank: '#3', tuition: '£40k', tests: 'No GRE · IELTS 7.5', deadline: 'Jan', funding: 'Clarendon · Reach Oxford', link: 'https://www.cs.ox.ac.uk/admissions/' },
  { name: 'Imperial College London', flag: '🇬🇧', region: 'uk', country: 'UK', program: 'MSc Computing / ML & DS (1 yr)', rank: '#2', tuition: '£42k', tests: 'No GRE · IELTS 6.5', deadline: 'Rolling (apply early)', funding: 'President’s Scholarship', link: 'https://www.imperial.ac.uk/computing/' },
  { name: 'Univ. of Edinburgh', flag: '🇬🇧', region: 'uk', country: 'UK', program: 'MSc AI / Data Science (1 yr)', rank: '#27', tuition: '£38k', tests: 'No GRE · IELTS 6.5', deadline: 'Rolling', funding: 'Chevening · GREAT scholarships', link: 'https://www.ed.ac.uk/informatics' },
  { name: 'Trinity College Dublin', flag: '🇮🇪', region: 'uk', country: 'Ireland', program: 'MSc CS / Data Science (1 yr)', rank: '#87', tuition: '€25k', tests: 'No GRE · IELTS 6.5', deadline: 'Rolling', funding: 'Govt of Ireland scholarship · 2-yr stay-back', link: 'https://www.tcd.ie/scss/postgraduate/' },

  // ── CANADA / AUSTRALIA / NZ ──
  { name: 'Univ. of Toronto', flag: '🇨🇦', region: 'canz', country: 'Canada', program: 'MScAC / MSc CS', rank: '#17', tuition: 'CA$35k/yr', tests: 'GRE optional · IELTS 7', deadline: 'Dec', funding: 'Funded thesis MSc · PGWP 3 yr', link: 'https://web.cs.toronto.edu/graduate' },
  { name: 'Univ. of Waterloo', flag: '🇨🇦', region: 'canz', country: 'Canada', program: 'MMath CS / Data Science', rank: '#112', tuition: 'CA$25k/yr', tests: 'GRE optional · IELTS 7', deadline: 'Dec/Jan', funding: 'Co-op + strong funding', link: 'https://uwaterloo.ca/computer-science/' },
  { name: 'Univ. of British Columbia', flag: '🇨🇦', region: 'canz', country: 'Canada', program: 'MDS / MSc CS', rank: '#38', tuition: 'CA$30k/yr', tests: 'GRE optional · IELTS 6.5', deadline: 'Dec', funding: 'Vanier · PGWP 3 yr', link: 'https://www.cs.ubc.ca/students/grad' },
  { name: 'Univ. of Melbourne', flag: '🇦🇺', region: 'canz', country: 'Australia', program: 'Master of CS / Data Science', rank: '#13', tuition: 'A$48k/yr', tests: 'No GRE · IELTS 6.5', deadline: 'Oct/Apr', funding: 'Graduate Research Scholarships · 3-yr PSW', link: 'https://study.unimelb.edu.au/' },
  { name: 'Univ. of Melbourne / UNSW / Monash', flag: '🇦🇺', region: 'canz', country: 'Australia', program: 'Master of IT / Data Science', rank: 'Top 50', tuition: 'A$45k/yr', tests: 'No GRE · IELTS 6.5', deadline: 'Rolling', funding: 'Australia Awards · PR-friendly', link: 'https://www.unsw.edu.au/study' },
];

// ─── SCHOLARSHIPS (for Indian / international students) ───────────────────────
const STUDY_SCHOLARSHIPS = [
  { name: 'DAAD Scholarships', flag: '🇩🇪', where: 'Germany', amount: '€992/mo + tuition + travel', who: 'Masters/PhD, strong academics', deadline: 'Aug–Oct', link: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/' },
  { name: 'Fulbright-Nehru Master’s', flag: '🇺🇸', where: 'USA', amount: 'Full: tuition + stipend + airfare', who: 'Indians, 3 yrs work exp, leadership', deadline: 'May', link: 'https://www.usief.org.in/' },
  { name: 'Chevening Scholarship', flag: '🇬🇧', where: 'UK', amount: 'Fully funded 1-yr Masters', who: '2+ yrs work exp, leadership', deadline: 'Nov', link: 'https://www.chevening.org/' },
  { name: 'Commonwealth Scholarship', flag: '🇬🇧', where: 'UK', amount: 'Tuition + stipend + airfare', who: 'Commonwealth citizens', deadline: 'Oct', link: 'https://cscuk.fcdo.gov.uk/scholarships/' },
  { name: 'Erasmus Mundus Joint Masters', flag: '🇪🇺', where: 'EU (multi-country)', amount: '€1,400/mo + tuition + travel', who: 'Any grad, top academics', deadline: 'Dec–Jan', link: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en' },
  { name: 'Inlaks Shivdasani Scholarship', flag: '🌍', where: 'US / UK / EU', amount: 'Up to $100k', who: 'Indians under 30, top unis', deadline: 'Mar/Apr', link: 'https://www.inlaksfoundation.org/' },
  { name: 'J.N. Tata Endowment', flag: '🌍', where: 'Any country', amount: 'Loan scholarship ₹1–10 L + travel grant', who: 'Indian graduates', deadline: 'Jan–Mar', link: 'https://www.jntataendowment.org/' },
  { name: 'K.C. Mahindra Scholarship', flag: '🌍', where: 'Any country', amount: 'Interest-free loan up to ₹10 L', who: 'Indian postgrad students', deadline: 'Mar–Apr', link: 'https://www.kcmet.org/' },
  { name: 'Knight-Hennessy Scholars', flag: '🇺🇸', where: 'Stanford, USA', amount: 'Fully funded (any grad program)', who: 'Any field, high impact', deadline: 'Oct', link: 'https://knight-hennessy.stanford.edu/' },
  { name: 'Vanier Canada Graduate', flag: '🇨🇦', where: 'Canada', amount: 'CA$50k/yr (mainly PhD)', who: 'Research excellence', deadline: 'Nov', link: 'https://vanier.gc.ca/' },
  { name: 'Australia Awards', flag: '🇦🇺', where: 'Australia', amount: 'Full tuition + living + airfare', who: 'Developing-country citizens', deadline: 'Apr–Jun', link: 'https://www.dfat.gov.au/people-to-people/australia-awards' },
  { name: 'University Assistantships (RA/TA)', flag: '🎓', where: 'US / Canada', amount: 'Tuition waiver + $1.5–2.5k/mo', who: 'Email professors — most common funding', deadline: 'Along with admission', link: 'https://www.reddit.com/r/gradadmissions/' },
];

// ─── EXAMS ───────────────────────────────────────────────────────────────────
const STUDY_EXAMS = [
  { icon: '📐', name: 'GRE General', sc: 'var(--accent)', cost: '~$220 / ₹18k', valid: '5 years', score: '320+ good · 325+ strong (Quant 165+)',
    note: 'Now optional at many US/Canada unis — but a strong score still helps funding. ~2 hr shortened test.', link: 'https://www.ets.org/gre' },
  { icon: '🗣️', name: 'IELTS Academic', sc: 'var(--sky)', cost: '~₹17k', valid: '2 years', score: '6.5–7.0 (no band < 6.0) for most',
    note: 'Most widely accepted (UK/EU/Canada/Australia). Book 2 months ahead — slots fill fast.', link: 'https://www.ielts.org/' },
  { icon: '💻', name: 'TOEFL iBT', sc: 'var(--green)', cost: '~$190 / ₹16k', valid: '2 years', score: '90–100+ for top US programs',
    note: 'Preferred by US universities. Home edition available. Great for accent-heavy speakers.', link: 'https://www.ets.org/toefl' },
  { icon: '🦉', name: 'Duolingo English Test', sc: 'var(--orange)', cost: '~$65 / ₹5k', valid: '2 years', score: '120–130+ accepted widely now',
    note: 'Cheapest + fastest (1 hr, from home, results in 2 days). Check each uni accepts it.', link: 'https://englishtest.duolingo.com/' },
];

// ─── TIPS & TRICKS (SOP, LOR, apps, visa, money) ─────────────────────────────
const STUDY_TIPS = [
  { icon: '✍️', title: 'Statement of Purpose (SOP)', sc: 'var(--accent)', items: [
    'Open with a specific moment, not "Since childhood I loved computers".',
    'Structure: hook → academic background → projects/research → why THIS program & professors → career goal.',
    'Name 2–3 professors whose work you’d join — proves genuine fit.',
    'One tailored paragraph per university. Never mass-send the same SOP.',
    'Show, don’t tell: "built X handling 10k users" beats "I am hardworking".',
    'Keep to 1–2 pages. Get 2 people to proofread. Cut every cliché.'] },
  { icon: '🤝', title: 'Letters of Recommendation (LOR)', sc: 'var(--sky)', items: [
    'Pick recommenders who know your WORK, not just your grades.',
    'Ask 4–6 weeks early; give them your CV, SOP, transcript & bullet points.',
    '1 academic + 1 project/research + 1 professional is a strong mix.',
    'A specific prof beats a famous but distant one.',
    'Draft talking points for them — busy profs appreciate it.'] },
  { icon: '🎯', title: 'Shortlisting Universities', sc: 'var(--orange)', items: [
    'Split into Ambitious (3) / Target (4–5) / Safe (2–3).',
    'Match by research fit + funding, not just ranking.',
    'Check placement/OPT stats & alumni on LinkedIn.',
    'Factor cost of living + post-study work visa length.',
    'Use QS/CSRankings for CS, not generic overall rankings.'] },
  { icon: '💰', title: 'Funding & Money', sc: 'var(--green)', items: [
    'Email professors 3–4 months early for RA/TA positions.',
    'Apply to 6–8 external scholarships — treat it like a job.',
    'Education loans: compare Prodigy, MPOWER (no-collateral) vs SBI/HDFC.',
    'Germany/Nordics ≈ free tuition — best ROI for tight budgets.',
    'Keep proof of funds ready (blocked account €11,904 for Germany).'] },
  { icon: '🛂', title: 'Visa & Documents', sc: 'var(--accent)', items: [
    'US F-1: get I-20 → pay SEVIS → book DS-160 interview ASAP.',
    'UK: CAS letter → prove funds held 28 days → Graduate Route = 2 yr stay.',
    'Germany: Blocked account + admission → student visa (apply early!).',
    'Canada: SDS stream (GIC + upfront tuition) = faster study permit.',
    'Get transcripts, degree certs & WES eval done months in advance.'] },
  { icon: '⚡', title: 'Insider Hacks', sc: 'var(--sky)', items: [
    'Request application-fee waivers — many unis grant them if you ask.',
    'Apply in Round 1 / early — funding drains as rounds progress.',
    'Cold-email PhD students in target labs, not just professors.',
    'A published paper or strong GitHub can outweigh a lower GPA.',
    'Join r/gradadmissions, r/MSCS & Yocket/GradCafe to benchmark profiles.'] },
];

// ─── PLAYBOOK / BLOG & RESOURCES ─────────────────────────────────────────────
const STUDY_RESOURCES = [
  { cat: '📚 Profile & Rankings', links: [
    { t: 'CSRankings — rank CS programs by research', u: 'https://csrankings.org/' },
    { t: 'QS World University Rankings', u: 'https://www.topuniversities.com/' },
    { t: 'GradCafe — real admit/reject results', u: 'https://www.thegradcafe.com/' },
    { t: 'Yocket — profile evaluation & peers', u: 'https://yocket.com/' } ] },
  { cat: '💬 Communities', links: [
    { t: 'r/gradadmissions', u: 'https://www.reddit.com/r/gradadmissions/' },
    { t: 'r/MSCS & r/MSinUS', u: 'https://www.reddit.com/r/MSCS/' },
    { t: 'r/developersIndia (study abroad megathreads)', u: 'https://www.reddit.com/r/developersIndia/' },
    { t: 'The GradCafe Forums', u: 'https://forums.thegradcafe.com/' } ] },
  { cat: '💸 Loans & Scholarships', links: [
    { t: 'Prodigy Finance — no-collateral loans', u: 'https://prodigyfinance.com/' },
    { t: 'MPOWER Financing', u: 'https://www.mpowerfinancing.com/' },
    { t: 'DAAD Scholarship Database', u: 'https://www.daad.de/en/' },
    { t: 'ProFellow scholarship search', u: 'https://www.profellow.com/' } ] },
  { cat: '🛠️ Exam Prep', links: [
    { t: 'GregMat — GRE prep (cheap & great)', u: 'https://www.gregmat.com/' },
    { t: 'Magoosh GRE/IELTS/TOEFL', u: 'https://magoosh.com/' },
    { t: 'IELTS Liz (free lessons)', u: 'https://ieltsliz.com/' },
    { t: 'ETS official GRE PowerPrep', u: 'https://www.ets.org/gre/test-takers/general-test/prepare.html' } ] },
];
