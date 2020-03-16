import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
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
import {LeaveType} from '../models';
import {LeaveTypeRepository, EmployeeRepository} from '../repositories';

export class LeaveTypeController {
  constructor(
    @repository(LeaveTypeRepository)
    public leaveTypeRepository: LeaveTypeRepository,
    @repository(EmployeeRepository)
    public employeeRepository: EmployeeRepository,
    ) {}

  @post('/leave-types', {
    responses: {
      '200': {
        description: 'LeaveType model instance',
        content: {'application/json': {schema: getModelSchemaRef(LeaveType)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LeaveType, {
            title: 'NewLeaveType',
          }),
        },
      },
    })
    leaveTypeRequest: LeaveType,
  ): Promise<LeaveType> {
    try {
      await LeaveType.validate(leaveTypeRequest);
      if(leaveTypeRequest.available + leaveTypeRequest.applied + leaveTypeRequest.availed != leaveTypeRequest.total)
        throw new Error("Sum of Available, Applied and Availed leaves should be equal to Total")
      const leaveType = await this.leaveTypeRepository.findOne({ where: { type: leaveTypeRequest.type } } )
      if(leaveType)
        throw new Error("Leave Type Already exists")
      const createdLeaveType = await this.leaveTypeRepository.create(leaveTypeRequest);
      const employees = await this.employeeRepository.find()
      employees.forEach(async (employee) => {
        employee.leaves.push(createdLeaveType)
        await this.employeeRepository.updateById(employee.id, employee)
      });
      return createdLeaveType
    } catch (err) {
      console.log(err.stack)
      console.log(err.toString());
      throw { status: 400, message: err.toString() }
    }
  }

  @get('/leave-types/count', {
    responses: {
      '200': {
        description: 'LeaveType model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(LeaveType))
    where?: Where<LeaveType>,
  ): Promise<Count> {
    return this.leaveTypeRepository.count(where);
  }

  @get('/leave-types', {
    responses: {
      '200': {
        description: 'Array of LeaveType model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(LeaveType, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(LeaveType))
    filter?: Filter<LeaveType>,
  ): Promise<LeaveType[]> {
    return this.leaveTypeRepository.find(filter);
  }

  @patch('/leave-types', {
    responses: {
      '200': {
        description: 'LeaveType PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LeaveType, {partial: true}),
        },
      },
    })
    leaveType: LeaveType,
    @param.query.object('where', getWhereSchemaFor(LeaveType))
    where?: Where<LeaveType>,
  ): Promise<Count> {
    return this.leaveTypeRepository.updateAll(leaveType, where);
  }

  @get('/leave-types/{id}', {
    responses: {
      '200': {
        description: 'LeaveType model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(LeaveType, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(LeaveType))
    filter?: Filter<LeaveType>,
  ): Promise<LeaveType> {
    return this.leaveTypeRepository.findById(id, filter);
  }

  @patch('/leave-types/{id}', {
    responses: {
      '204': {
        description: 'LeaveType PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LeaveType, {partial: true}),
        },
      },
    })
    leaveType: LeaveType,
  ): Promise<void> {
    await this.leaveTypeRepository.updateById(id, leaveType);
  }

  @put('/leave-types/{id}', {
    responses: {
      '204': {
        description: 'LeaveType PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() leaveType: LeaveType,
  ): Promise<void> {
    await this.leaveTypeRepository.replaceById(id, leaveType);
  }

  @del('/leave-types/{id}', {
    responses: {
      '204': {
        description: 'LeaveType DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.leaveTypeRepository.deleteById(id);
  }
}
