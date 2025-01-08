/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Squad` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Squad_email_key" ON "Squad"("email");
