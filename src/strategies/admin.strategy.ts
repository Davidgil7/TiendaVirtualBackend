import {AuthenticationStrategy} from '@loopback/authentication';
import {service} from '@loopback/core';
import {HttpErrors, RedirectRoute, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';

import parseBearerToken from 'parse-bearer-token';
import {AutentificacionService} from '../services';


export class EstrategiaAdministrador implements AuthenticationStrategy {
  name: string = 'Administrador';

  constructor(
    @service(AutentificacionService)
    public servicioAutentificacion: AutentificacionService
  ) {

  }

  async authenticate(request: Request): Promise<UserProfile | RedirectRoute | undefined> {

    let token = parseBearerToken(request);
    if (token) {
      let datos = this.servicioAutentificacion.ValidarTokenJWT(token);
      if (datos) {
        if (datos) {
          let perfil: UserProfile = Object.assign({
            nombre: datos.data.rol
          });
          return perfil;
        }

      } else {
        throw new HttpErrors[401]("El token incluido no es valido. ")
      }

    } else {
      throw new HttpErrors[401]("No se ha incluido un token en la solicitud.")
    }

  }
}
