/*
  Warnings:

  - The `gender` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `brands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sub_categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('NAM', 'NU', 'KHAC');

-- DropForeignKey
ALTER TABLE "sub_categories" DROP CONSTRAINT "sub_categories_categoryId_fkey";

-- DropIndex
DROP INDEX "products_subCategoryId_brandId_idx";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "sub_categories" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- CreateIndex
CREATE INDEX "products_subCategoryId_idx" ON "products"("subCategoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
