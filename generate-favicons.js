import favicons from "favicons";
import { promises as fs } from "fs";
import path from "path";

const source = "source-image.png";           // Replace with your source image name
const outputDir = "src/assets/icons";   // Output folder

const configuration = {
  path: "/src/assets/icons/",           // Path for icons in your deployed site
  appName: "Homecoming Ranch",      // Customize for your site
  appShortName: "Homecoming Ranch",
  appDescription: "Homecoming Ranch",
  developerName: "Joseph Bartholomew of Bartholomew Development LLC",
  developerURL: "https://bartdev.org",
  background: "#ffffff",
  theme_color: "#ffffff",
  display: "standalone",
  orientation: "portrait",
  start_url: "/",
  version: "1.0",
  logging: true,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    favicons: true,
    windows: true,
    yandex: true,
  },
};

// Async function to generate favicons
async function generateFavicons() {
  try {
    const response = await favicons(source, configuration);

    // Create output directory if it doesn’t exist
    await fs.mkdir(outputDir, { recursive: true });

    // Write all generated image files
    await Promise.all(
      response.images.map((image) =>
        fs.writeFile(path.join(outputDir, image.name), image.contents)
      )
    );

    // Write additional files (e.g., manifest)
    await Promise.all(
      response.files.map((file) =>
        fs.writeFile(path.join(outputDir, file.name), file.contents)
      )
    );

    // Write HTML <head> tags to a file
    await fs.writeFile(
      path.join(outputDir, "favicon.html"),
      response.html.join("\n")
    );

    console.log("Favicons generated successfully!");
  } catch (err) {
    console.error(err.message);
  }
}

// Run the function
generateFavicons();