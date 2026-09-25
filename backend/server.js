require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const crypto = require("crypto");
const Razorpay = require("razorpay");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const Produce = require("./models/Produce");
const BulkRequirement = require("./models/BulkRequirement");
const BulkOffer = require("./models/BulkOffer");
const Order = require("./models/Order");
const User = require("./models/User");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "farmconnect_secret_2026";

/* =========================================================
   RAZORPAY CONFIGURATION
   ========================================================= */

let razorpay = null;

if (
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("Razorpay configured successfully.");
} else {
  console.log(
    "Razorpay keys not configured. COD will still work."
  );
}

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   AUTHENTICATION MIDDLEWARE
   ========================================================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const parts = authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res.status(401).json({
      message: "Invalid authorization format.",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
}

/* =========================================================
   HOME
   ========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "FarmConnect backend is running 🌱",
  });
});

/* =========================================================
   SIGNUP
   ========================================================= */

app.post(
  "/api/auth/signup",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        location,
        role,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !location ||
        !role
      ) {
        return res.status(400).json({
          message:
            "Please fill all required fields.",
        });
      }

      const allowedRoles = [
        "Farmer",
        "Consumer",
        "Retailer",
        "Admin",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "An account with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        location: location.trim(),
        role,
      });

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.status(201).json({
        message:
          "Account created successfully.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during signup.",
      });
    }
  }
);

/* =========================================================
   LOGIN
   ========================================================= */

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const user =
        await User.findOne({
          email: email
            .trim()
            .toLowerCase(),
        });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.json({
        message:
          "Login successful.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      res.status(500).json({
        message:
          "Server error during login.",
      });
    }
  }
);

/* =========================================================
   CURRENT USER
   ========================================================= */

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      res.json(user);
    } catch (error) {
      console.error(
        "Get user error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to get user.",
      });
    }
  }
);

/* =========================================================
   ADD PRODUCE
   FARMER ONLY
   ========================================================= */

app.post(
  "/api/produce",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can add produce.",
        });
      }

     const body = req.body || {};

const name = body.name;
const quantity = body.quantity;
const price = body.price;
const location = body.location;
const latitude = body.latitude;
const longitude = body.longitude;
const harvestDate = body.harvestDate;
const farmingMethod = body.farmingMethod;
const pesticide = body.pesticide;
      
      let imageUrl = "";

if (req.file) {
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "farmconnect/crops",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(req.file.buffer);
  });

  imageUrl = uploadResult.secure_url;
}

      if (
        !name ||
        quantity === undefined ||
        price === undefined ||
        !location ||
        !harvestDate
      ) {
        return res.status(400).json({
          message:
            "Please provide all required produce details.",
        });
      }

      const numericQuantity =
        Number(quantity);

      const numericPrice =
        Number(price);

      if (
        Number.isNaN(numericQuantity) ||
        numericQuantity < 0
      ) {
        return res.status(400).json({
          message: "Invalid quantity.",
        });
      }

      if (
        Number.isNaN(numericPrice) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          message: "Invalid price.",
        });
      }

      let numericLatitude = null;
      let numericLongitude = null;

      if (
        latitude !== undefined &&
        latitude !== null &&
        latitude !== ""
      ) {
        numericLatitude =
          Number(latitude);

        if (
          Number.isNaN(
            numericLatitude
          ) ||
          numericLatitude < -90 ||
          numericLatitude > 90
        ) {
          return res.status(400).json({
            message:
              "Invalid latitude.",
          });
        }
      }

      if (
        longitude !== undefined &&
        longitude !== null &&
        longitude !== ""
      ) {
        numericLongitude =
          Number(longitude);

        if (
          Number.isNaN(
            numericLongitude
          ) ||
          numericLongitude < -180 ||
          numericLongitude > 180
        ) {
          return res.status(400).json({
            message:
              "Invalid longitude.",
          });
        }
      }

      const produce =
        await Produce.create({
          farmerId:
            req.user.userId,

          name: name.trim(),

          quantity:
            numericQuantity,

          price:
            numericPrice,

          location:
            location.trim(),

          latitude:
            numericLatitude,

          longitude:
            numericLongitude,

          harvestDate,

          farmingMethod:
            farmingMethod || "",

         pesticide:
  pesticide || "",

imageUrl:
  imageUrl,
            
        });

      const populatedProduce =
        await Produce.findById(
          produce._id
        ).populate(
          "farmerId",
          "name email location role"
        );

      res.status(201).json({
        message:
          "Produce added successfully.",
        produce:
          populatedProduce,
      });
    } catch (error) {
      console.error(
        "Add produce error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to add produce.",
      });
    }
  }
);

