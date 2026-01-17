import { IsString, MinLength, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'My Company' })
  @IsString()
  @MinLength(2)
  name: string;
}

export class UpdateTenantDto {
  @ApiProperty({ example: 'My Company Updated' })
  @IsString()
  @MinLength(2)
  name: string;
}

export class AddMemberDto {
  @ApiProperty({ example: 'newmember@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: MemberRole, example: MemberRole.ANALYST })
  @IsEnum(MemberRole)
  role: MemberRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MemberRole, example: MemberRole.ADMIN })
  @IsEnum(MemberRole)
  role: MemberRole;
}
