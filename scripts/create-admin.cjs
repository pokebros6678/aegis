/**
 * One-time bootstrap: create the first ADMIN when StaffUser table is empty.
 *
 *   ADMIN_USERNAME=alice ADMIN_PASSWORD='secret' node scripts/create-admin.cjs
 *
 * Exits non-zero if any staff user already exists or env is missing.
 * After git pull, run `npm ci` (or `npm install`) so bcryptjs/dotenv are installed.
 */
const path = require("path");

function requireOrExit(spec, humanName) {
  try {
    return require(spec);
  } catch (e) {
    if (e && e.code === "MODULE_NOT_FOUND") {
      console.error(
        `create-admin: missing dependency "${humanName}". From the repo root run:\n` +
          `  npm ci\n` +
          `then retry create-admin (see README Staff accounts).`,
      );
      process.exit(1);
    }
    throw e;
  }
}

const { config } = requireOrExit("dotenv", "dotenv");
config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = requireOrExit("bcryptjs", "bcryptjs");
const { PrismaClient } = requireOrExit("@prisma/client", "@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.staffUser.count();
  if (count > 0) {
    console.error(
      "create-admin: staff users already exist. Use /settings/users or remove users first.",
    );
    process.exit(1);
  }

  const usernameRaw = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!usernameRaw?.trim() || !password) {
    console.error(
      "create-admin: set ADMIN_USERNAME and ADMIN_PASSWORD (e.g. in shell or .env).",
    );
    process.exit(1);
  }

  const username = usernameRaw.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.staffUser.create({
    data: {
      username,
      passwordHash,
      role: "ADMIN",
      displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || null,
    },
  });

  console.log("create-admin: created ADMIN user:", username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
