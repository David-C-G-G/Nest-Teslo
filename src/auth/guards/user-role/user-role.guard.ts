import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators/role-protected/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: string[] = this.reflector.get(META_ROLES, context.getHandler());

    if( !validRoles ) return true;
    if( validRoles.length === 0 ) return true;

    const { user } = context.switchToHttp().getRequest();

    if( !user ) throw new BadRequestException('Usuario no encontrado');

    for (const role of user.roles) {
      if( validRoles.includes( role ) ){
        return true;
      }
    }
  
    throw new ForbiddenException(
      `El usuario ${ user.fullName } necesita un rol válido: [${ validRoles }]`
    );
  }
}
