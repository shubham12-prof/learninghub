import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");

export type ContentType = "markdown" | "javascript";

export type Topic = {
  slug: string;
  title: string;
  type: ContentType;
};

export function getAllCategories() {
  return fs
    .readdirSync(contentDir, {
      withFileTypes: true,
    })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

export function getAllTopics(category: string): Topic[] {
  const categoryDir = path.join(contentDir, category);

  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  return fs
    .readdirSync(categoryDir)
    .filter((file) => file.endsWith(".md") || file.endsWith(".js"))
    .map((file) => {
      const isJavaScript = file.endsWith(".js");

      return {
        slug: file.replace(/\.(md|js)$/, ""),

        title: file
          .replace(/\.(md|js)$/, "")
          .replace(/^\d+-/, "")
          .replace(/-/g, " "),

        type: isJavaScript ? "javascript" : "markdown",
      };
    });
}

export function getTopicContent(category: string, slug: string) {
  const categoryDir = path.join(contentDir, category);

  const files = fs.readdirSync(categoryDir);

  const file = files.find(
    (filename) => filename === `${slug}.md` || filename === `${slug}.js`,
  );

  if (!file) {
    return null;
  }

  const filePath = path.join(categoryDir, file);

  const content = fs.readFileSync(filePath, "utf-8");

  const type: ContentType = file.endsWith(".js") ? "javascript" : "markdown";

  return {
    content,
    type,
  };
}
