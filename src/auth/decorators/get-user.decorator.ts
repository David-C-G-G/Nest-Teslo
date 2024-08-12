import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";


export const GetUser = createParamDecorator(
    ( data, ctx: ExecutionContext ) => {

        // const req = ctx.switchToHttp().getRequest();
        const { user } = ctx.switchToHttp().getRequest();

        if( !user ) throw new InternalServerErrorException('usuario no encontrario (request)');

        return ( !data ) ? user : user[data];
    }
);