-- Drop removed feature tables
DROP TABLE IF EXISTS "Vehicle";
DROP TABLE IF EXISTS "EmploymentRecord";
DROP TABLE IF EXISTS "PlayerMovement";

-- Player: Discord-centric identity
ALTER TABLE "Player" RENAME COLUMN "ssn" TO "discordId";
ALTER TABLE "Player" RENAME COLUMN "firstName" TO "discordUser";
ALTER TABLE "Player" DROP COLUMN "lastName";
ALTER TABLE "Player" DROP COLUMN "dateOfBirth";
ALTER TABLE "Player" ADD COLUMN "notes" TEXT;

-- Affiliation: link to Organization instead of free-text name
ALTER TABLE "Affiliation" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Affiliation" DROP COLUMN "name";
