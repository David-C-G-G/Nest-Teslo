import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { UserAuth } from './entities/indext';
import { LoginUserAuthDto, CreateUserAuthDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
// import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {


  constructor(
    @InjectRepository(UserAuth)
    private readonly userAuthRepository: Repository<UserAuth>,

    private readonly jwtService: JwtService,
  ){}



  async create(createUserAuthDto: CreateUserAuthDto) {
    
    try {

      const { password, ...userDate } = createUserAuthDto;
      
      const user = this.userAuthRepository.create({
        ...userDate,
        password: bcrypt.hashSync( password, 10),
      });

      await this.userAuthRepository.save( user );
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      }

    } catch (error) {
      // console.log(error);
      this.handleDbErrors(error);
    }

  }

  async login( loginUserAuthDto: LoginUserAuthDto) {


    const { password, email } = loginUserAuthDto;

    const user = await this.userAuthRepository.findOne({ 
      where: { email },
      select: { email: true, password: true, id: true }
     });

     if ( !user ) throw new UnauthorizedException(`Las credenciales no son validas (email)`);

     if( !bcrypt.compareSync(password, user.password)) throw new UnauthorizedException(`Las credenciales no son validas (password)`);

    // return user;
    return {
      ...user,
      token: this.getJwtToken({id: user.id, })
    }

  }

  async checkAuthStatus( user: UserAuth ){
    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    };
  }

  // findAll() {
  //   return `This action returns all auth`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }

  private getJwtToken( payload: JwtPayload){

    const token = this.jwtService.sign( payload );
    return token;

  }

  private handleDbErrors( error: any ): never{
    if (error.code === '23505'){
      throw new BadRequestException(error.detail);
    }

    console.log(error);

    throw new InternalServerErrorException(' Please check server logs ');
  }
}
