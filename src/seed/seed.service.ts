import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
// import { Repository } from 'typeorm';

@Injectable()
export class SeedService {

  constructor(
    // @InjectRepository(ProductsService)
    private readonly productsService: ProductsService,
  ){}
  
  async runSeed(){

    await this.insertNewProducts();
    return 'SEED EXECUTED';
  }

  private async insertNewProducts(){
    await this.productsService.deleteAllProducts();

    const seedData = initialData.products;

    const insertPromises = [];
    
    seedData.forEach( product => {
      insertPromises.push( this.productsService.create( product ) );
    } );

    await Promise.all( insertPromises );


    return true;
    
  }


}
