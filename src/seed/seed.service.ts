import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import { UserAuth } from '../auth/entities/user.auth.entity';
// import { Repository } from 'typeorm';

@Injectable()
export class SeedService {

  constructor(
    // @InjectRepository(ProductsService)
    private readonly productsService: ProductsService,

    @InjectRepository(UserAuth)
    private readonly userRepository: Repository<UserAuth>
  ){}
  
  async runSeed(){

    await this.deleteTables();
    
   const adminUser = await this.insertUsers();
    
    await this.insertNewProducts(adminUser);
    return 'SEED EXECUTED';
  }

  private async deleteTables(){

    //1. primero borrar productos
    await this.productsService.deleteAllProducts();

    //2. eliminación de usuarios
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
      .delete()
      .where({})
      .execute()
  }

  private async insertUsers(){
    const seedUsers = initialData.users;
    const users: UserAuth[] = []

    seedUsers.forEach( user => {
      users.push( this.userRepository.create(user) )
    });

    const dbUsers = await this.userRepository.save( seedUsers )

    return dbUsers[0];

  }

  private async insertNewProducts( user: UserAuth ){
    await this.productsService.deleteAllProducts();

    const seedData = initialData.products;

    const insertPromises = [];
    
    seedData.forEach( product => {
      insertPromises.push( this.productsService.create( product, user ) );
    } );

    await Promise.all( insertPromises );


    return true;
    
  }


}
