-- CreateTable
CREATE TABLE "tweets" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" VARCHAR(280) NOT NULL DEFAULT '',
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tweet_media" (
    "id" UUID NOT NULL,
    "tweet_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "tweet_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tweets_author_id_id_idx" ON "tweets"("author_id", "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tweet_media_tweet_id_position_key" ON "tweet_media"("tweet_id", "position");

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_media" ADD CONSTRAINT "tweet_media_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
