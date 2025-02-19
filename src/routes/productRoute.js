import express from "express";
import { PrismaClient } from "@prisma/client";
import { CreateProduct, PatchProduct } from "../struct.js";
import { assert } from "superstruct";

const prisma = new PrismaClient();
const router = express.Router();

const asyncHandler = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (
        e.name === "StructError" ||
        (e instanceof Prisma.PrismaClientUnknownRequestError &&
          e.code === "P2002") ||
        e instanceof Prisma.PrismaClientValidationError
      ) {
        res.status(400).send({ message: e.message });
      } else if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        res.status(404).send({ message: e.message });
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
};

router
  .route("/")
  .get(
    asyncHandler(async (req, res) => {
      const { offset = 0, limit = 10, order = "newest", category } = req.query;
      let orderBy;
      switch (order) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "priceLowest":
          orderBy = { price: "asc" };
          break;
        case "priceHighest":
          orderBy = { price: "desc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }
      const products = await prisma.product.findMany({
        orderBy,
        skip: parseInt(offset),
        take: parseInt(limit),
        where: { category },
      });
      res.send(products);
    })
  )
  .post(
    asyncHandler(async (req, res) => {
      assert(req.body, CreateProduct);
      const product = await prisma.product.create({
        data: req.body,
      });
      res.status(201).send(product);
    })
  );

router
  .route("/:id")
  .get(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
      });
      res.send(product);
    })
  )
  .patch(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      assert(req.body, PatchProduct);
      const product = await prisma.product.update({
        where: { id },
        data: req.body,
      });
      res.status(201).send(product);
    })
  )
  .delete(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const product = await prisma.product.delete({
        where: { id },
      });
      res.send(product);
    })
  );

export default router;
