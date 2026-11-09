-- AlterTable
ALTER TABLE "tweets" ADD COLUMN     "is_quote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_reply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quote_of_id" UUID,
ADD COLUMN     "reply_to_id" UUID,
ADD COLUMN     "retweet_of_id" UUID;

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tweet_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tweet_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "likes_tweet_id_idx" ON "likes"("tweet_id");

-- CreateIndex
CREATE INDEX "likes_user_id_id_idx" ON "likes"("user_id", "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_tweet_id_key" ON "likes"("user_id", "tweet_id");

-- CreateIndex
CREATE INDEX "bookmarks_tweet_id_idx" ON "bookmarks"("tweet_id");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_id_idx" ON "bookmarks"("user_id", "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_tweet_id_key" ON "bookmarks"("user_id", "tweet_id");

-- CreateIndex
CREATE INDEX "tweets_reply_to_id_id_idx" ON "tweets"("reply_to_id", "id");

-- CreateIndex
CREATE INDEX "tweets_quote_of_id_idx" ON "tweets"("quote_of_id");

-- CreateIndex
CREATE INDEX "tweets_retweet_of_id_idx" ON "tweets"("retweet_of_id");

-- CreateIndex
CREATE UNIQUE INDEX "tweets_author_id_retweet_of_id_key" ON "tweets"("author_id", "retweet_of_id");

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_quote_of_id_fkey" FOREIGN KEY ("quote_of_id") REFERENCES "tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_retweet_of_id_fkey" FOREIGN KEY ("retweet_of_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Regras de integridade que o Prisma não expressa no schema (escritas à mão):
-- um repost não tem texto próprio e não é resposta nem citação
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_retweet_is_empty"
  CHECK ("retweet_of_id" IS NULL OR ("content" = '' AND "is_reply" = false AND "is_quote" = false));
-- um post não pode responder, citar ou repostar a si mesmo
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_no_self_reference"
  CHECK ("reply_to_id" <> "id" AND "quote_of_id" <> "id" AND "retweet_of_id" <> "id");
