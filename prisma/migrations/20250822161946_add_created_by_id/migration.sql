-- AlterTable
ALTER TABLE "Object" ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Object_createdById_idx" ON "Object"("createdById");

-- AddForeignKey
ALTER TABLE "Object" ADD CONSTRAINT "Object_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

