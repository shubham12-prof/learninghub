import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content");

export function getAllCategories() {
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

export function getAllTopics(category: string) {
  const categoryDir = path.join(contentDir, category);

  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  return fs
    .readdirSync(categoryDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(".md", ""),
      title: file.replace(".md", "").replace(/^\d+-/, "").replace(/-/g, " "),
    }));
}

export function getTopicContent(category: string, slug: string) {
  const filePath = path.join(contentDir, category, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf-8");
}
