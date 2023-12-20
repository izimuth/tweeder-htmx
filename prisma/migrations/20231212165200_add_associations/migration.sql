-- CreateTable
CREATE TABLE "UserAssociations" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUserId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,

    CONSTRAINT "UserAssociations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAssociations" ADD CONSTRAINT "UserAssociations_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssociations" ADD CONSTRAINT "UserAssociations_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
