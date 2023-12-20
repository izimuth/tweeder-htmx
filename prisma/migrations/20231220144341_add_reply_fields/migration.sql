-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "replyToPostId" INTEGER;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_replyToPostId_fkey" FOREIGN KEY ("replyToPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
