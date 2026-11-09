-- AlterTable
ALTER TABLE "tweets" ADD COLUMN     "search_vector" tsvector;

-- CreateTable
CREATE TABLE "tweet_hashtags" (
    "tweet_id" UUID NOT NULL,
    "tag" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tweet_hashtags_pkey" PRIMARY KEY ("tweet_id","tag")
);

-- CreateTable
CREATE TABLE "mentions" (
    "tweet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("tweet_id","user_id")
);

-- CreateIndex
CREATE INDEX "tweet_hashtags_tag_tweet_id_idx" ON "tweet_hashtags"("tag", "tweet_id" DESC);

-- CreateIndex
CREATE INDEX "tweet_hashtags_created_at_idx" ON "tweet_hashtags"("created_at");

-- CreateIndex
CREATE INDEX "mentions_user_id_idx" ON "mentions"("user_id");

-- CreateIndex
CREATE INDEX "tweets_search_vector_idx" ON "tweets" USING GIN ("search_vector");

-- AddForeignKey
ALTER TABLE "tweet_hashtags" ADD CONSTRAINT "tweet_hashtags_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Busca full-text (escrito à mão: o Prisma não gerencia extensões, funções nem triggers)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() não é IMMUTABLE (o dicionário poderia mudar), então não pode ser usado em
-- índices. Este wrapper fixa o dicionário e se declara IMMUTABLE.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Mantém search_vector sincronizado com o texto do post.
-- 'portuguese' faz stemming ("programando" e "programar" viram "program").
CREATE OR REPLACE FUNCTION tweets_search_vector_update() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', immutable_unaccent(NEW.content));
  RETURN NEW;
END
$$;

CREATE TRIGGER tweets_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content ON "tweets"
  FOR EACH ROW EXECUTE FUNCTION tweets_search_vector_update();

-- preenche os posts que já existiam
UPDATE "tweets" SET search_vector = to_tsvector('portuguese', immutable_unaccent(content));
