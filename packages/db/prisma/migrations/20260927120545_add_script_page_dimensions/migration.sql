/*
  Warnings:

  - Added the required column `image_height` to the `script_pages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_width` to the `script_pages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "script_pages" ADD COLUMN     "image_height" INTEGER NOT NULL,
ADD COLUMN     "image_width" INTEGER NOT NULL;
