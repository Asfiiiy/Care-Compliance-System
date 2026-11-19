import {
  BadRequestException,
} from '@nestjs/common';

import {
  diskStorage,
} from 'multer';

import {
  extname,
  join,
} from 'path';

import {
  existsSync,
  mkdirSync,
} from 'fs';

export const multerOptions = {
  storage: diskStorage({
    destination: (
      req,
      file,
      callback,
    ) => {
      const uploadPath = join(
        process.cwd(),
        'uploads',
        'certificates',
      );

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, {
          recursive: true,
        });
      }

      callback(null, uploadPath);
    },

    filename: (
      req,
      file,
      callback,
    ) => {
      const filename =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}${extname(file.originalname)}`;

      callback(
        null,
        filename,
      );
    },
  }),

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },

  fileFilter(
    req: any,
    file: Express.Multer.File,
    callback,
  ) {
    const extension = extname(
      file.originalname,
    ).toLowerCase();

    const allowed = [
      '.pdf',
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
    ];

    if (
      !allowed.includes(
        extension,
      )
    ) {
      return callback(
        new BadRequestException(
          'Only PDF/JPG/PNG files are allowed.',
        ),
        false,
      );
    }

    callback(null, true);
  },
};