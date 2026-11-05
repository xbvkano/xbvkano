-- CreateTable
CREATE TABLE "OpenHour" (
    "id" INTEGER NOT NULL,
    "openUntil" TIMESTAMP(3),

    CONSTRAINT "OpenHour_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OpenHour" ("id", "openUntil") VALUES (1, NULL);

-- CreateTable
CREATE TABLE "AssistantNote" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantNote_topic_key" ON "AssistantNote"("topic");

