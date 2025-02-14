import * as s from "superstruct";
import isEmail from "is-email";

export const CreateUser = s.object({
  email: s.define("Email", isEmail),
  firstName: s.size(s.string(), 1, 30),
  lastName: s.size(s.string(), 1, 30),
  address: s.string(),
});

export const PatchUser = s.partial(CreateUser);

export const CreateProduct = s.object({
  name: s.size(s.string(), 1, 60),
  description: s.string(),
  category: s.enums([
    "FASHION",
    "BEAUTY",
    "SPORTS",
    "ELECTRONICS",
    "HOME_INTERIOR",
    "HOUSEHOLD_SUPPLIES",
    "KITCHENWARE",
  ]),
  price: s.min(s.number(), 0),
  stock: s.min(s.integer(), 0),
});
export const PatchProduct = s.partial(CreateProduct);
