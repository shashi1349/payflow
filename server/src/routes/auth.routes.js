import { Router } from "express";
import {
  register, login, refresh, logout, getMe, searchUsers
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.get("/users/search", authenticate, searchUsers);

export default router;