import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";


export class PaginationDto {
    
    @ApiProperty({
        default: 10, description: '¿Cuantos renglones necesitas?'
    })
    @IsOptional()
    @IsPositive()
    @Type( () => Number )
    limit?: number;
    
    @ApiProperty({
        default: 0, description: '¿Cuantos renglones quieres saltarte?'
    })
    @IsOptional()
    // @IsPositive()
    @Min(0)
    @Type( () => Number )
    offset?: number;
}