/* =========================================================
   GET ALL PRODUCE
   PUBLIC
   ========================================================= */

app.get(
  "/api/produce",
  async (req, res) => {
    try {
      const produce =
        await Produce.find()
          .populate(
            "farmerId",
            "name email location role"
          )
          .sort({
            createdAt: -1,
          });

      res.json(produce);
    } catch (error) {
      console.error(
        "Get produce error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to fetch produce.",
      });
    }
  }
);

/* =========================================================
   GET FARMER'S PRODUCE
   ========================================================= */

app.get(
  "/api/produce/my",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can access this page.",
        });
      }

      const produce =
        await Produce.find({
          farmerId:
            req.user.userId,
        })
          .populate(
            "farmerId",
            "name email location role"
          )
          .sort({
            createdAt: -1,
          });

      res.json(produce);
    } catch (error) {
      console.error(
        "Get my produce error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to fetch your produce.",
      });
    }
  }
);

/* =========================================================
   CREATE ORDER
   CONSUMER / RETAILER
   COD + ONLINE
   ========================================================= */

app.post(
  "/api/orders",
  authenticateToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "Consumer" &&
        req.user.role !== "Retailer"
      ) {
        return res.status(403).json({
          message:
            "Only consumers and retailers can place orders.",
        });
      }

      const {
        produceId,
        quantity,
        buyerName,
        buyerLocation,
        paymentMethod = "COD",
      } = req.body;

      if (
        !produceId ||
        !quantity ||
        !buyerName ||
        !buyerLocation
      ) {
        return res.status(400).json({
          message:
            "Please provide all order details.",
        });
      }

      const requestedQuantity =
        Number(quantity);

      if (
        !Number.isFinite(
          requestedQuantity
        ) ||
        requestedQuantity < 1
      ) {
        return res.status(400).json({
          message:
            "Order quantity must be at least 1 kg.",
        });
      }

      if (
        !["COD", "ONLINE"].includes(
          paymentMethod
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid payment method.",
        });
      }

      const produce =
        await Produce.findById(
          produceId
        );

      if (!produce) {
        return res.status(404).json({
          message:
            "Produce not found.",
        });
      }

      if (
        produce.quantity <
        requestedQuantity
      ) {
        return res.status(400).json({
          message:
            "Not enough produce available.",
        });
      }

      const totalPrice =
        requestedQuantity *
        produce.price;

      /* =====================================================
         ONLINE PAYMENT
         ===================================================== */

      if (paymentMethod === "ONLINE") {
        if (!razorpay) {
          return res.status(500).json({
            message:
              "Online payment is not configured on the server yet.",
          });
        }

        const amountInPaise =
          Math.round(
            totalPrice * 100
          );

        const receipt =
          `FC_${Date.now()}`.slice(
            0,
            40
          );

        const razorpayOrder =
          await razorpay.orders.create({
            amount:
              amountInPaise,

            currency: "INR",

            receipt,

            notes: {
              produceId:
                String(
                  produce._id
                ),

              buyerId:
                String(
                  req.user.userId
                ),
            },
          });

        /*
          IMPORTANT:
          Online order stores the real Razorpay ID.
          Produce quantity is NOT reduced yet.
          It is reduced only after payment verification.
        */

        const order =
          await Order.create({
            produceId:
              produce._id,

            produceName:
              produce.name,

            farmerId:
              produce.farmerId,

            buyerId:
              req.user.userId,

            buyerType:
              req.user.role,

            quantity:
              requestedQuantity,

            pricePerKg:
              produce.price,

            totalPrice,

            buyerName:
              buyerName.trim(),

            buyerLocation:
              buyerLocation.trim(),

            paymentMethod:
              "ONLINE",

            paymentStatus:
              "Pending",

            razorpayOrderId:
              razorpayOrder.id,

            status:
              "Pending",
          });

        const populatedOrder =
          await Order.findById(
            order._id
          )
            .populate(
              "farmerId",
              "name email location"
            )
            .populate(
              "buyerId",
              "name email location role"
            )
            .populate(
              "produceId"
            );

        return res.status(201).json({
          message:
            "Razorpay order created",

          order:
            populatedOrder,

          razorpayOrder: {
            id:
              razorpayOrder.id,

            amount:
              razorpayOrder.amount,

            currency:
              razorpayOrder.currency,
          },

          razorpayKey:
            process.env
              .RAZORPAY_KEY_ID,
        });
      }

      /* =====================================================
         CASH ON DELIVERY
         ===================================================== */

      /*
        IMPORTANT FIX:

        DO NOT write:

       

        COD orders do not have a Razorpay order ID.
      */

      const codOrderData = {
  produceId:
    produce._id,

  produceName:
    produce.name,

  farmerId:
    produce.farmerId,

  buyerId:
    req.user.userId,

  buyerType:
    req.user.role,

  quantity:
    requestedQuantity,

  pricePerKg:
    produce.price,

  totalPrice,

  buyerName:
    buyerName.trim(),

  buyerLocation:
    buyerLocation.trim(),

  paymentMethod:
    "COD",

  paymentStatus:
    "Pending",

  status:
    "Pending",
};

