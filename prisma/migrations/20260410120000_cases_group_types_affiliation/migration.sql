-- Affiliation: drop linked profile, require organization
DELETE FROM "Affiliation" WHERE "organizationId" IS NULL;

ALTER TABLE "Affiliation" DROP CONSTRAINT IF EXISTS "Affiliation_relatedPlayerId_fkey";
ALTER TABLE "Affiliation" DROP COLUMN IF EXISTS "relatedPlayerId";

ALTER TABLE "Affiliation" DROP CONSTRAINT IF EXISTS "Affiliation_organizationId_fkey";
ALTER TABLE "Affiliation" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OrganizationType enum swap
CREATE TYPE "OrganizationType_new" AS ENUM ('COM', 'SUSPECTED_COM', 'ROBLOX', 'NSFW');

ALTER TABLE "Organization" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Organization" ALTER COLUMN "type" TYPE "OrganizationType_new" USING (
  CASE "type"::text
    WHEN 'COM' THEN 'COM'::"OrganizationType_new"
    WHEN 'SUSPECTED_COM' THEN 'SUSPECTED_COM'::"OrganizationType_new"
    WHEN 'ROBLOX' THEN 'ROBLOX'::"OrganizationType_new"
    WHEN 'NSFW' THEN 'NSFW'::"OrganizationType_new"
    ELSE 'COM'::"OrganizationType_new"
  END
);

DROP TYPE "OrganizationType";
ALTER TYPE "OrganizationType_new" RENAME TO "OrganizationType";

-- Cases
CREATE TYPE "CaseCategory" AS ENUM ('COMPLIANCE_REPORTING', 'ANALYTICS');

CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "category" "CaseCategory" NOT NULL,
    "seq" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "playerId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CasePost" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CasePost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE UNIQUE INDEX "Case_category_seq_key" ON "Case"("category", "seq");

ALTER TABLE "Case" ADD CONSTRAINT "Case_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CasePost" ADD CONSTRAINT "CasePost_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CasePost" ADD CONSTRAINT "CasePost_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
