import Category from "../models/Category.js";
import Product from "../models/Product.js";
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};
export const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    const cleanName = name.trim();

    const existing = await Category.findOne({ 
      name : {$regex: new RegExp(`^${cleanName}$`, "i")}
     });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({ name, icon: icon ? icon.trim() : "Tag" });
    res.status(201).json({ success: true, category, message: "Category created" });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    
    const productsInUse = await Product.countDocuments({
      category: category.name,
    });
    if (productsInUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${productsInUse} product(s) still use this category. Reassign them first.`,
      });
    }

    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};