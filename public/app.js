// app.js

// ---------------- Helper: show message ----------------
function showMessage(text, type = "success") {
  const messageEl = document.createElement("div");
  messageEl.className = type === "success" ? "success-message overlay" : "error-message overlay";
  messageEl.textContent = text;

  messageEl.style.position = "fixed";
  messageEl.style.top = "20px";
  messageEl.style.left = "50%";
  messageEl.style.transform = "translateX(-50%)";
  messageEl.style.zIndex = "9999";
  messageEl.style.padding = "12px 25px";
  messageEl.style.borderRadius = "8px";
  messageEl.style.fontSize = "16px";
  messageEl.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  messageEl.style.color = "#fff";
  messageEl.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  messageEl.style.transition = "opacity 0.5s ease";
  messageEl.style.opacity = "1";

  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.style.opacity = "0";
    setTimeout(() => messageEl.remove(), 500);
  }, 2000);
}

// ---------------- Navbar handling ----------------
function handleNavbar() {
  const token = localStorage.getItem("ft_token");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");

  if (token) {
    if (logoutBtn) logoutBtn.style.display = "inline";
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("ft_token");
        showMessage("Logged out successfully!", "success");
        setTimeout(() => window.location.href = "login.html", 1000);
      });
    }
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}
handleNavbar();

// ---------------- Save recipe ----------------
async function saveToFavorites(recipe) {
  const token = localStorage.getItem("ft_token");
  if (!token) return showMessage("You must login to save recipes.", "error");

  try {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: recipe.title,
        image: recipe.image,
        instructions: recipe.instructions || "",
        ingredients: recipe.ingredients || recipe.usedIngredients || [],
        readyin: recipe.readyin || 0
      })
    });
    const savedRecipe = await response.json();
    showMessage(`Recipe "${savedRecipe.title}" saved!`, "success");

    if (window.location.pathname.endsWith("favorites.html")) addRecipeCard(savedRecipe);
  } catch (err) {
    console.error(err);
    showMessage("Failed to save recipe.", "error");
  }
}

// ---------------- Update recipe ----------------
async function updateRecipe(id, updatedData) {
  const token = localStorage.getItem("ft_token");
  try {
    const response = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });
    const updatedRecipe = await response.json();
    showMessage(`Recipe "${updatedRecipe.title}" updated successfully`, "success");
    return updatedRecipe;
  } catch (err) {
    console.error(err);
    showMessage("Failed to update recipe.", "error");
    return null;
  }
}

