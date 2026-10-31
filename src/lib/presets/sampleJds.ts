import { JdRequirements } from "../schema/jd";

export const stripeFullStackJd: JdRequirements = {
  id: "jd-stripe-fullstack",
  title: "Senior Full-Stack Software Engineer — Platform Infrastructure",
  company: "Stripe",
  location: "San Francisco, CA (or Remote US)",
  sourceUrl: "https://stripe.com/jobs/senior-full-stack-engineer",
  rawText: `About Stripe:
Stripe is a financial infrastructure platform for the internet. Millions of companies—from the world’s largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

About the Role:
We are looking for a Senior Full-Stack Software Engineer to join our Platform Infrastructure team. In this role, you will architect, build, and operate resilient web applications and distributed backend services that power financial workflows for millions of businesses worldwide. You will partner with engineers, designers, and product leaders to deliver high-performance, developer-friendly experiences with uncompromising reliability.

Responsibilities:
- Design, build, and maintain high-throughput web applications and core microservices using TypeScript, React, Next.js, and Node.js.
- Optimize complex database queries, connection pooling, and data schema designs in PostgreSQL.
- Build real-time streaming data pipelines and collaboration systems using Redis and WebSockets.
- Champion engineering best practices, including comprehensive unit/integration test coverage, automated CI/CD pipelines, and observability with metrics and tracing.
- Collaborate with security and infrastructure teams to ensure high availability (99.999% SLA) and PCI compliance across all AWS deployments.

Requirements:
- 5+ years of full-stack software engineering experience building customer-facing web products and distributed backends.
- Expert-level proficiency in TypeScript, React, and modern Node.js environments.
- Deep hands-on experience with relational databases (PostgreSQL or MySQL) and query optimization.
- Proven experience containerizing applications with Docker and deploying to cloud infrastructure (AWS ECS, Kubernetes).
- Strong track record of improving system performance, cutting latency, and maintaining robust CI/CD pipelines.

Nice-to-Haves:
- Experience with Next.js App Router, server-side rendering, and micro-frontend architectures.
- Experience with real-time architectures using WebSockets, Redis Pub/Sub, or Apache Kafka.
- Familiarity with financial transactions, double-entry ledger systems, or billing platforms.`,
  mustHave: [
    "5+ years full-stack engineering experience building web apps and distributed backends",
    "Expert proficiency in TypeScript, React, and modern Node.js",
    "Hands-on experience with PostgreSQL database schema design and query optimization",
    "Experience containerizing applications with Docker and deploying to AWS cloud infrastructure",
    "Proven track record of improving latency, scaling systems, and maintaining CI/CD pipelines",
  ],
  niceToHave: [
    "Experience with Next.js App Router, SSR, and micro-frontends",
    "Real-time streaming architectures using WebSockets, Redis Pub/Sub, or Apache Kafka",
    "Familiarity with financial systems, double-entry ledger design, or PCI compliance",
  ],
  keywords: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "Redis",
    "AWS",
    "Docker",
    "GraphQL",
    "REST API",
    "CI/CD",
    "WebSockets",
    "Microservices",
    "System Design",
    "Kafka",
  ],
  structuredRequirements: [
    {
      id: "req-str-1",
      text: "5+ years full-stack engineering experience building web apps and distributed backends",
      category: "must-have",
      keywords: ["TypeScript", "React", "Node.js", "Distributed Systems"],
    },
    {
      id: "req-str-2",
      text: "Expert proficiency in TypeScript, React, and modern Node.js",
      category: "must-have",
      keywords: ["TypeScript", "React", "Node.js"],
    },
    {
      id: "req-str-3",
      text: "Hands-on experience with PostgreSQL database schema design and query optimization",
      category: "must-have",
      keywords: ["PostgreSQL", "SQL", "Database Optimization"],
    },
    {
      id: "req-str-4",
      text: "Experience containerizing applications with Docker and deploying to AWS cloud infrastructure",
      category: "must-have",
      keywords: ["Docker", "AWS", "CI/CD"],
    },
    {
      id: "req-str-5",
      text: "Experience with Next.js App Router, SSR, and micro-frontends",
      category: "nice-to-have",
      keywords: ["Next.js", "SSR"],
    },
    {
      id: "req-str-6",
      text: "Real-time streaming architectures using WebSockets, Redis Pub/Sub, or Apache Kafka",
      category: "nice-to-have",
      keywords: ["WebSockets", "Redis", "Kafka"],
    },
  ],
  parsedAt: "2026-01-01T00:00:00.000Z",
};

