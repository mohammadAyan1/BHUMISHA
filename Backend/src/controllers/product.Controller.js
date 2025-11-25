const Product = require("../models/productsModel");
const db = require("../config/db");

const validate = (body, isCreate = true) => {
  const errors = [];
  if (isCreate && (body.category_id === undefined || body.category_id === "")) {
    errors.push("category_id is required");
  }
  if (
    isCreate &&
    (body.product_name === undefined || String(body.product_name).trim() === "")
  ) {
    errors.push("product_name is required");
  }
  if (body.size !== undefined && String(body.size).length > 64) {
    errors.push("size too long (max 64)");
  }
  const numericFields = [
    "purchase_rate",
    "transport_charge",
    "local_transport",
    "packaging_cost",
    "packing_weight",
    "value",
    "discount_30",
    "discount_25",
    "discount_50",
    "total",
    "gst",
  ];
  numericFields.forEach((f) => {
    if (body[f] !== undefined && body[f] !== null && body[f] !== "") {
      if (isNaN(Number(body[f]))) errors.push(`${f} must be a number`);
    }
  });
  return errors;
};

// update trash record and adjust product stock by delta
const updateTrashProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.updateTrashProduct(id, req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(result || { message: "Trash updated" });
  });
};

// delete trash record and restore product stock
const deleteTrashProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.deleteTrashProduct(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(result || { message: "Trash deleted" });
  });
};

const safeErr = (err) => ({
  error: err?.sqlMessage || err?.message || String(err),
});

// Create (same)
const createProduct = (req, res) => {
  const errors = validate(req.body, true);
  if (errors.length) return res.status(400).json({ errors });
  Product.create(req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res
      .status(201)
      .json({ message: "Product created", id: result.insertId });
  });
};

const createCustomProduct = async (req, res) => {
  try {
    // ✅ 1. Create the custom product
    const result = await Product.createCustomProduct(req.body);

    // ✅ 2. Update ingredient stock (subtract quantity)
    for (const item of req.body.selectedProductIds) {
      db.query(`UPDATE products SET size = size - ? WHERE id = ?`, [
        item.qty,
        item.productId,
      ]);
    }

    // ✅ 3. Respond to client
    return res.status(200).json({
      success: true,
      message: result.message,
      productId: result.productId,
    });
  } catch (error) {
    console.error("❌ Error in createCustomProduct:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      error: error.error || error,
    });
  }
};

const getByIdCustomProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.getCustomProductById(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(result[0]);
  });
};

// List (same)
const getProducts = (req, res) => {
  Product.getAll((err, results) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(results);
  });
};

// Get one (same)
const getProductById = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.getById(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(result[0]);
  });
};

// Update (sanitizer + whitelist + partial)
const updateProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  // 1) Drop empty strings so they don't overwrite
  const clean = {};
  Object.entries(req.body || {}).forEach(([k, v]) => {
    if (v !== "") clean[k] = v;
  });

  // 2) Whitelist only known fields
  const allowed = new Set([
    "category_id",
    "product_name",
    "size",
    "purchase_rate",
    "transport_charge",
    "local_transport",
    "packaging_cost",
    "packing_weight",
    "hsn_code",
    "value",
    "discount_30",
    "discount_25",
    "discount_50",
    "total",
    "gst",
  ]);
  const filtered = {};
  Object.keys(clean).forEach((k) => {
    if (allowed.has(k)) filtered[k] = clean[k];
  });

  const errors = validate(filtered, false);
  if (errors.length) return res.status(400).json({ errors });

  // 3) If nothing to update, short-circuit
  if (!Object.keys(filtered).length) {
    return res.json({ message: "Nothing to update" });
  }

  Product.update(id, filtered, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product updated" });
  });
};

const updateCustomProduct = (req, res) => {
  const id = Number(req.params.id);

  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.updateCustomProduct(id, req.body, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product updated" });
  });
};

// Delete (same)
const deleteProduct = (req, res) => {
  const id = Number(req.params.id);

  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.delete(id, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product deleted" });
  });
};

// Trash product Controller

// create a trash product
const createTrashProduct = (req, res) => {
  Product.createTrashProduct(req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res
      .status(201)
      .json({ message: "Product created", id: result.insertId });
  });
};
// fetch all trash product
const getTrashProducts = (req, res) => {
  Product.getAllTrashProduct((err, results) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(results);
  });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createCustomProduct,
  getByIdCustomProduct,
  updateCustomProduct,
  createTrashProduct,
  getTrashProducts,
  updateTrashProduct,
  deleteTrashProduct,
};
