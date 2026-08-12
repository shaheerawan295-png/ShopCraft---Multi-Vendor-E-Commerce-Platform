import Product from "../models/Product.js";
import { v2 as cloudinary } from "cloudinary";




const extractPublicId = (url) => {
  try {
    const str = String(url);
    const uploadIdx = str.indexOf("/upload/");
    if (uploadIdx === -1) return null;

    const after = str.slice(uploadIdx + "/upload/".length);

    
    const withVersion = after.match(/(?:^|\/)v\d+\/(.+?)\.[a-zA-Z0-9]+$/);
    if (withVersion) return withVersion[1];

    const plain = after.match(/(.+?)\.[a-zA-Z0-9]+$/);
    return plain ? plain[1] : null;
  } catch {
    return null;
  }
};

const destroyCloudinaryImages = async (images) => {
  const publicIds = (Array.isArray(images) ? images : [])
    .map(extractPublicId)
    .filter(Boolean);
  await Promise.all(
    publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => {}))
  );
};

const isApprovedVendor = (req) =>
  req.user.role !== "vendor" || req.user.isApproved !== false;

export const createProduct = async (req, res) => {
  try {
    if (!isApprovedVendor(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Your vendor account is pending approval. You cannot manage products yet.",
      });
    }

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
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
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
    if (!isApprovedVendor(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Your vendor account is pending approval. You cannot manage products yet.",
      });
    }
    
    const ALLOWED_FIELDS = [
      "title",
      "description",
      "price",
      "category",
      "stock",
      "isPublished",
    ];
    const updateData = {};

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (req.body.price !== undefined) {
      updateData.price = Number(req.body.price);
    }
    if (req.body.stock !== undefined) {
      updateData.stock = Number(req.body.stock);
    }
    if (req.body.existingImages) {
      let parsed = req.body.existingImages;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (err) {
          parsed = [];
        }
      }
      if (Array.isArray(parsed)) {
        updateData.images = parsed;
      }
    }
    if (req.files && req.files.length > 0) {
      updateData.images = [
        ...(Array.isArray(updateData.images) ? updateData.images : []),
        ...req.files.map((file) => file.path),
      ];
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
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
    if (!isApprovedVendor(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Your vendor account is pending approval. You cannot manage products yet.",
      });
    }

    await product.deleteOne();

    
    await destroyCloudinaryImages(product.images);

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};
