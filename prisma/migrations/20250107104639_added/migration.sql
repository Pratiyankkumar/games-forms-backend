/*
  Warnings:

  - Added the required column `email` to the `Squad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Squad" ADD COLUMN     "email" TEXT NOT NULL;
