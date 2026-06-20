import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.username, username));
  const user = users[0];

  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req as any).session.userId = user.id;
  res.json({ id: user.id, username: user.username });
});

router.post("/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, username: user.username });
});

export default router;
