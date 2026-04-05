-- CreateTable
CREATE TABLE "OrganizationLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "kind" TEXT,
    "acquiredAt" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMovement" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,
    "locationDescription" TEXT NOT NULL,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMovement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrganizationLocation" ADD CONSTRAINT "OrganizationLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerMovement" ADD CONSTRAINT "PlayerMovement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
