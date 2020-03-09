import { Entity } from '@loopback/repository';
import Joi from 'joi';
export declare class Employee extends Entity {
    static validate(employeeRequest: Employee): Joi.ValidationResult<Employee>;
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    empId: string;
    doj: string;
    role: string;
    approver: string;
    status?: string;
    gender: string;
    password: string;
    leaves: object;
    constructor(data?: Partial<Employee>);
}
export interface EmployeeRelations {
}
export declare type EmployeeWithRelations = Employee & EmployeeRelations;
