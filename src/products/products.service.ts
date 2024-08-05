import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID} from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product) //inyectamos nuestra entidad 
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto) {
    
    try {
      
      // if(!createProductDto.slug){
      //   createProductDto.slug = createProductDto.title
      //     .toLowerCase()
      //     .replaceAll(' ','_')
      //     .replaceAll("'",'')
      // } else {
      //   createProductDto.slug = createProductDto.slug
      //     .toLowerCase()
      //     .replaceAll(' ','_')
      //     .replaceAll("'",'')
      // }

      const product = this.productRepository.create(createProductDto); //esta linea hace una instancia de producto
      await this.productRepository.save(product); //esta linea guarda en la BD

      return product; // devolvemos el producto creado


    } catch (error) {
      // console.log(error);
      // this.logger.error(error);
      this.handleDbExceptions(error);
    }

  }

  findAll( paginationDto: PaginationDto) { 

    const { limit = 5, offset = 0 } = paginationDto;

    return this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: relaciones
    });
  }

  async findOne(term: string) { //cambio de id a term (termino de busqueda)

    let product: Product;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      // product = await this.productRepository.findOneBy({ slug: term });
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }

    // const product = await this.productRepository.findOneBy({id}); // se comentar por que se buscara + que por ids

    if ( !product ) 
      throw new BadRequestException(`El producto con el id: ${term} no se encuentra`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if ( !product ) throw new NotFoundException(`Producto con el id: [${id}] no encontrado`);

    try {

      await this.productRepository.save( product );
      return product;

    } catch (error) {
      this.handleDbExceptions(error);
    }


  }

  async remove(id: string) {

    const product = await this.findOne(id);
    await this.productRepository.remove( product );
    return `Producto con el id [${id}] fue eliminado con exito!`;
  }

  private handleDbExceptions( error: any ) {
    if(error.code === '23505')
      throw new BadRequestException(error.detail);
    
    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
