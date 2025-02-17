import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import {
  CreateProduct,
  CreateUser,
  PatchProduct,
  PatchUser,
  CreateOrder,
  PatchOrder,
} from "./struct.js";
import { assert } from "superstruct";

dotenv.config();

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

const asyncHandler = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      // console.log("Error occured");
      // console.log(e.name);
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

//users
app.get(
  "/users",
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
);

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    res.send(user);
  })
);

app.post(
  "/users",
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

app.patch(
  "/users/:id",
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
);

app.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({
      where: { id },
    });
    res.send(user);
  })
);

app.get(
  "/users/:id/saved-products",
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
);

app.get(
  "/users/:id/orders",
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

//Product
app.get(
  "/products",
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
);

app.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });
    res.send(product);
  })
);

app.post(
  "/products",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateProduct);
    const product = await prisma.product.create({
      data: req.body,
    });
    res.status(201).send(product);
  })
);

app.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    assert(req.body, PatchProduct);
    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });
    res.status(201).send(product);
  })
);

app.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.delete({
      where: { id },
    });
    res.send(product);
  })
);

// Orders
app.get(
  "/orders/:id",
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
);

app.post(
  "/orders",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateOrder);
    const { userId, orderItems } = req.body;
    const order = await prisma.order.create({
      data: {
        userId,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });
    res.status(201).send(order);
  })
);

app.patch(
  "/orders/:id",
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

app.listen(process.env.PORT || 3000, () =>
  console.log(`server staring on ${process.env.PORT}`)
);
