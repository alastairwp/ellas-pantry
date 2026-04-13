-- DropIndex
DROP INDEX IF EXISTS "RecipeIngredient_recipeId_ingredientId_key";

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_orderIndex_key" ON "RecipeIngredient"("recipeId", "ingredientId", "orderIndex");
