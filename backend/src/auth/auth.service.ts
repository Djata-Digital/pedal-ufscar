import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      userType: user.userType,
    });
  }

  private validateUserStatus(user: User) {
    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        'Seu cadastro ainda está aguardando aprovação.',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Seu cadastro está suspenso. Entre em contato com a administração.',
      );
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Seu cadastro está bloqueado. Entre em contato com a administração.',
      );
    }

    if (user.status === UserStatus.CANCELLED) {
      throw new UnauthorizedException(
        'Seu cadastro foi cancelado.',
      );
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Este e-mail já está cadastrado.');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.createWithPassword({
      ...registerDto,
      passwordHash,
      status: UserStatus.PENDING,
    });

    return {
      user: this.sanitizeUser(user),
      message:
        'Cadastro realizado com sucesso. Aguarde aprovação da administração.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    this.validateUserStatus(user);

    return {
      user: this.sanitizeUser(user),
      accessToken: this.generateToken(user),
    };
  }
}