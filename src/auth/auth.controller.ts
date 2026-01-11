import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LocalAuthGuard } from './gaurds/local_auth/local_auth.guard';
import { JwtAuthGuard } from './gaurds/jwt_auth/jwt_auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerifyEmailDto } from './dto/verify_email.dto';

const sessionObj = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() user: RegisterUserDto) {
    return this.authService.registerUser(user);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Req() req, @Res({ passthrough: true }) res) {
    console.log(req.user);

    const { accessToken, refreshToken } = await this.authService.loginUser(
      req.user.id,
    );
    // res.cookie('sessionId', refreshToken, sessionObj);
    return { sucess: true, accessToken, refreshToken };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() { token, otpCode }: VerifyEmailDto) {
    return await this.authService.verifyEmail({ token, otpCode });
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() { email }: { email: string }) {
    return await this.authService.resendVerifyEmailCode({ email });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() { email }: { email: string }) {
    return await this.authService.forgetPassword({ email });
  }

  @Post('resend-forgot-password')
  @HttpCode(HttpStatus.OK)
  async resendForgotPassword(@Body() { email }: { email: string }) {
    return await this.authService.resendForgotPasswordLink(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body()
    {
      newPassword,
      confirmNewPassword,
      token,
    }: {
      newPassword: string;
      confirmNewPassword: string;
      token: string;
    },
  ) {
    return await this.authService.resetPassword({
      newPassword,
      confirmNewPassword,
      token,
    });
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@UploadedFile() avatar: Express.Multer.File) {
    if (!avatar) {
      throw new BadRequestException('No avatar uploaded');
    }
    const { avatarUrl } = await this.authService.uploadAvatar(avatar);
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(@Req() req) {
  //   return this.authService.refreshToken(req.user.id);
  // }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req) {
    return this.authService.logoutUser(req.user.id);
  }
}
