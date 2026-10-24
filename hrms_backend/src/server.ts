import dotenv from "dotenv";
dotenv.config();

import app from "./app";

import DatabaseConnection from "./connection/postgresql.connection";
import { seedRoles } from "./seeders/roles.seeder";
import { runMaintenanceAllTenants } from "./services/admin/attendanceMaintenance.service";

const PORT = process.env.PORT || 5001;

// Attendance maintenance sweeper: auto clock-out, missed-punch & absent marking.
const ATTENDANCE_SWEEP_INTERVAL_MS = 60 * 60 * 1000; // hourly

const startAttendanceSweeper = () => {
  const run = () =>
    runMaintenanceAllTenants().catch((e) =>
      console.error("Attendance maintenance sweep error:", e)
    );
  // Initial pass shortly after boot, then on a fixed interval.
  setTimeout(run, 15000);
  setInterval(run, ATTENDANCE_SWEEP_INTERVAL_MS);
};

DatabaseConnection.initialize()
  .then(async () => {
    console.log("Master Database Connected");

    const { Roles } = await import("./entity/master/roles.entity");
    const roleRepo = DatabaseConnection.getRepository(Roles);
    const masterRoles = ["SUPER_ADMIN", "TENANT_ADMIN", "EMPLOYEE"];
    for (const name of masterRoles) {
      const exists = await roleRepo.findOne({ where: { name } });
      if (!exists) {
        await roleRepo.save({ name, is_deleted: false });
      }
    }

    app.listen(PORT, () => {
      console.log(`Server Running On Port ${PORT}`);
    });


    startAttendanceSweeper();
  })
  .catch((error) => {
    console.log(error);
  });