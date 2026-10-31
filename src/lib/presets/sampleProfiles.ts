import { ResumeDocument } from "../schema/resume";

export const seniorFullStackProfile: ResumeDocument = {
  id: "profile-fullstack-01",
  title: "Alex Morgan — Senior Full-Stack Engineer",
  targetRole: "Senior Full-Stack Engineer",
  basics: {
    name: "Alex Morgan",
    headline: "Senior Full-Stack Engineer | Distributed Systems & React Architecture",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    website: "https://alexmorgan.dev",
    linkedin: "https://linkedin.com/in/alexmorgan-dev",
    github: "https://github.com/alexmorgan",
    summary:
      "Full-Stack Engineer with 7+ years of experience architecting high-throughput distributed web systems, real-time collaboration engines, and resilient cloud services. Proven track record reducing API latency by 42% and scaling SaaS platforms from 10k to 500k DAU using Next.js, Node.js, TypeScript, PostgreSQL, and AWS.",
    profiles: [
      {
        network: "GitHub",
        username: "alexmorgan",
        url: "https://github.com/alexmorgan",
      },
      {
        network: "LinkedIn",
        username: "alexmorgan-dev",
        url: "https://linkedin.com/in/alexmorgan-dev",
      },
    ],
  },
  experience: [
    {
      id: "exp-fs-1",
      company: "Apex Cloud Technologies",
      position: "Senior Full-Stack Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      description: "Led core infrastructure and web platform engineering for multi-tenant analytics SaaS.",
      bullets: [
        {
          id: "b-fs-101",
          text: "Spearheaded migration of legacy REST API to Next.js App Router and Node.js microservices, cutting p95 response latency from 320ms to 95ms for 450k active tenants.",
        },
        {
          id: "b-fs-102",
          text: "Engineered real-time collaboration canvas using WebSockets and Redis Pub/Sub, boosting multi-user concurrent session capacity by 3.5x with zero dropped frames.",
        },
        {
          id: "b-fs-103",
          text: "Architected automated CI/CD deployment pipelines on AWS ECS & Docker, shrinking release cycle time from 45 minutes to 6 minutes while enforcing 94% test coverage.",
        },
        {
          id: "b-fs-104",
          text: "Optimized complex PostgreSQL analytical queries and database connection pools, eliminating query bottlenecks and decreasing AWS RDS compute spend by 28%.",
        },
      ],
      technologies: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS ECS"],
    },
    {
      id: "exp-fs-2",
      company: "Stratum Data Solutions",
      position: "Full-Stack Software Engineer",
      location: "Austin, TX",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      description: "Built customer-facing data visualization dashboards and event ingestion pipelines.",
      bullets: [
        {
          id: "b-fs-201",
          text: "Developed responsive enterprise dashboard using React, TypeScript, and Tailwind CSS, increasing enterprise user NPS from 48 to 72 within 6 months.",
        },
        {
          id: "b-fs-202",
          text: "Implemented Apache Kafka event streaming consumers in Go and Node.js, reliably processing 15M+ daily audit log events with sub-second ingestion lag.",
        },
        {
          id: "b-fs-203",
          text: "Restructured authentication workflow to support SAML 2.0 and OAuth2 SSO, unblocking $1.2M in annual recurring enterprise contract deals.",
        },
      ],
      technologies: ["React", "TypeScript", "Node.js", "GraphQL", "PostgreSQL", "Kafka", "Docker"],
    },
    {
      id: "exp-fs-3",
      company: "Vanguard Interactive",
      position: "Frontend Software Engineer",
      location: "San Jose, CA",
      startDate: "2017-08",
      endDate: "2019-05",
      current: false,
      description: "Engineered performant web applications and component design systems.",
      bullets: [
        {
          id: "b-fs-301",
          text: "Built reusable React/TypeScript design system adopted across 8 engineering teams, reducing front-end bug tickets by 35% and accelerating feature delivery.",
        },
        {
          id: "b-fs-302",
          text: "Audited and refactored core rendering pipeline to improve Google Lighthouse performance score from 61 to 96 across all mobile devices.",
        },
      ],
      technologies: ["JavaScript", "TypeScript", "React", "Redux", "Webpack", "CSS Modules"],
    },
  ],
  education: [
    {
      id: "edu-fs-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2013-08",
      endDate: "2017-05",
      current: false,
      gpa: "3.85 / 4.0",
      highlights: [
        { id: "edu-fs-h1", text: "Dean's Honor List (6 consecutive semesters)" },
        { id: "edu-fs-h2", text: "Coursework: Distributed Systems, Operating Systems, Database Systems, Algorithms" },
      ],
    },
  ],
  projects: [
    {
      id: "proj-fs-1",
      name: "HyperGraph Engine",
      description: "High-performance in-memory graph query engine with WebAssembly acceleration.",
      role: "Creator & Maintainer",
      url: "https://hypergraph.dev",
      githubUrl: "https://github.com/alexmorgan/hypergraph",
      startDate: "2023-01",
      endDate: "Present",
      bullets: [
        {
          id: "pb-fs-101",
          text: "Designed in-memory indexing algorithms in TypeScript and Rust/Wasm, achieving 400k query operations per second in client browsers.",
        },
        {
          id: "pb-fs-102",
          text: "Grew open-source community to 2.4k GitHub stars with 18 outside contributors and 45k monthly npm downloads.",
        },
      ],
      technologies: ["TypeScript", "Rust", "WebAssembly", "Node.js", "Next.js"],
    },
    {
      id: "proj-fs-2",
      name: "PulseQueue Distributed Worker",
      description: "Fault-tolerant background task processing queue built with Redis and PostgreSQL.",
      role: "Lead Architect",
      githubUrl: "https://github.com/alexmorgan/pulse-queue",
      startDate: "2021-04",
      endDate: "2021-11",
      bullets: [
        {
          id: "pb-fs-201",
          text: "Engineered atomic queue scheduling with exponential backoff retries, dead-letter recovery, and Prometheus metrics monitoring.",
        },
      ],
      technologies: ["Node.js", "TypeScript", "Redis", "PostgreSQL", "Docker"],
    },
  ],
  skills: [
    {
      id: "sk-fs-1",
      category: "Languages & Core",
      skills: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML5", "CSS3"],
    },
    {
      id: "sk-fs-2",
      category: "Frameworks & Frontend",
      skills: ["React", "Next.js", "Node.js", "Express", "Tailwind CSS", "Redux", "GraphQL"],
    },
    {
      id: "sk-fs-3",
      category: "Databases & Storage",
      skills: ["PostgreSQL", "Redis", "MongoDB", "Elasticsearch", "Prisma"],
    },
    {
      id: "sk-fs-4",
      category: "DevOps & Cloud",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Git", "Linux"],
    },
  ],
  certifications: [
    {
      id: "cert-fs-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2023-06",
    },
  ],
  layout: {
    theme: "modern",
    fontFamily: "inter",
    fontScale: 1.0,
    margins: "normal",
    autoFitOnePage: false,
    sectionOrder: [
      "summary",
      "experience",
      "projects",
      "skills",
      "education",
      "certifications",
    ],
    sectionVisibility: {
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: true,
    },
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const dataScientistMlProfile: ResumeDocument = {
  id: "profile-ml-02",
  title: "Priya Sharma — Lead Data Scientist & ML Engineer",
  targetRole: "Lead Data Scientist & ML Engineer",
  basics: {
    name: "Dr. Priya Sharma",
    headline: "Lead Machine Learning Engineer | Generative AI, PyTorch & Distributed Inference",
    email: "priya.sharma@example.com",
    phone: "+1 (555) 456-7890",
    location: "Seattle, WA",
    website: "https://priyasharma.ai",
    linkedin: "https://linkedin.com/in/priyasharma-ml",
    github: "https://github.com/priyasharma-ai",
    summary:
      "Machine Learning Engineer & Data Scientist with 6+ years of production experience designing, training, and deploying deep learning models, LLM pipelines, and high-throughput inference engines. Specialized in PyTorch, Scikit-learn, LangChain, FastAPI, and distributed training on AWS/GCP, with a track record of saving $210k annually in cloud compute.",
    profiles: [
      {
        network: "GitHub",
        username: "priyasharma-ai",
        url: "https://github.com/priyasharma-ai",
      },
      {
        network: "LinkedIn",
        username: "priyasharma-ml",
        url: "https://linkedin.com/in/priyasharma-ml",
      },
    ],
  },
  experience: [
    {
      id: "exp-ml-1",
      company: "Nexus AI Labs",
      position: "Lead Machine Learning Engineer",
      location: "Seattle, WA",
      startDate: "2022-05",
      endDate: "Present",
      current: true,
      description: "Spearheaded enterprise LLM customization and low-latency inference architecture.",
      bullets: [
        {
          id: "b-ml-101",
          text: "Fine-tuned open-source foundation models (Llama 3, Mistral 7B) using LoRA and QLoRA for enterprise domain search, boosting factual retrieval accuracy by 34% and cutting external API costs by $18k/month.",
        },
        {
          id: "b-ml-102",
          text: "Architected distributed model serving infrastructure with vLLM, Ray Serve, and FastAPI on NVIDIA A100 GPU clusters, serving 14M daily requests with p99 latency <38ms.",
        },
        {
          id: "b-ml-103",
          text: "Engineered automated continuous evaluation harness using LangChain and Ragas to detect prompt drift and hallucination risks prior to production rollouts.",
        },
        {
          id: "b-ml-104",
          text: "Implemented dense vector indexing with Qdrant and hybrid BM25 retrieval across 25M enterprise documentation vectors with 99.9% query uptime.",
        },
      ],
      technologies: ["Python", "PyTorch", "LangChain", "FastAPI", "Ray Serve", "vLLM", "Qdrant", "Docker", "AWS"],
    },
    {
      id: "exp-ml-2",
      company: "DeepStream Analytics",
      position: "Senior Data Scientist",
      location: "San Francisco, CA",
      startDate: "2019-07",
      endDate: "2022-04",
      current: false,
      description: "Developed predictive machine learning models and real-time streaming feature stores.",
      bullets: [
        {
          id: "b-ml-201",
          text: "Trained customer churn and lifetime value (LTV) gradient-boosted ensembles using Scikit-learn and XGBoost, identifying $3.4M in at-risk ARR for automated re-engagement.",
        },
        {
          id: "b-ml-202",
          text: "Built real-time ML feature store on Feast and Snowflake with Apache Kafka event ingestion, slashing online/offline feature skew incidents by 68%.",
        },
        {
          id: "b-ml-203",
          text: "Published 3 end-to-end A/B test analysis frameworks in SQL and Python that accelerated product experimentation cycles from bi-weekly to continuous daily rollouts.",
        },
      ],
      technologies: ["Python", "Scikit-learn", "XGBoost", "SQL", "Snowflake", "Kafka", "MLflow", "Docker"],
    },
    {
      id: "exp-ml-3",
      company: "Cognitive Vision Labs",
      position: "Machine Learning Engineer",
      location: "San Jose, CA",
      startDate: "2018-01",
      endDate: "2019-06",
      current: false,
      description: "Developed deep learning computer vision algorithms for defect inspection.",
      bullets: [
        {
          id: "b-ml-301",
          text: "Implemented convolutional neural networks in PyTorch for high-speed anomaly detection on production lines, dropping defect escape rate from 4.8% to 0.5%.",
        },
        {
          id: "b-ml-302",
          text: "Packaged ML models as containerized REST microservices on AWS SageMaker with automated auto-scaling based on batch image throughput.",
        },
      ],
      technologies: ["Python", "PyTorch", "OpenCV", "AWS SageMaker", "Docker", "Linux"],
    },
  ],
  education: [
    {
      id: "edu-ml-1",
      institution: "University of Washington",
      degree: "Master of Science",
      field: "Computer Science (Machine Learning)",
      location: "Seattle, WA",
      startDate: "2016-09",
      endDate: "2018-06",
      current: false,
      gpa: "3.92 / 4.0",
      highlights: [
        { id: "edu-ml-h1", text: "Graduate Research Assistant in Natural Language Processing & Distributed Systems" },
        { id: "edu-ml-h2", text: "Master's Thesis: Low-Rank Parameter Adaptation in Deep Transformer Networks" },
      ],
    },
    {
      id: "edu-ml-2",
      institution: "Georgia Institute of Technology",
      degree: "Bachelor of Science",
      field: "Applied Mathematics & Computer Science",
      location: "Atlanta, GA",
      startDate: "2012-08",
      endDate: "2016-05",
      current: false,
      gpa: "3.88 / 4.0",
      highlights: [
        { id: "edu-ml-h3", text: "Summa Cum Laude, President's Scholar" },
      ],
    },
  ],
  projects: [
    {
      id: "proj-ml-1",
      name: "RAGFlow Engine",
      description: "High-throughput modular Retrieval-Augmented Generation framework with hybrid vector search.",
      role: "Creator & Maintainer",
      url: "https://ragflow.ai",
      githubUrl: "https://github.com/priyasharma-ai/ragflow",
      startDate: "2023-03",
      endDate: "Present",
      bullets: [
        {
          id: "pb-ml-101",
          text: "Engineered async chunking and re-ranking pipeline handling 1,500 docs/min with automatic hallucination guardrails.",
        },
        {
          id: "pb-ml-102",
          text: "Gained 3.1k GitHub stars and deployed by 12 tech startups for internal documentation assistant bots.",
        },
      ],
      technologies: ["Python", "PyTorch", "LangChain", "FastAPI", "Qdrant", "Hugging Face"],
    },
    {
      id: "proj-ml-2",
      name: "DeepAnomaly TimeSeries",
      description: "Unsupervised anomaly detection toolkit for financial transaction streams.",
      role: "Lead Author",
      githubUrl: "https://github.com/priyasharma-ai/deep-anomaly",
      startDate: "2021-08",
      endDate: "2022-03",
      bullets: [
        {
          id: "pb-ml-201",
          text: "Designed variational autoencoder (VAE) architecture with 96.2% precision on benchmark financial fraud telemetry.",
        },
      ],
      technologies: ["Python", "PyTorch", "Scikit-learn", "NumPy", "Pandas"],
    },
  ],
  skills: [
    {
      id: "sk-ml-1",
      category: "Machine Learning & Deep Learning",
      skills: ["Python", "PyTorch", "Scikit-learn", "TensorFlow", "Hugging Face", "XGBoost", "NumPy", "Pandas"],
    },
    {
      id: "sk-ml-2",
      category: "LLM & Generative AI",
      skills: ["LangChain", "LlamaIndex", "RAG", "LoRA", "vLLM", "Prompt Engineering", "Fine-Tuning", "Vector DBs"],
    },
    {
      id: "sk-ml-3",
      category: "Backend & ML Serving",
      skills: ["FastAPI", "SQL", "Docker", "Ray Serve", "Redis", "Kafka", "REST APIs", "PostgreSQL"],
    },
    {
      id: "sk-ml-4",
      category: "Cloud, MLOps & Data",
      skills: ["AWS SageMaker", "Snowflake", "MLflow", "Weights & Biases", "Qdrant", "Git", "Linux", "CI/CD"],
    },
  ],
  certifications: [
    {
      id: "cert-ml-1",
      name: "TensorFlow Developer Certificate",
      issuer: "Google",
      date: "2021-04",
    },
    {
      id: "cert-ml-2",
      name: "AWS Certified Machine Learning – Specialty",
      issuer: "Amazon Web Services",
      date: "2023-01",
    },
  ],
  layout: {
    theme: "tech",
    fontFamily: "roboto",
    fontScale: 1.0,
    margins: "compact",
    autoFitOnePage: false,
    sectionOrder: [
      "summary",
      "experience",
      "skills",
      "projects",
      "education",
      "certifications",
    ],
    sectionVisibility: {
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: true,
    },
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const technicalProductManagerProfile: ResumeDocument = {
  id: "profile-tpm-03",
  title: "Marcus Vance — Technical Product Manager",
  targetRole: "Principal Technical Product Manager",
  basics: {
    name: "Marcus Vance",
    headline: "Principal Technical Product Manager | Developer Platforms & Distributed Cloud Services",
    email: "marcus.vance@example.com",
    phone: "+1 (555) 789-0123",
    location: "New York, NY",
    website: "https://marcusvance.io",
    linkedin: "https://linkedin.com/in/marcusvance-pm",
    github: "https://github.com/marcusvance",
    summary:
      "Technical Product Leader with 8+ years driving roadmaps for developer platforms, API gateways, and payment infrastructure generating $28M+ in ARR. Combines software engineering roots with user-centric discovery, data-driven A/B testing (SQL, Amplitude), and Agile execution across multi-disciplinary squads.",
    profiles: [
      {
        network: "LinkedIn",
        username: "marcusvance-pm",
        url: "https://linkedin.com/in/marcusvance-pm",
      },
      {
        network: "GitHub",
        username: "marcusvance",
        url: "https://github.com/marcusvance",
      },
    ],
  },
  experience: [
    {
      id: "exp-pm-1",
      company: "CloudScale Systems",
      position: "Principal Technical Product Manager",
      location: "New York, NY",
      startDate: "2022-04",
      endDate: "Present",
      current: true,
      description: "Own product vision, roadmap, and execution for API Gateway and Developer Platform products.",
      bullets: [
        {
          id: "b-pm-101",
          text: "Spearheaded global developer platform modernization generating $28M ARR, growing monthly active API developers by 115% year-over-year.",
        },
        {
          id: "b-pm-102",
          text: "Partnered with 6 distributed engineering squads to ship zero-downtime multi-region failover, decreasing customer SLA incident credits by 78%.",
        },
        {
          id: "b-pm-103",
          text: "Authored 30+ technical PRDs, architecture decision records (ADRs), and user journey maps incorporating qualitative feedback from 85 enterprise customer interviews.",
        },
        {
          id: "b-pm-104",
          text: "Instituted automated usage-tier metering that reduced customer billing disputes by 41% and unlocked $3.2M in expansion ARR.",
        },
      ],
      technologies: ["REST APIs", "System Design", "Microservices", "SQL", "Agile", "AWS", "Jira", "Amplitude"],
    },
    {
      id: "exp-pm-2",
      company: "Horizon Financial Technologies",
      position: "Senior Product Manager, Core Payments",
      location: "San Francisco, CA",
      startDate: "2019-05",
      endDate: "2022-03",
      current: false,
      description: "Led core transaction processing, checkout optimization, and payment partner integrations.",
      bullets: [
        {
          id: "b-pm-201",
          text: "Led end-to-end launch of instant payout engine processing $1.8B in annual gross transaction volume across North America and EU.",
        },
        {
          id: "b-pm-202",
          text: "Designed comprehensive A/B experimentation program in collaboration with data science, executing 40+ iterative checkout tests that lifted conversion by 14.2%.",
        },
        {
          id: "b-pm-203",
          text: "Built SQL and Looker self-serve dashboards used daily by 200+ cross-functional stakeholders to monitor funnel drop-off and gateway error rates.",
        },
      ],
      technologies: ["SQL", "A/B Testing", "Looker", "Stripe API", "Payment Gateways", "Mixpanel", "Scrum"],
    },
    {
      id: "exp-pm-3",
      company: "Kinetix Software",
      position: "Technical Product Manager",
      location: "Boston, MA",
      startDate: "2016-10",
      endDate: "2019-04",
      current: false,
      description: "Managed public REST APIs, webhooks, and third-party developer integrations.",
      bullets: [
        {
          id: "b-pm-301",
          text: "Revamped public API documentation and interactive SDKs, reducing developer onboarding time from 3 weeks to under 2 days.",
        },
        {
          id: "b-pm-302",
          text: "Championed Agile and Scrum sprint velocity improvements across 4 engineering teams, increasing sprint commitment delivery predictability by 26%.",
        },
      ],
      technologies: ["REST APIs", "Webhooks", "Postman", "Swagger", "Jira", "Agile", "Git"],
    },
  ],
  education: [
    {
      id: "edu-pm-1",
      institution: "Cornell University",
      degree: "Bachelor of Science",
      field: "Information Science & Systems Engineering",
      location: "Ithaca, NY",
      startDate: "2012-08",
      endDate: "2016-05",
      current: false,
      gpa: "3.82 / 4.0",
      highlights: [
        { id: "edu-pm-h1", text: "President of Engineering Management Society" },
        { id: "edu-pm-h2", text: "Coursework: Database Systems, Systems Architecture, Human-Computer Interaction, Statistics" },
      ],
    },
  ],
  projects: [
    {
      id: "proj-pm-1",
      name: "OpenSpec PRD Framework",
      description: "Standardized framework and interactive tool for technical PRDs and API contract modeling.",
      role: "Creator",
      url: "https://openspec.dev",
      githubUrl: "https://github.com/marcusvance/openspec",
      startDate: "2023-02",
      endDate: "Present",
      bullets: [
        {
          id: "pb-pm-101",
          text: "Designed modular PRD template library adopted by 2,000+ tech product managers across the tech industry.",
        },
      ],
      technologies: ["Next.js", "TypeScript", "Markdown", "Tailwind CSS"],
    },
    {
      id: "proj-pm-2",
      name: "MetricPulse Analytics",
      description: "Self-hosted cohort retention analysis dashboard for SaaS teams.",
      role: "Co-Creator",
      githubUrl: "https://github.com/marcusvance/metric-pulse",
      startDate: "2021-06",
      endDate: "2021-12",
      bullets: [
        {
          id: "pb-pm-201",
          text: "Implemented SQL query builder and retention curve visualizer with zero external dependencies.",
        },
      ],
      technologies: ["PostgreSQL", "SQL", "Node.js", "React"],
    },
  ],
  skills: [
    {
      id: "sk-pm-1",
      category: "Product Management & Strategy",
      skills: ["Product Strategy", "Technical PRDs", "Roadmapping", "Agile/Scrum", "User Research", "Go-To-Market", "Customer Discovery"],
    },
    {
      id: "sk-pm-2",
      category: "Technical & Architecture",
      skills: ["System Design", "REST APIs", "Microservices", "Cloud Architecture", "Data Modeling", "Webhooks", "Security"],
    },
    {
      id: "sk-pm-3",
      category: "Data & Experimentation",
      skills: ["SQL", "A/B Testing", "Amplitude", "Mixpanel", "Looker", "Product Analytics", "Funnel Optimization"],
    },
    {
      id: "sk-pm-4",
      category: "Tools & Collaboration",
      skills: ["Jira", "Linear", "Notion", "Figma", "Postman", "Git", "Tableau"],
    },
  ],
  certifications: [
    {
      id: "cert-pm-1",
      name: "Certified Scrum Product Owner (CSPO)",
      issuer: "Scrum Alliance",
      date: "2020-03",
    },
    {
      id: "cert-pm-2",
      name: "Pragmatic Institute Certified (PMC-III)",
      issuer: "Pragmatic Institute",
      date: "2022-08",
    },
  ],
  layout: {
    theme: "executive",
    fontFamily: "garamond",
    fontScale: 1.0,
    margins: "normal",
    autoFitOnePage: false,
    sectionOrder: [
      "summary",
      "experience",
      "skills",
      "projects",
      "education",
      "certifications",
    ],
    sectionVisibility: {
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: true,
    },
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const sampleProfiles: ResumeDocument[] = [
  seniorFullStackProfile,
  dataScientistMlProfile,
  technicalProductManagerProfile,
];

export const sampleProfilesMap: Record<string, ResumeDocument> = {
  "senior-fullstack": seniorFullStackProfile,
  "data-scientist-ml": dataScientistMlProfile,
  "technical-product-manager": technicalProductManagerProfile,
};