export const googleMlJd: JdRequirements = {
  id: "jd-google-ml",
  title: "Senior Machine Learning Engineer — Applied Generative AI",
  company: "Google",
  location: "Mountain View, CA / Remote",
  sourceUrl: "https://careers.google.com/jobs/senior-ml-engineer-applied-ai",
  rawText: `About Google:
Google's mission is to organize the world’s information and make it universally accessible and useful. Our Applied AI teams build revolutionary technologies that help billions of people navigate information, create content, and build intelligent products.

About the Role:
We are seeking a Senior Machine Learning Engineer to design, fine-tune, and deploy state-of-the-art Generative AI models and LLM reasoning pipelines. You will collaborate closely with research scientists and product teams to bridge fundamental foundational research and production scale, serving low-latency inference to millions of developers worldwide.

Responsibilities:
- Design, train, fine-tune, and evaluate large language models (LLMs) and diffusion systems using PyTorch and JAX.
- Implement efficient parameter adaptation techniques (LoRA, QLoRA, distillation) to optimize domain performance and compute footprint.
- Build production-grade high-throughput, low-latency inference serving engines using vLLM, Ray Serve, and FastAPI on GPU/TPU clusters.
- Design retrieval-augmented generation (RAG) architectures with hybrid vector search, chunking algorithms, and automated hallucination evaluation.
- Establish rigorous MLOps practices, including continuous model evaluation, automated prompt testing, and data drift detection.

Requirements:
- Master’s or PhD degree in Computer Science, Machine Learning, Applied Mathematics, or equivalent practical experience.
- 4+ years of industry experience developing and shipping machine learning systems to production.
- Strong proficiency in Python and deep learning frameworks (PyTorch or TensorFlow/JAX).
- Demonstrated experience with Large Language Models, prompt tuning, RAG architectures, and LangChain/LlamaIndex.
- Hands-on experience optimizing model inference speed, memory bandwidth, and GPU utilization (e.g. vLLM, TensorRT-LLM, Ray).
- Solid software engineering fundamentals: REST APIs, Docker, SQL, and distributed system design.

Nice-to-Haves:
- Experience with vector databases (Qdrant, Pinecone, Milvus) and dense embedding indexing.
- Experience with automated LLM evaluation frameworks (Ragas, TruLens, MLflow).
- Publications in top AI/ML venues (NeurIPS, ICML, ICLR, CVPR) or recognized open-source contributions.`,
  mustHave: [
    "4+ years of industry experience developing and deploying machine learning systems into production",
    "Expert proficiency in Python and deep learning frameworks (PyTorch or TensorFlow)",
    "Demonstrated experience with Large Language Models (LLMs), RAG architectures, and LangChain",
    "Hands-on experience with low-latency model serving engines (vLLM, Ray Serve, FastAPI)",
    "Solid software engineering fundamentals including Docker, SQL, and distributed systems",
  ],
  niceToHave: [
    "Experience with vector databases (Qdrant, Pinecone, Milvus) and dense semantic indexing",
    "Experience with automated LLM evaluation frameworks (Ragas, TruLens, MLflow)",
    "Publications in top AI venues (NeurIPS, ICML) or open-source ML contributions",
  ],
  keywords: [
    "Python",
    "PyTorch",
    "Machine Learning",
    "Deep Learning",
    "LLM",
    "RAG",
    "LangChain",
    "FastAPI",
    "Docker",
    "SQL",
    "Scikit-learn",
    "Ray Serve",
    "vLLM",
    "Vector DB",
    "Qdrant",
    "MLOps",
    "Hugging Face",
    "LoRA",
  ],
  structuredRequirements: [
    {
      id: "req-goog-1",
      text: "4+ years of industry experience developing and deploying machine learning systems into production",
      category: "must-have",
      keywords: ["Machine Learning", "Deep Learning", "Production"],
    },
    {
      id: "req-goog-2",
      text: "Expert proficiency in Python and deep learning frameworks (PyTorch or TensorFlow)",
      category: "must-have",
      keywords: ["Python", "PyTorch"],
    },
    {
      id: "req-goog-3",
      text: "Demonstrated experience with Large Language Models (LLMs), RAG architectures, and LangChain",
      category: "must-have",
      keywords: ["LLM", "RAG", "LangChain"],
    },
    {
      id: "req-goog-4",
      text: "Hands-on experience with low-latency model serving engines (vLLM, Ray Serve, FastAPI)",
      category: "must-have",
      keywords: ["vLLM", "Ray Serve", "FastAPI"],
    },
    {
      id: "req-goog-5",
      text: "Experience with vector databases (Qdrant, Pinecone, Milvus) and dense semantic indexing",
      category: "nice-to-have",
      keywords: ["Vector DB", "Qdrant"],
    },
    {
      id: "req-goog-6",
      text: "Experience with automated LLM evaluation frameworks (Ragas, TruLens, MLflow)",
      category: "nice-to-have",
      keywords: ["MLOps", "MLflow"],
    },
  ],
  parsedAt: "2026-01-01T00:00:00.000Z",
};

