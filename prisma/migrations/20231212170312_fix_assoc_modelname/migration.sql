/*
  Warnings:

  - You are about to drop the `UserAssociations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAssociations" DROP CONSTRAINT "UserAssociations_sourceUserId_fkey";

-- DropForeignKey
ALTER TABLE "UserAssociations" DROP CONSTRAINT "UserAssociations_targetUserId_fkey";

-- DropTable
DROP TABLE "UserAssociations";

-- CreateTable
CREATE TABLE "UserAssociation" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUserId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,

    CONSTRAINT "UserAssociation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAssociation" ADD CONSTRAINT "UserAssociation_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssociation" ADD CONSTRAINT "UserAssociation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
