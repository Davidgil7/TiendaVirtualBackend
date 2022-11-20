import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Llaves} from '../config/llaves';
import {Cliente, Credenciales} from '../models';
import {ClienteRepository} from '../repositories';
import {AutentificacionService} from '../services';
const fetch = require('node-fetch');

export class ClienteController {
  constructor(
    @repository(ClienteRepository)
    public clienteRepository: ClienteRepository,
    @service(AutentificacionService)
    public servicioAutentificacion: AutentificacionService
  ) { }

  @post("/identificarCliente", {
    responses: {
      '200': {
        description: "Identificacion de usuarios"
      }
    }
  })
  async identificarPersona(
    @requestBody() credenciales: Credenciales
  ) {
    let p = await this.servicioAutentificacion.IdentificarPersona(credenciales.usuario, credenciales.clave);
    if (p) {
      let token = this.servicioAutentificacion.GenerarTokenJWT(p);
      return {
        datos: {
          nombre: p.nombre,
          correo: p.correo,
          id: p.id
        },
        tk: token
      }

    } else {
      throw new HttpErrors[401]("Datos invalidos");
    }

  }

  @post("/cambiarContrasenaManu", {
    responses: {
      '200': {
        description: "Cambiar contraseña manual"
      }
    }
  })
  async cambiarContrasenaManu(
    @requestBody() credenciales: Credenciales
  ) {

    let p = await this.servicioAutentificacion.IdentificarPersona(credenciales.usuario, credenciales.clave);
    if (p) {

      let claveCifrado = this.servicioAutentificacion.CifrarClave(credenciales.claveNew);
      p.password = claveCifrado;
      await this.clienteRepository.updateById(p.id, p);

      let destino = p.correo;
      let asunto = 'Alerta de cambio de contraseña'
      let contenido = `Hola ${p.nombre}, su contraseña fue cambiada y es: ${credenciales.claveNew}`;

      fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
        .then((data: any) => {
          console.log(data)
        })
      fetch(`${Llaves.urlServicioNotificaciones}/sms?mensaje=${contenido}&telefono=${p.telefono}`)
        .then((data: any) => {
          console.log(data)
        })

    } else {
      throw new HttpErrors[401]("Usuario invalido");
    }

  }


  @post('/cambiarContrasenaAu', {
    responses: {
      '200': {
        description: "Cambiar contraseña automatico"
      }
    }
  })
  async cambiarContrasenaAu(
    @requestBody() credenciales: Credenciales
  ) {
    let p = await this.servicioAutentificacion.IdentificarNombreUsuario(credenciales.usuario);
    if (p) {
      let clave = this.servicioAutentificacion.GenerarClave();
      let claveCifrado = this.servicioAutentificacion.CifrarClave(clave);
      p.password = claveCifrado;
      await this.clienteRepository.updateById(p.id, p);

      let destino = p.correo;
      let asunto = 'Alerta de cambio de contraseña'
      let contenido = `Hola ${p.nombre}, su contraseña fue cambiada y es: ${clave}`;

      fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
        .then((data: any) => {
          console.log(data)
        })
      fetch(`${Llaves.urlServicioNotificaciones}/sms?mensaje=${contenido}&telefono=${p.telefono}`)
        .then((data: any) => {
          console.log(data)
        })


    } else {
      throw new HttpErrors[401]("Usuario invalido");
    }


  }

  @post('/clientes')
  @response(200, {
    description: 'Cliente model instance',
    content: {'application/json': {schema: getModelSchemaRef(Cliente)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cliente, {
            title: 'NewCliente',
            exclude: ['id'],
          }),
        },
      },
    })
    cliente: Omit<Cliente, 'id'>,
  ): Promise<Cliente> {
    let clave = this.servicioAutentificacion.GenerarClave();
    let claveCifrado = this.servicioAutentificacion.CifrarClave(clave);
    cliente.password = claveCifrado;
    let p = await this.clienteRepository.create(cliente);
    //Notificar al usuario
    let destino = cliente.correo;
    let asunto = 'Registro en la plataforma'
    let contenido = `Hola ${cliente.nombre}, su nombre de usuario es ${cliente.correo} y su contraseña es: ${clave} y su rol es:  ${cliente.rol}`;

    fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
      .then((data: any) => {
        console.log(data)
      })
    return p;
  }

  @get('/clientes/count')
  @response(200, {
    description: 'Cliente model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Cliente) where?: Where<Cliente>,
  ): Promise<Count> {
    return this.clienteRepository.count(where);
  }

  @get('/clientes')
  @response(200, {
    description: 'Array of Cliente model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Cliente, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Cliente) filter?: Filter<Cliente>,
  ): Promise<Cliente[]> {
    return this.clienteRepository.find(filter);
  }

  @patch('/clientes')
  @response(200, {
    description: 'Cliente PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cliente, {partial: true}),
        },
      },
    })
    cliente: Cliente,
    @param.where(Cliente) where?: Where<Cliente>,
  ): Promise<Count> {
    return this.clienteRepository.updateAll(cliente, where);
  }

  @get('/clientes/{id}')
  @response(200, {
    description: 'Cliente model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Cliente, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Cliente, {exclude: 'where'}) filter?: FilterExcludingWhere<Cliente>
  ): Promise<Cliente> {
    return this.clienteRepository.findById(id, filter);
  }

  @patch('/clientes/{id}')
  @response(204, {
    description: 'Cliente PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cliente, {partial: true}),
        },
      },
    })
    cliente: Cliente,
  ): Promise<void> {
    await this.clienteRepository.updateById(id, cliente);
  }

  @put('/clientes/{id}')
  @response(204, {
    description: 'Cliente PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() cliente: Cliente,
  ): Promise<void> {
    await this.clienteRepository.replaceById(id, cliente);
  }

  @del('/clientes/{id}')
  @response(204, {
    description: 'Cliente DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.clienteRepository.deleteById(id);
  }
}
