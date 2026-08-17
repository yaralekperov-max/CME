-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('QUALIFICATION', 'MODULE', 'EVENT');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "courseType" "CourseType" NOT NULL DEFAULT 'MODULE';

-- Backfill: длинные программы (от 16 часов) — это программы повышения квалификации,
-- конференции — мероприятия, остальное остаётся образовательными модулями НМО.
UPDATE "Course" SET "courseType" = 'QUALIFICATION' WHERE "durationHours" >= 16;
UPDATE "Course" SET "courseType" = 'EVENT' WHERE "format" = 'CONFERENCE';

-- CreateIndex
CREATE INDEX "Course_courseType_idx" ON "Course"("courseType");
