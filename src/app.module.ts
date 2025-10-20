import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';

import { ConfigModule } from './configs/config.module';
import { ConfigService } from './configs/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomLogger } from './common/modules/logger/customerLogger.service';
import { LoggerMiddleware } from './common/middlewares/middleware';
import { MailModule } from './common/modules/mail/mail.module';

console.log({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_DATABASE || 'test',
  entities: [User],
  logging: true,
  synchronize: true
});
@Module({
  imports: [
    ConfigModule,

    // Schedule Modules
    ScheduleModule.forRoot(),

    // Database Connection Config
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 3306,
      username: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_DATABASE || 'test',
      entities: [User],
      logging: true,
      synchronize: true
    }),
    TypeOrmModule.forFeature([]),

    MailModule,

    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [ConfigService, CustomLogger]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes(AppController);
  }
}
