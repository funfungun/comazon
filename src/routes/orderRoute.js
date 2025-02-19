import express from "express";
import { PrismaClient } from "@prisma/client";
import { CreateOrder, PatchOrder } from "../struct.js";
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

router.route("/").post(
  asyncHandler(async (req, res) => {
    assert(req.body, CreateOrder);
    const { userId, orderItems } = req.body;

    const productIds = orderItems.map((orderItem) => orderItem.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const getQuantity = (productId) => {
      const { quantity } = orderItems.find(
        (orderItem) => orderItem.productId === productId
      );
      return quantity;
    };

    const isSufficientStock = products.every((product) => {
      const { id, stock } = product;
      return stock >= getQuantity(id);
    });

    if (!isSufficientStock) {
      throw new Error("Insufficient Stock");
    }

    const queries = productIds.map((productId) => {
      return prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: getQuantity(productId),
          },
        },
      });
    });

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          user: {
            connect: { id: userId },
          },
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: true,
        },
      }),
      ...queries,
    ]);
    res.status(201).send(order);
  })
);

router
  .route("/:id")
  .get(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const order = await prisma.order.findUniqueOrThrow({
        where: { id },
        include: {
          orderItems: true,
        },
      });
      let total = 0;
      order.orderItems.forEach(({ unitPrice, quantity }) => {
        total += unitPrice * quantity;
      });
      order.total = total;
      res.send(order);
    })
  )
  .patch(
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      assert(req.body, PatchOrder);
      const { userId, orderItems } = req.body;
      const order = await prisma.order.update({
        where: { id },
        data: {
          userId,
          orderItems: {
            update: orderItems,
          },
        },
        include: {
          orderItems: true,
        },
      });
      res.status(201).send(order);
    })
  );

export default router;