export const airbnbProductManagerJd: JdRequirements = {
  id: "jd-airbnb-tpm",
  title: "Senior Technical Product Manager — Core Platform & Infrastructure",
  company: "Airbnb",
  location: "San Francisco, CA / Remote",
  sourceUrl: "https://careers.airbnb.com/positions/senior-tpm-platform",
  rawText: `About Airbnb:
Airbnb was born in 2007 when two Hosts welcomed three guests to their San Francisco home, and has since grown to over 5 million Hosts who have welcomed over 1.5 billion guest arrivals across almost every country in the world.

About the Role:
We are seeking an experienced Senior Technical Product Manager to lead our Core Platform & Infrastructure product portfolio. You will define the roadmap for our developer experience, service mesh, API gateway, and cloud infrastructure platforms that empower thousands of engineers to build and deploy reliable services at global scale.

Responsibilities:
- Define product vision, strategy, and quarterly roadmap for developer platforms, API contracts, and distributed infrastructure services.
- Partner closely with engineering leaders to evaluate technical trade-offs, system architecture, SLA targets, and multi-region resilience.
- Author clear, actionable Technical PRDs, user stories, and acceptance criteria in collaboration with cross-functional partners.
- Build and analyze product metrics using SQL, Looker, and Amplitude to evaluate platform adoption, reliability, and developer velocity.
- Conduct continuous user research and developer interviews to uncover friction points and identify high-leverage platform enhancements.

Requirements:
- 5+ years of Technical Product Management experience managing platform, infrastructure, developer tooling, or cloud services.
- Technical background (degree in Computer Science, engineering, or equivalent hands-on experience reading code and system designs).
- Strong proficiency in SQL and data analytics platforms (Looker, Amplitude, Tableau) to drive quantitative decision-making.
- Deep expertise in Agile/Scrum processes, sprint planning, and backlog management in tools like Jira or Linear.
- Proven experience leading large-scale cross-functional initiatives across distributed teams with zero-downtime requirements.

Nice-to-Haves:
- Prior experience as a software engineer or DevOps/cloud engineer.
- Direct experience with microservices architectures, REST APIs, GraphQL, and AWS cloud services.
- Experience running rigorous A/B experiments or developer productivity measurement frameworks.`,
  mustHave: [
    "5+ years of Technical Product Management experience managing platform, infrastructure, or developer tools",
    "Technical background with ability to evaluate system designs, APIs, and architectural trade-offs",
    "Proficiency in SQL and quantitative analytics (Looker, Amplitude) to guide product roadmaps",
    "Deep expertise in Agile/Scrum processes, Technical PRD authoring, and customer discovery",
    "Proven track record of driving cross-functional initiatives for high-availability systems",
  ],
  niceToHave: [
    "Prior experience as a software engineer or cloud infrastructure architect",
    "Direct experience with microservices, REST APIs, and AWS cloud environments",
    "Experience running A/B experiments and developer productivity measurement programs",
  ],
  keywords: [
    "Product Management",
    "Technical PRD",
    "System Design",
    "SQL",
    "A/B Testing",
    "User Research",
    "Roadmapping",
    "Agile",
    "Scrum",
    "REST APIs",
    "Microservices",
    "Cloud Architecture",
    "AWS",
    "Amplitude",
    "Jira",
    "Analytics",
  ],
  structuredRequirements: [
    {
      id: "req-ab-1",
      text: "5+ years of Technical Product Management experience managing platform, infrastructure, or developer tools",
      category: "must-have",
      keywords: ["Product Management", "Roadmapping"],
    },
    {
      id: "req-ab-2",
      text: "Technical background with ability to evaluate system designs, APIs, and architectural trade-offs",
      category: "must-have",
      keywords: ["System Design", "REST APIs", "Microservices"],
    },
    {
      id: "req-ab-3",
      text: "Proficiency in SQL and quantitative analytics (Looker, Amplitude) to guide product roadmaps",
      category: "must-have",
      keywords: ["SQL", "Amplitude", "Analytics"],
    },
    {
      id: "req-ab-4",
      text: "Deep expertise in Agile/Scrum processes, Technical PRD authoring, and customer discovery",
      category: "must-have",
      keywords: ["Agile", "Scrum", "Technical PRD", "User Research"],
    },
    {
      id: "req-ab-5",
      text: "Direct experience with microservices, REST APIs, and AWS cloud environments",
      category: "nice-to-have",
      keywords: ["Microservices", "REST APIs", "AWS"],
    },
    {
      id: "req-ab-6",
      text: "Experience running A/B experiments and developer productivity measurement programs",
      category: "nice-to-have",
      keywords: ["A/B Testing"],
    },
  ],
  parsedAt: "2026-01-01T00:00:00.000Z",
};

export const sampleJds: JdRequirements[] = [
  stripeFullStackJd,
  googleMlJd,
  airbnbProductManagerJd,
];

export const sampleJdsMap: Record<string, JdRequirements> = {
  "stripe-fullstack": stripeFullStackJd,
  "google-ml": googleMlJd,
  "airbnb-tpm": airbnbProductManagerJd,
};
