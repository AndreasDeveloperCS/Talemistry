import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { AuthModule } from '../auth/auth.module';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { UserModule } from '../users/user.module';
import { BlogPostCommentController } from './controllers/blog-comment.controller';
import { BlogImageController } from './controllers/blog-image.controller';
import { BlogController } from './controllers/blog.controller';
import { BlogsFavoriteController } from './controllers/blogs-favorite.contoller';
import { BlogPostComment, BlogPostCommentSchema } from './models/blog-comment';
import { BlogFavorite, BlogFavoriteSchema } from './models/blog-favorite';
import { BlogImage, BlogImageSchema } from './models/blog-image';
import { BlogPost, BlogPostSchema } from './models/blog-post';
import { BlogPostCommentService } from './services/blog-comment.service';
import { BlogImageService } from './services/blog-image.service';
import { BlogService } from './services/blog.service';
import { BlogsFavoriteService } from './services/blogs-favorite.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      BlogPost, BlogImage, BlogPostComment, BlogFavorite
    ]),
    HttpModule,
    MongooseModule.forFeature([
      {
        name: BlogPost.name,
        schema: BlogPostSchema,
      },
      {
        name: BlogImage.name,
        schema: BlogImageSchema,
      },
      {
        name: BlogPostComment.name,
        schema: BlogPostCommentSchema,
      },
      {
        name: BlogFavorite.name,
        schema: BlogFavoriteSchema
      }
    ]),
    AuthModule,
    UserModule,
    BaseModule,
    CoreModule,
  ],
  controllers: [BlogController, BlogImageController, BlogPostCommentController, BlogsFavoriteController],
  providers: [BlogService, BlogImageService, BlogPostCommentService, BlogsFavoriteService],
  exports: [BlogService, BlogImageService, BlogPostCommentService, BlogsFavoriteService]
})
export class BlogModule { }