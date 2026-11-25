-- CreateTable
CREATE TABLE "SavedComponent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedComponent_userId_idx" ON "SavedComponent"("userId");

-- AddForeignKey
ALTER TABLE "SavedComponent" ADD CONSTRAINT "SavedComponent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
