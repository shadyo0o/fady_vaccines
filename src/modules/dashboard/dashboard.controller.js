
import { Router } from "express";
import * as dashboardService from "./dashboard.service.js";
import { authentication } from "../../middlewares/authentication.js";

const dashboardRouter = Router();

// Dashboard Unified Endpoint
dashboardRouter.get("/", authentication(), dashboardService.getDashboard);

export default dashboardRouter;
