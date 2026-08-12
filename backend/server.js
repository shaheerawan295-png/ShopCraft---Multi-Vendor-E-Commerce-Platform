import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import cookieParser from "cookie-parser";
import productRoutes from "./src/routes/productRoutes.js";
import publicProductRoutes from "./src/routes/publicProductRoutes.js";
import errorHandler from "./src/middlewares/errorMiddleware.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import earningsRoutes from "./src/routes/earningsRoutes.js";
import couponRoutes from "./src/routes/couponRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";

connectDB();
const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
})


app.use('/api/v1/auth',authRoutes)
app.use('/api/v1/products',productRoutes);
app.use("/api/v1/public/products", publicProductRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments",paymentRoutes);
app.use('/api/v1/earnings',earningsRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin",adminRoutes);
app.use("/api/v1/categories",categoryRoutes);





app.get('/',(req,res) => {
    res.send("ShopCraft API is running live!");
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});


app.use(errorHandler);

const PORT =process.env.PORT ||5000;
app.listen(PORT,() => { 
    console.log(`Server successfully running on port ${PORT}`);
});
