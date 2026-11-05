-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'declined', 'rejected', 'hired');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "appliedOn" DATE NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);
