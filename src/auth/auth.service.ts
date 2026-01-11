import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { CloudinaryService } from 'src/services/cloudinary/cloudinary.service';
import { TokenService } from 'src/services/token/token.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private cloudinary: CloudinaryService,
    private tokenService: TokenService,
    private jwtService: JwtService,
  ) {}

  async registerUser(userPayload: RegisterUserDto) {
    const findUser = await this.userService.findUserByEmail(userPayload.email);
    if (findUser) throw new ConflictException('Email already exist.');
    try {
      if (userPayload.avatarPublicId) {
        const newPublicId = userPayload.avatarPublicId.replace(
          'temp/avatar_url/',
          'books/avatars/',
        );
        const res = await this.cloudinary.renameFile(
          userPayload.avatarPublicId,
          newPublicId,
        );
        userPayload.avatarPublicId = res.secure_url;
      }
      const token = await this.tokenService.generateEmailToken(
        userPayload.email,
      );
      // generate otp and send mail, remove sent user and send successful message.
      const otp = Math.floor(100000 + Math.random() * 900000);
      await this.userService.createUser({
        ...userPayload,
        confirmEmailOtp: otp.toString(),
      });

      return { sucess: true, token, otp };
    } catch (error) {
      if (error.message.includes('Resource not found'))
        throw new BadRequestException('Invalid Avatar Id');
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async loginUser(user: User) {
    try {
      const accessToken = await this.jwtService.signAsync({ sub: user.id });
      // does not need user id, random crypto hash
      const refreshToken = await this.tokenService.generateRefreshToken(
        user.id,
      );
      const { password, ...rest } = user;
      return {
        accessToken,
        refreshToken,
        rest,
      };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async verifyEmail({ otpCode, token }: { otpCode: string; token: string }) {
    try {
      const email = await this.tokenService.verifyEmailToken(token);
      await this.userService.verifyUpdateUser(email, otpCode);
      return { success: true, message: 'Email verified successfully.' };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async resendVerifyEmailCode({ email }: { email: string }) {
    try {
      // check if it is time to resend another link and limit how many times the user can try this with rate limiter
      const otp = Math.floor(100000 + Math.random() * 900000);
      await this.userService.resendCode(email, otp.toString());
      const token = await this.tokenService.generateEmailToken(email);

      return { success: true, token, otp };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async forgetPassword({ email }: { email: string }) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) throw new NotFoundException('No User with this email.');
      if (!user.isVerified) {
        throw new BadRequestException('You need to verify your account first.');
      }
      const token = await this.tokenService.generateEmailToken(email);
      return { success: true, token };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async resendForgotPasswordLink(email: string) {
    // check if it is time to resend another link and limit how many times the user can try this with rate limiter
    return this.forgetPassword({ email });
  }

  // async verifyForgetPassword({ token }: { token: string }) {
  //   try {
  //     await this.tokenService.verifyEmailToken(token);
  //     return { success: true, message: 'Proceed to reset password.' };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async resetPassword({
    newPassword,
    confirmNewPassword,
    token,
  }: {
    newPassword: string;
    confirmNewPassword: string;
    token: string;
  }) {
    try {
      const email = await this.tokenService.verifyEmailToken(token);
      if (newPassword !== confirmNewPassword) {
        throw new BadRequestException('Password do not match');
      }
      await this.userService.changePassword(newPassword, email);
      return { success: true, message: 'Password Changed Successfully.' };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async validateUser(userPayload: LoginUserDto) {
    try {
      const { email, password } = userPayload;
      const user = await this.userService.findUserByEmail(email);

      if (!user) throw new NotFoundException('Invalid Email and Password');
      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (!user || !isCorrectPassword) {
        throw new UnauthorizedException('Invalid email and password.');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Please verify your email.');
      }
      return { id: user.id };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async uploadAvatar(avatar: Express.Multer.File) {
    // check file size and file type must be an image
    try {
      const cloudinaryResponse = await this.cloudinary.uploadFile(
        avatar,
        'temp/avatar_url',
      );
      return { avatarUrl: cloudinaryResponse.public_id };
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new InternalServerErrorException('Error uploading avatar');
    }
  }

  // async refreshToken(userId: string) {
  //   const accessToken = await this.generateTokens(userId, '7d');
  //   const sessionId = await this.refreshCacheService.setRefreshTokenCache();
  //   return {
  //     accessToken,
  //     sessionId,
  //   };
  // }

  async logoutUser(userId: string) {
    // await this.userService.updateRefreshToken(userId);
  }
}
