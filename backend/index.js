const config = require('./config')
const express = require('express')
const cors = require('cors')
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/Auth")
const productRoutes = require("./routes/Product")
const orderRoutes = require("./routes/Order")
const cartRoutes = require("./routes/Cart")
const brandRoutes = require("./routes/Brand")
const categoryRoutes = require("./routes/Category")
const userRoutes = require("./routes/User")
const addressRoutes = require('./routes/Address')
const reviewRoutes = require("./routes/Review")
const wishlistRoutes = require("./routes/Wishlist")
const { connectToDB } = require("./database/db")


// server init
const server = express()

// database connection
connectToDB()


// middlewares
const normalizeOrigin = (origin) => {
    if (!origin || typeof origin !== 'string') return origin;
    try {
        const u = new URL(origin);
        return `${u.protocol}//${u.host}`;
    } catch {
        return origin;
    }
};

const allowedOrigins = [
    config.ORIGIN,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [])
];

const isVercelPreviewOrigin = (origin) => {
    try {
        const u = new URL(origin);
        if (u.hostname.endsWith('.vercel.app')) {
            const parts = u.hostname.split('.');
            if (parts.length >= 3) {
                const subdomain = parts.slice(0, -2).join('.');
                return subdomain === 'full-stack-advanced-ecommerce-system' || subdomain.startsWith('full-stack-advanced-ecommerce-system-');
            }
        }
    } catch {}
    return false;
};

const getCorsOrigin = () => {
    const origins = allowedOrigins.map(s => normalizeOrigin(s)).filter(Boolean);
    if (origins.length === 0) return true;
    return (origin, callback) => {
        const normalized = normalizeOrigin(origin);
        if (!origin || origins.includes(normalized) || isVercelPreviewOrigin(normalized)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    };
};

server.use(cors({origin: getCorsOrigin(), credentials: true, exposedHeaders: ['X-Total-Count'], methods: ['GET', 'POST', 'PATCH', 'DELETE']}))
server.use(express.json())
server.use(cookieParser())
server.use(morgan("tiny"))

// routeMiddleware
server.use("/auth", authRoutes)
server.use("/users", userRoutes)
server.use("/products", productRoutes)
server.use("/orders", orderRoutes)
server.use("/cart", cartRoutes)
server.use("/brands", brandRoutes)
server.use("/categories", categoryRoutes)
server.use("/address", addressRoutes)
server.use("/reviews", reviewRoutes)
server.use("/wishlist", wishlistRoutes)



server.get("/",(req,res)=>{
    res.status(200).json({message:'running'})
})

server.listen(8000,()=>{
    console.log('server [STARTED] ~ http://localhost:8000');
})