/*
  IMPORTANT:
  COD orders must never contain a Razorpay order ID.
  Explicitly remove it if anything accidentally adds it.
*/
delete codOrderData.razorpayOrderId;

const order =
  await Order.create(
    codOrderData
  );
      /*
        COD order is placed immediately,
        so reduce available quantity.
      */
const updatedProduce = await Produce.findOneAndUpdate(
  {
    _id: produce._id,
    quantity: {
      $gte: requestedQuantity,
    },
  },
  {
    $inc: {
      quantity: -requestedQuantity,
    },
  },
  {
    new: true,
  }
);

if (!updatedProduce) {
  return res.status(400).json({
    message:
      "Sorry, this produce has just been sold out or there is not enough quantity available.",
  });
}

      const populatedOrder =
        await Order.findById(
          order._id
        )
          .populate(
            "farmerId",
            "name email location"
          )
          .populate(
            "buyerId",
            "name email location role"
          )
          .populate(
            "produceId"
          );

      return res.status(201).json({
        message:
          "Order placed successfully.",

        order:
          populatedOrder,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to create order.",
      });
    }
  }
);

/* =========================================================
   RAZORPAY PAYMENT VERIFICATION
   ========================================================= */

app.post(
  "/api/payments/verify",
  authenticateToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "Consumer" &&
        req.user.role !== "Retailer"
      ) {
        return res.status(403).json({
          message:
            "Only consumers and retailers can verify payments.",
        });
      }

      if (!razorpay) {
        return res.status(500).json({
          message:
            "Online payment is not configured.",
        });
      }

      const {
        produceId,
        quantity,
        buyerName,
        buyerLocation,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      if (
        !produceId ||
        !quantity ||
        !buyerName ||
        !buyerLocation ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res.status(400).json({
          message:
            "Payment verification details are incomplete.",
        });
      }

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpayOrderId}|${razorpayPaymentId}`
          )
          .digest("hex");

      if (
        generatedSignature.length !==
        razorpaySignature.length ||
        !crypto.timingSafeEqual(
          Buffer.from(
            generatedSignature
          ),
          Buffer.from(
            razorpaySignature
          )
        )
      ) {
        return res.status(400).json({
          message:
            "Payment verification failed.",
        });
      }

      const razorpayOrder =
        await razorpay.orders.fetch(
          razorpayOrderId
        );

      const requestedQuantity =
        Number(quantity);

      if (
        !Number.isFinite(
          requestedQuantity
        ) ||
        requestedQuantity < 1
      ) {
        return res.status(400).json({
          message:
            "Invalid quantity.",
        });
      }

      const produce =
        await Produce.findById(
          produceId
        );

      if (!produce) {
        return res.status(404).json({
          message:
            "Produce not found.",
        });
      }

      const totalPrice =
        requestedQuantity *
        produce.price;

      const expectedAmount =
        Math.round(
          totalPrice * 100
        );

      if (
        razorpayOrder.amount !==
          expectedAmount ||
        razorpayOrder.currency !==
          "INR"
      ) {
        return res.status(400).json({
          message:
            "Payment amount does not match the order.",
        });
      }

      if (
        produce.quantity <
        requestedQuantity
      ) {
        return res.status(400).json({
          message:
            "Not enough produce available.",
        });
      }

      /* Prevent duplicate payment verification */

      const existingOrder =
        await Order.findOne({
          razorpayOrderId,
        });

      if (existingOrder) {
        return res.json({
          message:
            "Payment already verified and order exists.",

          order:
            existingOrder,
        });
      }

      const order =
        await Order.create({
          produceId:
            produce._id,

          produceName:
            produce.name,

          farmerId:
            produce.farmerId,

          buyerId:
            req.user.userId,

          buyerType:
            req.user.role,

          quantity:
            requestedQuantity,

          pricePerKg:
            produce.price,

          totalPrice,

          buyerName:
            buyerName.trim(),

          buyerLocation:
            buyerLocation.trim(),

          paymentMethod:
            "ONLINE",

          paymentStatus:
            "Paid",

          razorpayOrderId,

          razorpayPaymentId,

          razorpaySignature,

          status:
            "Pending",
        });

      /* Reduce quantity only after successful payment */

      produce.quantity -=
        requestedQuantity;

      await produce.save();

      const populatedOrder =
        await Order.findById(
          order._id
        )
          .populate(
            "farmerId",
            "name email location"
          )
          .populate(
            "buyerId",
            "name email location role"
          )
          .populate(
            "produceId"
          );

      res.status(201).json({
        message:
          "Payment verified and order created successfully.",

        order:
          populatedOrder,
      });
    } catch (error) {
      console.error(
        "Verify Razorpay payment error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to verify payment.",
      });
    }
  }
);

/* =========================================================
   FARMER ORDERS
   ========================================================= */

app.get(
  "/api/orders",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can access orders.",
        });
      }

      const orders =
        await Order.find({
          farmerId:
            req.user.userId,
        })
          .populate(
            "buyerId",
            "name email location role"
          )
          .populate(
            "produceId"
          )
          .sort({
            createdAt: -1,
          });

      res.json(orders);
    } catch (error) {
      console.error(
        "Get farmer orders error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to fetch farmer orders.",
      });
    }
  }
);

/* =========================================================
   BUYER ORDERS
   ========================================================= */

app.get(
  "/api/orders/my",
  authenticateToken,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          buyerId:
            req.user.userId,
        })
          .populate(
            "produceId"
          )
          .populate(
            "farmerId",
            "name email location"
          )
          .sort({
            createdAt: -1,
          });

      res.json(orders);
    } catch (error) {
      console.error(
        "Get buyer orders error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to fetch your orders.",
      });
    }
  }
);

/* =========================================================
   LEGACY BUYER NAME SEARCH
   ========================================================= */

app.get(
  "/api/orders/buyer/:buyerName",
  authenticateToken,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          buyerName:
            req.params.buyerName,
        }).sort({
          createdAt: -1,
        });

      res.json(orders);
    } catch (error) {
      console.error(
        "Buyer name search error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to find orders.",
      });
    }
  }
);

/* =========================================================
   UPDATE ORDER STATUS
   FARMER ONLY
   ========================================================= */

app.patch(
  "/api/orders/:id/status",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can update order status.",
        });
      }

      const {
        status,
      } = req.body;

      const allowedStatuses = [
        "Pending",
        "Accepted",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Rejected",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid order status.",
        });
      }
      
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found.",
        });
      }

      if (
        !order.farmerId ||
        order.farmerId.toString() !==
          req.user.userId.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only update your own orders.",
        });
      }

      order.status =
        status;

      /*
        COD is considered paid when
        the farmer marks the order Delivered.
      */

      if (
        order.paymentMethod ===
          "COD" &&
        status === "Delivered"
      ) {
        order.paymentStatus =
          "Paid";
      }

      await order.save();

      const updatedOrder =
        await Order.findById(
          order._id
        )
          .populate(
            "buyerId",
            "name email location role"
          )
          .populate(
            "produceId"
          )
          .populate(
            "farmerId",
            "name email location"
          );

      res.json({
        message:
          "Order status updated successfully.",

        order:
          updatedOrder,
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to update order status.",
      });
    }
  }
);
// ===============================
// FARMCONNECT AI ASSISTANT
// ===============================

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please provide a question.",
      });
    }

    const languageNames = {
      "en-IN": "English",
      "hi-IN": "Hindi",
      "mr-IN": "Marathi",
    };

    const selectedLanguage =
      languageNames[language] || "English";

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are FarmConnect AI, an agricultural assistant
designed especially for farmers in India.

Answer the farmer in ${selectedLanguage}.

Important rules:

1. Use simple language that farmers can understand.
2. Give practical and useful farming guidance.
3. You can help with:
   - Crops
   - Soil
   - Irrigation
   - Fertilizers
   - Pests
   - Crop diseases
   - Harvesting
   - Storage
   - Farming practices
   - General agricultural questions

4. Do not invent live market prices.
5. Do not invent current weather information.
6. Do not invent government schemes or current eligibility details.
7. If the farmer asks for live information, clearly explain
   that current data needs to be checked from an appropriate
   live source.
8. Never claim that you personally inspected the farmer's crop.
9. For serious crop disease or pesticide decisions,
   recommend consulting a local agricultural expert.
10. Keep answers reasonably concise.
11. Always respond in ${selectedLanguage}.
      `,

          input: message.trim(),
  });

  const answer = response.output_text;

  res.json({
    answer,
    language: selectedLanguage,
  });

} catch (error) {

  console.error(
    "================ FARMCONNECT AI ERROR ================"
  );

  console.error(
    "Message:",
    error?.message
  );

  console.error(
    "Status:",
    error?.status || error?.response?.status
  );

  console.error(
    "Details:",
    error?.response?.data || error
  );

  console.error(
    "======================================================="
  );

  res.status(500).json({
    message:
      "AI assistant is temporarily unavailable.",
  });
}
});

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});
// =========================================================
// BULK REQUIREMENTS
// =========================================================

