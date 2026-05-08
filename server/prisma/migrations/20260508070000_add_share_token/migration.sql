-- AlterTable
ALTER TABLE "users" ADD COLUMN "share_token" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "users_share_token_key" ON "users"("share_token");
