// Yandex Object Storage is S3-compatible
// Using native fetch with AWS Signature V4 — no SDK dependency needed

export function getPublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
}

export function getCertificateKey(userId: string, certId: string): string {
  return `certificates/${userId}/${certId}.pdf`
}

export function getAvatarKey(userId: string): string {
  return `avatars/${userId}`
}

export function getCourseImageKey(courseId: string): string {
  return `courses/${courseId}/cover`
}
