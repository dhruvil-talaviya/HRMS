import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Staff } from "./staff.entity";

@Entity("payroll")
export class Payroll {
  @PrimaryGeneratedColumn()
  id!: number;


  @Column()
  staffId!: number;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: "staffId" })
  staff!: Staff;

  
  @Column("decimal")
  basicSalary!: number;

  @Column("decimal", { default: 0 })
  allowance!: number;

  @Column("decimal", { default: 0 })
  bonus!: number;

  @Column("decimal", { default: 0 })
  deduction!: number;

  @Column("decimal", { default: 0 })
  tax!: number;

  @Column("decimal", { default: 0 })
  overtimePay!: number;

  @Column("decimal", { default: 0 })
  shiftAllowance!: number;

  @Column("decimal", { default: 0 })
  lopDeduction!: number;

  @Column("decimal", { default: 0 })
  lateDeduction!: number;

  @Column("decimal")
  netSalary!: number;

  @Column()
  month!: string;

  @Column()
  year!: number;

  @Column({
    default: "Pending",
  })
  status!: string;

  @Column({
    type: "jsonb",
    nullable: true,
  })
  attendanceDetails!: any;

  @Column({
    type: "jsonb",
    nullable: true,
  })
  salaryBreakdown!: any;

  @Column({
    type: "varchar",
    nullable: true,
  })
  paymentDate!: string | null;

  @Column({
    type: "text",
    nullable: true,
  })
  remarks!: string | null;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  processedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}