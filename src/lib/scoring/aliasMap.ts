import { ALL_SKILLS } from "./skillTaxonomy";

/**
 * Raw alias mappings: canonical skill name -> array of aliases / variations
 */
export const RAW_ALIAS_DEFINITIONS: Record<string, string[]> = {
  // Languages
  JavaScript: ["js", "javascript", "ecmascript", "es6", "es6+", "vanilla js", "modern javascript"],
  TypeScript: ["ts", "typescript", "typed javascript"],
  Python: ["python", "py", "python3", "python 3", "py3"],
  "C++": ["cpp", "c++", "c plus plus", "c/c++"],
  C: ["c language", "ansi c"],
  "C#": ["csharp", "c#", "c sharp", "c-sharp"],
  Go: ["golang", "go language", "go-lang"],
  Rust: ["rustlang", "rust-lang", "rust"],
  Ruby: ["ruby", "ruby-lang"],
  PHP: ["php", "php7", "php8"],
  Swift: ["swift", "swiftui", "swift-lang"],
  Kotlin: ["kotlin", "kt"],
  Scala: ["scala"],
  R: ["r language", "r-lang", "r programming"],
  Dart: ["dart", "dartlang"],
  Elixir: ["elixir", "mix"],
  Clojure: ["clojure", "clj"],
  Haskell: ["haskell", "ghc"],
  Shell: ["shell", "sh", "shell script", "shell scripting"],
  Bash: ["bash", "bash scripting", "bash script", "bourne again shell"],
  PowerShell: ["powershell", "ps", "pwsh"],
  SQL: ["sql", "structured query language", "ansi sql"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3"],
  Solidity: ["solidity", "smart contracts"],

  // Frontend
  React: ["react", "react.js", "reactjs", "react js"],
  "Next.js": ["next.js", "nextjs", "next js", "next"],
  "Vue.js": ["vue", "vue.js", "vuejs", "vue 3", "vue 2"],
  "Nuxt.js": ["nuxt", "nuxt.js", "nuxtjs", "nuxt 3"],
  Angular: ["angular", "angular.js", "angularjs", "angular 2+"],
  Svelte: ["svelte", "svelte.js", "sveltejs"],
  SvelteKit: ["sveltekit", "svelte-kit"],
  Remix: ["remix", "remix.run"],
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind-css"],
  Bootstrap: ["bootstrap", "bootstrap 5"],
  "Material UI": ["material ui", "mui", "material-ui"],
  "Chakra UI": ["chakra", "chakra ui", "chakra-ui"],
  "Shadcn UI": ["shadcn", "shadcn/ui", "shadcn ui"],
  "Radix UI": ["radix", "radix ui", "radix-ui"],
  Redux: ["redux", "reduxjs"],
  "Redux Toolkit": ["redux toolkit", "rtk"],
  Zustand: ["zustand"],
  "TanStack Query": ["tanstack query", "tanstack/react-query"],
  "React Query": ["react query", "react-query"],
  "Three.js": ["three.js", "threejs", "three js"],
  "D3.js": ["d3", "d3.js", "d3js"],
  WebSockets: ["websockets", "websocket", "ws", "socket.io"],
  WebRTC: ["webrtc"],
  "Progressive Web Apps": ["pwa", "progressive web app", "progressive web apps"],
  "Responsive Design": ["responsive design", "mobile responsive", "responsive web design", "mobile-first"],
  "Web Accessibility": ["a11y", "accessibility", "web accessibility", "wcag", "aria"],

  // Backend
  "Node.js": ["node", "node.js", "nodejs", "node js"],
  Express: ["express", "express.js", "expressjs"],
  NestJS: ["nest", "nestjs", "nest.js"],
  Fastify: ["fastify"],
  Django: ["django", "django rest framework", "drf"],
  FastAPI: ["fastapi", "fast-api", "fast api"],
  Flask: ["flask"],
  "Spring Boot": ["spring boot", "springboot", "spring-boot"],
  "Spring Framework": ["spring framework", "spring mvc", "spring context", "spring core"],
  "Ruby on Rails": ["rails", "ruby on rails", "ror"],
  "ASP.NET Core": ["asp.net core", "aspnet core", "asp.net", "aspnet"],
  ".NET": [".net", "dotnet", ".net core", "dotnet core", "c#/.net"],
  "REST API": ["rest", "rest api", "rest apis", "restful", "restful api", "restful apis", "rest-api"],
  GraphQL: ["graphql", "graph-ql", "graphql api", "gql"],
  gRPC: ["grpc", "g-rpc"],
  TRPC: ["trpc", "t-rpc"],
  "Apache Kafka": ["kafka", "apache kafka"],
  RabbitMQ: ["rabbitmq", "rabbit-mq", "rabbit mq"],
  "Redis Pub/Sub": ["pub/sub", "redis pub/sub", "redis pubsub"],
  Microservices: ["microservices", "micro-services", "microservice architecture", "microservice"],
  "Event-Driven Architecture": ["event-driven", "event driven", "event-driven architecture", "eda"],
  OAuth2: ["oauth", "oauth2", "oauth 2.0", "oauth2.0", "oidc", "openid connect"],
  JWT: ["jwt", "json web token", "json web tokens"],
  Serverless: ["serverless", "faas", "lambda functions"],
  "AWS Lambda": ["aws lambda", "lambda", "serverless lambda"],

  // Databases
  PostgreSQL: ["postgres", "postgresql", "pgsql", "postgres db"],
  MySQL: ["mysql", "my sql"],
  SQLite: ["sqlite", "sqlite3"],
  "Microsoft SQL Server": ["mssql", "sql server", "microsoft sql server", "ms sql"],
  MongoDB: ["mongo", "mongodb", "mongo db"],
  DynamoDB: ["dynamodb", "dynamo", "amazon dynamodb", "aws dynamodb"],
  Redis: ["redis", "redis cache"],
  Elasticsearch: ["elasticsearch", "elastic search", "elastic", "es"],
  OpenSearch: ["opensearch", "open search"],
  Prisma: ["prisma", "prisma orm"],
  "Vector Databases": ["vector db", "vector database", "vector databases", "vector stores", "vector store"],
  Pinecone: ["pinecone", "pinecone db"],
  Qdrant: ["qdrant"],
  Milvus: ["milvus"],
  Weaviate: ["weaviate"],
  pgvector: ["pgvector", "pg_vector"],
  Snowflake: ["snowflake"],
  BigQuery: ["bigquery", "big query", "google bigquery"],
  ClickHouse: ["clickhouse"],

  // Cloud & DevOps
  AWS: ["aws", "amazon web services", "amazon aws"],
  "Google Cloud Platform": ["gcp", "google cloud", "google cloud platform", "google cloud (gcp)"],
  "Microsoft Azure": ["azure", "microsoft azure", "ms azure"],
  Docker: ["docker", "docker container", "docker containers", "containerization"],
  Kubernetes: ["k8s", "kubernetes", "kube", "k8"],
  Helm: ["helm", "helm charts"],
  Terraform: ["terraform", "tf", "opentofu"],
  Ansible: ["ansible"],
  "GitHub Actions": ["github actions", "gh actions", "gha"],
  "GitLab CI": ["gitlab ci", "gitlab-ci", "gitlab ci/cd"],
  Jenkins: ["jenkins"],
  Prometheus: ["prometheus"],
  Grafana: ["grafana"],
  Datadog: ["datadog"],
  Linux: ["linux", "unix", "gnu/linux", "ubuntu", "debian", "centos", "alpine"],
  "CI/CD Pipelines": ["ci/cd", "ci-cd", "cicd", "continuous integration", "continuous deployment", "ci/cd pipelines"],
  "Infrastructure as Code": ["iac", "infrastructure as code"],
  "Site Reliability Engineering": ["sre", "site reliability engineering", "site reliability"],

  // AI & Machine Learning
  "Machine Learning": ["ml", "machine learning", "machine-learning"],
  "Deep Learning": ["dl", "deep learning", "deep-learning"],
  "Artificial Intelligence": ["ai", "artificial intelligence"],
  "Generative AI": ["generative ai", "genai", "gen-ai", "generative-ai"],
  "Natural Language Processing": ["nlp", "natural language processing", "text processing"],
  "Computer Vision": ["cv", "computer vision"],
  "Large Language Models": ["large language model", "large language models"],
  LLM: ["llm", "llms"],
  RAG: ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
  "Prompt Engineering": ["prompt engineering", "prompt design", "prompt tuning"],
  "Fine-Tuning": ["fine-tuning", "finetuning", "fine tuning", "model fine-tuning", "lora", "qlora"],
  PyTorch: ["pytorch", "torch"],
  TensorFlow: ["tensorflow", "tensor flow"],
  "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  "Hugging Face": ["hugging face", "huggingface", "hf transformers", "transformers"],
  LangChain: ["langchain", "lang-chain"],
  LlamaIndex: ["llamaindex", "llama-index", "llama index"],
  vLLM: ["vllm"],
  MLflow: ["mlflow", "ml-flow"],
  "Vector Embeddings": ["embeddings", "vector embeddings", "dense embeddings"],

  // Testing & Tooling
  Jest: ["jest", "jestjs"],
  Vitest: ["vitest"],
  Cypress: ["cypress", "cypress.io"],
  Playwright: ["playwright", "pw"],
  "Testing Library": ["testing library", "react testing library", "rtl"],
  PyTest: ["pytest", "py-test"],
  Git: ["git", "version control", "vcs"],
  GitHub: ["github", "gh"],
  Jira: ["jira", "atlassian jira"],
  Linear: ["linear", "linear app"],

  // System Design & Architecture
  "System Design": ["system design", "system architecture", "software architecture", "systems design"],
  "Distributed Systems": ["distributed systems", "distributed computing", "distributed architecture"],
  "High Availability": ["high availability", "ha", "high-availability"],
  "Fault Tolerance": ["fault tolerance", "fault tolerant", "resilience"],
  "Load Balancing": ["load balancing", "load balancer", "load balancers", "alb", "nlb"],
  "Database Sharding": ["sharding", "database sharding", "partitioning"],
  "Caching Strategies": ["caching", "cache", "caching strategies", "in-memory caching"],
};

/**
 * Precomputed lookup map: Lowercase Alias / Name -> Canonical Skill Name
 */
export const ALIAS_MAP: Map<string, string> = new Map();

/**
 * Precomputed lookup map: Canonical Skill Name -> Array of all lowercase aliases
 */
export const CANONICAL_TO_ALIASES: Map<string, string[]> = new Map();

// Initialize the lookup maps
for (const [canonical, aliases] of Object.entries(RAW_ALIAS_DEFINITIONS)) {
  const allAliases = new Set<string>();
  allAliases.add(canonical.toLowerCase());

  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().trim();
    if (cleanAlias) {
      allAliases.add(cleanAlias);
      ALIAS_MAP.set(cleanAlias, canonical);
    }
  }

  // Also map canonical itself
  ALIAS_MAP.set(canonical.toLowerCase(), canonical);
  CANONICAL_TO_ALIASES.set(canonical, Array.from(allAliases));
}

// Add all remaining canonical skills from the taxonomy so every skill is in the map
for (const skill of ALL_SKILLS) {
  const lower = skill.toLowerCase();
  if (!ALIAS_MAP.has(lower)) {
    ALIAS_MAP.set(lower, skill);
    CANONICAL_TO_ALIASES.set(skill, [lower]);
  }
}

/**
 * Normalize any raw skill or abbreviation to its canonical taxonomy form.
 * Returns the canonical name if recognized, or the trimmed original string.
 */
export function normalizeSkill(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  const canonical = ALIAS_MAP.get(lower);
  if (canonical) {
    return canonical;
  }

  return trimmed;
}

/**
 * Returns all lowercase aliases and alternative names for a given canonical skill name.
 */
export function getSkillAliases(canonical: string): string[] {
  return CANONICAL_TO_ALIASES.get(canonical) ?? [canonical.toLowerCase()];
}

/**
 * Checks if two skill names (aliases or variations) refer to the same canonical technology.
 */
export function areSkillsEquivalent(skillA: string, skillB: string): boolean {
  if (!skillA || !skillB) return false;
  return normalizeSkill(skillA).toLowerCase() === normalizeSkill(skillB).toLowerCase();
}
