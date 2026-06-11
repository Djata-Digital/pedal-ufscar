import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { PasswordResetToken } from './entities/password-reset-token.entity';

import {
  User,
  UserStatus,
  UserType,
} from '../users/entities/user.entity';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokensRepository: Repository<PasswordResetToken>,
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

  private generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return {
        message:
          'Se o e-mail estiver cadastrado, um código de recuperação será enviado.',
      };
    }

    const code = this.generateResetCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const token = this.passwordResetTokensRepository.create({
      user,
      code,
      expiresAt,
      used: false,
    });

    await this.passwordResetTokensRepository.save(token);

    return {
      message:
        'Código de recuperação gerado com sucesso. Ele expira em 15 minutos.',
      code,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    const token = await this.passwordResetTokensRepository.findOne({
      where: {
        user: { id: user.id },
        code: dto.code,
        used: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!token) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Código expirado.');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.usersRepository.save(user);

    token.used = true;

    await this.passwordResetTokensRepository.save(token);

    return {
      message: 'Senha redefinida com sucesso. Você já pode fazer login.',
    };
  }

  // ROTA TEMPORÁRIA PARA CRIAR O PRIMEIRO ADMIN
  async createFirstAdmin() {
    const adminEmail = 'admin@pedal.com';
    const adminPassword = '123456';

    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (existingAdmin) {
      return {
        message: 'Admin já existe.',
        email: adminEmail,
        password: adminPassword,
      };
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await this.usersService.createWithPassword({
      fullName: 'Administrador PEDAL-UFSCar',
      email: adminEmail,
      phone: '00000000000',
      cpf: '00000000000',
      rg: null,
      birthDate: new Date('2000-01-01'),
      birthPlace: 'São Carlos / Brasil',
      nationality: 'Brasileira',
      ufscarNumber: 'ADMIN-001',
      courseOrDepartment: 'Administração do Sistema',
      address: 'UFSCar',
      racialIdentity: 'Prefiro não responder',
      genderIdentity: 'Prefiro não responder',
      socialClass: 'Prefiro não responder',
      userType: UserType.ADMIN,
      status: UserStatus.APPROVED,
      passwordHash,
      photoUrl: null,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
    });

    return {
      message: 'Primeiro admin criado com sucesso.',
      login: {
        email: admin.email,
        password: adminPassword,
      },
    };
  }
}