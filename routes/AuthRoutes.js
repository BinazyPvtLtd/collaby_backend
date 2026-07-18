import express from "express";
// import { signup } from "../controller/AuthController.js";
import { googleLogin } from "../controller/GoogleAuth.js";

const router = express.Router();

// router.post("/signup", signup);
router.post("/google-login", googleLogin);




export default router;