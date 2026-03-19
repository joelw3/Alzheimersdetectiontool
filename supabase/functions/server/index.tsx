import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { predictAlzheimerRisk, getModelMetrics } from "./xgboost_model.tsx";
import type { XGBoostFeatures } from "./xgboost_model.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-57b7b6f3/health", (c) => {
  return c.json({ status: "ok" });
});

// XGBoost prediction endpoint
app.post("/make-server-57b7b6f3/predict-risk", async (c) => {
  try {
    const features: Partial<XGBoostFeatures> = await c.req.json();
    
    console.log("Received features for prediction:", features);
    
    const prediction = await predictAlzheimerRisk(features);
    
    return c.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Model metrics endpoint
app.get("/make-server-57b7b6f3/model-metrics", (c) => {
  const metrics = getModelMetrics();
  return c.json(metrics);
});

Deno.serve(app.fetch);