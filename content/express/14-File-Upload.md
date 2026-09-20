# 14. File Upload

## Why File Uploads Need Special Handling

Files are sent as `multipart/form-data`, which Express's built-in `express.json()`/`express.urlencoded()` **cannot parse**. You need a dedicated middleware — the most common choice is **Multer**.

```bash
npm install multer
```

## Basic Setup: Disk Storage

```js
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder must already exist
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("avatar"), (req, res) => {
  console.log(req.file); // metadata about the uploaded file
  res.json({ file: req.file });
});

app.listen(3000);
```

`req.file` looks like:

```json
{
  "fieldname": "avatar",
  "originalname": "photo.jpg",
  "filename": "1719999999-123456789.jpg",
  "path": "uploads/1719999999-123456789.jpg",
  "size": 204800,
  "mimetype": "image/jpeg"
}
```

## Single vs Multiple Files

```js
// Single file, field name "avatar"
app.post("/upload-single", upload.single("avatar"), handler);

// Multiple files, same field name "photos", max 5
app.post("/upload-multiple", upload.array("photos", 5), (req, res) => {
  console.log(req.files); // array of file objects
  res.json({ files: req.files });
});

// Multiple fields with different names
app.post(
  "/upload-mixed",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  (req, res) => {
    console.log(req.files.avatar); // array
    console.log(req.files.gallery); // array
    res.json({ files: req.files });
  },
);
```

## Validating File Type and Size

```js
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  },
});
```

### Handling Multer Errors

```js
app.post("/upload", (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // e.g. LIMIT_FILE_SIZE
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ file: req.file });
  });
});
```

Or centrally, in your error-handling middleware:

```js
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  next(err);
});
```

## In-Memory Storage (for Cloud Uploads)

When you want to forward the file straight to cloud storage (S3, Cloudinary) instead of saving to local disk:

```js
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload-to-cloud", upload.single("avatar"), async (req, res) => {
  console.log(req.file.buffer); // raw file data in memory
  // await s3.upload({ Bucket: '...', Key: '...', Body: req.file.buffer }).promise();
  res.json({ message: "Uploaded to cloud" });
});
```

## Example: Uploading to AWS S3 with Multer

```bash
npm install multer-s3 @aws-sdk/client-s3
```

```js
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "us-east-1" });

const upload = multer({
  storage: multerS3({
    s3,
    bucket: "my-app-uploads",
    key: (req, file, cb) => {
      cb(null, `avatars/${Date.now()}-${file.originalname}`);
    },
  }),
});

app.post("/upload", upload.single("avatar"), (req, res) => {
  res.json({ url: req.file.location }); // public S3 URL
});
```

## Serving Uploaded Files

```js
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

Now `uploads/1719999999.jpg` is served at `http://localhost:3000/uploads/1719999999.jpg`.

## Complete Example: Avatar Upload Endpoint

```js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

app.post("/api/avatar", upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.status(201).json({
    message: "Upload successful",
    url: `/uploads/${req.file.filename}`,
  });
});

app.use("/uploads", express.static(uploadDir));

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.listen(3000);
```

Client-side (HTML form) that triggers this:

```html
<form action="/api/avatar" method="POST" enctype="multipart/form-data">
  <input type="file" name="avatar" />
  <button type="submit">Upload</button>
</form>
```

## Security Considerations

- Always restrict file types via `fileFilter` (never trust file extension alone — check `mimetype`, and ideally verify actual file signature/magic bytes for critical apps).
- Always set a `fileSize` limit to prevent denial-of-service via huge uploads.
- Store uploads outside publicly executable directories, or use a cloud bucket, to avoid accidentally allowing uploaded scripts to be executed.
- Generate randomized filenames — never trust `file.originalname` directly (path traversal, collisions).

## Common Interview-Style Questions

- **Why can't `express.json()` parse file uploads?**
  File uploads use `multipart/form-data` encoding, which is a different format from JSON or URL-encoded bodies; it requires a streaming multipart parser like Multer.

- **What's the difference between `upload.single()`, `upload.array()`, and `upload.fields()`?**
  `single()` handles one file from one named field; `array()` handles multiple files from the same named field; `fields()` handles multiple files across different named fields.

- **How do you limit upload file size in Multer?**
  Pass `limits: { fileSize: <bytes> }` when creating the Multer instance.

- **Disk storage vs memory storage — when would you use each?**
  Disk storage saves directly to the local filesystem (fine for simple apps/dev); memory storage keeps the file in a buffer in RAM, useful when immediately forwarding to cloud storage (S3, Cloudinary) without touching local disk.
