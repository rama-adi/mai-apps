import { expect, test } from "vite-plus/test";
import { cn } from "../src/lib/utils";

test("cn merges class names", () => {
  expect(cn("foo", "bar")).toBe("foo bar");
});
