-- AlterTable
ALTER TABLE "agents" ADD COLUMN "moltbook_id" TEXT,
ADD COLUMN "moltbook_karma" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "agents_moltbook_id_key" ON "agents"("moltbook_id");
