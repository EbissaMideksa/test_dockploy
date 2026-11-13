-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;

-- AlterTable
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_productId_key";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_productId_variantId_key" UNIQUE ("cartId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL;
