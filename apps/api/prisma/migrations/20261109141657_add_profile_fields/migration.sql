-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "banner_url" TEXT,
ADD COLUMN     "bio" VARCHAR(160),
ADD COLUMN     "location" VARCHAR(30),
ADD COLUMN     "website" VARCHAR(100);
