import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PartialType } from '@nestjs/swagger'
import { JourneyStage, WorkStyleType } from '../../../common/journey'

export class TalentElementDto {
  @IsString() key: string
  @IsString() label: string
  @IsInt() @Min(0) @Max(100) score: number
}

export class VerifiedSkillDto {
  @IsString() name: string
  @IsInt() @Min(0) @Max(100) level: number
  @IsOptional() verified?: boolean
  @IsOptional() @IsString() source?: string
}

export class CreateCandidateDto {
  @IsString() name: string
  @IsString() title: string
  @IsOptional() @IsString() location?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsInt() @Min(0) yearsExperience?: number

  @IsInt() @Min(0) @Max(100) matchScore: number

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TalentElementDto)
  elements?: TalentElementDto[]

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VerifiedSkillDto)
  skills?: VerifiedSkillDto[]

  @IsOptional() @IsEnum(JourneyStage) stage?: JourneyStage
  @IsOptional() @IsEnum(WorkStyleType) workStyleType?: WorkStyleType
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
  @IsOptional() @IsString() summary?: string
  @IsOptional() @IsString() avatarTone?: string
  @IsOptional() @IsInt() @Min(0) @Max(100) potentialSpectrum?: number
}

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {}

export class QueryCandidateDto {
  @IsOptional() @IsString() q?: string
  @IsOptional() @IsEnum(JourneyStage) stage?: JourneyStage
  @IsOptional() @IsInt() @Min(0) @Max(100) minMatch?: number
  @IsOptional() @IsInt() @Min(1) page?: number
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number
}
