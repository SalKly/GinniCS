/**
 * Post-install script to copy the PDF.js worker file from node_modules to public directory
 * This ensures the worker file always matches the installed pdfjs-dist version
 */

const fs = require("fs");
const path = require("path");

const sourceFile = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const targetFile = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

try {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error("❌ PDF.js worker file not found in node_modules");
    process.exit(1);
  }

  // Create public directory if it doesn't exist
  const publicDir = path.dirname(targetFile);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy the worker file
  fs.copyFileSync(sourceFile, targetFile);
  console.log("✅ PDF.js worker file copied successfully to public directory");
} catch (error) {
  console.error("❌ Error copying PDF.js worker file:", error.message);
  process.exit(1);
}
