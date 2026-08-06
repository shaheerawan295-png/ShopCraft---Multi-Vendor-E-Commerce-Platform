import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
const { title, description, price, category, stock } = req.body;
    let imageUrls = [];
    if(req.files && req.files.length > 0){
      imageUrls = req.files.map((file) => file.path);
    }
    if(imageUrls.length === 0){
      return res.status(400).json({
        success: false,
        message: "Please upload at least one product image.",
      });
    }
    const product = await Product.create({
      title,
      description,
      price : Number(price),
      category,
      stock : Number(stock),
      images: imageUrls,
      vendor: req.user._id,
    });
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only update your own products",
      });
    }
    let updateData = { ...req.body };
    if (req.body.price !== undefined) {
      updateData.price = Number(req.body.price);
    }
    if (req.body.stock !== undefined) {
      updateData.stock = Number(req.body.stock);
    }
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.path);
    }
    product = await Product.findByIdAndUpdate(req.params.id,updateData , {
        new : true,
        runValidators : true,
    });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const deleteProduct = async(req,res) => {
   try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own products",
      });
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
