-- CreateEnum
CREATE TYPE "SquadType" AS ENUM ('SINGLE', 'DUO', 'TRIPLE', 'SQUAD');

-- AlterTable
ALTER TABLE "Squad" ADD COLUMN     "type" "SquadType" NOT NULL DEFAULT 'SQUAD';

-- CreateIndex
CREATE INDEX "Squad_type_idx" ON "Squad"("type");