// ---------------- INDEX.HTML ----------------
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  const searchBtn = document.getElementById("searchBtn");
  const ingredientInput = document.getElementById("ingredientInput");
  const recipesContainer = document.getElementById("recipesContainer");

  searchBtn.addEventListener("click", async () => {
    const ingredients = ingredientInput.value.trim();
    if (!ingredients) return showMessage("Please enter ingredients.", "error");

    try {
      recipesContainer.innerHTML = "<p>Searching recipe...</p>";
      const response = await fetch(`/api/recipes/search?ingredients=${encodeURIComponent(ingredients)}`);
      const data = await response.json();

      recipesContainer.innerHTML = "";
      if (!data.length) return recipesContainer.innerHTML = "<p>No recipes found</p>";

      data.forEach(recipe => {
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
          <img src="${recipe.image}" alt="Recipe Image" />
          <h3>${recipe.title}</h3>
          <h4>Ingredients:</h4>
          <ul>${(recipe.usedIngredients || recipe.ingredients).map(i => `<li>${i.name || i}</li>`).join("")}</ul>
          <button onclick='saveToFavorites(${JSON.stringify(recipe)})'>Save to Favorites</button>
        `;
        recipesContainer.appendChild(card);
      });
    } catch (err) {
      recipesContainer.innerHTML = "<p>Error fetching recipes</p>";
      console.error(err);
    }
  });
}

// ---------------- RANDOMRECIPES.HTML ----------------
else if (window.location.pathname.endsWith("randomRecipes.html")) {
  const randomBtn = document.getElementById("getRandomRecipe");
  const randomContainer = document.getElementById("randomRecipeContainer");

  randomBtn.addEventListener("click", async () => {
    randomContainer.innerHTML = "<p>Loading random recipe...</p>";
    try {
      const response = await fetch("/api/recipes/random");
      const recipe = await response.json();

      randomContainer.innerHTML = `
        <div class="recipe-card">
          <img src="${recipe.image}" alt="Recipe Image" />
          <h3>${recipe.title}</h3>
          <p><strong>Instructions:</strong> ${recipe.instructions || "No instructions available."}</p>
          <h4>Ingredients:</h4>
          <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
          <button onclick='saveToFavorites(${JSON.stringify(recipe)})'>Save to Favorites</button>
        </div>
      `;
    } catch (err) {
      randomContainer.innerHTML = "<p>Failed to load recipe.</p>";
      console.error(err);
    }
  });
}

// ---------------- FAVORITES.HTML ----------------
else if (window.location.pathname.endsWith("favorites.html")) {
  const favoritesContainer = document.getElementById("favoritesContainer");

  async function loadFavorites() {
    const token = localStorage.getItem("ft_token");
    if (!token) {
      favoritesContainer.innerHTML = "<p>You must login to view your favorites.</p>";
      return;
    }

    try {
      const response = await fetch("/api/recipes/all", { headers: { "Authorization": `Bearer ${token}` } });
      const favorites = await response.json();
      favoritesContainer.innerHTML = "";
      if (!favorites.length) return favoritesContainer.innerHTML = "<p>No favorite recipes saved.</p>";

      favorites.forEach(recipe => addRecipeCard(recipe));
    } catch (err) {
      console.error(err);
      favoritesContainer.innerHTML = "<p>Failed to load favorite recipes.</p>";
    }
  }

  // Add single recipe card
  function addRecipeCard(recipe) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.dataset.id = recipe.id;

    card.innerHTML = `
      <img src="${recipe.image}" alt="Recipe Image" />
      <h3>${recipe.title}</h3>
      ${recipe.instructions ? `<p>${recipe.instructions}</p>` : ""}
      <h4>Ingredients:</h4>
      <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Remove</button>
      <div class="edit-form-container"></div>
    `;
    favoritesContainer.prepend(card);

    // Delete recipe
    card.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteFavorite(recipe.id, card);
    });

    // Edit recipe
    card.querySelector(".edit-btn").addEventListener("click", () => {
      showEditForm(recipe, card.querySelector(".edit-form-container"));
    });
  }

  // Delete recipe from DOM
  async function deleteFavorite(id, card) {
    const token = localStorage.getItem("ft_token");
    try {
      await fetch(`/api/recipes/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      showMessage("Recipe deleted successfully.", "success");
      if (card) card.remove();
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete recipe.", "error");
    }
  }

  // Show edit form
  function showEditForm(recipe, container) {
    container.innerHTML = `
      <form class="updateForm">
        <input type="text" class="editTitle" value="${recipe.title}" required />
        <input type="text" class="editImage" value="${recipe.image}" required />
        <textarea class="editInstructions">${recipe.instructions || ""}</textarea>
        <input type="text" class="editIngredients" value="${recipe.ingredients.join(", ")}" required />
        <input type="number" class="editReadyIn" value="${recipe.readyin}" required />
        <button type="submit">Update</button>
      </form>
    `;

    const form = container.querySelector(".updateForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updatedData = {
        title: form.querySelector(".editTitle").value,
        image: form.querySelector(".editImage").value,
        instructions: form.querySelector(".editInstructions").value,
        ingredients: form.querySelector(".editIngredients").value.split(",").map(i => i.trim()),
        readyin: parseInt(form.querySelector(".editReadyIn").value)
      };

      const updatedRecipe = await updateRecipe(recipe.id, updatedData);
      if (updatedRecipe) updateRecipeCardDOM(updatedRecipe, container.parentElement);
      container.innerHTML = "";
    });
  }

  // Update DOM for a single recipe
  function updateRecipeCardDOM(updatedRecipe, card) {
    card.querySelector("h3").textContent = updatedRecipe.title;
    card.querySelector("img").src = updatedRecipe.image;
    if (card.querySelector("p")) card.querySelector("p").textContent = updatedRecipe.instructions;
    else card.insertAdjacentHTML("beforeend", `<p>${updatedRecipe.instructions}</p>`);
    card.querySelector("ul").innerHTML = updatedRecipe.ingredients.map(i => `<li>${i}</li>`).join("");
  }

  loadFavorites();
}
