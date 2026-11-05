-- CreateEnum
CREATE TYPE "EntryKind" AS ENUM ('project', 'certificate', 'experience', 'education', 'coursework');

-- AlterTable
ALTER TABLE "Profile"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "birthDate" DATE,
ADD COLUMN "sex" TEXT,
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';

UPDATE "Profile"
SET
  "firstName" = split_part("name", ' ', 1),
  "lastName" = CASE
    WHEN position(' ' IN "name") = 0 THEN ''
    ELSE substring("name" FROM position(' ' IN "name") + 1)
  END,
  "birthDate" = DATE '2005-03-14',
  "notes" = (
    SELECT string_agg(paragraph.value, E'\n\n' ORDER BY paragraph.ordinality)
    FROM jsonb_array_elements_text("paragraphs") WITH ORDINALITY AS paragraph(value, ordinality)
  );

ALTER TABLE "Profile" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Profile" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "Profile" DROP COLUMN "name";
ALTER TABLE "Profile" DROP COLUMN "paragraphs";

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "imagePath" TEXT,
    "linkUrl" TEXT,
    "startedOn" DATE,
    "endedOn" DATE,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Entry" ("kind", "slug", "title", "shortDescription", "longDescription", "imagePath", "linkUrl", "sortOrder")
SELECT
    'project'::"EntryKind",
    "slug",
    "title",
    split_part("body", E'\n\n', 1),
    "body",
    "imagePath",
    "linkUrl",
    "sortOrder"
FROM "Project";

INSERT INTO "Entry" ("kind", "slug", "title", "shortDescription", "longDescription", "imagePath", "linkUrl", "sortOrder")
SELECT
    'certificate'::"EntryKind",
    "slug",
    "title",
    split_part("body", E'\n\n', 1),
    "body",
    "imagePath",
    "verifyUrl",
    "sortOrder"
FROM "Certification";

-- DropTable
DROP TABLE "Certification";

-- DropTable
DROP TABLE "Project";

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrySkill" (
    "entryId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "EntrySkill_pkey" PRIMARY KEY ("entryId","skillId")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_slug_key" ON "Entry"("slug");

-- AddForeignKey
ALTER TABLE "EntrySkill" ADD CONSTRAINT "EntrySkill_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrySkill" ADD CONSTRAINT "EntrySkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
