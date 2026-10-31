import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ResumeDocument,
  ResumeDocumentSchema,
  ResumeBasics,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroup,
  CertificationItem,
  SectionId,
  ResumeLayout,
  BulletPoint,
} from "../schema/resume";
import { JdRequirements, createEmptyJd } from "../schema/jd";

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const defaultResumeDocument: ResumeDocument = {
  id: "resume-default-01",
  title: "Senior Full-Stack Engineer Profile",
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
      id: "exp-1",
      company: "Apex Cloud Technologies",
      position: "Senior Full-Stack Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      description: "Led core infrastructure and web platform engineering for multi-tenant analytics SaaS.",
      bullets: [
        {
          id: "b-101",
          text: "Spearheaded migration of legacy REST API to Next.js App Router and Node.js microservices, cutting p95 response latency from 320ms to 95ms for 450k active tenants.",
        },
        {
          id: "b-102",
          text: "Engineered real-time collaboration canvas using WebSockets and Redis Pub/Sub, boosting multi-user concurrent session capacity by 3.5x with zero dropped frames.",
        },
        {
          id: "b-103",
          text: "Architected automated CI/CD deployment pipelines on AWS ECS & Docker, shrinking release cycle time from 45 minutes to 6 minutes while enforcing 94% test coverage.",
        },
        {
          id: "b-104",
          text: "Optimized complex PostgreSQL analytical queries and database connection pools, eliminating query bottlenecks and decreasing AWS RDS compute spend by 28%.",
        },
      ],
      technologies: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS ECS"],
    },
    {
      id: "exp-2",
      company: "Stratum Data Solutions",
      position: "Full-Stack Software Engineer",
      location: "Austin, TX",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      description: "Built customer-facing data visualization dashboards and event ingestion pipelines.",
      bullets: [
        {
          id: "b-201",
          text: "Developed responsive enterprise dashboard using React, TypeScript, and Tailwind CSS, increasing enterprise user NPS from 48 to 72 within 6 months.",
        },
        {
          id: "b-202",
          text: "Implemented Apache Kafka event streaming consumers in Go and Node.js, reliably processing 15M+ daily audit log events with sub-second ingestion lag.",
        },
        {
          id: "b-203",
          text: "Restructured authentication workflow to support SAML 2.0 and OAuth2 SSO, unblocking $1.2M in annual recurring enterprise contract deals.",
        },
      ],
      technologies: ["React", "TypeScript", "Node.js", "GraphQL", "PostgreSQL", "Kafka", "Docker"],
    },
    {
      id: "exp-3",
      company: "Vanguard Interactive",
      position: "Frontend Software Engineer",
      location: "San Jose, CA",
      startDate: "2017-08",
      endDate: "2019-05",
      current: false,
      description: "Engineered performant web applications and component design systems.",
      bullets: [
        {
          id: "b-301",
          text: "Built reusable React/TypeScript design system adopted across 8 engineering teams, reducing front-end bug tickets by 35% and accelerating feature delivery.",
        },
        {
          id: "b-302",
          text: "Audited and refactored core rendering pipeline to improve Google Lighthouse performance score from 61 to 96 across all mobile devices.",
        },
      ],
      technologies: ["JavaScript", "TypeScript", "React", "Redux", "Webpack", "CSS Modules"],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2013-08",
      endDate: "2017-05",
      current: false,
      gpa: "3.85 / 4.0",
      highlights: [
        { id: "edu-h-1", text: "Dean's Honor List (6 consecutive semesters)" },
        { id: "edu-h-2", text: "Coursework: Distributed Systems, Operating Systems, Database Systems, Algorithms" },
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "HyperGraph Engine",
      description: "High-performance in-memory graph query engine with WebAssembly acceleration.",
      role: "Creator & Maintainer",
      url: "https://hypergraph.dev",
      githubUrl: "https://github.com/alexmorgan/hypergraph",
      startDate: "2023-01",
      endDate: "Present",
      bullets: [
        {
          id: "pb-101",
          text: "Designed in-memory indexing algorithms in TypeScript and Rust/Wasm, achieving 400k query operations per second in client browsers.",
        },
        {
          id: "pb-102",
          text: "Grew open-source community to 2.4k GitHub stars with 18 outside contributors and 45k monthly npm downloads.",
        },
      ],
      technologies: ["TypeScript", "Rust", "WebAssembly", "Node.js", "Next.js"],
    },
    {
      id: "proj-2",
      name: "PulseQueue Distributed Worker",
      description: "Fault-tolerant background task processing queue built with Redis and PostgreSQL.",
      role: "Lead Architect",
      githubUrl: "https://github.com/alexmorgan/pulse-queue",
      startDate: "2021-04",
      endDate: "2021-11",
      bullets: [
        {
          id: "pb-201",
          text: "Engineered atomic queue scheduling with exponential backoff retries, dead-letter recovery, and Prometheus metrics monitoring.",
        },
      ],
      technologies: ["Node.js", "TypeScript", "Redis", "PostgreSQL", "Docker"],
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Languages & Core",
      skills: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML5", "CSS3"],
    },
    {
      id: "sk-2",
      category: "Frameworks & Frontend",
      skills: ["React", "Next.js", "Node.js", "Express", "Tailwind CSS", "Redux", "GraphQL"],
    },
    {
      id: "sk-3",
      category: "Databases & Storage",
      skills: ["PostgreSQL", "Redis", "MongoDB", "Elasticsearch", "Prisma"],
    },
    {
      id: "sk-4",
      category: "DevOps & Cloud",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Git", "Linux"],
    },
  ],
  certifications: [
    {
      id: "cert-1",
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

export interface SavedVariant {
  id: string;
  title: string;
  jobTitle?: string;
  jobDescription?: string;
  profile: ResumeDocument;
  savedAt: string;
}

export interface ResumeState {
  masterResume: ResumeDocument;
  resume: ResumeDocument;
  jd: JdRequirements;
  savedVariants: SavedVariant[];
  isTailored: boolean;
  uiTheme: "dark" | "light";

  // Actions on active/tailored resume (never mutates masterResume)
  updateBasics: (basics: Partial<ResumeBasics>) => void;
  addExperience: (experience: ExperienceItem) => void;
  updateExperience: (id: string, experience: Partial<ExperienceItem>) => void;
  deleteExperience: (id: string) => void;
  reorderExperience: (startIndex: number, endIndex: number) => void;
  updateBullet: (experienceId: string, bulletId: string, text: string) => void;
  addBullet: (experienceId: string, text: string) => void;
  deleteBullet: (experienceId: string, bulletId: string) => void;

  addProject: (project: ProjectItem) => void;
  updateProject: (id: string, project: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  updateProjectBullet: (projectId: string, bulletId: string, text: string) => void;

  addEducation: (education: EducationItem) => void;
  updateEducation: (id: string, education: Partial<EducationItem>) => void;
  deleteEducation: (id: string) => void;

  addSkillGroup: (group: SkillGroup) => void;
  updateSkillGroup: (id: string, group: Partial<SkillGroup>) => void;
  deleteSkillGroup: (id: string) => void;
  addSkillToGroup: (groupId: string, skill: string) => void;
  removeSkillFromGroup: (groupId: string, skill: string) => void;

  addCertification: (cert: CertificationItem) => void;
  deleteCertification: (id: string) => void;

  reorderSections: (newOrder: SectionId[]) => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  toggleItemHidden: (section: "experience" | "projects" | "education" | "certifications", itemId: string) => void;
  toggleBulletHidden: (section: "experience" | "projects" | "education", itemId: string, bulletId: string) => void;
  updateTheme: (layout: Partial<ResumeLayout>) => void;

  // JD Actions
  setJd: (jd: JdRequirements | string) => void;
  clearJd: () => void;

  // Saved Job Variants
  saveVariant: (title: string, jobTitle?: string, jobDescription?: string) => void;
  loadVariant: (id: string) => void;
  deleteVariant: (id: string) => void;

  // Backup Import & Export
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;

  // Profile lifecycle
  loadProfile: (profile: ResumeDocument) => void;
  resetToDefault: () => void;
  resetToMaster: () => void;
  saveAsMaster: () => void;

  // UI Theme (Light / Dark)
  toggleUiTheme: () => void;
  setUiTheme: (theme: "dark" | "light") => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      masterResume: clone(defaultResumeDocument),
      resume: clone(defaultResumeDocument),
      jd: createEmptyJd(),
      savedVariants: [] as SavedVariant[],
      isTailored: false,
      uiTheme: "dark" as "dark" | "light",

      updateBasics: (basics) =>
        set((state) => ({
          resume: {
            ...state.resume,
            basics: { ...state.resume.basics, ...basics },
            updatedAt: new Date().toISOString(),
          },
        })),

      addExperience: (experience) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: [experience, ...state.resume.experience],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateExperience: (id, experience) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((item) =>
              item.id === id ? { ...item, ...experience } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteExperience: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      reorderExperience: (startIndex, endIndex) =>
        set((state) => {
          const list = [...state.resume.experience];
          const [removed] = list.splice(startIndex, 1);
          if (!removed) return state;
          list.splice(endIndex, 0, removed);
          return {
            resume: {
              ...state.resume,
              experience: list,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateBullet: (experienceId, bulletId, text) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((exp) => {
              if (exp.id !== experienceId) return exp;
              return {
                ...exp,
                bullets: exp.bullets.map((b) =>
                  b.id === bulletId ? { ...b, text } : b
                ),
              };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      addBullet: (experienceId, text) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((exp) => {
              if (exp.id !== experienceId) return exp;
              const newBullet: BulletPoint = {
                id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                text,
              };
              return {
                ...exp,
                bullets: [...exp.bullets, newBullet],
              };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteBullet: (experienceId, bulletId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((exp) => {
              if (exp.id !== experienceId) return exp;
              return {
                ...exp,
                bullets: exp.bullets.filter((b) => b.id !== bulletId),
              };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      addProject: (project) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: [project, ...state.resume.projects],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateProject: (id, project) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.map((item) =>
              item.id === id ? { ...item, ...project } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteProject: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      updateProjectBullet: (projectId, bulletId, text) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.map((proj) => {
              if (proj.id !== projectId) return proj;
              return {
                ...proj,
                bullets: proj.bullets.map((b) =>
                  b.id === bulletId ? { ...b, text } : b
                ),
              };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      addEducation: (education) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: [education, ...state.resume.education],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateEducation: (id, education) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.map((item) =>
              item.id === id ? { ...item, ...education } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteEducation: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addSkillGroup: (group) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: [...state.resume.skills, group],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateSkillGroup: (id, group) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((item) =>
              item.id === id ? { ...item, ...group } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteSkillGroup: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addSkillToGroup: (groupId, skill) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((group) => {
              if (group.id !== groupId) return group;
              if (group.skills.includes(skill)) return group;
              return { ...group, skills: [...group.skills, skill] };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeSkillFromGroup: (groupId, skill) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((group) => {
              if (group.id !== groupId) return group;
              return { ...group, skills: group.skills.filter((s) => s !== skill) };
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      addCertification: (cert) =>
        set((state) => ({
          resume: {
            ...state.resume,
            certifications: [...state.resume.certifications, cert],
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteCertification: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            certifications: state.resume.certifications.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      reorderSections: (newOrder) =>
        set((state) => ({
          resume: {
            ...state.resume,
            layout: {
              ...state.resume.layout,
              sectionOrder: newOrder,
            },
            updatedAt: new Date().toISOString(),
          },
        })),

      toggleSectionVisibility: (sectionId) =>
        set((state) => {
          const currentVisibility = state.resume.layout.sectionVisibility[sectionId] ?? true;
          return {
            resume: {
              ...state.resume,
              layout: {
                ...state.resume.layout,
                sectionVisibility: {
                  ...state.resume.layout.sectionVisibility,
                  [sectionId]: !currentVisibility,
                },
              },
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateTheme: (layout) =>
        set((state) => ({
          resume: {
            ...state.resume,
            layout: {
              ...state.resume.layout,
              ...layout,
            },
            updatedAt: new Date().toISOString(),
          },
        })),

      setJd: (jd) =>
        set(() => {
          if (typeof jd === "string") {
            return {
              jd: {
                ...createEmptyJd(),
                rawText: jd,
              },
              isTailored: true,
            };
          }
          return {
            jd,
            isTailored: true,
          };
        }),

      toggleItemHidden: (section, itemId) =>
        set((state) => {
          if (section === "experience") {
            return {
              resume: {
                ...state.resume,
                experience: state.resume.experience.map((e) =>
                  e.id === itemId ? { ...e, hidden: !e.hidden } : e
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          } else if (section === "projects") {
            return {
              resume: {
                ...state.resume,
                projects: state.resume.projects.map((p) =>
                  p.id === itemId ? { ...p, hidden: !p.hidden } : p
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          } else if (section === "education") {
            return {
              resume: {
                ...state.resume,
                education: state.resume.education.map((e) =>
                  e.id === itemId ? { ...e, hidden: !e.hidden } : e
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          } else if (section === "certifications") {
            return {
              resume: {
                ...state.resume,
                certifications: state.resume.certifications.map((c) =>
                  c.id === itemId ? { ...c, hidden: !c.hidden } : c
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return state;
        }),

      toggleBulletHidden: (section, itemId, bulletId) =>
        set((state) => {
          if (section === "experience") {
            return {
              resume: {
                ...state.resume,
                experience: state.resume.experience.map((e) => {
                  if (e.id !== itemId) return e;
                  return {
                    ...e,
                    bullets: e.bullets.map((b) =>
                      b.id === bulletId ? { ...b, hidden: !b.hidden } : b
                    ),
                  };
                }),
                updatedAt: new Date().toISOString(),
              },
            };
          } else if (section === "projects") {
            return {
              resume: {
                ...state.resume,
                projects: state.resume.projects.map((p) => {
                  if (p.id !== itemId) return p;
                  return {
                    ...p,
                    bullets: p.bullets.map((b) =>
                      b.id === bulletId ? { ...b, hidden: !b.hidden } : b
                    ),
                  };
                }),
                updatedAt: new Date().toISOString(),
              },
            };
          } else if (section === "education") {
            return {
              resume: {
                ...state.resume,
                education: state.resume.education.map((e) => {
                  if (e.id !== itemId) return e;
                  return {
                    ...e,
                    highlights: e.highlights.map((h) =>
                      h.id === bulletId ? { ...h, hidden: !h.hidden } : h
                    ),
                  };
                }),
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return state;
        }),

      saveVariant: (title, jobTitle, jobDescription) =>
        set((state) => {
          const id = `variant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const newVariant: SavedVariant = {
            id,
            title: title.trim() || "Untitled Variant",
            jobTitle: jobTitle || state.resume.targetRole || "Target Role",
            jobDescription: jobDescription || state.jd.rawText || "",
            profile: clone(state.resume),
            savedAt: new Date().toISOString(),
          };
          const existingFiltered = state.savedVariants.filter(
            (v) => v.title.toLowerCase() !== title.trim().toLowerCase()
          );
          return {
            savedVariants: [newVariant, ...existingFiltered].slice(0, 20),
          };
        }),

      loadVariant: (id) =>
        set((state) => {
          const v = state.savedVariants.find((item) => item.id === id);
          if (!v) return state;
          return {
            resume: clone(v.profile),
            jd: v.jobDescription
              ? { ...createEmptyJd(), rawText: v.jobDescription, title: v.jobTitle || "" }
              : state.jd,
            isTailored: true,
          };
        }),

      deleteVariant: (id) =>
        set((state) => ({
          savedVariants: state.savedVariants.filter((item) => item.id !== id),
        })),

      exportBackupJson: (): string => {
        const state = get();
        return JSON.stringify(
          {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            masterResume: state.masterResume,
            resume: state.resume,
            savedVariants: state.savedVariants,
            jd: state.jd,
          },
          null,
          2
        );
      },

      importBackupJson: (jsonStr: string): boolean => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data || typeof data !== "object") return false;
          const targetResume = data.resume || data.profile;
          if (!targetResume || typeof targetResume !== "object") return false;

          const parsedResume = ResumeDocumentSchema.safeParse(targetResume);
          if (!parsedResume.success) return false;

          const rawMaster = data.masterResume || data.masterProfile;
          const parsedMaster = rawMaster ? ResumeDocumentSchema.safeParse(rawMaster) : null;
          const finalMaster = parsedMaster && parsedMaster.success ? parsedMaster.data : parsedResume.data;

          const variantsList = Array.isArray(data.savedVariants || data.variants)
            ? (data.savedVariants || data.variants).slice(0, 20)
            : [];

          set({
            resume: clone(parsedResume.data),
            masterResume: clone(finalMaster),
            savedVariants: variantsList,
            jd: data.jd || (data.jobDescription ? { ...createEmptyJd(), rawText: data.jobDescription, title: data.jobTitle || "" } : createEmptyJd()),
          });
          return true;
        } catch {
          return false;
        }
      },

      clearJd: () =>
        set(() => ({
          jd: createEmptyJd(),
          isTailored: false,
        })),

      loadProfile: (profile: ResumeDocument) =>
        set(() => ({
          masterResume: clone(profile),
          resume: clone(profile),
          isTailored: false,
        })),

      resetToDefault: () =>
        set(() => ({
          masterResume: clone(defaultResumeDocument),
          resume: clone(defaultResumeDocument),
          jd: createEmptyJd(),
          isTailored: false,
        })),

      resetToMaster: () =>
        set((state) => ({
          resume: clone(state.masterResume),
          isTailored: false,
        })),

      saveAsMaster: () =>
        set((state) => ({
          masterResume: clone(state.resume),
        })),

      toggleUiTheme: () =>
        set((state) => {
          const next = state.uiTheme === "dark" ? "light" : "dark";
          if (typeof document !== "undefined") {
            if (next === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          return { uiTheme: next };
        }),

      setUiTheme: (theme: "dark" | "light") =>
        set(() => ({
          uiTheme: theme,
        })),
    }),
    {
      name: "resuarchitect_resume_v1",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        const memoryStore = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStore.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memoryStore.set(key, value);
          },
          removeItem: (key: string) => {
            memoryStore.delete(key);
          },
        };
      }),
      partialize: (state) => ({
        masterResume: state.masterResume,
        resume: state.resume,
        jd: state.jd,
        savedVariants: state.savedVariants,
        isTailored: state.isTailored,
        uiTheme: state.uiTheme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          if (state.uiTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }
  )
);
