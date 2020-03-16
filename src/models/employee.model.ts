import { Entity, model, property } from '@loopback/repository';
import Joi from 'joi';
import { LeaveType } from '../models';

@model()
export class Employee extends Entity {
  static validate(employeeRequest: Employee) {
    const objectSchema = Joi.object({
      type: Joi.string().min(1).required(),
      total: Joi.number().required(),
      applied: Joi.number().required(),
      availed: Joi.number().required(),
      available: Joi.number().required()
    })

    const schema = {
      firstName: Joi.string().min(3).max(50).required(),
      middleName: Joi.string().min(0).max(255).allow(""),
      lastName: Joi.string().min(3).max(255).required(),
      email: Joi.string().min(5).max(255).email(),
      empId: Joi.number().min(1),
      doj: Joi.string().min(5).max(255).required(),
      gender: Joi.string().valid("male", "female", "other"),
      status: Joi.string(),
      role: Joi.string().min(5).max(255).required(),
      approver: Joi.string().required().allow(""),
      password: Joi.string().min(5).max(1024).required(),
      leaves: Joi.array().items(objectSchema)
    }
    return Joi.validate(employeeRequest, schema);
  }

  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  firstName: string;

  @property({
    type: 'string',
  })
  middleName?: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'number',
  })
  empId: string;

  @property({
    type: 'string',
    required: true,
  })
  doj: string;

  @property({
    type: 'string',
    required: true,
  })
  role: string;

  @property({
    type: 'string',
    default: "",
    required: true
  })
  approver: string;

  @property({
    type: 'string',
    default: "active"
  })
  status?: string;

  @property({
    type: 'string',
    required: true,
  })
  gender: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property.array(LeaveType)
  leaves: LeaveType[];

  constructor(data?: Partial<Employee>) {
    super(data);
  }
}

export interface EmployeeRelations {
  // describe navigational properties here
}

export type EmployeeWithRelations = Employee & EmployeeRelations;
