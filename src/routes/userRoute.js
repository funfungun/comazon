import express from "express";
import { PrismaClient } from "@prisma/client";
import { CreateUser, PatchUser, CreateSavedProduct } from "../struct.js";
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
      const { offset = 0, limit = 10, order = "newest" } = req.query;
      let orderBy;
      switch (order) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }
      const users = await prisma.user.findMany({
        orderBy,
        skip: parseInt(offset),
        take: parseInt(limit),
        include: {
          userPreference: {
            select: {
              receiveEmail: true,
            },
          },
        },
      });
      res.send(users);
    })
  )
  .post(
    asyncHandler(async (req, res) => {
      assert(req.body, CreateUser);
      const { userPreference, ...userFields } = req.body;
      const user = await prisma.user.create({
        data: {
          ...userFields,
          userPreference: {
            create: userPreference,
          },
        },
        include: {
          userPreference: true,
        },
      });
      res.status(201).send(user);
    })
  );

router
  .route("/:id")
  .get(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
      });
      res.send(user);
    })
  )
  .patch(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      assert(req.body, PatchUser);
      const { userPreference, ...userFields } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...userFields,
          userPreference: {
            update: userPreference,
          },
        },
        include: {
          userPreference: true,
        },
      });
      res.status(201).send(user);
    })
  )
  .delete(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const user = await prisma.user.delete({
        where: { id },
      });
      res.send(user);
    })
  );

router
  .route("/:id/saved-products")
  .get(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { savedProducts } = await prisma.user.findUniqueOrThrow({
        where: { id },
        include: {
          savedProducts: true,
        },
      });
      res.send(savedProducts);
    })
  )
  .post(
    asyncHandler(async (req, res) => {
      assert(req.body, CreateSavedProduct);
      const { id: userId } = req.params;
      const { productId } = req.body;
      const savedCount = await prisma.user.count({
        where: {
          id: userId,
          savedProducts: {
            some: { id: productId },
          },
        },
      });
      const { savedProducts } = await prisma.user.update({
        where: { id: userId },
        data: {
          savedProducts:
            savedCount > 0
              ? { disconnect: { id: productId } }
              : { connect: { id: productId } },
        },
        include: {
          savedProducts: true,
        },
      });
      res.status(201).send(savedProducts);
    })
  );

router.get(
  "/:id/orders",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orders } = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        orders: true,
      },
    });
    res.send(orders);
  })
);

export default router;
