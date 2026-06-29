import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Start Local Server
app.listen(PORT, () => {
  console.log(`🚀 Local Server running on http://localhost:${PORT}`);
});
