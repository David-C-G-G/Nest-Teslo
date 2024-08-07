import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID} from 'uuid';
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product) //inyectamos nuestra entidad 
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage) //inyectamos nuestra entidad 
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
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
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({ url: image }) )
      }); //esta linea hace una instancia de producto
      await this.productRepository.save(product); //esta linea guarda en la BD

      return {...product, images }; // devolvemos el producto creado


    } catch (error) {
      // console.log(error);
      // this.logger.error(error);
      this.handleDbExceptions(error);
    }

  }

  async findAll( paginationDto: PaginationDto) { 

    const { limit = 0, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      //relaciones para las imagenes de la otra tabla
      relations: {
        images: true,
      }
    });

    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url )
    }));
  }

  async findOne(term: string) { //cambio de id a term (termino de busqueda)

    let product: Product;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      // product = await this.productRepository.findOneBy({ slug: term });
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images','prodImages')
        .getOne();
    }

    // const product = await this.productRepository.findOneBy({id}); // se comentar por que se buscara + que por ids

    if ( !product ) 
      throw new BadRequestException(`El producto con el id: ${term} no se encuentra`);

    return product;
  }

  //aplanar para devolver solo el URL al solicitar el producto por el ID (findOne)
  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate, });

    if ( !product ) throw new NotFoundException(`Producto con el id: [${id}] no encontrado`);

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();


    try {

      if( images ){ //con esto se borran las imagenes anteriores
        await queryRunner.manager.delete( ProductImage, { product: { id } });

        product.images = images.map( 
          image => this.productImageRepository.create({ url: image })
        )
      }

      await queryRunner.manager.save( product );
      await queryRunner.commitTransaction(); //aquí es donde impacta en la base de datos
      await queryRunner.release();

      // await this.productRepository.save( product );
      // return product;
      return this.findOnePlain(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    //aquí se puede llamar la condicion de que si está en producción esto no se llame

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDbExceptions(error);
    }
  }


}
