import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  FilterBuilder,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {Leave} from '../models';
import {LeaveRepository} from '../repositories';
import {EmployeeRepository} from '../repositories';
import {emailLeavePostEmp,emailLeavePostApp,emailLeavePatchAcc,emailLeavePatchRej} from '../utils/email';

interface LeaveUpdateRequest {
  status: string
}

export class LeaveController {
  constructor(
    @repository(LeaveRepository)
    public leaveRepository : LeaveRepository,

    @repository(EmployeeRepository)
    public employeeRepository: EmployeeRepository
  ) {}

  invalidDays = (startDate: string, endDate: string, halfDay: boolean) =>  {
    if(!halfDay)
        return false;

    let start = new Date(startDate)
    let end = new Date(endDate)
    return start.toString() !== end.toString()
  }

  getLeaveDuration = (start: string, end: string, halfDay: boolean) => {
    if(halfDay)
        return 0.5;

    let startDate = new Date(start)
    let endDate = new Date(end)
    let count = 0;
    for(var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        let day = d.getDay()
        if(day == 0 || day == 6) {
            continue;
        }
        count++;
    }
    return count;
  }

  @post('/leaves', {
    responses: {
      '200': {
        description: 'Leave model instance',
        content: {'application/json': {schema: getModelSchemaRef(Leave)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Leave, {
            title: 'NewLeave',
            exclude: ['id', 'firstName', 'lastName', 'daysCount'],
          }),
        },
      },
    })
    leave: Omit<Leave, 'id & firstName & lastName'>,
  ): Promise<Leave> {
    try {
      console.log(leave)
      await Leave.validate(leave)
      const employee = await this.employeeRepository.findById(leave.employeeId)
      if(!employee)
        throw new Error("Invalid Employee Id")
      
      const approver = await this.employeeRepository.findById(leave.approverId)
      
      if(employee.approver != leave.approverId)
        throw new Error("Provided approver is not the approver of provided employee")

      if(!approver)
        throw new Error("Invalid Approver Id")

      if(this.invalidDays(leave.startDate, leave.endDate, leave.halfDay))
        throw new Error("start and end date should be same for half day")

      let daysCount = this.getLeaveDuration(leave.startDate, leave.endDate, leave.halfDay);
      const employeeLeave = employee.leaves.find(leaveObject => leaveObject.type === leave.leaveType);
      if(employeeLeave === undefined || employeeLeave.available < daysCount) {
        throw new Error("Employee Does not have that many leaves of the given type")
      }
      employeeLeave.available -= daysCount;
      employeeLeave.applied += daysCount;

      leave.status = "pending"
      leave.firstName = employee.firstName;
      leave.lastName = employee.lastName;
      leave.daysCount = daysCount

      await this.employeeRepository.update(employee);
      const savedLeave = await this.leaveRepository.create(leave);
      
      //Code for Email sending
      // const responseEmp = await emailLeavePostEmp(employee.email,leave.firstName,leave.halfDay,leave.leaveType,leave.description,leave.startDate,leave.endDate,leave.daysCount);
      // const responseApp = await emailLeavePostApp(approver.email,leave.firstName,leave.halfDay,leave.leaveType,leave.description,leave.startDate,leave.endDate,leave.daysCount);
      // console.log('Employee email res:', responseEmp);
      // console.log('Approver email res:', responseApp);

      return savedLeave;

    } catch(err) {
      console.log(err.stack)
      console.log(err.toString());
      throw {status: 400, message: err.toString()}
    }
  }

