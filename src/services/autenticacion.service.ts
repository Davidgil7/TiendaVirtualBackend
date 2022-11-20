import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Llaves} from '../config/llaves';
import {Cliente} from '../models';
import {ClienteRepository} from '../repositories';

const generador = require("password-generator");
const cryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");

const generador = require("password-generator");
const cryptoJS = require("crypto-js");//importamos el paquete de crypto-js
const jwt = require("jsonwebtoken");//importamos el paquete de jwt
@injectable({scope: BindingScope.TRANSIENT})
export class AutentificacionService {
  constructor(
    @repository(ClienteRepository)
    public clienteRepository: ClienteRepository
  ) { }

  /*
   * Add service methods here
   */

  GenerarClave() {
    let clave = generador(8, false);
    return clave;

  }

  CifrarClave(clave: string) {
    let claveCifrado = cryptoJs.MD5(clave).toString();
    return claveCifrado;

  }

  IdentificarPersona(usuario: string, clave: string) {
    let claveEn = this.CifrarClave(clave)
    try {

      let p = this.clienteRepository.findOne({where: {correo: usuario, password: claveEn}})
      if (p) {
        return p;
      }

      return false;
    } catch {
      return false;

    }

  }
  IdentificarNombreUsuario(usuario: string) {
    try {
      let p = this.clienteRepository.findOne({where: {correo: usuario}})
      if (p) {
        return p;
      }

      return false;
    } catch {
      return false;

    }

  }
  GenerarTokenJWT(cliente: Cliente) {
    let token = jwt.sign({
      data: {
        id: cliente.id,
        correo: cliente.correo,
        nombre: cliente.nombre + " " + cliente.apellidos
      }

    },
      Llaves.claveJWT);
    return token;
  }
  ValidarTokenJWT(token: string) {
    try {
      let datos = jwt.verify(token, Llaves.claveJWT);
      return datos;
    } catch {
      return false
    }
  }
}
