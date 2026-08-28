-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "variantColorName" TEXT,
ADD COLUMN     "variantId" TEXT;

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
