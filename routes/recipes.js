// routes/recipes.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/verifyToken");

// Spoonacular routes (unchanged)
router.get("/search", async (req, res) => {
  const { ingredients } = req.query;
  try {
    const response = await axios.get("https://api.spoonacular.com/recipes/findByIngredients", {
      params: { ingredients, number: 8, apiKey: process.env.SPOONACULAR_API_KEY }
    });
    res.json(response.data);
  } catch (err) {
    console.error("Error in /search:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/random", async (req, res) => {
  try {
    const response = await axios.get("https://api.spoonacular.com/recipes/random", {
      params: { number: 1, apiKey: process.env.SPOONACULAR_API_KEY }
    });
    const recipe = response.data.recipes[0];
    res.json({
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map(i => i.original),
      readyin: recipe.readyInMinutes || 0
    });
  } catch (err) {
    console.error("Error in /random:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to load random recipe" });
  }
});

// --- CRUD per-user --- //

// Get all recipes for the logged-in user
router.get("/all", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes WHERE user_id=$1 ORDER BY id DESC", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("DB Error (GET all):", err.message);
    res.status(500).json({ error: "Failed to load recipes" });
  }
});

// Add recipe (belongs to req.user)
router.post("/", verifyToken, async (req, res) => {
  const { title, image, instructions, ingredients, readyin } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO recipes (title, image, instructions, ingredients, readyin, user_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, image, instructions, ingredients, readyin, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB Error (POST):", err.message);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

// Update recipe — only owner can update
router.put("/:id", verifyToken, async (req, res) => {
  const { title, image, instructions, ingredients, readyin } = req.body;
  const recipeId = req.params.id;

  try {
    // check owner
    const ownerRes = await pool.query("SELECT user_id FROM recipes WHERE id=$1", [recipeId]);
    if (ownerRes.rows.length === 0) return res.status(404).json({ error: "Recipe not found" });

    if (parseInt(ownerRes.rows[0].user_id) !== parseInt(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `UPDATE recipes
       SET title=$1, image=$2, instructions=$3, ingredients=$4, readyin=$5
       WHERE id=$6 RETURNING *`,
      [title, image, instructions, ingredients, readyin, recipeId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB Error (PUT):", err.message);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});


// Delete recipe — only owner can delete
router.delete("/:id", verifyToken, async (req, res) => {
  const recipeId = req.params.id;
  try {
    const deleteRes = await pool.query("DELETE FROM recipes WHERE id=$1 AND user_id=$2 RETURNING *", [recipeId, req.user.id]);
    if (deleteRes.rows.length === 0) return res.status(404).json({ error: "Recipe not found or not authorized" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DB Error (DELETE):", err.message);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

module.exports = router;