// Retailer creates a bulk requirement
app.post(
  "/api/bulk-requirements",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Retailer") {
        return res.status(403).json({
          message: "Only retailers can create bulk requirements.",
        });
      }

      const {
  produceName,
  quantity,
  expectedPrice,
  deliveryLocation,
  deliveryLatitude,
  deliveryLongitude,
  requiredBy,
  requirements,
} = req.body;

      if (
        !produceName ||
        !quantity ||
        !expectedPrice ||
        !deliveryLocation ||
        !requiredBy
      ) {
        return res.status(400).json({
          message: "Please fill all required fields.",
        });
      }

      const bulkRequirement = await BulkRequirement.create({
  retailerId: req.user.id,
  produceName,
  quantity: Number(quantity),
  expectedPrice: Number(expectedPrice),
  deliveryLocation,

  deliveryLatitude:
    deliveryLatitude === "" ||
    deliveryLatitude === undefined
      ? null
      : Number(deliveryLatitude),

  deliveryLongitude:
    deliveryLongitude === "" ||
    deliveryLongitude === undefined
      ? null
      : Number(deliveryLongitude),

  requiredBy,
  requirements: requirements || "",
});

      res.status(201).json({
        message: "Bulk requirement posted successfully.",
        requirement: bulkRequirement,
      });
    } catch (error) {
      console.error("Create bulk requirement error:", error);

      res.status(500).json({
        message: "Failed to create bulk requirement.",
      });
    }
  }
);
// Farmer submits an offer for a bulk requirement
app.post(
  "/api/bulk-requirements/:requirementId/offers",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message: "Only farmers can submit offers.",
        });
      }

      const { requirementId } = req.params;

      const {
        offeredQuantity,
        offeredPrice,
        message,
      } = req.body;

      if (!offeredQuantity || !offeredPrice) {
        return res.status(400).json({
          message: "Please provide quantity and price.",
        });
      }

      const requirement =
        await BulkRequirement.findById(requirementId);

      if (!requirement) {
        return res.status(404).json({
          message: "Bulk requirement not found.",
        });
      }

      if (requirement.status === "Closed") {
        return res.status(400).json({
          message: "This requirement is closed.",
        });
      }

      if (requirement.status === "Fulfilled") {
        return res.status(400).json({
          message: "This requirement is already fulfilled.",
        });
      }

      if (Number(offeredQuantity) > requirement.quantity) {
        return res.status(400).json({
          message: `Maximum quantity allowed is ${requirement.quantity} kg.`,
        });
      }

      const offer = await BulkOffer.create({
        requirementId,
        farmerId: req.user.id,
        offeredQuantity: Number(offeredQuantity),
        offeredPrice: Number(offeredPrice),
        message: message || "",
      });

      res.status(201).json({
        message: "Offer submitted successfully.",
        offer,
      });
    } catch (error) {
      console.error("Submit bulk offer error:", error);

      res.status(500).json({
        message: "Failed to submit offer.",
      });
    }
  }
);
// Retailer views their own bulk requirements
app.get(
  "/api/bulk-requirements/my",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Retailer") {
        return res.status(403).json({
          message: "Only retailers can view their bulk requirements.",
        });
      }

      const requirements = await BulkRequirement.find({
        retailerId: req.user.id,
      })
        .sort({ createdAt: -1 });

      res.status(200).json({
        requirements,
      });
    } catch (error) {
      console.error(
        "Get retailer bulk requirements error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch your bulk requirements.",
      });
    }
  }
);
// Retailer views offers for one of their bulk requirements
app.get(
  "/api/bulk-requirements/:requirementId/offers",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Retailer") {
        return res.status(403).json({
          message: "Only retailers can view bulk offers.",
        });
      }

      const { requirementId } = req.params;

      const requirement =
        await BulkRequirement.findById(requirementId);

      if (!requirement) {
        return res.status(404).json({
          message: "Bulk requirement not found.",
        });
      }

      if (
        requirement.retailerId.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only view offers for your own requirements.",
        });
      }

      const offers = await BulkOffer.find({
        requirementId,
      })
        .populate(
          "farmerId",
          "name email location role"
        )
        .sort({ createdAt: -1 });

      res.status(200).json({
        offers,
      });
    } catch (error) {
      console.error(
        "Get bulk offers error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch bulk offers.",
      });
    }
  }
);
/* =========================================================
   MONGODB CONNECTION
   ========================================================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully 🌱");

    app.listen(PORT, () => {
      console.log(
        `FarmConnect backend running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error
    );
  });