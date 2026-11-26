import Category from "../models/Category.js";

export async function listActiveCategories(_request, response) {
  const categories = await Category.find({ isActive: true })
    .select("name slug description")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  response.status(200).json({ categories });
}
