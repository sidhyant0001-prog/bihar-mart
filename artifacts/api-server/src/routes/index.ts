import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import propertiesRouter from "./properties";
import tenantsRouter from "./tenants";
import leasesRouter from "./leases";
import paymentsRouter from "./payments";
import maintenanceRouter from "./maintenance";
import inquiriesRouter from "./inquiries";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(propertiesRouter);
router.use(tenantsRouter);
router.use(leasesRouter);
router.use(paymentsRouter);
router.use(maintenanceRouter);
router.use(inquiriesRouter);
router.use(dashboardRouter);

export default router;
