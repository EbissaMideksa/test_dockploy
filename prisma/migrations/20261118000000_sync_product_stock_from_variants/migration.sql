-- Keep "Product"."stock" in sync with the sum of its "ProductVariant"."stock" rows.
--
-- "ProductVariant"."stock" is the source of truth (stock lives on variants);
-- "Product"."stock" is the aggregate shown on the home page. This trigger makes
-- that invariant hold at the database level, so direct SQL writes to variants can
-- never leave the product aggregate stale.

CREATE OR REPLACE FUNCTION sync_product_stock_from_variants()
RETURNS TRIGGER AS $$
DECLARE
    old_product_id TEXT;
    new_product_id TEXT;
BEGIN
    old_product_id := COALESCE(OLD."productId", '');
    new_product_id := COALESCE(NEW."productId", '');

    -- UPDATE that moved a variant to a different product: fix the old product too.
    IF TG_OP = 'UPDATE' AND old_product_id <> new_product_id THEN
        UPDATE "Product"
        SET "stock" = COALESCE(
            (SELECT SUM("stock") FROM "ProductVariant" WHERE "productId" = old_product_id),
            0
        )
        WHERE "id" = old_product_id;
    END IF;

    -- INSERT / UPDATE: recompute the (possibly new) owning product.
    IF TG_OP <> 'DELETE' THEN
        UPDATE "Product"
        SET "stock" = COALESCE(
            (SELECT SUM("stock") FROM "ProductVariant" WHERE "productId" = new_product_id),
            0
        )
        WHERE "id" = new_product_id;
    END IF;

    -- DELETE: recompute the product that lost the variant.
    IF TG_OP = 'DELETE' THEN
        UPDATE "Product"
        SET "stock" = COALESCE(
            (SELECT SUM("stock") FROM "ProductVariant" WHERE "productId" = old_product_id),
            0
        )
        WHERE "id" = old_product_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_variant_sync_product_stock ON "ProductVariant";

CREATE TRIGGER product_variant_sync_product_stock
AFTER INSERT OR UPDATE OR DELETE ON "ProductVariant"
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock_from_variants();

-- Backfill: converge any existing product that already has variants.
-- Products without variants keep their legacy stock untouched.
UPDATE "Product" p
SET "stock" = sub.total
FROM (
    SELECT "productId", SUM("stock") AS total
    FROM "ProductVariant"
    GROUP BY "productId"
) sub
WHERE p."id" = sub."productId";