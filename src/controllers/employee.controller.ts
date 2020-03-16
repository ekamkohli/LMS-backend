import { repository, FilterBuilder } from '@loopback/repository';
import { EmployeeRepository } from '../repositories';
import { LeaveTypeRepository } from '../repositories';
import { get, put, param, post, requestBody, getModelSchemaRef } from '@loopback/rest';
import { LeaveType, Employee } from '../models';
import {emailEmpPostEmp,emailEmpPostApp} from '../utils/email';

// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

export class EmployeeController {
  constructor(
    @repository(EmployeeRepository)
    public employeeRepository: EmployeeRepository,
    @repository(LeaveTypeRepository)
    public leaveTypeRepository: LeaveTypeRepository,
  ) { }

  @post('/employee', {
    responses: {
      '200': {
        description: 'Employee model instance',
        content: { 'application/json': { schema: getModelSchemaRef(Employee) } },
      },
    }
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Employee, {
            exclude: ['id', 'leaves'],
          }),
        },
      },
    })
    employeeRequest: Employee,
  ): Promise<Object> {
    try {
      const leaveTypes = await this.leaveTypeRepository.find()
      employeeRequest.leaves = leaveTypes;

      //validate employee schema
      await Employee.validate(employeeRequest);

      // Validate if the provided email already exists
      const filterBuilder = new FilterBuilder();
      const filter = filterBuilder
        .fields("email")
        .where({ email: employeeRequest.email }).build();

      const email = await this.employeeRepository.findOne(filter)
      if (email) {
        throw new Error("Employee Already exists");
      }
      
      // Check if approver id is valid in case of non-admin employees
      if(employeeRequest.role !== "admin") {
        let approver = await this.employeeRepository.findById(employeeRequest.approver)
        if(!approver) throw new Error('Entered approver doesn\'t exist')
      }

      const result = await this.employeeRepository.create(employeeRequest);

      //Code for Email sending
      //const responseEmp = await emailEmpPostEmp(employeeRequest.email,employeeRequest.firstName,employeeRequest.password);
      //console.log('Employee email res:', responseEmp);
      if(employeeRequest.role !== "admin") {
        let approver = await this.employeeRepository.findById(employeeRequest.approver)
        if(!approver) throw new Error('Entered approver doesn\'t exist')
        //const responseApp = await emailEmpPostApp(approver.email,employeeRequest.firstName,employeeRequest.email);
        //console.log('Approver email res:', responseApp);
      } else {
        result.approver = result.id.toString();
        await this.employeeRepository.updateById(result.id, result);
      }

      return result;
    } catch (err) {
      console.log(err.stack)
      console.log(err.toString());
      throw { status: 400, message: err.toString() }
    }
  }

  @put('/employee/{id}', {
    responses: {
      '204': {
        description: 'Employee PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Employee, {
            exclude: ['id'],
          }),
        },
      },
    }) employeeRequest: Employee,
  ): Promise<void> {
    try {
      const filterBuilder = new FilterBuilder();

      //validate employee schema
      await Employee.validate(employeeRequest);

      const result = await this.employeeRepository.replaceById(id, employeeRequest);
      return result;
    } catch (err) {
      console.log(err.toString());
      throw { status: 400, message: err.toString() }
    }
  }

  @get('/employee', {
    responses: {
      '200': {
        description: 'Array of Employee model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Employee, { includeRelations: true }),
            },
          },
        },
      },
    },
  })
  async find(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  @get('/employee/{id}', {
    responses: {
      '200': {
        description: 'Employee model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Employee, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ): Promise<Employee> {
    return this.employeeRepository.findById(id);
  }
  
}
