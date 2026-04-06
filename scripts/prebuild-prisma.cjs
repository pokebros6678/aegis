#!/usr/bin/env node
/**
 * Runs before `next build`. Always: validate + generate.
 * Runs `migrate deploy` unless SKIP_PRISMA_MIGRATE_ON_BUILD=1 (e.g. CI image build without DB).
 */
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma validate");
run("npx prisma generate");

if (process.env.SKIP_PRISMA_MIGRATE_ON_BUILD === "1") {
  console.log("prebuild-prisma: skipping migrate deploy (SKIP_PRISMA_MIGRATE_ON_BUILD=1)");
  process.exit(0);
}

run("npx prisma migrate deploy");
