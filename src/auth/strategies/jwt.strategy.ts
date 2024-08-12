import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { UserAuth } from "../entities/user.auth.entity";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ){


    constructor(
        @InjectRepository( UserAuth )
        private readonly userAuthRepository: Repository<UserAuth>,

        configService: ConfigService
    ){
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate( payload: JwtPayload ): Promise<UserAuth> {

        const { id } = payload;

        const user = await this.userAuthRepository.findOneBy({ id });

        if( !user ) throw new UnauthorizedException('Token no válido')

        if( !user.isActive ) throw new UnauthorizedException('Usuario inactivo, ponganse en contacto con el Administrador');

        // console.log({user});

        return user;
    }
}