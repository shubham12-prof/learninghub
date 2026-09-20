import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");

export type ContentType = "markdown" | "javascript";

export type Topic = {
  slug: string;
  title: string;
  type: ContentType;

  // Full path split into parts
  // Example:
  // ["01-React-Fundamentals", "02-JSX"]
  path: string[];

  // Folder containing the file
  // Example: "01-React-Fundamentals"
  folder: string | null;
};

/**
 * Get all top-level categories
 *
 * content/
 * ├── react/
 * ├── javascript/
 * └── nodejs/
 */
export function getAllCategories() {
  return fs
    .readdirSync(contentDir, {
      withFileTypes: true,
    })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

/**
 * Recursively find all .md and .js files
 */
function getFilesRecursively(
  dir: string,
  parentPath: string[] = [],
): string[][] {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  const files: string[][] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // If folder, go inside it
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, [...parentPath, entry.name]));
    }

    // If markdown/javascript file
    if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".js"))
    ) {
      const fileName = entry.name.replace(/\.(md|js)$/, "");

      files.push([...parentPath, fileName]);
    }
  }

  return files;
}

/**
 * Remove numbering from names
 *
 * "01-React-Fundamentals"
 *        ↓
 * "React Fundamentals"
 */
function formatTitle(value: string) {
  return value
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get all topics inside a category
 *
 * This works recursively.
 */
export function getAllTopics(category: string): Topic[] {
  const categoryDir = path.join(contentDir, category);

  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  const files = getFilesRecursively(categoryDir);

  return files.map((parts) => {
    const fileName = parts[parts.length - 1];

    const extensionPath = path.join(categoryDir, ...parts);

    const actualFile = fs.existsSync(`${extensionPath}.md`)
      ? `${extensionPath}.md`
      : `${extensionPath}.js`;

    const isJavaScript = actualFile.endsWith(".js");

    return {
      slug: parts.join("/"),

      title: formatTitle(fileName),

      type: isJavaScript ? "javascript" : "markdown",

      path: parts,

      folder: parts.length > 1 ? parts[0] : null,
    };
  });
}

/**
 * Get one topic's actual content
 *
 * Example:
 *
 * category = "react"
 *
 * slug = [
 *   "01-React-Fundamentals",
 *   "02-JSX"
 * ]
 *
 * Result:
 *
 * content/react/
 * └── 01-React-Fundamentals/
 *     └── 02-JSX.md
 */
export function getTopicContent(category: string, slug: string[]) {
  const categoryDir = path.join(contentDir, category);

  if (!fs.existsSync(categoryDir)) {
    return null;
  }

  const basePath = path.join(categoryDir, ...slug);

  let filePath: string | null = null;

  if (fs.existsSync(`${basePath}.md`)) {
    filePath = `${basePath}.md`;
  } else if (fs.existsSync(`${basePath}.js`)) {
    filePath = `${basePath}.js`;
  }

  if (!filePath) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const type: ContentType = filePath.endsWith(".js")
    ? "javascript"
    : "markdown";

  return {
    content,
    type,
  };
}
