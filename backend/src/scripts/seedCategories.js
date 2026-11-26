import "dotenv/config";
import { connectDatabase } from "../config/database.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

const categories = [
  {
    name: "Account access",
    slug: "account-access",
    description: "Sign-in, account recovery, and profile access.",
    sortOrder: 1,
  },
  {
    name: "Billing",
    slug: "billing",
    description: "Payments, invoices, and subscription questions.",
    sortOrder: 2,
  },
  {
    name: "Technical support",
    slug: "technical-support",
    description: "Troubleshooting product issues and unexpected behavior.",
    sortOrder: 3,
  },
  {
    name: "Other",
    slug: "other",
    description: "Questions that do not fit another category.",
    sortOrder: 4,
  },
];

async function run() {
  try {
    await connectDatabase();
    for (const category of categories) {
      await Category.updateOne(
        { slug: category.slug },
        { $setOnInsert: category },
        { upsert: true, runValidators: true },
      );
    }
    console.log(`Ensured ${categories.length} default ticket categories.`);
  } catch (error) {
    console.error("Category seeding failed:", error.message);
    process.exitCode = 1;
  }

  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("MongoDB disconnect failed:", error.message);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Category seeding failed unexpectedly:", error.message);
  process.exitCode = 1;
});
