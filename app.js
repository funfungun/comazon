import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
  });
  res.send(user);
});

app.post("/users", async (req, res) => {
  const user = await prisma.user.create({
    data: req.body,
  });
  res.status(201).send(user);
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: req.body,
  });
  res.status(201).send(user);
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.delete({
    where: { id },
  });
  res.send(user);
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`server staring on ${process.env.PORT}`)
);
