import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");

export type ContentType = "markdown" | "javascript";

/* ---------------------------------------------
   Flat topic type
--------------------------------------------- */

export type Topic = {
  slug: string;
  title: string;
  type: ContentType;
  path: string[];
  folder: string | null;
};

/* ---------------------------------------------
   Recursive sidebar tree
--------------------------------------------- */

export type ContentTree =
  | {
      type: "folder";
      name: string;
      title: string;
      path: string[];
      children: ContentTree[];
    }
  | {
      type: "file";
      name: string;
      title: string;
      slug: string;
      path: string[];
      contentType: ContentType;
    };

/* ---------------------------------------------
   Get all categories
--------------------------------------------- */

export function getAllCategories() {
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

/* ---------------------------------------------
   Format title
--------------------------------------------- */

function formatTitle(value: string) {
  return value
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ---------------------------------------------
   Get number from filename/folder name
   Example:
   01-React       -> 1
   02-Hooks       -> 2
   10-Suspense    -> 10
--------------------------------------------- */

function getOrder(value: string) {
  const match = value.match(/^(\d+)/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]);
}

/* ---------------------------------------------
   Sort folders + files together
--------------------------------------------- */

function sortEntries(a: fs.Dirent, b: fs.Dirent) {
  const orderA = getOrder(a.name);
  const orderB = getOrder(b.name);

  // First sort by number
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  // If numbers are the same, sort alphabetically
  return a.name.localeCompare(b.name);
}

/* ---------------------------------------------
   Recursive content tree
--------------------------------------------- */

export function getContentTree(category: string): ContentTree[] {
  const categoryDir = path.join(contentDir, category);

  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  function buildTree(
    currentDir: string,
    parentPath: string[] = [],
  ): ContentTree[] {
    const entries = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .sort(sortEntries);

    return entries
      .map((entry): ContentTree | null => {
        const fullPath = path.join(currentDir, entry.name);

        /* -----------------------------
           Folder
        ----------------------------- */

        if (entry.isDirectory()) {
          const folderName = entry.name;

          return {
            type: "folder",
            name: folderName,
            title: formatTitle(folderName),
            path: [...parentPath, folderName],
            children: buildTree(fullPath, [...parentPath, folderName]),
          };
        }

        /* -----------------------------
           Markdown file
        ----------------------------- */

        if (entry.isFile() && entry.name.endsWith(".md")) {
          const fileName = entry.name.replace(/\.md$/, "");

          return {
            type: "file",
            name: entry.name,
            title: formatTitle(fileName),
            slug: [...parentPath, fileName].join("/"),
            path: [...parentPath, fileName],
            contentType: "markdown",
          };
        }

        /* -----------------------------
           JavaScript file
        ----------------------------- */

        if (entry.isFile() && entry.name.endsWith(".js")) {
          const fileName = entry.name.replace(/\.js$/, "");

          return {
            type: "file",
            name: entry.name,
            title: formatTitle(fileName),
            slug: [...parentPath, fileName].join("/"),
            path: [...parentPath, fileName],
            contentType: "javascript",
          };
        }

        return null;
      })
      .filter((item): item is ContentTree => item !== null);
  }

  return buildTree(categoryDir);
}

/* ---------------------------------------------
   Get files recursively
   Used for generateStaticParams
--------------------------------------------- */

function getFilesRecursively(
  dir: string,
  parentPath: string[] = [],
): string[][] {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort(sortEntries);

  const files: string[][] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, [...parentPath, entry.name]));
    }

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

/* ---------------------------------------------
   Get all topics
--------------------------------------------- */

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

/* ---------------------------------------------
   Get topic content
--------------------------------------------- */

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
