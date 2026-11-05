-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
