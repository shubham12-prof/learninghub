# 11. API Documentation (Swagger / OpenAPI)

## What is OpenAPI?

**OpenAPI Specification (OAS)** is a standardized, language-agnostic format (YAML or JSON) for describing REST APIs — endpoints, parameters, request/response schemas, authentication methods, etc. **Swagger** is the toolset historically associated with OpenAPI (Swagger UI, Swagger Editor, Swagger Codegen) — "Swagger" and "OpenAPI" are often used interchangeably today, though OpenAPI is the spec name and Swagger is the tooling brand now maintained under the Linux Foundation via the OpenAPI Initiative.

## Why Document Your API?

- Lets frontend/mobile teams and third-party developers understand your API without reading source code.
- Enables auto-generated interactive documentation (Swagger UI) where consumers can try requests directly in the browser.
- Enables client SDK generation (auto-generate a JS/Python/Java client from the spec).
- Serves as a contract for API testing and validation.

## Basic OpenAPI Document Structure (YAML)

```yaml
openapi: 3.0.3
info:
  title: Products API
  version: 1.0.0
  description: API for managing products
servers:
  - url: https://api.example.com/v1
paths:
  /products:
    get:
      summary: List all products
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        "200":
          description: A paginated list of products
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Product"
                  total:
                    type: integer
    post:
      summary: Create a new product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewProduct"
      responses:
        "201":
          description: Product created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
        "400":
          description: Validation error
components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        price:
          type: number
        category:
          type: string
      required: [id, name, price]
    NewProduct:
      type: object
      properties:
        name:
          type: string
        price:
          type: number
        category:
          type: string
      required: [name, price]
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
```

## Setting Up Swagger UI in an Express App

```bash
npm install swagger-ui-express yamljs
```

```js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const swaggerDocument = YAML.load("./openapi.yaml");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () => {
  console.log("Docs available at http://localhost:3000/api-docs");
});
```

Now `/api-docs` shows an interactive UI where consumers can browse endpoints and send test requests.

## Generating Docs from JSDoc Comments (`swagger-jsdoc`)

Instead of maintaining a separate YAML file, you can annotate routes directly and generate the spec automatically.

```bash
npm install swagger-jsdoc swagger-ui-express
```

```js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.3",
    info: { title: "Products API", version: "1.0.0" },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./routes/*.js"], // files containing JSDoc-style annotations
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

`routes/productRoutes.js`:

```js
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get("/products", productController.list);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 */
router.post("/products", productController.create);
```

## Generating OpenAPI from Zod Schemas (Schema-First Approach)

A modern pattern: define validation with `zod`, then derive the OpenAPI schema from the same source of truth, avoiding drift between docs and actual validation.

```bash
npm install zod @asteasolutions/zod-to-openapi
```

```js
const { z } = require("zod");
const {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} = require("@asteasolutions/zod-to-openapi");

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const ProductSchema = z
  .object({
    id: z.string().openapi({ example: "p_123" }),
    name: z.string().openapi({ example: "Running Shoe" }),
    price: z.number().positive(),
  })
  .openapi("Product");

registry.registerPath({
  method: "get",
  path: "/products/{id}",
  responses: {
    200: {
      description: "A single product",
      content: { "application/json": { schema: ProductSchema } },
    },
  },
});
```

## Documenting Authentication

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
paths:
  /products:
    get:
      security:
        - bearerAuth: []
```

## Documenting Error Responses Consistently

```yaml
components:
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
paths:
  /products/{id}:
    get:
      responses:
        "404":
          description: Product not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

## Postman as an Alternative/Complement

Many teams also maintain a **Postman Collection** (exportable/importable JSON) alongside or instead of OpenAPI, especially for internal APIs — Postman collections can also be auto-generated from an OpenAPI spec via import.

## Best Practices

1. Keep documentation **in sync** with actual behavior — generate it from code/schemas where possible instead of hand-maintaining a separate file that drifts out of date.
2. Document **every** status code a client might realistically encounter (not just the happy path).
3. Include realistic **examples** for requests and responses.
4. Version your documentation alongside your API version (`/api-docs/v1`, `/api-docs/v2`).
5. Document authentication requirements per-endpoint, not just globally, if they vary.

## Common Interview-Style Questions

- **What's the difference between Swagger and OpenAPI?**
  OpenAPI is the specification format itself (the standard); Swagger is the historical toolset (Swagger UI, Swagger Editor) built around that spec — the terms are often used interchangeably today.

- **What is Swagger UI, and what does it provide?**
  An interactive web page generated from an OpenAPI document that lets developers browse endpoints, view schemas, and send live test requests directly from the browser.

- **What are two ways to generate an OpenAPI spec for an Express app?**
  Hand-write a YAML/JSON OpenAPI document, or auto-generate it from JSDoc-style annotations on routes (`swagger-jsdoc`) or from schema definitions (`zod-to-openapi`).

- **Why is a schema-first approach (e.g., deriving OpenAPI docs from Zod schemas) preferred over maintaining a separate hand-written spec?**
  It avoids drift between actual validation logic and documented behavior, since both are generated from the same source of truth.
