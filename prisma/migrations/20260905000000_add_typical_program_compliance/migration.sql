-- Форма обучения: смешанный формат (лекции дистанционно, практика и аттестация очно).
-- С 01.03.2026 это основной легальный формат для программ ПК.
ALTER TYPE "CourseFormat" ADD VALUE 'BLENDED';

-- Соответствие курса типовой программе Минздрава (ФЗ № 28-ФЗ)
ALTER TABLE "Course" ADD COLUMN "typicalProgramOrder" TEXT;
ALTER TABLE "Course" ADD COLUMN "typicalProgramTitle" TEXT;

-- Город очной части — для IN_PERSON и BLENDED
ALTER TABLE "Course" ADD COLUMN "inPersonCity" TEXT;

-- Заключение о соответствии требованиям к практической подготовке
-- (ПП РФ № 1942 от 28.11.2025)
ALTER TABLE "Organization" ADD COLUMN "practiceApprovalNumber" TEXT;
ALTER TABLE "Organization" ADD COLUMN "practiceApprovalDate" TIMESTAMP(3);