  @get('/leaves/count', {
    responses: {
      '200': {
        description: 'Leave model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Leave)) where?: Where<Leave>,
  ): Promise<Count> {
    return this.leaveRepository.count(where);
  }

  @get('/leaves', {
    responses: {
      '200': {
        description: 'Array of Leave model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Leave, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Leave)) filter?: Filter<Leave>,
  ): Promise<Leave[]> {
    return this.leaveRepository.find(filter);
  }

  @get('/leaves/employee/{employeeId}/{status}', {
    responses: {
      '200': {
        description: 'Array of Leave model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Leave, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async findEmployeeLeaves(
    @param.path.string('employeeId') employeeId: string,
    @param.path.string('status') status: string
  ): Promise<Leave[]> {
    try {
      const employee = await this.employeeRepository.findById(employeeId);
      if(!employee)
        throw new Error("Employee with given employee id not found")

      if(status === "pending" || status === "rejected" || status === "approved") {  
        const leaves = await this.leaveRepository.find({ where: { employeeId: { like: employeeId }, status: status } })
        return leaves
      } else {
        const leaves = await this.leaveRepository.find({ where: { employeeId: { like: employeeId } } })
        return leaves
      }
    } catch(err) {
      console.log(err.stack)
      console.log(err.toString());
      throw {status: 400, message: err.toString()}
    }
  }

  @get('/leaves/approver/{employeeId}/{status}', {
    responses: {
      '200': {
        description: 'Array of Leave model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Leave, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async findApproverLeaves(
    @param.path.string('employeeId') employeeId: string,
    @param.path.string('status') status: string
  ): Promise<Leave[]> {
    try {
      const employee = await this.employeeRepository.findById(employeeId);
      if(!employee)
        throw new Error("Employee with given employee id not found")

        if(status === "pending" || status === "rejected" || status === "approved") {  
        const leaves = await this.leaveRepository.find({ where: { approverId: { like: employeeId }, status: status } })
        return leaves
      } else {
        const leaves = await this.leaveRepository.find({ where: { approverId: { like: employeeId } } })
        return leaves
      }
    } catch(err) {
      console.log(err.stack)
      console.log(err.toString());
      throw {status: 400, message: err.toString()}
    }
  }

  @patch('/leaves/{id}', {
    responses: {
      '200': {
        description: 'Leave model instance',
        content: {'application/json': {
          schema: getModelSchemaRef(Leave, {
          title: 'Update Status',
          exclude: ['id'],
        }
        )}},
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {type: 'string'}
            }
          },
        },
      },
    }) leaveUpdateRequest: LeaveUpdateRequest,

  ): Promise<Leave> {
    try {
      const leave = await this.leaveRepository.findById(id);
      if(leave.status != "pending")
        throw new Error("Leave has already been approved or rejected")
      if(!leave)
        throw new Error("Invalid leave id provided")

      await Leave.validStatus(leaveUpdateRequest.status)

      const employee = await this.employeeRepository.findById(leave.employeeId);
      if(!employee)
        throw new Error("Employee ID mentioned in leave does not exist now")
      const employeeLeave = employee.leaves.find(leaveItems => leaveItems.type === leave.leaveType)
      if(employeeLeave === undefined) {
        throw new Error("The type of leave provided during leave application no longer exists in the database")
      }
      if(leaveUpdateRequest.status === "approved") {
        employeeLeave.applied -= leave.daysCount
        employeeLeave.availed += leave.daysCount
        leave.status = "approved"
      } else if(leaveUpdateRequest.status === "rejected") {
        employeeLeave.applied -= leave.daysCount
        employeeLeave.available += leave.daysCount
        leave.status = "rejected"
      }

      await this.employeeRepository.updateById(leave.employeeId, employee);
      const updatedLeave = await this.leaveRepository.updateById(id, leave);
      
      //Code for emailing
      // if(leave.status === "approved") {
      //   const responseApp = await emailLeavePatchAcc(employee.email,employee.firstName,leave.halfDay,leave.leaveType,leave.startDate,leave.endDate);
      //   console.log('Approved email res:', responseApp); 
      // } else if(leave.status === "rejected") {
      //   const responseRej = await emailLeavePatchRej(employee.email,employee.firstName,leave.halfDay,leave.leaveType,leave.startDate,leave.endDate);
      //   console.log('Rejected email res:', responseRej);
      // }
      
      return leave
    } catch(err) {
      console.log(err.stack)
      console.log(err.toString());
      throw {status: 400, message: err.toString()}
    }
  }

}
