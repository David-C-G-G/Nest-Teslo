import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserAuthDto, LoginUserAuthDto } from './dto';
import { Auth, GetUser, RawHeaders } from './decorators';
import { UserAuth } from './entities/user.auth.entity';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected/role-protected.decorator';
import { ValidRoles } from './interfaces';
// import { UpdateAuthDto } from './dto/update-auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserAuthDto: CreateUserAuthDto) {
    return this.authService.create(createUserAuthDto);
  }

  @Post('login')
  loginUser(@Body() loginUserAuthDto: LoginUserAuthDto) {
    return this.authService.login(loginUserAuthDto);
  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: UserAuth
  ){
    return this.authService.checkAuthStatus( user );
  }

  @Get('private')
  @UseGuards( AuthGuard() )
  testingPrivateRoute(
    @Req() request: Express.Request,
    @RawHeaders() rawHeaders: string[],
    
    @GetUser() user: UserAuth,
    @GetUser('email') userEmail: string,
  ){

    // console.log(request);
    // console.log({ user });

    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
      userEmail,
      rawHeaders,
    }
  }

  @Get('private2')
  // @SetMetadata('roles',['admin','super-user'])
  @RoleProtected( ValidRoles.SuperUser, ValidRoles.admin )
  @UseGuards( AuthGuard(), UserRoleGuard )
  privateRoute2(
    @GetUser() user: UserAuth
  ) {
    return {
      ok: true,
      user,
    }
  }

  @Get('private3')
  @Auth()
  privateRoute3(
    @GetUser() user: UserAuth
  ) {
    return {
      ok: true,
      user,
    }
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
