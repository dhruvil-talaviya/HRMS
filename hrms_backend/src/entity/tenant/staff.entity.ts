import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Department } from "../tenant/department.entity";
import { Designation } from "../tenant/designation.entity";
import { Role } from "../tenant/roles.entity";

@Entity("staff")
export class Staff {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  gender!: string;

@Column({ type: "uuid", nullable: false })
departmentId!: string;

@ManyToOne(() => Department, (department) => department.staffs)
@JoinColumn({ name: "departmentId" })
department!: Department;


@Column({ type: "uuid", nullable: false })
designationId!: string;

@ManyToOne(() => Designation, (designation) => designation.staffs)
@JoinColumn({ name: "designationId" })
designation!: Designation;

  @Column()
  dob!: Date;

  @Column()
  joiningDate!: Date;

  @Column("decimal")
  salary!: number;

  @Column("text")
  address!: string;

  @Column({ nullable: true })
password!: string;
 
  @Column({
    type: "varchar",
    default: "InActive",
  })
  status!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  isFirstLogin!: boolean;


  @CreateDateColumn()
  createdAt!: Date;

  @Column({
  nullable: true,
})
role!: string;

@Column({
  nullable: true,
})
accessRoleId!: string;

@ManyToOne(() => Role, (role) => role.staffs)
@JoinColumn({ name: "accessRoleId" })
accessRole!: Role; 

}
