-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('offered', 'moved_forward', 'completed');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "interviewStage" "InterviewStage";

-- Backfill existing interview tags. Closed applications do not keep one.
UPDATE "JobApplication" SET "interviewStage" = 'offered' WHERE "interviewOffered" = true AND "status" = 'applied';

-- AlterTable
ALTER TABLE "JobApplication" DROP COLUMN "interviewOffered";
