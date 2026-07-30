import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { PartialType } from '@nestjs/swagger'
import { JobStatus, WorkModel } from '../schemas/job.schema'

export class CreateJobDto {
  @IsString() title: string
  @IsString() department: string
  @IsOptional() @IsString() location?: string
  @IsOptional() @IsEnum(WorkModel) workModel?: WorkModel
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus
  @IsOptional() @IsString() seniority?: string
  @IsOptional() @IsString() summary?: string
  @IsOptional() @IsArray() @IsString({ each: true }) mustHaveSkills?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) niceToHaveSkills?: string[]
  @IsOptional() @IsInt() @Min(0) salaryMin?: number
  @IsOptional() @IsInt() @Min(0) salaryMax?: number
  @IsOptional() @IsString() currency?: string
  @IsOptional() @IsString() hiringManager?: string
  @IsOptional() @IsString() recruiter?: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() metaDescription?: string
}

export class UpdateJobDto extends PartialType(CreateJobDto) {}

export class QueryJobDto {
  @IsOptional() @IsString() q?: string
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus
}
