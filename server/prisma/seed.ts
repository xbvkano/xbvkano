import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.js";
import { PrismaClient, type EntryKind } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contentDir = path.join(root, "archive", "content");

type ProfileSeed = {
  name: string;
  photoPath: string;
  paragraphs: string[];
};

type ProjectSeed = {
  slug: string;
  title: string;
  body: string;
  imagePath: string;
  linkUrl?: string | null;
  sortOrder: number;
};

type CertificationSeed = {
  slug: string;
  title: string;
  body: string;
  imagePath: string;
  verifyUrl?: string | null;
  sortOrder: number;
};

type DetailedSeed = {
  slug: string;
  kind: EntryKind;
  title: string;
  subtitle?: string | null;
  bullets: string[];
  preface?: string;
  imagePath?: string | null;
  linkUrl?: string | null;
  startedOn?: string | null;
  endedOn?: string | null;
  sortOrder: number;
};

function descriptions(body: string): { shortDescription: string; longDescription: string } {
  const [first] = body.split("\n\n");
  return {
    shortDescription: first && first.length > 0 ? first : body,
    longDescription: body,
  };
}

function day(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function readJson<T>(fileName: string): Promise<T> {
  const raw = await readFile(path.join(contentDir, fileName), "utf8");
  return JSON.parse(raw) as T;
}

const prisma = new PrismaClient();

async function upsertEntry(
  kind: EntryKind,
  item: {
    slug: string;
    title: string;
    body: string;
    imagePath: string;
    linkUrl?: string | null;
    sortOrder: number;
  },
) {
  const text = descriptions(item.body);
  const data = {
    kind,
    title: item.title,
    subtitle: null,
    shortDescription: text.shortDescription,
    longDescription: text.longDescription,
    imagePath: item.imagePath,
    linkUrl: item.linkUrl ?? null,
    startedOn: null,
    endedOn: null,
    sortOrder: item.sortOrder,
  };

  await prisma.entry.upsert({
    where: { slug: item.slug },
    update: data,
    create: { slug: item.slug, ...data },
  });
}

async function upsertDetailed(item: DetailedSeed) {
  const firstBullet = item.bullets[0] ?? item.title;
  const longDescription = item.preface
    ? [item.preface, ...item.bullets].join("\n")
    : item.bullets.join("\n");
  const data = {
    kind: item.kind,
    title: item.title,
    subtitle: item.subtitle ?? null,
    shortDescription: firstBullet,
    longDescription,
    imagePath: item.imagePath ?? null,
    linkUrl: item.linkUrl ?? null,
    startedOn: day(item.startedOn),
    endedOn: day(item.endedOn),
    sortOrder: item.sortOrder,
  };

  await prisma.entry.upsert({
    where: { slug: item.slug },
    update: data,
    create: { slug: item.slug, ...data },
  });
}

async function upsertSkill(name: string, shortDescription: string) {
  const existing = await prisma.skill.findFirst({ where: { name } });
  const data = {
    name,
    shortDescription,
    longDescription: `Listed on the resume under ${shortDescription}.`,
  };
  if (existing) {
    await prisma.skill.update({ where: { id: existing.id }, data });
    return;
  }
  await prisma.skill.create({ data });
}

async function linkSkills(slug: string, names: string[]) {
  const entry = await prisma.entry.findUniqueOrThrow({ where: { slug } });
  const skills = await prisma.skill.findMany({ where: { name: { in: names } } });
  await prisma.entrySkill.deleteMany({ where: { entryId: entry.id } });
  await prisma.entrySkill.createMany({
    data: skills.map((skill) => ({ entryId: entry.id, skillId: skill.id })),
  });
}

const resumeEntries: DetailedSeed[] = [
  {
    slug: "junior-full-stack-software-engineer",
    kind: "experience",
    title: "Junior Full-stack Software Engineer",
    subtitle: "BLT SMRT",
    startedOn: "2024-01-01",
    sortOrder: 0,
    bullets: [
      "Developed React applications for enterprise user management, billing, and software distribution.",
      "Identified and remediated SQL injection vulnerabilities, improving backend security and query handling.",
      "Developed AI-powered Python scripting tools using Prisma and OpenAI APIs, alongside C# WPF applications using MVVM.",
    ],
  },
  {
    slug: "co-founder-evidence-llc",
    kind: "experience",
    title: "Co-Founder",
    subtitle: "Evidence LLC",
    startedOn: "2020-10-01",
    sortOrder: 1,
    bullets: [
      "Oversee daily business operations, managing employee teams, client relationships, scheduling, and service delivery.",
      "Lead software development, overseeing internal applications, architecture, and new features.",
      "Define product roadmaps and scalable solutions for future franchise expansion.",
      "Drive business growth through technology, automation, and operational improvements.",
    ],
  },
  {
    slug: "software-developer-data-annotation",
    kind: "experience",
    title: "Software Developer",
    subtitle: "Data Annotation",
    startedOn: "2024-01-01",
    endedOn: "2024-05-01",
    sortOrder: 2,
    bullets: ["Completed 50+ programming and AI-related projects across 300+ hours of contract work."],
  },
  {
    slug: "undergraduate-researcher-datax-quorum",
    kind: "experience",
    title: "Undergraduate researcher",
    subtitle: "DataX Labs & Quorum Lab",
    startedOn: "2024-01-01",
    endedOn: "2024-05-01",
    sortOrder: 3,
    bullets: [
      "Developing software to create a heatmap for tissue cancer in .svs slide images.",
      "Working together with other research teams to adapt an AI model for cancer detection.",
      "Collecting data based on the results of the model to present at the UNLV 2024 OUR's undergraduate symposium.",
    ],
  },
  {
    slug: "software-engineer-intern-arete-games",
    kind: "experience",
    title: "Software Engineer Intern",
    subtitle: "Arete Games",
    startedOn: "2023-08-01",
    endedOn: "2023-11-01",
    sortOrder: 4,
    bullets: [
      "Co-developed the first game demo for the Arete Engine and debugged the engine.",
      "Co-developed the first game demo for Arete Engine, now published in the App Store with a 4-star rating.",
    ],
  },
  {
    slug: "university-of-nevada-las-vegas",
    kind: "education",
    title: "University of Nevada, Las Vegas",
    subtitle: "B.S. Computer Science, Software Engineering; B.S. Mathematics, Actuarial Science",
    endedOn: "2026-05-01",
    sortOrder: 0,
    bullets: [
      "Dean's List, The OUR's Fellowship, and TheDream.US full ride.",
    ],
  },
  {
    slug: "college-of-southern-nevada",
    kind: "education",
    title: "College of Southern Nevada",
    subtitle: "Associates of Physical Science",
    endedOn: "2023-05-01",
    sortOrder: 1,
    bullets: ["President's List and NSHS full ride."],
  },
  {
    slug: "business-operations-crm-platform",
    kind: "project",
    title: "Business Operations & CRM Platform",
    subtitle: "Evidence LLC",
    startedOn: "2024-10-01",
    sortOrder: 3,
    preface: "React, TypeScript, Node.js, Express, PostgreSQL, Prisma, Twilio, OpenAI",
    bullets: [
      "Architected and developed a full-stack business management platform integrating scheduling, CRM, SMS communications, payroll, invoicing, and employee management into a unified system.",
      "Built AI-powered workflows using OpenAI's API to extract structured booking information from SMS conversations and screenshots, reducing manual data entry.",
      "Engineered RESTful APIs, role-based access control, automated background jobs, and third-party integrations with Twilio, Google Drive, and Supabase.",
    ],
  },
  {
    slug: "microsoft-entra-scim-provisioning",
    kind: "project",
    title: "Microsoft Entra SCIM 2.0 Provisioning System",
    subtitle: "BLT SMRT",
    startedOn: "2026-05-01",
    sortOrder: 4,
    bullets: [
      "Built a SCIM 2.0 provisioning API used to onboard 1,000+ users across two major enterprise clients.",
      "Implemented SCIM CRUD, PATCH, filtering, pagination, schema validation, and standards-based error handling.",
      "Enforced RFC 7643/7644 rules for attribute mutability, uniqueness, and extensible user/group JSON resources.",
    ],
  },
];

const skillGroups: { group: string; names: string[] }[] = [
  {
    group: "Language",
    names: ["TypeScript", "JavaScript", "Python", "C++", "C#", "SQL", "HTML/CSS"],
  },
  {
    group: "Framework & Tool",
    names: ["React", "Node.js", "Express", "Prisma", "PostgreSQL", "Docker", "Git", "REST APIs", "Postman"],
  },
  {
    group: "Integration",
    names: ["OpenAI API", "Twilio", "Microsoft Entra", "SCIM 2.0"],
  },
];

async function main() {
  const profile = await readJson<ProfileSeed>("profile.json");
  const projects = await readJson<ProjectSeed[]>("projects.json");
  const certifications = await readJson<CertificationSeed[]>("certifications.json");
  const nameParts = profile.name.split(" ");
  const firstName = nameParts[0] ?? profile.name;
  const lastName = nameParts.slice(1).join(" ");
  const notes = [
    ...profile.paragraphs,
    "Passionate developer who wants to innovate tech",
    "UNLV NEWS (April 3, 2024): “New UNLV Paid Internship Program Connects Students with Local Startups”",
  ].join("\n\n");

  await prisma.profile.upsert({
    where: { id: 1 },
    update: {
      firstName,
      lastName,
      phone: "(725)-577-4523",
      email: "kanomarcos1974+work@gmail.com",
      notes,
      birthDate: new Date("2005-03-14T00:00:00.000Z"),
      photoPath: profile.photoPath,
      languages: ["English", "Portuguese"],
    },
    create: {
      id: 1,
      firstName,
      lastName,
      phone: "(725)-577-4523",
      email: "kanomarcos1974+work@gmail.com",
      notes,
      birthDate: new Date("2005-03-14T00:00:00.000Z"),
      photoPath: profile.photoPath,
      languages: ["English", "Portuguese"],
    },
  });

  for (const project of projects) {
    await upsertEntry("project", project);
  }

  for (const certification of certifications) {
    await upsertEntry("certificate", {
      ...certification,
      linkUrl: certification.verifyUrl,
    });
  }

  for (const entry of resumeEntries) {
    await upsertDetailed(entry);
  }

  for (const group of skillGroups) {
    for (const name of group.names) {
      await upsertSkill(name, group.group);
    }
  }

  await linkSkills("junior-full-stack-software-engineer", [
    "React",
    "SQL",
    "Python",
    "Prisma",
    "OpenAI API",
    "C#",
  ]);
  await linkSkills("business-operations-crm-platform", [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Prisma",
    "Twilio",
    "OpenAI API",
  ]);
  await linkSkills("microsoft-entra-scim-provisioning", ["Microsoft Entra", "SCIM 2.0"]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
